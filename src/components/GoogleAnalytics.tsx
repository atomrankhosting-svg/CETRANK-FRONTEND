import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled, trackPageView } from "@/lib/analytics";

/**
 * Tracks page views on every client-side route change, including the initial load.
 * Automatic page views are disabled in index.html so SPA navigation is counted once.
 */
export function GoogleAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
}

export { GA_MEASUREMENT_ID, isAnalyticsEnabled };
