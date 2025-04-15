import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroupChat,
  getUserGroupChats,
  getGroupChatById,
  updateGroupChat,
  addGroupMembers,
  removeGroupMember,
  getGroupMessages,
  sendGroupMessage,
} from "../controllers/groupChat.controller.js";

const router = express.Router();

// Apply protectRoute middleware to all routes
router.use(protectRoute);

// Group chat routes
router.post("/create", createGroupChat);
router.get("/", getUserGroupChats);
router.get("/:id", getGroupChatById);
router.put("/:id", updateGroupChat);
router.post("/:id/members", addGroupMembers);
router.delete("/:groupId/members/:memberId", removeGroupMember);

// Group message routes
router.get("/:id/messages", getGroupMessages);
router.post("/:id/messages", sendGroupMessage);

export default router;