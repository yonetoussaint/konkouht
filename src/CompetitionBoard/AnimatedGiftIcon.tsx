import { useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { notoAnimatedEmojiUrl } from "./utils";

// Renders a gift's icon as an animated sticker instead of a static emoji
// glyph. Falls back to the plain emoji if the animation fails to load
// (e.g. no matching Noto animation exists for that emoji, or offline).
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
