import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, CreditCard, Calendar, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onComplete: () => void;
  clientName?: string;
}

const features = [
  {
    icon: CheckCircle2,
    title: "Tasks",
    description: "Track your project tasks and milestones",
  },
  {
    icon: FileUp,
    title: "Files",
    description: "Upload and access your project documents securely",
  },
  {
    icon: Calendar,
    title: "Meetings",
    description: "View upcoming meetings and join video calls",
  },
  {
    icon: FileText,
    title: "Contracts",
    description: "Review and sign contracts electronically",
  },
  {
    icon: CreditCard,
    title: "Billing",
    description: "View invoices and manage payments",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    description: "Share your thoughts and help us improve",
  },
];

export function WelcomeModal({ open, onComplete, clientName }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-3xl text-center">
            Welcome{clientName ? `, ${clientName}` : ""}! 🎉
          </DialogTitle>
          <DialogDescription className="text-base text-center">
            Your personalized client portal is ready. Here's what you can do:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/5 transition-all group"
            >
              <div className="rounded-lg gradient-primary p-2 group-hover:shadow-glow transition-shadow shrink-0">
                <feature.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button 
            onClick={onComplete} 
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
            size="lg"
          >
            Get Started
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can always access these features from your dashboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
