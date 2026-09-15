#!/usr/bin/env python3
"""Anthropic Messages -> OpenAI Chat Completions bridge.

Designed for Claude Code -> local bridge -> an OpenAI-compatible upstream
(e.g. a Render DeepSeek proxy). It preserves Anthropic tool_use/tool_result
semantics in both non-streaming and streaming responses.
"""
from __future__ import annotations

import json
import os
import uuid
from typing import Any

import httpx
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, StreamingResponse
from starlette.routing import Route

UPSTREAM = os.getenv("BRIDGE_UPSTREAM", "https://deepseek-free-api-xyvk.onrender.com/v1").rstrip("/")
MODEL_DEFAULT = os.getenv("BRIDGE_MODEL", "deepseek-chat")
HOST = os.getenv("BRIDGE_HOST", "127.0.0.1")
PORT = int(os.getenv("BRIDGE_PORT", "16889"))
TIMEOUT = float(os.getenv("BRIDGE_TIMEOUT", "600"))

# Map OpenAI finish_reason -> Anthropic stop_reason
STOP_REASON_MAP = {
    "tool_calls": "tool_use",
    "stop": "end_turn",
    "length": "max_tokens",
    "content_filter": "end_turn",
    None: "end_turn",
}

client = httpx.AsyncClient(timeout=TIMEOUT, trust_env=False)


def text_from_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for b in content:
            if isinstance(b, dict) and b.get("type") == "text":
                out.append(b.get("text", ""))
        return "".join(out)
    return ""


def anthropic_to_openai(data: dict[str, Any]) -> dict[str, Any]:
    messages: list[dict[str, Any]] = []

    system = data.get("system")
    system_text = text_from_content(system)
    if system_text:
        messages.append({"role": "system", "content": system_text})

    for msg in data.get("messages", []):
        role = msg.get("role")
        content = msg.get("content")

        if role == "user":
            if isinstance(content, str):
                messages.append({"role": "user", "content": content})
                continue
            text_parts = []
            tool_results = []
            if isinstance(content, list):
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    typ = block.get("type")
                    if typ == "text":
                        text_parts.append(block.get("text", ""))
                    elif typ == "tool_result":
                        result = block.get("content", "")
                        tool_results.append({
                            "role": "tool",
                            "tool_call_id": block.get("tool_use_id", ""),
                            "content": text_from_content(result) if isinstance(result, list) else str(result),
                        })
            if text_parts:
                messages.append({"role": "user", "content": "".join(text_parts)})
            elif not tool_results:
                messages.append({"role": "user", "content": ""})
            messages.extend(tool_results)

        elif role == "assistant":
            text_parts = []
            tool_calls = []
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, list):
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    typ = block.get("type")
                    if typ == "text":
                        text_parts.append(block.get("text", ""))
                    elif typ == "tool_use":
                        tool_calls.append({
                            "id": block.get("id") or f"call_{uuid.uuid4().hex[:12]}",
                            "type": "function",
                            "function": {
                                "name": block.get("name", ""),
                                "arguments": json.dumps(block.get("input", {}), ensure_ascii=False),
                            },
                        })
            m: dict[str, Any] = {"role": "assistant", "content": "".join(text_parts) or None}
            if tool_calls:
                m["tool_calls"] = tool_calls
            messages.append(m)

    out: dict[str, Any] = {
        "model": data.get("model") or MODEL_DEFAULT,
        "messages": messages,
        "stream": bool(data.get("stream", False)),
    }
    if data.get("max_tokens") is not None:
        out["max_tokens"] = data["max_tokens"]
    if data.get("temperature") is not None:
        out["temperature"] = data["temperature"]
    if data.get("top_p") is not None:
        out["top_p"] = data["top_p"]

    tools = []
    for t in data.get("tools", []) or []:
        if not isinstance(t, dict):
            continue
        # Anthropic: {name, description, input_schema}
        # OpenAI: {type:function, function:{name,description,parameters}}
        if t.get("type") == "function" and isinstance(t.get("function"), dict):
            tools.append(t)
        elif t.get("name"):
            tools.append({
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "parameters": t.get("input_schema") or {"type": "object", "properties": {}},
                },
            })
    if tools:
        out["tools"] = tools

    tc = data.get("tool_choice")
    if isinstance(tc, dict):
        typ = tc.get("type")
        if typ == "auto":
            out["tool_choice"] = "auto"
        elif typ == "any":
            out["tool_choice"] = "required"
        elif typ == "tool":
            out["tool_choice"] = {"type": "function", "function": {"name": tc.get("name", "")}}
    elif isinstance(tc, str):
        out["tool_choice"] = tc
    return out


def openai_to_anthropic(resp: dict[str, Any], model: str) -> dict[str, Any]:
    choice = (resp.get("choices") or [{}])[0]
    msg = choice.get("message") or {}
    content = []

    # Some OpenAI-compatible upstreams (DeepSeek reasoning models in
    # particular) return the actual answer in `reasoning_content` and
    # leave `content` null/empty, especially when the token budget ran
    # out mid-reasoning. Fall back so we never emit an empty message.
    text = msg.get("content") or msg.get("reasoning_content")
    if text:
        content.append({"type": "text", "text": text})

    for call in msg.get("tool_calls") or []:
        fn = call.get("function") or {}
        try:
            inp = json.loads(fn.get("arguments", "{}"))
        except json.JSONDecodeError:
            inp = {}
        content.append({
            "type": "tool_use",
            "id": call.get("id") or f"toolu_{uuid.uuid4().hex[:12]}",
            "name": fn.get("name", ""),
            "input": inp,
        })

    # Guard against a truly empty content array, which some clients
    # (Claude Code included) treat as an error/hang rather than a
    # no-op turn.
    if not content:
        content.append({"type": "text", "text": ""})

    finish = choice.get("finish_reason")
    stop_reason = STOP_REASON_MAP.get(finish, finish)
    usage = resp.get("usage") or {}
    return {
        "id": resp.get("id") or f"msg_{uuid.uuid4().hex}",
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": content,
        "stop_reason": stop_reason,
        "stop_sequence": None,
        "usage": {
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
        },
    }


