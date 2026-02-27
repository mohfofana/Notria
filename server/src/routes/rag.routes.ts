import { Router } from "express";

import { RagController } from "../controllers/rag.controller.js";

const router = Router();

router.post("/search", RagController.search);

export default router;

