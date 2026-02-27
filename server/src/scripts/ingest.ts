import path from "node:path";

import "../lib/load-env.js";
import { RagService } from "../services/rag.service.js";

async function main() {
  const dataDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(process.cwd(), "server", "data", "raw");

  console.log(`Starting ingestion from: ${dataDir}`);
  const summary = await RagService.ingestFromDirectory(dataDir);
  console.log(
    `Done. files=${summary.filesProcessed} chunks_created=${summary.chunksCreated} inserted=${summary.chunksInserted} skipped=${summary.chunksSkipped}`
  );
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});
