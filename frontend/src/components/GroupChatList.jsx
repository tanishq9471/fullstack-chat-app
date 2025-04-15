import { useEffect, useState } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Loader, Users, Plus } from "lucide-react";
import SimpleGroupModal from "./SimpleGroupModal";

const GroupChatList = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { groupChats, getGroupChats, isGroupsLoading, setSelectedGroup, selectedGroup } = useGroupChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    console.log("GroupChatList mounted, fetching group chats");
    getGroupChats();
  }, [getGroupChats]);

  const handleGroupSelect = (group) => {
    console.log("Group selected:", group);
    setSelectedGroup(group);
  };
  
  const handleOpenCreateModal = () => {
    console.log("Opening create group modal");
    setIsCreateModalOpen(true);
  };

  return (
    <div className="py-2">
      <div className="flex justify-between items-center px-4 mb-2">
        <h3 className="text-lg font-semibold flex items-center">
          <Users size={18} className="mr-2" /> Groups
        </h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleOpenCreateModal}
        >
          <Plus size={18} />
        </button>
      </div>

      {isGroupsLoading ? (
        <div className="flex justify-center p-4">
          <Loader className="animate-spin" />
        </div>
      ) : groupChats.length === 0 ? (
        <div className="text-center text-gray-500 py-2">
          <p>No group chats yet</p>
          <button
            className="btn btn-ghost btn-sm mt-1"
            onClick={handleOpenCreateModal}
          >
            Create a group
          </button>
        </div>
      ) : (
        <div className="space-y-1 px-2">
          {groupChats.map((group) => (
            <div
              key={group._id}
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-base-200 ${
                selectedGroup?._id === group._id ? "bg-base-200" : ""
              }`}
              onClick={() => handleGroupSelect(group)}
            >
              <div className="avatar mr-3">
                <div className="w-10 h-10 rounded-full">
                  <img
                    src={group.groupImage || "/group-avatar.png"}
                    alt={group.name}
                    onError={(e) => {
                      e.target.src = "/avatar.png"; // Fallback image
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{group.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {group.members.length} members
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((member) => (
                    <div
                      key={member._id}
                      className={`avatar ${
                        onlineUsers.includes(member._id.toString())
                          ? "online"
                          : "offline"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full border border-base-100">
                        <img
                          src={member.profilePic || "/avatar.png"}
                          alt={member.fullName}
                        />
                      </div>
                    </div>
                  ))}
                  {group.members.length > 3 && (
                    <div className="avatar">
                      <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-xs">
                        +{group.members.length - 3}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimpleGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          console.log("Closing create group modal");
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
};

export default GroupChatList;