import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientPortalBilling() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", user.id)
      .is("deleted_at", null)
      .order("due_date", { ascending: false });

    if (error) {
      console.error("Error loading invoices:", error);
      return;
    }
    setInvoices(data || []);
  };

  const statusColors = {
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    overdue: "bg-red-500",
    cancelled: "bg-gray-500",
  };

  const formatAmount = (amountCents: number, currency: string) => {
    const amount = amountCents / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Billing</h1>
        </div>

        <div className="space-y-4">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No invoices available</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
                      {invoice.description && (
                        <p className="text-sm text-muted-foreground mt-2">{invoice.description}</p>
                      )}
                    </div>
                    <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-2xl font-bold">{formatAmount(invoice.amount_cents, invoice.currency)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="text-lg font-semibold">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {invoice.paid_at && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Paid on: {new Date(invoice.paid_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
