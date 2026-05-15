import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ImageUploadFlow } from "@/components/dashboard/ImageUploadFlow";
import { CollegeResults } from "@/components/dashboard/CollegeResults";
import { AISidebar } from "@/components/dashboard/AISidebar";
import { ApiError, getEligibleCutoffs } from "@/lib/api";
import type { CollegeResult, CutoffRequest } from "@/lib/api";
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
import { X, User, FileScan } from "lucide-react";
import { cn } from "@/lib/utils";

type InputMethod = "manual" | "upload";

type GeneratedListState = {
  results: CollegeResult[];
  userDetails: UserDetails | null;
  hasSearched: boolean;
  lastFilters: CutoffRequest | null;
};

const createInitialGeneratedListState = (): GeneratedListState => ({
  results: [],
  userDetails: null,
  hasSearched: false,
  lastFilters: null,
});

const ListGenerator = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [inputMethod, setInputMethod] = useState<InputMethod>("manual");
  const [generatedLists, setGeneratedLists] = useState<Record<InputMethod, GeneratedListState>>({
    manual: createInitialGeneratedListState(),
    upload: createInitialGeneratedListState(),
  });
  const [loadingMethod, setLoadingMethod] = useState<InputMethod | null>(null);
  const [downloadingMethod, setDownloadingMethod] = useState<InputMethod | null>(null);

  const [availableCredits, setAvailableCredits] = useState<number | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const activeGeneratedList = generatedLists[inputMethod];
  const isCurrentMethodLoading = loadingMethod === inputMethod;
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

  const simulatePayment = async (creditsToAdd: number) => {
    if (!user) return;

    const newTotal = (availableCredits || 0) + creditsToAdd;

    await supabase
      .from("user_credits")
      .update({ available_credits: newTotal })
      .eq("user_id", user.id);

    setAvailableCredits(newTotal);
    setShowPricingModal(false);
    toast({
      title: "Payment Successful",
      description: `Added ${creditsToAdd} list credits to your account!`,
    });
  };

  const handleSearch = async (filters: CutoffRequest) => {
    if (availableCredits !== null && availableCredits <= 0) {
      setShowPricingModal(true);
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
      const apiResponse = await getEligibleCutoffs(filters);
      const { results: list, user_details } = apiResponse;
      
      setGeneratedLists((currentLists) => ({
        ...currentLists,
        [searchMethod]: {
          ...currentLists[searchMethod],
          results: list,
          userDetails: user_details,
        },
      }));

      if (list.length === 0) {
        toast({
          title: "No results",
          description: "Try adjusting your filters for more options.",
        });
        return;
      }

      if (user && list.length > 0) {
        const newCreditBalance = (availableCredits || 1) - 1;
        await supabase
          .from("user_credits")
          .update({ available_credits: newCreditBalance })
          .eq("user_id", user.id);
        setAvailableCredits(newCreditBalance);

        // BULLETPROOF FIX: Explicitly constructing the JSON object to guarantee
        // that Supabase receives an object and not just the array.
        const listDataPayload = {
          results: list,
          user_details: user_details || filters,
          count: list.length
        };

        const { error } = await supabase.from("college_lists").insert({
          user_id: user.id,
          list_data: listDataPayload,
        });

        if (error) {
          console.error("Failed to save list to history:", error);
          toast({
            title: "History update failed",
            description: "Generated successfully, but couldn't save to your profile history.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: `List generated! You have ${newCreditBalance} credits remaining.`,
          });
        }
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
        },
      }));
    } finally {
      setLoadingMethod((currentMethod) => (currentMethod === searchMethod ? null : currentMethod));
    }
  };

  const handleDownloadPdf = async () => {
    if (activeGeneratedList.results.length === 0) return;
    const downloadMethod = inputMethod;
    setDownloadingMethod(downloadMethod);

    try {
      await downloadCollegeListPdf({
        results: activeGeneratedList.results,
        filters: activeGeneratedList.lastFilters,
        userDetails: activeGeneratedList.userDetails,
      });
      toast({
        title: "PDF downloaded",
        description: `Saved ${activeGeneratedList.results.length} college${activeGeneratedList.results.length !== 1 ? "s" : ""} as a PDF.`,
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
              <div className="w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Credits Remaining: {availableCredits !== null ? availableCredits : "..."}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Input Method Selector */}
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

          <AnimatePresence mode="wait">
            {inputMethod === "manual" ? (
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
              onDownloadPdf={handleDownloadPdf}
              isDownloadingPdf={isCurrentMethodDownloading}
            />
          </motion.div>
        </div>
      </div>

      <AISidebar />

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

            <h2 className="mb-2 pr-10 text-center text-2xl font-bold">Unlock Your College Lists</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground sm:mb-8 sm:text-base">
              You are out of credits. Choose a tier to generate highly accurate, AI-filtered
              college prediction lists.
            </p>

            <div className="grid gap-4 md:grid-cols-3 md:gap-6">
              <div className="flex flex-col items-center rounded-2xl border p-5 transition-colors hover:border-primary sm:p-6">
                <h3 className="text-xl font-semibold">Basic</h3>
                <div className="mb-2 mt-4 text-3xl font-bold">Rs 49</div>
                <p className="mb-6 text-sm text-muted-foreground">1 List Generation</p>
                <Button className="mt-auto w-full" onClick={() => simulatePayment(1)}>
                  Buy 1 Credit
                </Button>
              </div>

              <div className="relative flex flex-col items-center rounded-2xl border-2 border-primary bg-primary/5 p-5 shadow-lg md:-translate-y-4 sm:p-6">
                <div className="absolute top-0 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
                  Most Popular
                </div>
                <h3 className="text-xl font-semibold">Standard</h3>
                <div className="mb-2 mt-4 text-3xl font-bold">Rs 129</div>
                <p className="mb-6 text-sm text-muted-foreground">3 List Generations</p>
                <Button className="mt-auto w-full" onClick={() => simulatePayment(3)}>
                  Buy 3 Credits
                </Button>
              </div>

              <div className="flex flex-col items-center rounded-2xl border p-5 transition-colors hover:border-primary sm:p-6">
                <h3 className="text-xl font-semibold">Pro</h3>
                <div className="mb-2 mt-4 text-3xl font-bold">Rs 199</div>
                <p className="mb-6 text-sm text-muted-foreground">5 List Generations</p>
                <Button className="mt-auto w-full" onClick={() => simulatePayment(5)}>
                  Buy 5 Credits
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListGenerator;
