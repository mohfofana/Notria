import type { Request, Response } from "express";
import type { RagSearchRequest } from "@notria/shared";

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
};
