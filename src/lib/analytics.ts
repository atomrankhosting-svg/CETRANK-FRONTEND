export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-RRSZHG35Z6";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const isAnalyticsEnabled = (): boolean =>
  import.meta.env.PROD && Boolean(GA_MEASUREMENT_ID);

function gtagCommand(...args: unknown[]) {
  if (!isAnalyticsEnabled()) return;
  window.gtag?.(...args);
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  gtagCommand("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle ?? document.title,
    page_location: window.location.href,
  });
}

export function trackEvent(eventName: string, params?: EventParams) {
  gtagCommand("event", eventName, params);
}

export function setAnalyticsUserId(userId: string | null) {
  if (!isAnalyticsEnabled()) return;

  if (userId) {
    gtagCommand("config", GA_MEASUREMENT_ID, { user_id: userId });
    return;
  }

  gtagCommand("config", GA_MEASUREMENT_ID, { user_id: undefined });
}

export function trackLogin(method: "email" | "google") {
  trackEvent("login", { method });
}

export function trackSignUp(method: "email" | "google") {
  trackEvent("sign_up", { method });
}

export function trackSignOut() {
  trackEvent("logout");
}

export function trackCtaClick(ctaName: string, location: string) {
  trackEvent("select_content", {
    content_type: "cta",
    content_id: ctaName,
    location,
  });
}

export function trackGenerateList(params: {
  inputMethod: "manual" | "upload";
  resultCount: number;
  courseType?: string;
  creditCharged: boolean;
}) {
  trackEvent("generate_list", {
    input_method: params.inputMethod,
    result_count: params.resultCount,
    course_type: params.courseType,
    credit_charged: params.creditCharged,
  });
}

export function trackDownloadPdf(params: {
  source: "list_generator" | "my_lists";
  resultCount: number;
}) {
  trackEvent("download_pdf", {
    source: params.source,
    result_count: params.resultCount,
  });
}

export function trackPricingModalOpened(reason: "no_credits" | "manual") {
  trackEvent("view_pricing", { reason });
}

export function trackCouponApplied(couponCode: string) {
  trackEvent("apply_coupon", { coupon_code: couponCode });
}

export function trackBeginCheckout(params: {
  tier: "basic" | "standard" | "pro";
  valueInPaise: number;
  couponCode?: string;
}) {
  const value = params.valueInPaise / 100;

  trackEvent("begin_checkout", {
    currency: "INR",
    value,
    coupon: params.couponCode,
    items: [
      {
        item_id: params.tier,
        item_name: `${params.tier} plan`,
        price: value,
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase(params: {
  tier: "basic" | "standard" | "pro";
  transactionId: string;
  valueInPaise: number;
  creditsAdded: number;
  couponCode?: string;
}) {
  const value = params.valueInPaise / 100;

  trackEvent("purchase", {
    currency: "INR",
    value,
    transaction_id: params.transactionId,
    coupon: params.couponCode,
    items: [
      {
        item_id: params.tier,
        item_name: `${params.tier} plan`,
        price: value,
        quantity: params.creditsAdded,
      },
    ],
  });
}

export function trackPaymentCancelled(params: {
  tier: "basic" | "standard" | "pro";
  valueInPaise: number;
}) {
  trackEvent("payment_cancelled", {
    tier: params.tier,
    value: params.valueInPaise / 100,
    currency: "INR",
  });
}

export function trackAuthRedirect(fromPath: string) {
  trackEvent("auth_redirect", { from_path: fromPath });
}