def sse(event: str, data: dict[str, Any]) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n".encode()


async def stream_translate(resp: httpx.Response, model: str):
    msg_id = f"msg_{uuid.uuid4().hex}"
    index = 0
    text_started = False
    tool_indexes: dict[int, int] = {}
    tool_state: dict[int, dict[str, Any]] = {}
    any_content_emitted = False

    yield sse("message_start", {"type": "message_start", "message": {
        "id": msg_id, "type": "message", "role": "assistant", "model": model,
        "content": [], "stop_reason": None, "stop_sequence": None,
        "usage": {"input_tokens": 0, "output_tokens": 0},
    }})

    async for line in resp.aiter_lines():
        if not line.startswith("data:"):
            continue
        raw = line[5:].strip()
        if not raw or raw == "[DONE]":
            continue
        try:
            chunk = json.loads(raw)
        except json.JSONDecodeError:
            continue
        choice = (chunk.get("choices") or [{}])[0]
        delta = choice.get("delta") or {}

        # Fall back to reasoning_content, same rationale as the
        # non-streaming path: some upstreams stream the real answer
        # there instead of (or in addition to) `content`.
        text = delta.get("content") or delta.get("reasoning_content")
        if text:
            if not text_started:
                yield sse("content_block_start", {"type": "content_block_start", "index": index, "content_block": {"type": "text", "text": ""}})
                text_started = True
            yield sse("content_block_delta", {"type": "content_block_delta", "index": index, "delta": {"type": "text_delta", "text": text}})
            any_content_emitted = True

        for call in delta.get("tool_calls") or []:
            ci = call.get("index", 0)
            if ci not in tool_indexes:
                if text_started:
                    yield sse("content_block_stop", {"type": "content_block_stop", "index": index})
                    index += 1
                    text_started = False
                tool_indexes[ci] = index
                fn = call.get("function") or {}
                tool_state[ci] = {"id": call.get("id") or f"toolu_{uuid.uuid4().hex[:12]}", "name": fn.get("name", "")}
                yield sse("content_block_start", {"type": "content_block_start", "index": index, "content_block": {"type": "tool_use", "id": tool_state[ci]["id"], "name": tool_state[ci]["name"], "input": {}}})
            idx = tool_indexes[ci]
            args = (call.get("function") or {}).get("arguments", "")
            if args:
                yield sse("content_block_delta", {"type": "content_block_delta", "index": idx, "delta": {"type": "input_json_delta", "partial_json": args}})
            any_content_emitted = True

        finish = choice.get("finish_reason")
        if finish:
            # If nothing was ever emitted, open and immediately close an
            # empty text block so the message isn't left with zero
            # content blocks.
            if not any_content_emitted and not tool_indexes:
                yield sse("content_block_start", {"type": "content_block_start", "index": index, "content_block": {"type": "text", "text": ""}})
                text_started = True

            for idx in sorted(tool_indexes.values()):
                yield sse("content_block_stop", {"type": "content_block_stop", "index": idx})
            if text_started:
                yield sse("content_block_stop", {"type": "content_block_stop", "index": index})
            stop_reason = STOP_REASON_MAP.get(finish, finish)
            yield sse("message_delta", {"type": "message_delta", "delta": {"stop_reason": stop_reason, "stop_sequence": None}, "usage": {"output_tokens": 0}})
            yield sse("message_stop", {"type": "message_stop"})

    await resp.aclose()


async def messages(request: Request):
    if request.method != "POST":
        return Response(status_code=405)
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"error": {"type": "invalid_request_error", "message": "Invalid JSON"}}, status_code=400)

    payload = anthropic_to_openai(data)
    headers = {"content-type": "application/json"}
    api_key = request.headers.get("authorization")
    if api_key:
        headers["authorization"] = api_key
    x_api = request.headers.get("x-api-key")
    if x_api:
        headers["authorization"] = f"Bearer {x_api}"

    try:
        if payload.get("stream"):
            req = client.build_request("POST", f"{UPSTREAM}/chat/completions", headers=headers, json=payload)
            upstream = await client.send(req, stream=True)
            if upstream.status_code >= 400:
                body = await upstream.aread()
                await upstream.aclose()
                return Response(body, status_code=upstream.status_code, media_type="application/json")
            return StreamingResponse(stream_translate(upstream, data.get("model") or MODEL_DEFAULT), media_type="text/event-stream")

        r = await client.post(f"{UPSTREAM}/chat/completions", headers=headers, json=payload)
        if r.status_code >= 400:
            return Response(r.content, status_code=r.status_code, media_type="application/json")
        return JSONResponse(openai_to_anthropic(r.json(), data.get("model") or MODEL_DEFAULT))
    except Exception as e:
        return JSONResponse({"error": {"type": "proxy_error", "message": str(e)}}, status_code=502)


async def health(request: Request):
    return JSONResponse({"status": "ok", "upstream": UPSTREAM})

app = Starlette(routes=[
    Route("/health", health, methods=["GET"]),
    Route("/v1/messages", messages, methods=["POST"]),
])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
