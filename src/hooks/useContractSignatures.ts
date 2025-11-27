import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContractSignature {
  id: string;
  contract_id: string;
  organization_id: string;
  signer_user_id: string | null;
  signer_email: string;
  signer_name: string;
  signer_role: string | null;
  signature_data: string | null;
  signature_type: string;
  signed_at: string | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export function useContractSignatures(contractId?: string) {
  const [signatures, setSignatures] = useState<ContractSignature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignatures = async () => {
    if (!contractId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contract_signatures")
        .select("*")
        .eq("contract_id", contractId)
        .order("order_index");

      if (error) throw error;
      setSignatures(data || []);
    } catch (error: any) {
      console.error("Error fetching signatures:", error);
      toast.error("Failed to load signatures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, [contractId]);

  const addSignature = async (signatureData: string, signatureId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("contract_signatures")
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          signer_user_id: user?.id,
        })
        .eq("id", signatureId);

      if (error) throw error;

      toast.success("Contract signed successfully");
      await fetchSignatures();
      return true;
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract");
      return false;
    }
  };

  const createSignatureRequirement = async (
    contractId: string,
    organizationId: string,
    signerEmail: string,
    signerName: string,
    signerRole: string = "client",
    orderIndex: number = 0
  ) => {
    try {
      const { error } = await supabase
        .from("contract_signatures")
        .insert({
          contract_id: contractId,
          organization_id: organizationId,
          signer_email: signerEmail,
          signer_name: signerName,
          signer_role: signerRole,
          order_index: orderIndex,
          is_required: true,
        });

      if (error) throw error;

      toast.success("Signature requirement added");
      await fetchSignatures();
      return true;
    } catch (error: any) {
      console.error("Error adding signature requirement:", error);
      toast.error("Failed to add signature requirement");
      return false;
    }
  };

  return {
    signatures,
    loading,
    addSignature,
    createSignatureRequirement,
    refresh: fetchSignatures,
  };
}
