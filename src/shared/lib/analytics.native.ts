import {
  getAnalytics,
  logAppOpen,
  setAnalyticsCollectionEnabled,
} from "@react-native-firebase/analytics";
import { getApp } from "@react-native-firebase/app";

// GA4 measurement is configured natively via google-services.json /
// GoogleService-Info.plist (linked to the same GA4 property as web).
export const GA_MEASUREMENT_ID = "G-GZB9TDQHG6";

/**
 * Native analytics init (iOS/Android). React Native Firebase auto-initialises
 * from the bundled Google services config; here we enable collection and log
 * an app_open event. Firebase Analytics also auto-collects sessions and basic
 * device/usage data.
 */
export function initAnalytics(): void {
  try {
    const analytics = getAnalytics(getApp());
    void setAnalyticsCollectionEnabled(analytics, true);
    void logAppOpen(analytics);
  } catch {
    void 0;
  }
}
