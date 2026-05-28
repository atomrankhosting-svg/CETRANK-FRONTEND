import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  FileScan,
  RefreshCcw,
  User,
  GraduationCap,
  Percent,
  MapPin,
  Settings2,
  Check,
  X,
  FileUp,
  ChevronDown,
  Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  extractApplicationForm, 
  getMetadata, 
  type ApplicationFormExtractedData, 
  type CutoffRequest,
  type MetadataResponse,
  BRANCH_FILTERS
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadFlowProps {
  onSearch: (filters: CutoffRequest) => void;
  isLoading: boolean;
}

type FlowStage = "upload" | "review";
const UPLOAD_TFWS_STORAGE_KEY = "cetrank:upload:is_tfws";

function SelectedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium leading-tight max-w-[160px]">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function MultiSelectItem({
  label,
  selected,
  onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 ${
        selected ? "text-primary font-medium bg-primary/5" : ""
      }`}
    >
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          selected ? "bg-primary border-primary" : "border-border/80"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function ImageUploadFlow({ onSearch, isLoading }: ImageUploadFlowProps) {
  const [stage, setStage] = useState<FlowStage>("upload");
  const [isExtracting, setIsExtracting] = useState(false);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  
  // Extracted/Form state
  const [formData, setFormData] = useState<ApplicationFormExtractedData & {
    user_minority_list: string[];
    division: string[] | null;
    city: string[] | null;
    is_tech: boolean;
    is_electronic: boolean;
    is_civil: boolean;
    is_mechanical: boolean;
    is_electrical: boolean;
    is_other: boolean;
    location_flexibility: 1 | 2 | 3;
    is_tfws: boolean;
  }>({
    student_name: "",
    user_gender: null,
    user_category: null,
    user_home_university: "",
    percentile_cet: 0,
    percentile_ai: 0,
    is_ews: false,
    minority_detected: null,
    user_minority_list: [],
    division: null,
    city: null,
    is_tech: true,
    is_electronic: false,
    is_civil: false,
    is_mechanical: false,
    is_electrical: false,
    is_other: false,
    location_flexibility: 3,
    is_tfws: false,
  });

  const [divisionSearch, setDivisionSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const divisionDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(event.target as Node)) {
        setShowDivisionDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const data = await getMetadata();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to load metadata", error);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTfws = window.localStorage.getItem(UPLOAD_TFWS_STORAGE_KEY);
    if (savedTfws === "true") {
      setFormData((prev) => ({ ...prev, is_tfws: true }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UPLOAD_TFWS_STORAGE_KEY, String(formData.is_tfws));
  }, [formData.is_tfws]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    try {
      const response = await extractApplicationForm(file);
      if (response.success && response.extracted_data) {
        const data = response.extracted_data;
        setFormData(prev => ({
          ...prev,
          ...data,
          student_name: data.student_name || "",
          user_home_university: data.user_home_university || "",
          user_minority_list: data.minority_detected ? [data.minority_detected] : [],
        }));
        setConfidence(response.confidence || "high");
        setStage("review");
        toast({
          title: "Extraction Successful",
          description: "We've pre-filled the form with details from your FC Acknowledgement.",
        });
      } else {
        toast({
          title: "Extraction Failed",
          description: response.error || "Could not read the receipt. Please try a clearer image.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred during extraction.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = () => {
    // Validation
    if (!formData.user_gender || !formData.user_category || !formData.user_home_university) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields in the review section.",
        variant: "destructive",
      });
      return;
    }

    const hasBranch = formData.is_tech || formData.is_electronic || formData.is_civil || 
                    formData.is_mechanical || formData.is_electrical || formData.is_other;
    
    if (!hasBranch) {
      toast({
        title: "No Branch Selected",
        description: "Please select at least one preferred branch.",
        variant: "destructive",
      });
      return;
    }

    const request: CutoffRequest = {
      ...formData,
      city: formData.city && formData.city.length > 0 ? formData.city : null,
      division: formData.division && formData.division.length > 0 ? formData.division : null,
    };
    
    console.log("[ImageUploadFlow] Generating list with request:", JSON.stringify(request, null, 2));
    onSearch(request);
  };

  const reset = () => {
    setStage("upload");
    setFile(null);
    setPreview(null);
    setConfidence(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {stage === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="panel-surface p-10 border-dashed flex flex-col items-center text-center gap-6 group hover:border-primary/50 transition-colors">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <FileUp className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Upload FC Acknowledgement</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Upload a photo or scan of your FC Center Acknowledgement receipt.
                </p>
              </div>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer group hover:border-primary/50 hover:bg-primary/5 mb-8",
                file ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-40 rounded-lg overflow-hidden border shadow-lg mb-4">
                    <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <RefreshCcw className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <p className="font-medium text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {file.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1">Click to browse or drag and drop</p>
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP (Max 10MB)</p>
                </div>
              )}
            </div>

            <Button 
              size="lg" 
              className="h-12 px-10 rounded-full glow-primary"
              disabled={!file || isExtracting}
              onClick={handleExtract}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Details...
                </>
              ) : (
                <>
                  Extract Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="panel-surface overflow-hidden">
              <div className="bg-primary/5 p-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileScan className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">AI Extraction Results</h3>
                    <p className="text-xs text-muted-foreground">We've identified your details from the form</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowReview(!showReview)}
                  className="rounded-full gap-2"
                >
                  {showReview ? "Hide Details" : "Review Details"}
                  <ArrowRight className={cn("w-4 h-4 transition-transform", showReview ? "rotate-90" : "rotate-0")} />
                </Button>
              </div>

              {!showReview && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Category</p>
                    <p className={cn("text-sm font-bold flex items-center gap-1", !formData.user_category && "text-red-500 animate-pulse")}>
                      {formData.user_category || "MISSING"} 
                      {formData.user_category ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3" />}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">CET Percentile</p>
                    <p className="text-sm font-bold">{formData.percentile_cet?.toFixed(4)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">University</p>
                    <p className="text-sm font-bold truncate max-w-[150px]">{formData.user_home_university || "Missing"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">EWS</p>
                    <p className="text-sm font-bold">{formData.is_ews ? "Yes" : "No"}</p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showReview && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 border-t bg-muted/10 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Candidate Name</Label>
                          <Input 
                            value={formData.student_name || ""} 
                            onChange={e => setFormData({...formData, student_name: e.target.value})}
                            className="rounded-xl h-10"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Gender</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {["Male", "Female"].map(g => (
                                <Button
                                  key={g}
                                  variant={formData.user_gender === g ? "default" : "outline"}
                                  size="sm"
                                  className="rounded-lg h-9"
                                  onClick={() => setFormData({...formData, user_gender: g as any})}
                                >
                                  {g}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className={cn("text-xs uppercase tracking-wider", !formData.user_category ? "text-red-500 font-bold" : "text-muted-foreground")}>
                              Category {!formData.user_category && "*"}
                            </Label>
                            <select 
                              value={formData.user_category || ""}
                              onChange={e => setFormData({...formData, user_category: e.target.value})}
                              className={cn(
                                "w-full h-9 rounded-lg border bg-background px-3 text-sm",
                                !formData.user_category && "border-red-300 ring-2 ring-red-100"
                              )}
                            >
                              <option value="" disabled>Select Category</option>
                              {["OPEN", "OBC", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "SEBC"].map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Home University</Label>
                          <select 
                            value={formData.user_home_university || ""}
                            onChange={e => setFormData({...formData, user_home_university: e.target.value})}
                            className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                          >
                            <option value="" disabled>Select University</option>
                            {metadata?.universities.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">MHT-CET %</Label>
                            <Input 
                              type="number"
                              value={formData.percentile_cet} 
                              onChange={e => setFormData({...formData, percentile_cet: parseFloat(e.target.value)})}
                              className="rounded-xl h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">JEE %</Label>
                            <Input 
                              type="number"
                              value={formData.percentile_ai} 
                              onChange={e => setFormData({...formData, percentile_ai: parseFloat(e.target.value)})}
                              className="rounded-xl h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!formData.user_category && !showReview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel-surface p-6 border-red-200 bg-red-50/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <h4 className="font-bold text-red-900">Wait, we missed your Category!</h4>
                    <p className="text-xs text-red-700">Please select it manually to ensure accurate college matching.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {["OPEN", "OBC", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "SEBC"].map(c => (
                    <Button
                      key={c}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-red-200 hover:bg-red-100 hover:border-red-300 transition-all font-bold"
                      onClick={() => setFormData({...formData, user_category: c})}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-xl">Your Preferences</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-6">
                  <div className="panel-surface p-6 space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        Preferred Branches
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BRANCH_FILTERS.map(b => (
                          <button
                            key={b.key}
                            onClick={() => setFormData(prev => ({ ...prev, [b.key]: !prev[b.key as keyof typeof prev] }))}
                            className={cn(
                              "flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all relative overflow-hidden group",
                              formData[b.key as keyof typeof formData] 
                                ? "bg-primary border-primary text-white shadow-lg scale-[1.02]" 
                                : "bg-white border-border hover:border-primary/50"
                            )}
                          >
                            <span className="text-xs font-bold">{b.label}</span>
                            <span className={cn("text-[9px]", formData[b.key as keyof typeof formData] ? "text-white/80" : "text-muted-foreground")}>
                              {b.key === 'is_tech' ? 'CS, IT, AI, DS' : 
                               b.key === 'is_electronic' ? 'ENTC, Electronics' : 
                               'Core Engineering'}
                            </span>
                            {formData[b.key as keyof typeof formData] && (
                              <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Location Preferences
                      </Label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 relative" ref={divisionDropdownRef}>
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Preferred Divisions</Label>
                          <div 
                            className="flex flex-wrap gap-1.5 p-3 rounded-2xl border bg-white min-h-[44px] cursor-pointer hover:border-primary/50 transition-colors relative"
                            onClick={() => setShowDivisionDropdown(!showDivisionDropdown)}
                          >
                            {(formData.division || []).map(div => (
                              <SelectedChip 
                                key={div} 
                                label={div} 
                                onRemove={() => {
                                  const next = (formData.division || []).filter(d => d !== div);
                                  setFormData({ ...formData, division: next });
                                }} 
                              />
                            ))}
                            {(!formData.division || formData.division.length === 0) && (
                              <span className="text-sm text-muted-foreground">Select divisions...</span>
                            )}
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>
                          
                          <AnimatePresence>
                            {showDivisionDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute z-[100] top-full mt-2 left-0 right-0 max-h-[240px] overflow-hidden rounded-2xl bg-white shadow-2xl border border-border/50 flex flex-col"
                              >
                                <div className="p-2 border-b">
                                  <div className="relative">
                                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="Search divisions..." 
                                      value={divisionSearch}
                                      onChange={e => setDivisionSearch(e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      className="pl-8 h-9 rounded-xl border-none bg-muted/50"
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto max-h-[200px]">
                                  {Object.keys(metadata?.divisions || {})
                                    .filter(div => div.toLowerCase().includes(divisionSearch.toLowerCase()))
                                    .map(div => (
                                      <MultiSelectItem
                                        key={div}
                                        label={div}
                                        selected={formData.division?.includes(div) || false}
                                        onClick={() => {
                                          const current = formData.division || [];
                                          const next = current.includes(div) ? current.filter(d => d !== div) : [...current, div];
                                          setFormData({ ...formData, division: next });
                                        }}
                                      />
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="space-y-2 relative" ref={cityDropdownRef}>
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Preferred Cities</Label>
                          <div 
                            className="flex flex-wrap gap-1.5 p-3 rounded-2xl border bg-white min-h-[44px] cursor-pointer hover:border-primary/50 transition-colors relative"
                            onClick={() => setShowCityDropdown(!showCityDropdown)}
                          >
                            {(formData.city || []).map(city => (
                              <SelectedChip 
                                key={city} 
                                label={city} 
                                onRemove={() => {
                                  const next = (formData.city || []).filter(c => c !== city);
                                  setFormData({ ...formData, city: next });
                                }} 
                              />
                            ))}
                            {(!formData.city || formData.city.length === 0) && (
                              <span className="text-sm text-muted-foreground">Select cities...</span>
                            )}
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          </div>

                          <AnimatePresence>
                            {showCityDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute z-[100] top-full mt-2 left-0 right-0 max-h-[240px] overflow-hidden rounded-2xl bg-white shadow-2xl border border-border/50 flex flex-col"
                              >
                                <div className="p-2 border-b">
                                  <div className="relative">
                                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      placeholder="Search cities..." 
                                      value={citySearch}
                                      onChange={e => setCitySearch(e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      className="pl-8 h-9 rounded-xl border-none bg-muted/50"
                                    />
                                  </div>
                                </div>
                                <div className="overflow-y-auto max-h-[200px]">
                                  {(formData.division && formData.division.length > 0
                                    ? Array.from(new Set(formData.division.flatMap(d => metadata?.divisions[d] || [])))
                                    : (metadata?.cities || [])
                                  ).sort()
                                    .filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
                                    .map(city => (
                                      <MultiSelectItem
                                        key={city}
                                        label={city}
                                        selected={formData.city?.includes(city) || false}
                                        onClick={() => {
                                          const current = formData.city || [];
                                          const next = current.includes(city) ? current.filter(c => c !== city) : [...current, city];
                                          setFormData({ ...formData, city: next });
                                        }}
                                      />
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        Quota Preferences
                      </Label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl border bg-white px-3 py-2.5">
                          <Switch
                            id="upload-ews-switch"
                            checked={formData.is_ews}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, is_ews: checked })
                            }
                            aria-labelledby="upload-ews-label"
                            aria-describedby="upload-ews-help"
                          />
                          <div>
                            <Label id="upload-ews-label" htmlFor="upload-ews-switch" className="text-xs font-medium text-foreground">
                              EWS Quota
                            </Label>
                            <p id="upload-ews-help" className="text-[11px] text-muted-foreground">
                              Include EWS seat consideration in shortlist.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border bg-white px-3 py-2.5">
                          <Switch
                            id="upload-tfws-switch"
                            checked={formData.is_tfws}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, is_tfws: checked })
                            }
                            aria-labelledby="upload-tfws-label"
                            aria-describedby="upload-tfws-help"
                          />
                          <div>
                            <Label id="upload-tfws-label" htmlFor="upload-tfws-switch" className="text-xs font-medium text-foreground">
                              TFWS
                            </Label>
                            <p id="upload-tfws-help" className="text-[11px] text-muted-foreground">
                              Include Tuition Fee Waiver Scheme seats.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-sm font-bold flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        Search Flexibility
                      </Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { val: 1, label: "Strict", desc: "No travel" },
                          { val: 2, label: "Moderate", desc: "Nearby" },
                          { val: 3, label: "Flexible", desc: "Anywhere" }
                        ].map(item => (
                          <div 
                            key={item.val}
                            onClick={() => setFormData({...formData, location_flexibility: item.val as any})}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all text-center",
                              formData.location_flexibility === item.val 
                                ? "bg-primary/5 border-primary shadow-inner" 
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              formData.location_flexibility === item.val ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                              {formData.location_flexibility === item.val && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{item.label}</p>
                              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-6">
                  <div className="panel-surface p-6 bg-primary text-white space-y-6">
                    <div className="space-y-2">
                      <h4 className="font-bold">Ready to Generate?</h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        We've merged your {confidence === 'high' ? 'perfectly' : ''} extracted form data with your preferences.
                      </p>
                    </div>

                    <Button 
                      className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-bold text-lg shadow-xl"
                      onClick={handleGenerate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          Generate List
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setShowReview(true)}
                        className="text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <User className="w-3 h-3" /> Edit Student Details
                      </button>
                      <button 
                        onClick={reset}
                        className="text-xs text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCcw className="w-3 h-3" /> Re-upload Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
