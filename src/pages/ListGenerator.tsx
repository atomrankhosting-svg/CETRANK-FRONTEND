import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ImageUploadFlow } from "@/components/dashboard/ImageUploadFlow";
import { CollegeResults } from "@/components/dashboard/CollegeResults";
import { ApiError, generateCollegeList, unlockCollegeList, createRazorpayOrder, verifyRazorpaySignature, claimFreeCoupon, recordPaymentEvent } from "@/lib/api";
import type { CollegeResult, CutoffRequest, GatedListResponse } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { downloadCollegeListPdf } from "@/lib/collegePdf";
import type { UserDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, User, FileScan, Tag, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_TIER_PRICES, fetchTierPrices, type TierPrices } from "@/lib/listPricing";
import { BROADEN_FILTERS_ADVICE, MIN_LIST_OPTIONS_FOR_CREDIT, PREVIEW_COLLEGE_COUNT } from "@/lib/listConstants";
import {
  trackBeginCheckout,
  trackCouponApplied,
  trackDownloadPdf,
  trackGenerateList,
  trackPaymentCancelled,
  trackPricingModalOpened,
  trackPurchase,
} from "@/lib/analytics";
import {
  clearPendingGenerate,
  loadPendingGenerate,
  savePendingGenerate,
} from "@/lib/filterFormDraft";

type InputMethod = "manual" | "upload";

type GeneratedListState = {
  results: CollegeResult[];
  userDetails: UserDetails | null;
  hasSearched: boolean;
  lastFilters: CutoffRequest | null;
  creditNotCharged: boolean;
  isLocked: boolean;
  totalCount: number;
};

const createInitialGeneratedListState = (): GeneratedListState => ({
  results: [],
  userDetails: null,
  hasSearched: false,
  lastFilters: null,
  creditNotCharged: false,
  isLocked: false,
  totalCount: 0,
});

/** Set to true to re-enable the FC Receipt AI autofill tab */
const SHOW_FC_RECEIPT_AUTOFILL = false;

