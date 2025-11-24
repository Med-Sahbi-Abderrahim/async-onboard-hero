import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BrandedFooter } from "@/components/BrandedFooter";

export default function ClientPortalBilling() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First get the client record for this organization
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, organization_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!clientData) return;

    setOrganizationId(clientData.organization_id);

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", clientData.id)
      .is("deleted_at", null)
      .order("due_date", { ascending: false });

    if (error) {
      console.error("Error loading invoices:", error);
      return;
    }
    setInvoices(data || []);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-pending",
    paid: "bg-completed",
    overdue: "bg-blocked",
    cancelled: "bg-muted",
  };

  const formatAmount = (amountCents: number, currency: string) => {
    const amount = amountCents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")} className="hover:scale-110 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Billing</h1>
            <p className="text-sm text-muted-foreground">View your invoices and payments</p>
          </div>
        </div>

        <div className="space-y-4">
          {invoices.length === 0 ? (
            <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10" style={{ animationDelay: '0.1s' }}>
              <CardContent className="text-center py-12 text-muted-foreground">
                <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-10 w-10 text-primary/50" />
                </div>
                <p className="text-lg font-medium mb-1">No invoices yet</p>
                <p className="text-sm">Payment information will appear here</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice, index) => (
              <Card key={invoice.id} className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Invoice #{invoice.invoice_number}</CardTitle>
                      </div>
                      {invoice.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{invoice.description}</p>
                      )}
                    </div>
                    <Badge className={`${statusColors[invoice.status as keyof typeof statusColors]} shadow-soft`}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                        {formatAmount(invoice.amount_cents, invoice.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                      <p className="text-xl font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {invoice.paid_at && (
                    <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-completed" />
                      Paid on: {new Date(invoice.paid_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {organizationId && <BrandedFooter organizationId={organizationId} />}
    </div>
  );
}
