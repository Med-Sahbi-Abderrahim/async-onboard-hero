import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BrandedFooter } from "@/components/BrandedFooter";

export default function ClientPortalFeedback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: client } = await supabase
        .from("clients")
        .select("id, organization_id")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .single();

      if (!client) throw new Error("Client record not found");

      setOrganizationId(client.organization_id);

      const { error } = await supabase.from("client_feedback").insert({
        client_id: client.id,
        organization_id: client.organization_id,
        rating,
        message,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });

      setRating(0);
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Feedback</h1>
            <p className="text-sm text-muted-foreground">Share your thoughts with us</p>
          </div>
        </div>

        <Card
          className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all"
          style={{ animationDelay: "0.1s" }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl gradient-primary p-2.5 shadow-soft">
                <Star className="h-5 w-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Share Your Experience</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-semibold mb-3 block">How would you rate us?</label>
              <div className="flex gap-3 justify-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-all hover:scale-125"
                  >
                    <Star
                      className={`h-10 w-10 transition-all ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-glow"
                          : "text-muted-foreground/30 hover:text-muted-foreground/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Your Feedback</label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="border-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full hover:scale-105 transition-transform shadow-soft"
            >
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>

        <Card
          className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all"
          style={{ animationDelay: "0.2s" }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/10 p-2.5 shadow-soft">
                <ExternalLink className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-xl">Love Our Service?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Help others discover us by leaving a review on Google!
            </p>
            <Button variant="outline" className="w-full hover:scale-105 transition-transform" asChild>
              <a href="https://www.google.com/search?q=your+business+name" target="_blank" rel="noopener noreferrer">
                Leave a Google Review
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {organizationId && <BrandedFooter organizationId={organizationId} />}
    </div>
  );
}
