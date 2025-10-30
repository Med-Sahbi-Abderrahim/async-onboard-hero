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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Contracts</h1>
        </div>

        <div className="space-y-4">
          {contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No contracts available</p>
              </CardContent>
            </Card>
          ) : (
            contracts.map((contract) => (
              <Card key={contract.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{contract.title}</CardTitle>
                      {contract.description && (
                        <p className="text-sm text-muted-foreground mt-2">{contract.description}</p>
                      )}
                    </div>
                    <Badge className={statusColors[contract.status as keyof typeof statusColors]}>
                      {contract.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                      {contract.signed_at && (
                        <span className="ml-4">
                          Signed: {new Date(contract.signed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {contract.status === "pending" && (
                      <Button onClick={() => signContract(contract.id)}>
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
