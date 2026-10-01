// The live system theme (light or dark), as the stalls and the Tally abacus follow it.
import { useSyncExternalStore } from "react";

const systemTheme = () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
function subscribeTheme(onChange) {
  const query = matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export const useSystemTheme = () => useSyncExternalStore(subscribeTheme, systemTheme, () => "light");
