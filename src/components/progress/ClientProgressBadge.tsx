import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface ClientProgressBadgeProps {
  percentage: number;
  size?: "sm" | "md";
}

export function ClientProgressBadge({ percentage, size = "md" }: ClientProgressBadgeProps) {
  const getVariant = () => {
    if (percentage === 100) return "completed";
    if (percentage >= 50) return "in-progress";
    return "pending";
  };

  const getIcon = () => {
    if (percentage === 100) return <CheckCircle2 className="h-3 w-3 mr-1" />;
    if (percentage > 0) return <TrendingUp className="h-3 w-3 mr-1" />;
    return <Clock className="h-3 w-3 mr-1" />;
  };

  return (
    <Badge variant={getVariant()} className={size === "sm" ? "text-xs" : ""}>
      {getIcon()}
      {percentage}% Complete
    </Badge>
  );
}