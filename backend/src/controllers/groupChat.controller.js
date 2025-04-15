import GroupChat from "../models/groupChat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

// Create a new group chat
export const createGroupChat = async (req, res) => {
  try {
    console.log("Creating group chat with request body:", {
      ...req.body,
      groupImage: req.body.groupImage ? "Image data present (not shown)" : null
    });
    
    const { name, members, description, groupImage } = req.body;
    const admin = req.user._id;
    
    console.log("Admin ID:", admin);
    console.log("Members received:", members);

    // Validate required fields
    if (!name) {
      console.log("Missing group name");
      return res.status(400).json({ message: "Group name is required" });
    }
    
    if (!members || !Array.isArray(members) || members.length < 1) {
      console.log("Invalid or missing members array");
      return res.status(400).json({ message: "Please select at least one member" });
    }

    // Ensure all member IDs are valid
    try {
      for (const memberId of members) {
        if (!memberId || typeof memberId !== 'string') {
          console.log("Invalid member ID:", memberId);
          return res.status(400).json({ message: "Invalid member ID format" });
        }
      }
    } catch (validationError) {
      console.error("Error validating member IDs:", validationError);
      return res.status(400).json({ message: "Invalid member data" });
    }

    // Add admin to members if not already included
    const membersList = [...members];
    if (!membersList.includes(admin.toString())) {
      console.log("Adding admin to members");
      membersList.push(admin.toString());
    }
    
    console.log("Final members list:", membersList);

    // Handle group image upload
    let imageUrl = "";
    if (groupImage) {
      console.log("Uploading group image to cloudinary");
      try {
        // Upload base64 image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(groupImage);
        imageUrl = uploadResponse.secure_url;
        console.log("Image uploaded successfully:", imageUrl);
      } catch (cloudinaryError) {
        console.error("Error uploading image to cloudinary:", cloudinaryError);
        console.error("Cloudinary error details:", cloudinaryError.message);
        // Continue without image if upload fails
      }
    }

    // Create the group chat document
    console.log("Creating new group chat with name:", name);
    const newGroupChat = new GroupChat({
      name,
      admin,
      members: membersList,
      description: description || "",
      groupImage: imageUrl,
    });

    // Save to database
    console.log("Saving group chat to database");
    try {
      await newGroupChat.save();
      console.log("Group chat saved with ID:", newGroupChat._id);
    } catch (saveError) {
      console.error("Error saving group chat:", saveError);
      return res.status(500).json({ message: "Failed to save group chat: " + saveError.message });
    }

    // Populate members info
    console.log("Populating members info");
    let populatedGroupChat;
    try {
      populatedGroupChat = await GroupChat.findById(newGroupChat._id)
        .populate("members", "fullName email profilePic")
        .populate("admin", "fullName email profilePic");
        
      if (!populatedGroupChat) {
        console.error("Failed to retrieve populated group chat");
        return res.status(500).json({ message: "Failed to retrieve group details" });
      }
    } catch (populateError) {
      console.error("Error populating group chat:", populateError);
      return res.status(500).json({ message: "Failed to retrieve group details: " + populateError.message });
    }

    // Notify members via socket
    console.log("Notifying members about new group");
    try {
      membersList.forEach((memberId) => {
        console.log("Notifying member:", memberId);
        const socketId = getReceiverSocketId(memberId);
        console.log("Socket ID for member:", socketId);
        if (socketId) {
          io.to(socketId).emit("newGroupChat", populatedGroupChat);
        }
      });
    } catch (socketError) {
      console.error("Error notifying members:", socketError);
      // Continue even if socket notifications fail
    }

    // Return success response
    console.log("Successfully created group chat");
    return res.status(201).json(populatedGroupChat);
  } catch (error) {
    console.error("Error in createGroupChat controller: ", error);
    console.error("Error message: ", error.message);
    console.error("Error stack: ", error.stack);
    return res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

// Get all group chats for a user
export const getUserGroupChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const groupChats = await GroupChat.find({ members: userId })
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groupChats);
  } catch (error) {
    console.log("Error in getUserGroupChats controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific group chat by ID
export const getGroupChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const groupChat = await GroupChat.findById(id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if user is a member of the group
    if (!groupChat.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.status(200).json(groupChat);
  } catch (error) {
    console.log("Error in getGroupChatById controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update group chat details
export const updateGroupChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, groupImage } = req.body;
    const userId = req.user._id;

    const groupChat = await GroupChat.findById(id);

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if user is the admin of the group
    if (groupChat.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the admin can update group details" });
    }

    let imageUrl = groupChat.groupImage;
    if (groupImage && groupImage !== groupChat.groupImage) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(groupImage);
      imageUrl = uploadResponse.secure_url;
    }

    groupChat.name = name || groupChat.name;
    groupChat.description = description !== undefined ? description : groupChat.description;
    groupChat.groupImage = imageUrl;

    await groupChat.save();

    const updatedGroupChat = await GroupChat.findById(id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify all members about the group update
    updatedGroupChat.members.forEach((member) => {
      const socketId = getReceiverSocketId(member._id.toString());
      if (socketId) {
        io.to(socketId).emit("updateGroupChat", updatedGroupChat);
      }
    });

    res.status(200).json(updatedGroupChat);
  } catch (error) {
    console.log("Error in updateGroupChat controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add members to a group
export const addGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { members } = req.body;
    const userId = req.user._id;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Please provide members to add" });
    }

    const groupChat = await GroupChat.findById(id);

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if user is the admin of the group
    if (groupChat.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the admin can add members" });
    }

    // Filter out members that are already in the group
    const newMembers = members.filter(
      (memberId) => !groupChat.members.includes(memberId)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All users are already members of this group" });
    }

    // Add new members to the group
    groupChat.members = [...groupChat.members, ...newMembers];
    await groupChat.save();

    const updatedGroupChat = await GroupChat.findById(id)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify all members about the new members
    updatedGroupChat.members.forEach((member) => {
      const socketId = getReceiverSocketId(member._id.toString());
      if (socketId) {
        io.to(socketId).emit("updateGroupChat", updatedGroupChat);
      }
    });

    // Notify new members about being added to the group
    newMembers.forEach((memberId) => {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.to(socketId).emit("addedToGroup", updatedGroupChat);
      }
    });

    res.status(200).json(updatedGroupChat);
  } catch (error) {
    console.log("Error in addGroupMembers controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove a member from a group
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const groupChat = await GroupChat.findById(groupId);

    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    // Check if user is the admin of the group or removing themselves
    if (groupChat.admin.toString() !== userId.toString() && userId.toString() !== memberId) {
      return res.status(403).json({ message: "You don't have permission to remove this member" });
    }

    // Check if member is in the group
    if (!groupChat.members.includes(memberId)) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }

    // If admin is leaving, assign a new admin or delete the group
    if (groupChat.admin.toString() === memberId) {
      // If there are other members, assign the first one as admin
      if (groupChat.members.length > 1) {
        const newAdmin = groupChat.members.find(
          (member) => member.toString() !== memberId
        );
        groupChat.admin = newAdmin;
      } else {
        // If admin is the only member, delete the group
        await GroupChat.findByIdAndDelete(groupId);
        return res.status(200).json({ message: "Group deleted as you were the only member" });
      }
    }

    // Remove member from the group
    groupChat.members = groupChat.members.filter(
      (member) => member.toString() !== memberId
    );
    await groupChat.save();

    const updatedGroupChat = await GroupChat.findById(groupId)
      .populate("members", "fullName email profilePic")
      .populate("admin", "fullName email profilePic");

    // Notify all remaining members about the member removal
    updatedGroupChat.members.forEach((member) => {
      const socketId = getReceiverSocketId(member._id.toString());
      if (socketId) {
        io.to(socketId).emit("updateGroupChat", updatedGroupChat);
      }
    });

    // Notify the removed member
    const removedMemberSocketId = getReceiverSocketId(memberId);
    if (removedMemberSocketId) {
      io.to(removedMemberSocketId).emit("removedFromGroup", {
        groupId: groupChat._id,
        message: "You have been removed from the group",
      });
    }

    res.status(200).json(updatedGroupChat);
  } catch (error) {
    console.log("Error in removeGroupMember controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a group chat
export const getGroupMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const groupChat = await GroupChat.findById(id);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!groupChat.members.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Get messages for the group
    const messages = await Message.find({
      groupId: id,
      isGroupMessage: true,
    })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send a message to a group chat
export const sendGroupMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    // Check if user is a member of the group
    const groupChat = await GroupChat.findById(id);
    if (!groupChat) {
      return res.status(404).json({ message: "Group chat not found" });
    }

    if (!groupChat.members.some(member => member.toString() === senderId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      groupId: id,
      text,
      image: imageUrl,
      isGroupMessage: true,
    });

    await newMessage.save();

    // Populate sender info
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName profilePic"
    );

    // Notify all group members about the new message
    groupChat.members.forEach((memberId) => {
      if (memberId.toString() !== senderId.toString()) {
        const socketId = getReceiverSocketId(memberId.toString());
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", {
            message: populatedMessage,
            groupId: id,
          });
        }
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// getReceiverSocketId is now imported at the top of the file