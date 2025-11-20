import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface ClientProgressBadgeProps {
  percentage: number;
  size?: "sm" | "md";
}

export function ClientProgressBadge({ percentage, size = "md" }: ClientProgressBadgeProps) {
  const getVariant = () => {
    if (percentage === 100) return "default";
    if (percentage >= 50) return "secondary";
    return "outline";
  };

  const getIcon = () => {
    if (percentage === 100) return <CheckCircle2 className="h-3 w-3 mr-1" />;
    if (percentage > 0) return <TrendingUp className="h-3 w-3 mr-1" />;
    return <Clock className="h-3 w-3 mr-1" />;
  };

  const getColor = () => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 50) return "text-blue-600";
    return "text-yellow-600";
  };

  return (
    <Badge variant={getVariant()} className={`${size === "sm" ? "text-xs" : ""} ${getColor()}`}>
      {getIcon()}
      {percentage}% Complete
    </Badge>
  );
}