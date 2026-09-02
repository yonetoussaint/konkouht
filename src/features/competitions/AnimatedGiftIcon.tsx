import { useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";

function notoAnimatedEmojiUrl(emoji: string) {
  const codepoints = Array.from(emoji)
    .map((ch) => ch.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f");
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoints.join("_")}/lottie.json`;
}

export default function AnimatedGiftIcon({ emoji, size = 40 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span style={{ fontSize: size * 0.7, lineHeight: 1, display: "block" }}>
        {emoji}
      </span>
    );
  }

  return (
    <Player
      src={notoAnimatedEmojiUrl(emoji)}
      autoplay
      loop
      onEvent={(event) => {
        if (event === "error") setFailed(true);
      }}
      style={{ width: size, height: size }}
    />
  );
}
