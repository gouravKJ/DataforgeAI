import { Badge } from "@/components/ui/badge";
import { Sparkles, Database, User, CheckCircle2, FlaskConical } from "lucide-react";

export function ProvenanceBadge({ provenance, verified }: { provenance: string; verified?: boolean }) {
  if (verified) {
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" /> HUMAN-VERIFIED
      </Badge>
    );
  }
  switch (provenance) {
    case "SOURCE":
      return (
        <Badge tone="info">
          <Database className="h-3 w-3" /> SOURCE-DERIVED
        </Badge>
      );
    case "AI_GENERATED":
      return (
        <Badge tone="ai">
          <Sparkles className="h-3 w-3" /> AI-GENERATED
        </Badge>
      );
    case "USER":
      return (
        <Badge tone="default">
          <User className="h-3 w-3" /> USER-PROVIDED
        </Badge>
      );
    case "DEMO":
      return (
        <Badge tone="demo">
          <FlaskConical className="h-3 w-3" /> DEMO DATA
        </Badge>
      );
    default:
      return <Badge tone="outline">{provenance}</Badge>;
  }
}
