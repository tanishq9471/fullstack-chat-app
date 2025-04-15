import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupChatStore = create((set, get) => ({
  groupChats: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  isCreatingGroup: false,
  isUpdatingGroup: false,

  // Get all group chats for the current user
  getGroupChats: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groupChats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching group chats");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  // Get a specific group chat by ID
  getGroupChatById: async (groupId) => {
    try {
      const res = await axiosInstance.get(`/groups/${groupId}`);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching group chat");
      return null;
    }
  },

  // Create a new group chat
  createGroupChat: async (groupData) => {
    set({ isCreatingGroup: true });
    try {
      console.log("Creating group chat with data:", groupData);
      
      // Make sure members is an array of strings
      if (groupData.members && Array.isArray(groupData.members)) {
        groupData.members = groupData.members.map(id => id.toString());
      }
      
      console.log("Sending request to create group chat");
      const res = await axiosInstance.post("/groups/create", groupData);
      console.log("Response from server:", res.data);
      
      // Update the state with the new group chat
      set({ groupChats: [res.data, ...get().groupChats] });
      toast.success("Group chat created successfully");
      return res.data;
    } catch (error) {
      console.error("Error creating group chat:", error);
      console.error("Error response:", error.response);
      
      const errorMessage = error.response?.data?.message || "Error creating group chat";
      console.error("Error message:", errorMessage);
      
      toast.error(errorMessage);
      return null;
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  // Update group chat details
  updateGroupChat: async (groupId, updateData) => {
    set({ isUpdatingGroup: true });
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, updateData);
      
      // Update the group in the list
      const updatedGroups = get().groupChats.map(group => 
        group._id === groupId ? res.data : group
      );
      
      set({ 
        groupChats: updatedGroups,
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup
      });
      
      toast.success("Group updated successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating group");
      return null;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  // Add members to a group
  addGroupMembers: async (groupId, members) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { members });
      
      // Update the group in the list
      const updatedGroups = get().groupChats.map(group => 
        group._id === groupId ? res.data : group
      );
      
      set({ 
        groupChats: updatedGroups,
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup
      });
      
      toast.success("Members added successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding members");
      return null;
    }
  },

  // Remove a member from a group
  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
      
      // If the group was deleted (last member left)
      if (res.data.message && res.data.message.includes("deleted")) {
        set({ 
          groupChats: get().groupChats.filter(group => group._id !== groupId),
          selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup
        });
        toast.success("Group deleted as you were the last member");
        return null;
      }
      
      // Update the group in the list
      const updatedGroups = get().groupChats.map(group => 
        group._id === groupId ? res.data : group
      );
      
      set({ 
        groupChats: updatedGroups,
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup
      });
      
      toast.success("Member removed successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing member");
      return null;
    }
  },

  // Get messages for a group chat
  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching group messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // Send a message to a group chat
  sendGroupMessage: async (groupId, messageData) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, messageData);
      set({ groupMessages: [...get().groupMessages, res.data] });
      
      // Emit socket event for real-time updates
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("sendGroupMessage", {
          groupId,
          message: res.data
        });
      }
      
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending message");
      return null;
    }
  },

  // Join a group chat socket room
  joinGroupChat: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("joinGroupChat", groupId);
    }
  },

  // Leave a group chat socket room
  leaveGroupChat: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("leaveGroupChat", groupId);
    }
  },

  // Subscribe to group messages
  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Join the group chat room
    get().joinGroupChat(groupId);

    // Listen for new group messages
    socket.on("receiveGroupMessage", (data) => {
      if (data.groupId === groupId) {
        set({ groupMessages: [...get().groupMessages, data.message] });
      }
    });

    // Listen for group updates
    socket.on("updateGroupChat", (updatedGroup) => {
      if (updatedGroup._id === groupId) {
        // Update the group in the list
        const updatedGroups = get().groupChats.map(group => 
          group._id === groupId ? updatedGroup : group
        );
        
        set({ 
          groupChats: updatedGroups,
          selectedGroup: get().selectedGroup?._id === groupId ? updatedGroup : get().selectedGroup
        });
      }
    });

    // Listen for being removed from a group
    socket.on("removedFromGroup", (data) => {
      if (data.groupId === groupId) {
        toast.info(data.message);
        set({ 
          groupChats: get().groupChats.filter(group => group._id !== groupId),
          selectedGroup: null
        });
      }
    });
  },

  // Unsubscribe from group messages
  unsubscribeFromGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Leave the group chat room
    get().leaveGroupChat(groupId);

    // Remove event listeners
    socket.off("receiveGroupMessage");
    socket.off("updateGroupChat");
    socket.off("removedFromGroup");
  },

  // Set the selected group
  setSelectedGroup: (group) => {
    // If there was a previously selected group, unsubscribe from its messages
    if (get().selectedGroup && get().selectedGroup._id !== group?._id) {
      get().unsubscribeFromGroupMessages(get().selectedGroup._id);
    }
    
    set({ selectedGroup: group });
    
    // Subscribe to the new group's messages
    if (group) {
      get().getGroupMessages(group._id);
      get().subscribeToGroupMessages(group._id);
    }
  },

  // Handle new group message notification
  handleNewGroupMessage: (message, groupId) => {
    // If this is the currently selected group, add the message to the list
    if (get().selectedGroup?._id === groupId) {
      set({ groupMessages: [...get().groupMessages, message] });
    } else {
      // Otherwise, show a notification
      const group = get().groupChats.find(g => g._id === groupId);
      if (group) {
        toast.success(`New message in ${group.name}`);
      }
    }
  },

  // Reset state when user logs out
  resetState: () => {
    set({
      groupChats: [],
      selectedGroup: null,
      groupMessages: [],
      isGroupsLoading: false,
      isGroupMessagesLoading: false,
      isCreatingGroup: false,
      isUpdatingGroup: false,
    });
  },
}));