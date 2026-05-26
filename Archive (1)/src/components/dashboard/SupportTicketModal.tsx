import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { HelpCircle, Loader2, Send, MessageSquare } from "lucide-react";

export function SupportTicketModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit support tickets.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const ticketData = {
      user_id: user.id,
      user_email: user.email || "unknown@user.com",
      subject: subject.trim(),
      category,
      description: description.trim(),
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // 1. Try submitting to Supabase
      const { error } = await supabase.from("support_tickets").insert(ticketData);

      if (error) {
        throw error;
      }

      toast({
        title: "Ticket Submitted!",
        description: "Your support ticket has been registered. Our team will review it soon.",
      });

      setSubject("");
      setDescription("");
      setCategory("general");
      setOpen(false);
    } catch (dbError: any) {
      console.warn("Failed to insert into Supabase, using localStorage fallback:", dbError);
      
      // 2. Fallback to localStorage
      try {
        const stored = localStorage.getItem("cetrank_mock_tickets");
        const tickets = stored ? JSON.parse(stored) : [];
        const newTicket = {
          id: Math.random().toString(36).substr(2, 9),
          ...ticketData,
        };
        tickets.push(newTicket);
        localStorage.setItem("cetrank_mock_tickets", JSON.stringify(tickets));

        toast({
          title: "Ticket Submitted (Local Fallback)",
          description: "Submitted successfully using local storage simulation.",
        });

        setSubject("");
        setDescription("");
        setCategory("general");
        setOpen(false);
      } catch (localError) {
        console.error("Local storage error:", localError);
        toast({
          title: "Submission Failed",
          description: "We could not register your support ticket. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-6 right-6 z-40 h-12 rounded-full border border-border/80 bg-background/80 px-4 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-muted/50 gap-2 font-medium"
        >
          <HelpCircle className="h-5 w-5 text-primary" />
          <span>Help & Support</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MessageSquare className="h-5 w-5 text-primary" />
            Submit a Support Ticket
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Have questions or issues? Create a ticket and our admin team will assist you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="Brief summary of the issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="general">General Support</option>
              <option value="payment">Payment & Credits</option>
              <option value="list_generation">List Generator Error</option>
              <option value="account">Account Access</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Describe your issue
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please provide details so we can help you faster..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-xl h-11 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl h-11 px-5 font-semibold gap-2 shadow-md hover:shadow-primary/20"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
