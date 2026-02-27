import path from "node:path";
import { existsSync } from "node:fs";

import "../lib/load-env.js";
import { RagService } from "../services/rag.service.js";

async function main() {
  const inputPath = process.argv[2];
  let dataDir: string;

  if (inputPath) {
    dataDir = path.resolve(inputPath);
  } else {
    const candidates = [
      path.resolve(process.cwd(), "data", "raw"),
      path.resolve(process.cwd(), "server", "data", "raw"),
    ];

    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new Error(`No data directory found. Checked: ${candidates.join(", ")}`);
    }
    dataDir = found;
  }

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
