# Context Retrieval Policy

## Core Principle

Never guess information when it can be obtained from the workspace or an
available MCP server.

## Context Retrieval Order

Before asking the user for technical or project context:

1. Inspect the relevant files in the workspace.
2. Search the codebase for relevant implementations.
3. Check available MCP servers.
4. Query the MCP server most likely to contain the missing information.
5. Only ask the user if the information cannot be obtained from the
   workspace or an available MCP server.

## MCP Usage

Proactively use MCP tools whenever additional context could materially improve
the accuracy of the implementation.

Use relevant MCP servers for:

- Database schemas and data structure.
- External API information.
- Project documentation.
- Connected services.
- Deployment infrastructure.
- Authentication configuration.
- Existing issues or tasks.
- Information outside the local repository.

Do not invent APIs, database schemas, configuration values, or external
service behavior when an MCP server can provide authoritative information.

If multiple MCP servers could provide relevant context, use the most
authoritative source.

## Before Major Changes

Before implementing a significant feature:

1. Inspect existing code.
2. Identify missing context.
3. Query relevant MCP servers.
4. Form an implementation plan.
5. Implement the changes.

Do not ask the user questions that can reasonably be answered by inspecting
the workspace or querying an available MCP server.
