import express from "express";

import { analyzeComplaint } from "../gemini.js";

const router = express.Router();

router.post("/", analyzeComplaint);

export default router;