import { WorkflowDetailClient } from "./workflow-detail-client";

export const metadata = { title: "Workflow — DataForge AI" };

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowDetailClient jobId={id} />;
}
