import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, FileUp, CreditCard, Calendar, MessageSquare, Building, CheckCircle2 } from "lucide-react";
import { useOrgLimits } from "@/hooks/useOrgLimits";

interface BrandingPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  logoUrl: string | null;
  brandColor: string;
}

export function BrandingPreviewModal({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  logoUrl,
  brandColor,
}: BrandingPreviewModalProps) {
  const { limits } = useOrgLimits(organizationId);

  // Determine if custom colors are allowed based on plan
  const allowCustomColors = limits?.brandingLevel === 'custom' || limits?.brandingLevel === 'none';
  const showKenlyBadge = limits?.brandingLevel === 'full';

  // Apply custom color styling
  const customStyles = allowCustomColors && brandColor ? {
    '--preview-primary': brandColor,
  } as React.CSSProperties : {};

  const quickLinks = [
    { title: "Files", icon: FileUp, description: "Upload and view files" },
    { title: "Contracts", icon: FileText, description: "Review and sign contracts" },
    { title: "Billing", icon: CreditCard, description: "View invoices and payments" },
    { title: "Meetings", icon: Calendar, description: "Upcoming meetings" },
    { title: "Tasks", icon: CheckCircle2, description: "View your tasks" },
    { title: "Feedback", icon: MessageSquare, description: "Share your feedback" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Portal Preview</DialogTitle>
          <DialogDescription>
            This is how your client portal will appear with your current branding settings.
            {limits && (
              <span className="block mt-1 text-xs">
                Plan: <span className="font-semibold capitalize">{limits.plan}</span>
                {!allowCustomColors && " (Upgrade to Pro for custom colors)"}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden" style={customStyles}>
          {/* Preview Header */}
          <div className="flex items-center justify-center p-6 bg-card border-b">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={organizationName} 
                className="h-12 max-w-[200px] object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold">{organizationName}</h1>
            )}
          </div>

          {/* Preview Content */}
          <div className="p-6 space-y-6 bg-gradient-to-b from-background to-muted/20">
            {/* Hero Section */}
            <div className="text-center space-y-3 py-6">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-3"
                style={allowCustomColors ? { 
                  background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` 
                } : {}}
              >
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold">John Smith</h2>
              <p className="text-muted-foreground">Your secure workspace for projects and communication</p>
              <Badge className="bg-primary text-primary-foreground">ACTIVE</Badge>
            </div>

            {/* Progress Card Preview */}
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Track your project milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-semibold">65%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={allowCustomColors ? { 
                        backgroundColor: brandColor,
                        width: '65%'
                      } : { width: '65%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Preview */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickLinks.slice(0, 6).map((link) => (
                  <Card 
                    key={link.title}
                    className="hover:shadow-lg transition-all cursor-pointer bg-card/80 backdrop-blur-sm"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div 
                          className="rounded-xl p-3 transition-all"
                          style={allowCustomColors ? { 
                            background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` 
                          } : {}}
                        >
                          <link.icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{link.title}</CardTitle>
                          <CardDescription className="text-xs">{link.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sample Content Card */}
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Follow these steps to get the most out of your portal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-primary-foreground shrink-0"
                      style={allowCustomColors ? { backgroundColor: brandColor } : {}}
                    >
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">Upload Your Files</h4>
                      <p className="text-sm text-muted-foreground">Share documents and assets securely</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Footer */}
          {showKenlyBadge && (
            <div className="py-4 text-center text-sm text-muted-foreground border-t bg-card">
              <div className="flex items-center justify-center gap-2">
                <span>Powered by</span>
                <span className="font-semibold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Kenly
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
