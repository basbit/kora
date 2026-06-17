import { Platform } from "react-native";

// Google Analytics (GA4) measurement ID.
export const GA_MEASUREMENT_ID = "G-GZB9TDQHG6";

/**
 * Initialise analytics.
 * - Web: injects the gtag.js snippet (GA4).
 * - Native (iOS/Android): no-op here. Native uses Google Analytics for
 *   Firebase, wired separately once Firebase config files are present.
 */
export function initAnalytics(): void {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  if (document.getElementById("ga-gtag")) return;

  const script = document.createElement("script");
  script.async = true;
  script.id = "ga-gtag";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  const dataLayer = (w.dataLayer = w.dataLayer || []);
  // gtag must push the raw `arguments` object, exactly like the official snippet.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  }
  w.gtag = gtag as unknown as (...args: unknown[]) => void;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}
