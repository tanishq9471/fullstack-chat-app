import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// used to store users in group chat rooms
const userGroupMap = {}; // {userId: [groupId1, groupId2, ...]}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join group chat rooms
  socket.on("joinGroupChat", (groupId) => {
    socket.join(`group-${groupId}`);
    
    // Add group to user's joined groups
    if (!userGroupMap[userId]) {
      userGroupMap[userId] = [];
    }
    
    if (!userGroupMap[userId].includes(groupId)) {
      userGroupMap[userId].push(groupId);
    }
    
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // Leave group chat room
  socket.on("leaveGroupChat", (groupId) => {
    socket.leave(`group-${groupId}`);
    
    // Remove group from user's joined groups
    if (userGroupMap[userId]) {
      userGroupMap[userId] = userGroupMap[userId].filter(id => id !== groupId);
    }
    
    console.log(`User ${userId} left group ${groupId}`);
  });

  // Handle group message
  socket.on("sendGroupMessage", (data) => {
    const { groupId, message } = data;
    
    // Broadcast to all users in the group except sender
    socket.to(`group-${groupId}`).emit("receiveGroupMessage", {
      groupId,
      message
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    
    // Clean up user data
    delete userSocketMap[userId];
    delete userGroupMap[userId];
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
