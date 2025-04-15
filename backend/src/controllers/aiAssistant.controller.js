import User from "../models/user.model.js";
import axios from 'axios';
import Message from "../models/message.model.js";
import { io } from "../lib/socket.js";
import e, { response } from "express";
import dotenv from "dotenv";

dotenv.config();

// Create or get the AI assistant user
export const getOrCreateAIAssistant = async () => {
  try {
    // Check if AI assistant already exists
    let aiAssistant = await User.findOne({ email: "ai.assistant@chatapp.com" });
    
    // If not, create it
    if (!aiAssistant) {
      aiAssistant = new User({
        email: "ai.assistant@chatapp.com",
        fullName: "ChatGPT Assistant",
        password: "AIAssistant123!@#", // This won't be used for login
        profilePic: "/ai-assistant.png", // Make sure to add this image to frontend/public
      });
      
      await aiAssistant.save();
    }
    
    return aiAssistant;
  } catch (error) {
    console.error("Error in getOrCreateAIAssistant:", error.message);
    throw error;
  }
};

// Get messages between user and AI assistant
export const getAIAssistantMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get or create AI assistant
    const aiAssistant = await getOrCreateAIAssistant();
    
    // Get messages between user and AI assistant
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: aiAssistant._id },
        { senderId: aiAssistant._id, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getAIAssistantMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send message to AI assistant and get response
export const sendMessageToAIAssistant = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }
    
    // Get or create AI assistant
    const aiAssistant = await getOrCreateAIAssistant();
    
    // Save user message
    const userMessage = new Message({
      senderId: userId,
      receiverId: aiAssistant._id,
      text,
    });
    
    await userMessage.save();
    
    // Generate AI response
    const aiResponse = await generateAIResponse(text);
    console.log("response",aiResponse);
    // Save AI response
    const aiMessage = new Message({
      senderId: aiAssistant._id,
      receiverId: userId,
      text: aiResponse,
    });
    
    await aiMessage.save();
    
    // Emit socket event for real-time update
    const socketId = req.socketId;
    if (socketId) {
      io.to(socketId).emit("newMessage", aiMessage);
    }
    
    // Return both messages
    res.status(201).json({
      userMessage,
      aiMessage,
    });
  } catch (error) {
    console.error("Error in sendMessageToAIAssistant:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Simple function to generate AI responses
// In a real implementation, this would call the OpenAI API
const generateAIResponse = async (userMessage) => {
  // Simple response logic - in a real app, you would call OpenAI API here
  // const responses = [
  //   "I'm here to help! What would you like to know?",
  //   "That's an interesting question. Let me think about it...",
  //   "I understand your question. Here's what I think...",
  //   "Based on my knowledge, I would suggest...",
  //   "I'm not sure about that, but here's my best guess...",
  //   `I've processed your message: "${userMessage}". Here's my response...`,
  //   "Thanks for asking! Here's what I can tell you...",
  //   "Let me provide some information on that topic...",
  //   "I'm happy to assist with your question about that.",
  //   "I've analyzed your question and here's what I found..."
  // ];
  
  try {
  let data = JSON.stringify({
    "model": "google/gemma-3-12b-it",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": userMessage
          }        
        ]
      }
    ],
    "max_tokens": 512
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.netmind.ai/inference-api/openai/v1/chat/completions',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${process.env.CHAT_GPT_KEY}`
    },
    data : data
  };

  const response = await axios.request(config)

  return response.data.choices[0].message.content;

} catch (error) {
  console.error(error);
  return error.message;
}

  
};