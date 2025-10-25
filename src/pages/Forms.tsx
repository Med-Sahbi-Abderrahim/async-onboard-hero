import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Forms() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Forms</h2>
          <p className="text-muted-foreground mt-2">Create and manage your intake forms.</p>
        </div>
        <Button onClick={() => navigate("/forms/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>
    </div>
  );
}
