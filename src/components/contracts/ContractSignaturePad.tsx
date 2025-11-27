import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eraser, Check, X } from "lucide-react";

interface ContractSignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
}

export function ContractSignaturePad({ onSave, onCancel }: ContractSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

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

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const signatureData = canvas.toDataURL("image/png");
    onSave(signatureData);
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sign Below</h3>
        <p className="text-sm text-muted-foreground">
          Draw your signature using your mouse or touch screen
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg bg-background">
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
        />
      </div>

      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={clear} disabled={!hasDrawn}>
          <Eraser className="h-4 w-4 mr-2" />
          Clear
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!hasDrawn}>
            <Check className="h-4 w-4 mr-2" />
            Sign Contract
          </Button>
        </div>
      </div>
    </Card>
  );
}
