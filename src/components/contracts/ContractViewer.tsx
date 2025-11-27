import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Download, CheckCircle, Clock, Users, DollarSign, Calendar } from "lucide-react";
import { ContractSignaturePad } from "./ContractSignaturePad";
import { useContractSignatures } from "@/hooks/useContractSignatures";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  contract_type: string;
  status: string;
  file_path: string | null;
  file_type: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  amount_cents: number | null;
  currency: string;
  created_at: string;
  signed_at: string | null;
}

interface ContractViewerProps {
  contract: Contract;
  onRefresh?: () => void;
}

const statusColors = {
  draft: "bg-gray-500",
  pending_signature: "bg-yellow-500",
  signed: "bg-green-500",
  cancelled: "bg-red-500",
};

const contractTypeLabels: Record<string, string> = {
  nda: "NDA",
  service_agreement: "Service Agreement",
  consulting_agreement: "Consulting Agreement",
  master_service_agreement: "Master Service Agreement",
  sow: "Statement of Work",
  amendment: "Amendment",
  other: "Other",
};

export function ContractViewer({ contract, onRefresh }: ContractViewerProps) {
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [mySignature, setMySignature] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const { signatures, loading, addSignature, refresh } = useContractSignatures(contract.id);

  useEffect(() => {
    checkMySignature();
  }, [signatures]);

  const checkMySignature = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const mySign = signatures.find(
      (sig) => sig.signer_user_id === user.id || sig.signer_email.toLowerCase() === user.email?.toLowerCase()
    );
    setMySignature(mySign);
  };

  const handleDownload = async () => {
    if (!contract.file_path) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("contracts")
        .createSignedUrl(contract.file_path, 3600);

      if (error) throw error;

      if (data?.signedUrl) {
        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${contract.title}.${contract.file_type?.includes('pdf') ? 'pdf' : 'docx'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Contract downloaded");
      }
    } catch (error: any) {
      console.error("Error downloading contract:", error);
      toast.error("Failed to download contract");
    } finally {
      setDownloading(false);
    }
  };

  const handleSign = async (signatureData: string) => {
    if (!mySignature) return;

    const success = await addSignature(signatureData, mySignature.id);
    if (success) {
      setShowSignaturePad(false);
      await refresh();
      onRefresh?.();
    }
  };

  const canSign = mySignature && !mySignature.signed_at && contract.status === "pending_signature";
  const allSignaturesComplete = signatures.length > 0 && signatures.every((sig) => !sig.is_required || sig.signed_at);

  return (
    <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">{contract.title}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={`${statusColors[contract.status as keyof typeof statusColors]} shadow-soft`}>
                {contract.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline">{contractTypeLabels[contract.contract_type] || contract.contract_type}</Badge>
            </div>
            {contract.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{contract.description}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contract Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
          {contract.effective_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Effective: </span>
                {new Date(contract.effective_date).toLocaleDateString()}
              </div>
            </div>
          )}
          {contract.expiration_date && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Expires: </span>
                {new Date(contract.expiration_date).toLocaleDateString()}
              </div>
            </div>
          )}
          {contract.amount_cents && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">Amount: </span>
                {contract.currency} {(contract.amount_cents / 100).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Signatures Section */}
        {!loading && signatures.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Signatures ({signatures.filter((s) => s.signed_at).length}/{signatures.filter((s) => s.is_required).length})
            </h4>
            <div className="space-y-2">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{sig.signer_name}</p>
                    <p className="text-xs text-muted-foreground">{sig.signer_email}</p>
                    {sig.signer_role && (
                      <p className="text-xs text-muted-foreground capitalize">{sig.signer_role}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {sig.signed_at ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div className="text-xs text-muted-foreground">
                          {new Date(sig.signed_at).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Pad */}
        {showSignaturePad && (
          <ContractSignaturePad
            onSave={handleSign}
            onCancel={() => setShowSignaturePad(false)}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {contract.file_path && (
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
              className="hover:scale-105 transition-transform"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "Downloading..." : "Download"}
            </Button>
          )}

          {canSign && !showSignaturePad && (
            <Button
              onClick={() => setShowSignaturePad(true)}
              className="hover:scale-105 transition-transform shadow-soft"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign Contract
            </Button>
          )}

          {allSignaturesComplete && contract.status === "signed" && (
            <Badge className="bg-green-500 shadow-soft px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              Fully Executed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
