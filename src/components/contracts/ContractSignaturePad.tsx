import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eraser, Check, X, RefreshCcw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EnhancedSignaturePadProps {
  contractId: string;
  signatureRequirementId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function EnhancedSignaturePad({
  contractId,
  signatureRequirementId,
  onComplete,
  onCancel,
}: EnhancedSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [agreement, setAgreement] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    if (!hasDrawn || !agreement) {
      toast.error("Please complete the signature and agree to the terms");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSigning(true);

    try {
      const signatureData = canvas.toDataURL("image/png");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update the signature requirement
      const { error: sigError } = await supabase
        .from("contract_signatures")
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          signer_user_id: user?.id,
          signature_status: "completed",
        })
        .eq("id", signatureRequirementId);

      if (sigError) throw sigError;

      // Check if all signatures are complete
      const { data: allSignatures } = await supabase
        .from("contract_signatures")
        .select("signature_status, is_required")
        .eq("contract_id", contractId);

      const allComplete = allSignatures?.every((sig) => !sig.is_required || sig.signature_status === "completed");

      // If all signatures complete, update contract status
      if (allComplete) {
        await supabase
          .from("contracts")
          .update({
            workflow_status: "signed",
            signed_at: new Date().toISOString(),
          })
          .eq("id", contractId);
      }

      toast.success("Contract signed successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error(error.message || "Failed to sign contract");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Contract</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            By signing this contract, you agree to the terms and conditions outlined in the document. Your signature
            will be legally binding.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">Draw your signature below:</label>
          <div className="border-2 border-dashed border-border rounded-lg bg-background overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-48 cursor-crosshair touch-none"
              style={{ display: "block" }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="agreement"
            checked={agreement}
            onChange={(e) => setAgreement(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="agreement" className="text-sm">
            I agree to sign this contract electronically and understand that my electronic signature is legally binding.
          </label>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button type="button" variant="outline" onClick={clear} disabled={!hasDrawn || isSigning}>
            <Eraser className="h-4 w-4 mr-2" />
            Clear
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSigning}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!hasDrawn || !agreement || isSigning}>
              {isSigning ? (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Sign Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
