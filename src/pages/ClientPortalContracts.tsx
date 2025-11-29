import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BrandedFooter } from "@/components/BrandedFooter";
import { useContracts } from "@/hooks/useSharedData";
import { ContractViewer } from "@/components/contracts/ContractViewer";
import { ContractRequestModal } from "@/components/contracts/ContractRequestModal";
import { useClientData } from "@/hooks/useClientData";

export default function ClientPortalContracts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orgId } = useParams<{ orgId: string }>();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { client } = useClientData(orgId);
  const { contracts, loading, refresh } = useContracts(client?.id, client?.organization_id, true);

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

      {client && <BrandedFooter organizationId={client.organization_id} />}

      {showRequestModal && client && (
        <ContractRequestModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          clientId={client.id}
          organizationId={client.organization_id}
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
