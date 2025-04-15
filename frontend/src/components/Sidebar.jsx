import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import GroupChatList from "./GroupChatList";
import { Users, MessageSquare, Bot } from "lucide-react";

const Sidebar = ({ showAIAssistant, setShowAIAssistant }) => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { selectedGroup, setSelectedGroup } = useGroupChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("direct"); // "direct" or "groups"

  useEffect(() => {
    getUsers();
  }, [getUsers]);
  
  // When switching tabs, reset selections
  useEffect(() => {
    console.log("Tab changed to:", activeTab);
    if (activeTab === "direct") {
      console.log("Resetting selected group");
      setSelectedGroup(null);
    } else {
      console.log("Resetting selected user");
      setSelectedUser(null);
    }
  }, [activeTab, setSelectedGroup, setSelectedUser]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Tabs */}
      <div className="flex border-b border-base-300">
        <button
          className={`flex-1 py-3 flex flex-col items-center lg:flex-row lg:justify-center gap-2 
            ${activeTab === "direct" ? "border-b-2 border-primary" : ""}`}
          onClick={() => {
            console.log("Switching to Direct Messages tab");
            setActiveTab("direct");
          }}
        >
          <MessageSquare size={20} />
          <span className="text-xs lg:text-sm">Direct Messages</span>
        </button>
        <button
          className={`flex-1 py-3 flex flex-col items-center lg:flex-row lg:justify-center gap-2
            ${activeTab === "groups" ? "border-b-2 border-primary" : ""}`}
          onClick={() => {
            console.log("Switching to Group Chats tab");
            setActiveTab("groups");
          }}
        >
          <Users size={20} />
          <span className="text-xs lg:text-sm">Group Chats</span>
        </button>
      </div>

      {activeTab === "direct" ? (
        <>
          <div className="border-b border-base-300 w-full p-3">
            <div className="flex items-center gap-2">
              <Users className="size-5" />
              <span className="font-medium hidden lg:block">Contacts</span>
            </div>
            <div className="mt-2 hidden lg:flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show online only</span>
              </label>
              <span className="text-xs text-gray-500">({onlineUsers.length - 1} online)</span>
            </div>
          </div>

          <div className="overflow-y-auto w-full py-2">
            {/* AI Assistant Button */}
            <button
              onClick={() => {
                setSelectedUser(null);
                setSelectedGroup(null);
                setShowAIAssistant(true);
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${showAIAssistant ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <div className="size-12 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Bot size={24} className="text-white" />
                </div>
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              </div>

              {/* AI Assistant info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">ChatGPT Assistant</div>
                <div className="text-sm text-green-500">
                  Always Online
                </div>
              </div>
            </button>

            {/* Regular Users */}
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                  setShowAIAssistant(false);
                }}
                className={`
                  w-full p-3 flex items-center gap-3
                  hover:bg-base-300 transition-colors
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span
                      className="absolute bottom-0 right-0 size-3 bg-green-500 
                      rounded-full ring-2 ring-zinc-900"
                    />
                  )}
                </div>

                {/* User info - only visible on larger screens */}
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-gray-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && !showAIAssistant && (
              <div className="text-center text-gray-500 py-4">No users found</div>
            )}
          </div>
        </>
      ) : (
        <GroupChatList />
      )}
    </aside>
  );
};
export default Sidebar;
