import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BrandedFooter } from "@/components/BrandedFooter";
import { useContracts } from "@/hooks/useSharedData";
import { ContractViewer } from "@/components/contracts/ContractViewer";
import { ContractRequestModal } from "@/components/contracts/ContractRequestModal";

export default function ClientPortalContracts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clientId, setClientId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { contracts, loading, refresh } = useContracts(clientId || undefined, organizationId || undefined, true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clients } = await supabase
      .from("clients")
      .select("id, organization_id")
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .is("deleted_at", null);

    if (clients && clients.length > 0) {
      setClientId(clients[0].id);
      setOrganizationId(clients[0].organization_id);
    }
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">Contracts</h1>
            <p className="text-sm text-muted-foreground">View and sign your contracts</p>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="outline"
            className="hover:scale-105 transition-transform"
          >
            <FileQuestion className="h-4 w-4 mr-2" />
            Request Contract
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No contracts yet</p>
              <p className="text-sm">New contracts will appear here</p>
            </div>
          ) : (
            contracts.map((contract) => <ContractViewer key={contract.id} contract={contract} onRefresh={refresh} />)
          )}
        </div>
      </div>

      {organizationId && <BrandedFooter organizationId={organizationId} />}

      {showRequestModal && clientId && organizationId && (
        <ContractRequestModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          clientId={clientId}
          organizationId={organizationId}
          onSuccess={() => {
            setShowRequestModal(false);
            toast({
              title: "Request sent",
              description: "Your contract request has been submitted successfully.",
            });
          }}
        />
      )}
    </div>
  );
}
