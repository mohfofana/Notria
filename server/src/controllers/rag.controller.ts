import type { Request, Response } from "express";

interface RagSearchRequest {
  query: string;
  limit?: number;
  filters?: {
    chapter?: string;
    grade?: string;
    sourceType?: "cours" | "exercice" | "annale" | "livre";
    subject?: string;
  };
}

import { RagService } from "../services/rag.service.js";

export const RagController = {
  async search(req: Request, res: Response) {
    try {
      const body = req.body as Partial<RagSearchRequest>;
      const query = body.query?.trim();

      if (!query) {
        return res.status(400).json({
          error: "query is required",
          code: "INVALID_INPUT",
        });
      }

      const limit = typeof body.limit === "number" ? body.limit : 5;
      const results = await RagService.search(query, limit, body.filters);

      return res.json({ results });
    } catch (error) {
      console.error("RAG search error:", error);
      return res.status(500).json({
        error: "failed to search knowledge base",
        code: "RAG_SEARCH_FAILED",
      });
    }
  },

  async coverage(_req: Request, res: Response) {
    try {
      const data = await RagService.getMathCoverage();
      return res.json({ success: true, data });
    } catch (error) {
      console.error("RAG coverage error:", error);
      return res.status(500).json({
        success: false,
        error: "failed to compute rag coverage",
      });
    }
  },
};
