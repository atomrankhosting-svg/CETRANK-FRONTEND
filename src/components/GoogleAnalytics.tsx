import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const GA_MEASUREMENT_ID = "G-RRSZHG35Z6";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends page views on client-side route changes. The initial page view is
 * already tracked by the gtag snippet in index.html.
 */
export function GoogleAnalytics() {
  const { pathname, search } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: pathname + search,
    });
  }, [pathname, search]);

  return null;
}
