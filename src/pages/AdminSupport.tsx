import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { SiteBackdrop } from "@/components/effects/SiteBackdrop";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Calendar,
  Info,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Inbox,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SupportTicket {
  id: string;
  user_id: string | null;
  user_email: string;
  subject: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSupport() {
  const { user } = useAuth();
  const { loading: accessLoading, allowed } = useAdminAccess();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Edit / Reply states
  const [adminNotes, setAdminNotes] = useState("");
  const [ticketStatus, setTicketStatus] = useState<"open" | "in_progress" | "resolved">("open");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTickets(data || []);
      setIsFallback(false);
    } catch (error: any) {
      console.warn("Could not query support_tickets table, falling back to localStorage:", error);
      setIsFallback(true);

      const stored = localStorage.getItem("cetrank_mock_tickets");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setTickets(parsed);
        } catch (e) {
          console.error("Error parsing local tickets:", e);
          setTickets([]);
        }
      } else {
        const mockSeed: SupportTicket[] = [
          {
            id: "mock-1",
            user_id: user?.id || "mock-user-123",
            user_email: "demo@cetrank.in",
            subject: "Unable to download generated PDF",
            description: "I generated my engineering preference list but the 'Download PDF' button is unresponsive on Safari. Works on Chrome though. Can you check?",
            category: "list_generation",
            status: "open",
            admin_notes: null,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: "mock-2",
            user_id: null,
            user_email: "student99@gmail.com",
            subject: "Payment verified but credits not showing",
            description: "I completed the standard checkout via UPI. The money got debited and I got the Razorpay receipt but the system still shows 0 credits.",
            category: "payment",
            status: "in_progress",
            admin_notes: "Checking transaction logs on Razorpay gateway.",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
          }
        ];
        localStorage.setItem("cetrank_mock_tickets", JSON.stringify(mockSeed));
        setTickets(mockSeed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void fetchTickets();
  }, [allowed]);

  useEffect(() => {
    if (selectedTicket) {
      setAdminNotes(selectedTicket.admin_notes || "");
      setTicketStatus(selectedTicket.status);
    }
  }, [selectedTicket]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsSubmitting(true);

    const updatePayload = {
      status: ticketStatus,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isFallback) {
        const stored = localStorage.getItem("cetrank_mock_tickets");
        const ticketsList = stored ? JSON.parse(stored) : [];
        const updatedList = ticketsList.map((t: any) =>
          t.id === selectedTicket.id ? { ...t, ...updatePayload } : t
        );
        localStorage.setItem("cetrank_mock_tickets", JSON.stringify(updatedList));
        setTickets(updatedList);
        setSelectedTicket(prev => prev ? { ...prev, ...updatePayload } : null);
        toast({ title: "Ticket Updated (Local)", description: "Changes saved to simulated database." });
      } else {
        const { error } = await supabase
          .from("support_tickets")
          .update(updatePayload)
          .eq("id", selectedTicket.id);

        if (error) throw error;

        await fetchTickets();
        setSelectedTicket(prev => prev ? { ...prev, ...updatePayload } : null);
        toast({ title: "Ticket Updated", description: "Support ticket updated successfully." });
      }
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save ticket details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;

    try {
      if (isFallback) {
        const stored = localStorage.getItem("cetrank_mock_tickets");
        const ticketsList = stored ? JSON.parse(stored) : [];
        const filteredList = ticketsList.filter((t: any) => t.id !== id);
        localStorage.setItem("cetrank_mock_tickets", JSON.stringify(filteredList));
        setTickets(filteredList);
        if (selectedTicket?.id === id) setSelectedTicket(null);
        toast({ title: "Ticket Deleted", description: "Removed from local storage." });
      } else {
        const { error } = await supabase.from("support_tickets").delete().eq("id", id);
        if (error) throw error;
        setTickets(prev => prev.filter(t => t.id !== id));
        if (selectedTicket?.id === id) setSelectedTicket(null);
        toast({ title: "Ticket Deleted", description: "Support ticket deleted." });
      }
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      toast({ title: "Deletion Failed", description: "Could not remove the ticket.", variant: "destructive" });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-500">
            <AlertCircle className="w-3.5 h-3.5" /> Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "payment": return "Payment & Credits";
      case "list_generation": return "List Generator";
      case "account": return "Account";
      default: return "General";
    }
  };

  if (accessLoading || (loading && tickets.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const progressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <div className="app-shell min-h-screen">
      <SiteBackdrop particleCount={10} variant="focused" />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-32">
        <div className="mb-8">
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Support Tickets</h1>
              <p className="text-muted-foreground">
                Respond to and manage user support issues and billing queries.
              </p>
            </div>
          </div>
        </div>

        {isFallback && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-600 text-sm">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local Storage Fallback Mode Active</p>
              <p className="text-xs mt-1 text-amber-600/80">
                The `support_tickets` table was not detected in Supabase. Tickets are saved in browser local storage for testing.
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
          {[
            { label: "Total Tickets", value: totalCount, color: "" },
            { label: "Open", value: openCount, color: "text-red-500" },
            { label: "In Progress", value: progressCount, color: "text-amber-500" },
            { label: "Resolved", value: resolvedCount, color: "text-emerald-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass rounded-2xl border border-border/50 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <h4 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h4>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left panel */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="glass rounded-2xl border border-border/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tickets, email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded-xl bg-background/50 text-xs font-medium text-muted-foreground">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Status</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="h-10 px-2.5 rounded-xl border bg-background/50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="glass rounded-3xl border border-border/70 overflow-hidden divide-y divide-border/40">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-5 cursor-pointer transition-all flex flex-col gap-3 hover:bg-white/50 ${
                    selectedTicket?.id === ticket.id ? "bg-white/80 shadow-inner border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground line-clamp-1">{ticket.subject}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3 h-3" /> {ticket.user_email}
                      </p>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span className="rounded bg-secondary/60 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {getCategoryLabel(ticket.category)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-2 text-muted-foreground/30" />
                  <p className="font-semibold text-sm">No tickets found</p>
                  <p className="text-xs">Adjust your search query or filter settings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-5">
            {selectedTicket ? (
              <div className="glass rounded-[24px] border border-border/70 p-6 space-y-6 sticky top-28">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h2 className="text-xl font-bold text-foreground">{selectedTicket.subject}</h2>
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedTicket.user_email}</span>
                    <span>•</span>
                    <span className="rounded bg-secondary/80 px-2 py-0.5 font-semibold text-primary">
                      {getCategoryLabel(selectedTicket.category)}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white/40 border border-border/40 p-4 text-sm text-foreground">
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">User Query</p>
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-4 text-right">
                      Submitted at {new Date(selectedTicket.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateTicket} className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    Admin Resolution
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Status Action
                    </label>
                    <select
                      value={ticketStatus}
                      onChange={e => setTicketStatus(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="open">Open (Needs Attention)</option>
                      <option value="in_progress">In Progress (Investigating)</option>
                      <option value="resolved">Resolved (Closed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Resolution Notes / Response
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Write resolution steps, response email copies, or internally track progress..."
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      className="w-full p-4 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl font-semibold shadow-md mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Resolution details"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <div className="glass rounded-[24px] border border-border/50 p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-64 lg:h-96">
                <MessageSquare className="w-12 h-12 mb-3 text-muted-foreground/30 animate-pulse" />
                <p className="font-semibold text-sm">Select a ticket</p>
                <p className="text-xs">Click on any ticket in the list to view queries and response details.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
