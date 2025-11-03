import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientPortalContracts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClientAndContracts();
  }, []);

  const loadClientAndContracts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("id", user.id)
      .single();

    if (client) {
      setClientId(client.id);
      loadContracts(client.id);
    }
  };

  const loadContracts = async (cId: string) => {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("client_id", cId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading contracts:", error);
      return;
    }
    setContracts(data || []);
  };

  const signContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
        })
        .eq("id", contractId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contract signed successfully",
      });

      if (clientId) loadContracts(clientId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const statusColors = {
    pending: "bg-yellow-500",
    signed: "bg-green-500",
    rejected: "bg-red-500",
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")} className="hover:scale-110 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Contracts</h1>
            <p className="text-sm text-muted-foreground">Review and sign your agreements</p>
          </div>
        </div>

        <div className="space-y-4">
          {contracts.length === 0 ? (
            <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10" style={{ animationDelay: '0.1s' }}>
              <CardContent className="text-center py-12 text-muted-foreground">
                <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-primary/50" />
                </div>
                <p className="text-lg font-medium mb-1">No contracts yet</p>
                <p className="text-sm">New agreements will appear here</p>
              </CardContent>
            </Card>
          ) : (
            contracts.map((contract, index) => (
              <Card key={contract.id} className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{contract.title}</CardTitle>
                      </div>
                      {contract.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{contract.description}</p>
                      )}
                    </div>
                    <Badge className={`${statusColors[contract.status as keyof typeof statusColors]} shadow-soft`}>
                      {contract.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Created:</span> {new Date(contract.created_at).toLocaleDateString()}
                      {contract.signed_at && (
                        <span className="ml-4">
                          <span className="font-medium">Signed:</span> {new Date(contract.signed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {contract.status === "pending" && (
                      <Button onClick={() => signContract(contract.id)} className="hover:scale-105 transition-transform shadow-soft">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sign Contract
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
