export type FieldSpec = {
  key: string;
  label: string;
  type: "string" | "number" | "url" | "email" | "date" | "enum" | "text";
  required: boolean;
  provenance: "SOURCE" | "AI_GENERATED" | "USER" | "DEMO";
  options?: string[];
};

export type ParsedRequirement = {
  intent: "MARKET_RESEARCH" | "LEAD_GENERATION" | "TALENT_SOURCING" | "SPONSOR_PROSPECTING" | "INVESTOR_PROSPECTING";
  domain: "companies" | "people" | "sponsors";
  location: { label: string; code?: string } | null;
  industries: string[];
  skills: string[];
  hiring: boolean;
  funding: { stage: string; context: string } | null;
  foundedAfter: number | null;
  employeeRange: { min: number; max: number } | null;
  count: number;
  filters: string[];
  fields: FieldSpec[];
  notes: string;
};

export type PlanNode = {
  id: string;
  kind: "REQUIREMENT" | "SOURCE_DISCOVERY" | "DISCOVERY" | "EXTRACTION" | "CLEANING" | "ENTITY_RESOLUTION" | "DEDUPLICATION" | "VALIDATION" | "QUALITY_SCORING" | "DATASET";
  title: string;
  description: string;
  dependsOn: string[];
};

export type WorkflowPlan = {
  summary: string;
  estimatedRecords: number;
  estimatedMinutes: number;
  nodes: PlanNode[];
};
