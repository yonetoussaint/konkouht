import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

export const isNative = Capacitor.isNativePlatform();

/* Runs once at app boot (see main.tsx). No-ops in a regular browser tab �
   these plugins only do anything inside the compiled iOS/Android shell. */
export async function initNativeShell() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark }); // dark icons on our light background
    await StatusBar.setBackgroundColor({ color: "#F2F2F0" });
  } catch {
    // StatusBar overlay isn't available on every platform/version � safe to ignore.
  }
  try {
    await SplashScreen.hide();
  } catch {
    // no-op
  }
}

/* Small tactile confirmation for taps that matter (register, vote, send
   gift, post comment) � the kind of feedback a native app gives for free
   that a website never can. Silently does nothing on web/desktop. */
export function hapticTap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative) return;
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  Haptics.impact({ style: map[style] }).catch(() => {});
}
