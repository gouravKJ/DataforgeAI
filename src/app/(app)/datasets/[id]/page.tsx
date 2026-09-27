import { DatasetExplorerClient } from "./dataset-explorer-client";

export const metadata = { title: "Dataset — DataForge AI" };

export default async function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DatasetExplorerClient datasetId={id} />;
}