const ListGenerator = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual");
  const [generatedLists, setGeneratedLists] = useState<Record<InputMethod, GeneratedListState>>({
    manual: createInitialGeneratedListState(),
    upload: createInitialGeneratedListState(),
  });
  const [loadingMethod, setLoadingMethod] = useState<InputMethod | null>(null);
  const [unlockingMethod, setUnlockingMethod] = useState<InputMethod | null>(null);
  const [downloadingMethod, setDownloadingMethod] = useState<InputMethod | null>(null);

  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalContext, setPricingModalContext] = useState<"buy_credits" | "unlock_list">("buy_credits");
  const [paymentLoadingTier, setPaymentLoadingTier] = useState<"basic" | "standard" | "pro" | null>(null);
  const [tierPrices, setTierPrices] = useState<TierPrices>(DEFAULT_TIER_PRICES);

  // Coupon state
  type CouponInfo = {
    code: string;
    discount_type: "percentage" | "flat";
    discount_value: number;
  };
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const pendingGenerateHandled = useRef(false);
  const activeGeneratedList = generatedLists[inputMethod];
  const isCurrentMethodLoading = loadingMethod === inputMethod;
  const isCurrentMethodUnlocking = unlockingMethod === inputMethod;
  const isCurrentMethodDownloading = downloadingMethod === inputMethod;

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.from(headerRef.current.children, {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
    });
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_credits")
        .select("available_credits")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        await supabase.from("user_credits").insert({ user_id: user.id, available_credits: 0 });
        setAvailableCredits(0);
      } else if (data) {
        setAvailableCredits(data.available_credits);
      }
    };

    fetchCredits();
  }, [user]);

  useEffect(() => {
    const loadTierPrices = async () => {
      try {
        const prices = await fetchTierPrices();
        setTierPrices(prices);
      } catch (error) {
        console.error("Failed to load tier prices:", error);
        setTierPrices(DEFAULT_TIER_PRICES);
      }
    };

    void loadTierPrices();
  }, []);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);

    try {
      // Query coupon directly from Supabase
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .single();

      if (error || !coupon) {
        setCouponError("Invalid coupon code.");
        return;
      }

      // Check if active
      if (!coupon.is_active) {
        setCouponError("This coupon is no longer active.");
        return;
      }

      // Check expiration
      if (coupon.expires_at) {
        const expiresAt = new Date(coupon.expires_at);
        if (new Date() > expiresAt) {
          setCouponError("This coupon has expired.");
          return;
        }
      }

      // Check usage limit
      if (coupon.max_uses !== null && coupon.use_count >= coupon.max_uses) {
        setCouponError("This coupon has reached its usage limit.");
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
      });

      trackCouponApplied(coupon.code);

      const standardPrice = tierPrices.standard;
      const standardDiscounted =
        coupon.discount_type === "percentage"
          ? Math.round(standardPrice * (100 - coupon.discount_value) / 100)
          : Math.max(0, Math.round(standardPrice - coupon.discount_value * 100));
      const isFreeOnStandard = standardDiscounted <= 0;

      toast({
        title: "Coupon Applied!",
        description: isFreeOnStandard
          ? "This coupon makes your purchase completely free!"
          : `Discount applied: ${coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} off`,
      });
    } catch (err) {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const getDisplayPrice = (tier: "basic" | "standard" | "pro") => {
    const originalAmount = tierPrices[tier];
    if (!appliedCoupon) return originalAmount / 100;

    const discountedAmount =
      appliedCoupon.discount_type === "percentage"
        ? Math.round(originalAmount * (100 - appliedCoupon.discount_value) / 100)
        : Math.max(0, Math.round(originalAmount - appliedCoupon.discount_value * 100));

    return discountedAmount / 100;
  };

  const isTierFree = (tier: "basic" | "standard" | "pro") => getDisplayPrice(tier) <= 0;
  const getPayableAmountInPaise = (tier: "basic" | "standard" | "pro") =>
    Math.max(0, Math.round(getDisplayPrice(tier) * 100));

  const handlePayment = async (tier: "basic" | "standard" | "pro", creditsToAdd: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setPaymentLoadingTier(tier);

    try {
      const payableAmountInPaise = getPayableAmountInPaise(tier);

      // Skip Razorpay for free checkout (zero-priced tier or 100% discount coupon)
      // Capture locked list state at payment start so callbacks use consistent data
      const lockedListSnapshot = generatedLists[inputMethod];
      const isListPendingUnlock =
        lockedListSnapshot.isLocked && lockedListSnapshot.totalCount >= MIN_LIST_OPTIONS_FOR_CREDIT;

      if (payableAmountInPaise <= 0) {
        if (appliedCoupon) {
          const result = await claimFreeCoupon(appliedCoupon.code, tier, {
            userId: user.id,
            userEmail: user.email ?? undefined,
          });
          if (result.success) {
            const newTotal = (availableCredits || 0) + result.credits;
            const { error } = await supabase
              .from("user_credits")
              .update({ available_credits: newTotal })
              .eq("user_id", user.id);

            if (error) {
              toast({
                title: "Credit Update Failed",
                description: "Coupon claimed but credits couldn't be updated. Contact support.",
                variant: "destructive",
              });
              return;
            }

            setAvailableCredits(newTotal);
            setShowPricingModal(false);
            handleRemoveCoupon();
            trackPurchase({
              tier,
              transactionId: `free_coupon_${appliedCoupon.code}`,
              valueInPaise: 0,
              creditsAdded: result.credits,
              couponCode: appliedCoupon.code,
            });
            if (isListPendingUnlock && lockedListSnapshot.lastFilters) {
              await unlockList(lockedListSnapshot.lastFilters, inputMethod);
            } else {
              toast({
                title: "Credits Added",
                description: `Added ${result.credits} free list credits to your account.`,
              });
            }
          }
          return;
        }

        const newTotal = (availableCredits || 0) + creditsToAdd;
        const { error } = await supabase
          .from("user_credits")
          .update({ available_credits: newTotal })
          .eq("user_id", user.id);

        if (error) {
          toast({
            title: "Credit Update Failed",
            description: "Could not add free credits. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        setAvailableCredits(newTotal);
        setShowPricingModal(false);
        handleRemoveCoupon();
        trackPurchase({
          tier,
          transactionId: `free_tier_${Date.now()}`,
          valueInPaise: 0,
          creditsAdded: creditsToAdd,
        });
        await recordPaymentEvent({
          user_id: user.id,
          user_email: user.email ?? undefined,
          status: "success",
          tier,
          amount_in_paise: 0,
          coupon_code: appliedCoupon?.code,
        });
        if (isListPendingUnlock && lockedListSnapshot.lastFilters) {
          await unlockList(lockedListSnapshot.lastFilters, inputMethod);
        } else {
          toast({
            title: "Credits Added",
            description: `Added ${creditsToAdd} free list credit${creditsToAdd > 1 ? "s" : ""} to your account.`,
          });
        }
        return;
      }

      // 1. Create Razorpay order via backend api (with coupon if applied)
      const order = await createRazorpayOrder(tier, {
        couponCode: appliedCoupon?.code,
        userId: user.id,
        userEmail: user.email ?? undefined,
      });

      // 2. Configure Razorpay Checkout options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "CETRANK",
        description: `Unlock ${creditsToAdd} College Prediction List${creditsToAdd > 1 ? "s" : ""}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment signature on backend api
            await verifyRazorpaySignature({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 4. Update user credits in database (Supabase)
            const newTotal = (availableCredits || 0) + creditsToAdd;
            const { error } = await supabase
              .from("user_credits")
              .update({ available_credits: newTotal })
              .eq("user_id", user.id);

            if (error) {
              console.error("Failed to update credits in database:", error);
              await recordPaymentEvent({
                user_id: user.id,
                user_email: user.email ?? undefined,
                status: "credits_failed",
                tier,
                amount_in_paise: order.amount,
                coupon_code: appliedCoupon?.code,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                error_message: error.message,
              });
              toast({
                title: "Credit Update Failed",
                description: "Payment verified successfully, but we couldn't update your credits. Please contact support.",
                variant: "destructive",
              });
              return;
            }

            setAvailableCredits(newTotal);
            setShowPricingModal(false);
            handleRemoveCoupon();
            trackPurchase({
              tier,
              transactionId: response.razorpay_payment_id,
              valueInPaise: order.amount,
              creditsAdded: creditsToAdd,
              couponCode: appliedCoupon?.code,
            });
            if (isListPendingUnlock && lockedListSnapshot.lastFilters) {
              await unlockList(lockedListSnapshot.lastFilters, inputMethod);
            } else {
              toast({
                title: "Payment Successful",
                description: `Added ${creditsToAdd} list credits to your account!`,
              });
            }
          } catch (err) {
            console.error("Signature verification failed:", err);
            await recordPaymentEvent({
              user_id: user.id,
              user_email: user.email ?? undefined,
              status: "failed",
              tier,
              amount_in_paise: order.amount,
              coupon_code: appliedCoupon?.code,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              error_message: err instanceof Error ? err.message : "Verification failed",
            });
            toast({
              title: "Verification Failed",
              description: "Your payment verification failed. If money was debited, please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.email?.split("@")[0] || "",
          email: user.email || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            trackPaymentCancelled({ tier, valueInPaise: order.amount });
            void recordPaymentEvent({
              user_id: user.id,
              user_email: user.email ?? undefined,
              status: "cancelled",
              tier,
              amount_in_paise: order.amount,
              coupon_code: appliedCoupon?.code,
              razorpay_order_id: order.id,
            });
            toast({
              title: "Payment Cancelled",
              description: "The payment process was cancelled.",
            });
          }
        }
      };

      trackBeginCheckout({
        tier,
        valueInPaise: payableAmountInPaise,
        couponCode: appliedCoupon?.code,
      });

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initialization failed:", err);
      toast({
        title: "Payment Gateway Error",
        description: err instanceof Error ? err.message : "Failed to contact payment server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoadingTier(null);
    }
  };

  const getAccessToken = () => session?.access_token ?? null;

  const openPlansModal = (
    context: "buy_credits" | "unlock_list",
    reason: "no_credits" | "manual",
  ) => {
    setPricingModalContext(context);
    trackPricingModalOpened(reason);
    setShowPricingModal(true);
  };

  const applyUnlockedList = (searchMethod: InputMethod, response: GatedListResponse) => {
    if (response.credits_remaining !== undefined) {
      setAvailableCredits(response.credits_remaining);
    }

    setGeneratedLists((currentLists) => ({
      ...currentLists,
      [searchMethod]: {
        ...currentLists[searchMethod],
        results: response.results,
        userDetails: response.user_details,
        isLocked: false,
        totalCount: response.count,
        creditNotCharged: false,
      },
    }));
  };

  /** Fetch full list from server, save history, and deduct 1 credit. */
  const unlockList = async (
    filters: CutoffRequest,
    searchMethod: InputMethod,
    options?: { silent?: boolean },
  ): Promise<GatedListResponse | null> => {
    const accessToken = getAccessToken();
    if (!user || !accessToken) {
      toast({
        title: "Session expired",
        description: "Please sign in again to unlock your list.",
        variant: "destructive",
      });
      return null;
    }

    if (unlockingMethod !== null) return null;

    setUnlockingMethod(searchMethod);
    try {
      const response = await unlockCollegeList(filters, accessToken);
      applyUnlockedList(searchMethod, response);

      trackGenerateList({
        inputMethod: searchMethod,
        resultCount: response.count,
        courseType: filters.course_type,
        creditCharged: true,
      });

      if (!options?.silent) {
        toast({
          title: "List unlocked!",
          description: `Showing all ${response.count} colleges. You have ${Math.max(0, response.credits_remaining ?? 0)} credits remaining.`,
        });
      }

      return response;
    } catch (err) {
      console.error("[ListGenerator] Error unlocking list:", err);
      toast({
        title: "Unlock failed",
        description:
          err instanceof ApiError && err.detail
            ? err.detail
            : "Could not unlock the full list. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUnlockingMethod((current) => (current === searchMethod ? null : current));
    }
  };

  const handleUnlockList = () => {
    const list = generatedLists[inputMethod];
    if (!list.isLocked || !list.lastFilters || list.totalCount === 0) return;

    if (availableCredits !== null && availableCredits > 0) {
      void unlockList(list.lastFilters, inputMethod);
    } else {
      openPlansModal("unlock_list", "no_credits");
    }
  };

  const handleSearch = async (filters: CutoffRequest) => {
    if (!user) {
      savePendingGenerate(filters);
      toast({
        title: "Create an account to generate your list",
        description: "Sign up to continue — your form details will be saved.",
      });
      navigate("/auth?mode=signup", {
        state: { from: { pathname: "/list-generator" } },
      });
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast({
        title: "Session expired",
        description: "Please sign in again to generate your list.",
        variant: "destructive",
      });
      navigate("/auth?mode=signup", {
        state: { from: { pathname: "/list-generator" } },
      });
      return;
    }

    const searchMethod = inputMethod;

    setLoadingMethod(searchMethod);
    setGeneratedLists((currentLists) => ({
      ...currentLists,
      [searchMethod]: {
        ...currentLists[searchMethod],
        hasSearched: true,
        lastFilters: filters,
      },
    }));

    try {
      const apiResponse = await generateCollegeList(filters, accessToken);
      const {
        results: list,
        user_details,
        count,
        is_locked: isLocked,
        credit_not_charged: creditNotCharged,
        credits_remaining: creditsRemaining,
      } = apiResponse;

      if (creditsRemaining !== undefined) {
        setAvailableCredits(creditsRemaining);
      }

      if (count === 0) {
        setGeneratedLists((currentLists) => ({
          ...currentLists,
          [searchMethod]: {
            ...currentLists[searchMethod],
            results: list,
            userDetails: user_details,
            creditNotCharged: false,
            isLocked: false,
            totalCount: 0,
          },
        }));
        toast({
          title: "No results",
          description: "Try adjusting your filters for more options.",
        });
        return;
      }

      if (creditNotCharged) {
        setGeneratedLists((currentLists) => ({
          ...currentLists,
          [searchMethod]: {
            ...currentLists[searchMethod],
            results: list,
            userDetails: user_details,
            creditNotCharged: true,
            isLocked: false,
            totalCount: count,
          },
        }));
        trackGenerateList({
          inputMethod: searchMethod,
          resultCount: count,
          courseType: filters.course_type,
          creditCharged: false,
        });
        toast({
          title: `Only ${count} option${count !== 1 ? "s" : ""} found`,
          description: `No credit was used. ${BROADEN_FILTERS_ADVICE}`,
        });
        return;
      }

      setGeneratedLists((currentLists) => ({
        ...currentLists,
        [searchMethod]: {
          ...currentLists[searchMethod],
          results: list,
          userDetails: user_details,
          creditNotCharged: false,
          isLocked,
          totalCount: count,
        },
      }));

      if (isLocked) {
        trackGenerateList({
          inputMethod: searchMethod,
          resultCount: count,
          courseType: filters.course_type,
          creditCharged: false,
        });
        toast({
          title: `${PREVIEW_COLLEGE_COUNT} colleges previewed`,
          description: `Unlock the full list of ${count} colleges to see all your options.`,
        });
      } else {
        trackGenerateList({
          inputMethod: searchMethod,
          resultCount: count,
          courseType: filters.course_type,
          creditCharged: true,
        });
        toast({
          title: "Success",
          description: `List generated! You have ${creditsRemaining ?? availableCredits ?? 0} credits remaining.`,
        });
      }
    } catch (err) {
      console.error("[ListGenerator] Error in handleSearch:", err);
      toast({
        title: "Error",
        description:
          err instanceof ApiError && err.detail
            ? err.detail
            : "Failed to fetch results. Try again.",
        variant: "destructive",
      });
      setGeneratedLists((currentLists) => ({
        ...currentLists,
        [searchMethod]: {
          ...currentLists[searchMethod],
          results: [],
          creditNotCharged: false,
          isLocked: false,
          totalCount: 0,
        },
      }));
    } finally {
      setLoadingMethod((currentMethod) => (currentMethod === searchMethod ? null : currentMethod));
    }
  };

  useEffect(() => {
    if (!user || !session?.access_token || pendingGenerateHandled.current) return;

    const pendingFilters = loadPendingGenerate();
    if (!pendingFilters) return;

    pendingGenerateHandled.current = true;
    clearPendingGenerate();

    toast({
      title: "Welcome back!",
      description: "Your form details were restored. Generating your list now…",
    });

    void handleSearch(pendingFilters);
  }, [user, session?.access_token]);

  const handleDownloadPdf = async () => {
    const list = activeGeneratedList;
    if (!list.hasSearched || list.results.length === 0) return;

    const downloadMethod = inputMethod;
    setDownloadingMethod(downloadMethod);

    try {
      let pdfResults = list.results;
      let pdfUserDetails = list.userDetails;
      const pdfFilters = list.lastFilters;

      if (list.isLocked) {
        if (availableCredits === null || availableCredits <= 0) {
          openPlansModal("unlock_list", "no_credits");
          return;
        }

        if (!list.lastFilters) return;

        const unlocked = await unlockList(list.lastFilters, downloadMethod, { silent: true });
        if (!unlocked) return;

        pdfResults = unlocked.results;
        pdfUserDetails = unlocked.user_details;
      }

      await downloadCollegeListPdf({
        results: pdfResults,
        filters: pdfFilters,
        userDetails: pdfUserDetails,
      });
      trackDownloadPdf({
        source: "list_generator",
        resultCount: pdfResults.length,
      });
      toast({
        title: "PDF downloaded",
        description: `Saved ${pdfResults.length} college${pdfResults.length !== 1 ? "s" : ""} as a PDF.`,
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "PDF export failed",
        description: "We couldn't generate the PDF for this list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingMethod((currentMethod) => (currentMethod === downloadMethod ? null : currentMethod));
    }
  };

  return (
    <div className="app-shell">
      <SiteBackdrop particleCount={isMobile ? 0 : 12} variant="focused" />
      <Navbar />

      <div className="relative z-10 mx-auto max-w-7xl px-3 pb-24 pt-24 sm:px-4 sm:pb-12 sm:pt-28">
        <div ref={headerRef} className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold sm:text-3xl">Admission Engine 2026</h1>
            {user && (
              <div className="flex w-fit flex-wrap items-center gap-2">
                <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Credits Remaining: {availableCredits !== null ? availableCredits : "..."}
                </div>
                <Button
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => {
                    setPricingModalContext("buy_credits");
                    trackPricingModalOpened("manual");
                    setShowPricingModal(true);
                  }}
                >
                  Buy Credits
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Input Method Selector */}
          {SHOW_FC_RECEIPT_AUTOFILL && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8 p-1 bg-muted/30 rounded-[32px] border w-fit mx-auto sm:mx-0">
              <button
                onClick={() => setInputMethod("manual")}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-[28px] transition-all text-sm font-semibold",
                  inputMethod === "manual" 
                    ? "bg-white shadow-sm text-primary border border-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <User className="w-4 h-4" />
                Manual Entry
              </button>
              <button
                onClick={() => setInputMethod("upload")}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-[28px] transition-all text-sm font-semibold relative overflow-hidden group",
                  inputMethod === "upload" 
                    ? "bg-white shadow-sm text-primary border border-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileScan className="w-4 h-4" />
                <span>FC Receipt Autofill</span>
                {inputMethod === "upload" && (
                  <motion.div 
                    layoutId="active-glow"
                    className="absolute inset-0 bg-primary/5 pointer-events-none"
                  />
                )}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {inputMethod === "manual" || !SHOW_FC_RECEIPT_AUTOFILL ? (
              <motion.div
                key="manual-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <FilterBar onSearch={handleSearch} isLoading={isCurrentMethodLoading} />
              </motion.div>
            ) : (
              <motion.div
                key="upload-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ImageUploadFlow onSearch={handleSearch} isLoading={isCurrentMethodLoading} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-4">
            <CollegeResults
              results={activeGeneratedList.results}
              isLoading={isCurrentMethodLoading}
              hasSearched={activeGeneratedList.hasSearched}
              creditNotCharged={activeGeneratedList.creditNotCharged}
              isLocked={activeGeneratedList.isLocked}
              totalCount={activeGeneratedList.totalCount}
              hasCredits={availableCredits !== null && availableCredits > 0}
              onUnlock={handleUnlockList}
              isUnlocking={isCurrentMethodUnlocking}
              onDownloadPdf={handleDownloadPdf}
              isDownloadingPdf={isCurrentMethodDownloading}
            />
          </motion.div>
        </div>
      </div>

      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border bg-background p-4 shadow-2xl sm:p-6">
            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:right-4 sm:top-4"
              aria-label="Close pricing modal"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-2 pr-10 text-center text-2xl font-bold">
              {pricingModalContext === "unlock_list"
                ? "Unlock Your Full College List"
                : "Buy List Credits"}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground sm:mb-8 sm:text-base">
              {pricingModalContext === "unlock_list"
                ? `You've seen your top ${PREVIEW_COLLEGE_COUNT} matches. Purchase credits to unlock all ${activeGeneratedList.totalCount} colleges, PDF download, and save to My Lists.`
                : "Choose a credit pack to generate highly accurate, AI-filtered college prediction lists."}
            </p>

            {/* Coupon Code Section */}
            <div className="mb-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Have a coupon code?</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      <span className="font-bold">{appliedCoupon.code}</span>
                      {" — "}
                      {appliedCoupon.discount_type === "percentage"
                        ? `${appliedCoupon.discount_value}% off`
                        : `₹${appliedCoupon.discount_value} off`}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="rounded-full p-1 text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyCoupon();
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="rounded-xl border-primary/30 px-5 hover:bg-primary/10 hover:text-primary"
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              )}
              {couponError && (
                <p className="mt-2 text-xs font-medium text-red-500">{couponError}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              {(["basic", "standard", "pro"] as const).map((tier) => {
                const tierConfig = {
                  basic: { label: "Basic", credits: 1, popular: false },
                  standard: { label: "Standard", credits: 3, popular: true },
                  pro: { label: "Pro", credits: 5, popular: false },
                }[tier];

                const originalPrice = tierPrices[tier] / 100;
                const displayPrice = getDisplayPrice(tier);
                const hasDiscount = appliedCoupon && displayPrice < originalPrice;
                const isFree = isTierFree(tier);

                return (
                  <div
                    key={tier}
                    className={cn(
                      "flex flex-col items-center rounded-2xl p-5 transition-all sm:p-6",
                      tierConfig.popular
                        ? "relative border-2 border-primary bg-primary/5 shadow-lg md:-translate-y-4"
                        : "border hover:border-primary"
                    )}
                  >
                    {tierConfig.popular && (
                      <div className="absolute top-0 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-semibold">{tierConfig.label}</h3>
                    <div className="mb-2 mt-4 flex items-baseline gap-2">
                      {hasDiscount && (
                        <span className="text-lg font-medium text-muted-foreground line-through">Rs {originalPrice}</span>
                      )}
                      <span className="text-3xl font-bold">
                        {isFree ? "FREE" : `Rs ${displayPrice}`}
                      </span>
                    </div>
                    <p className="mb-6 text-sm text-muted-foreground">
                      {tierConfig.credits} List Generation{tierConfig.credits > 1 ? "s" : ""}
                    </p>
                    <Button
                      className="mt-auto w-full"
                      onClick={() => handlePayment(tier, tierConfig.credits)}
                      disabled={paymentLoadingTier !== null}
                    >
                      {paymentLoadingTier === tier
                        ? "Processing..."
                        : isFree
                          ? `Claim ${tierConfig.credits} Free Credit${tierConfig.credits > 1 ? "s" : ""}`
                          : `Buy ${tierConfig.credits} Credit${tierConfig.credits > 1 ? "s" : ""}`
                      }
                    </Button>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By purchasing you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/refund" className="text-primary hover:underline">
                Refund Policy
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListGenerator;
