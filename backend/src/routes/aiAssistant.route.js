import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getAIAssistantMessages, sendMessageToAIAssistant } from "../controllers/aiAssistant.controller.js";

const router = express.Router();

// Apply protectRoute middleware to all routes
router.use(protectRoute);

// AI assistant routes
router.get("/messages", getAIAssistantMessages);
router.post("/send", sendMessageToAIAssistant);

export default router;