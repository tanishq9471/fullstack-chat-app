import { useState } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { MoreVertical, Users, Info } from "lucide-react";
import GroupInfoModal from "./GroupInfoModal";

const GroupChatHeader = () => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { selectedGroup } = useGroupChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedGroup) return null;

  const onlineGroupMembers = selectedGroup.members.filter(member => 
    onlineUsers.includes(member._id.toString())
  );

  return (
    <div className="border-b p-4 flex justify-between items-center">
      <div className="flex items-center">
        <div className="avatar mr-3">
          <div className="w-12 h-12 rounded-full">
            <img
              src={selectedGroup.groupImage || "/group-avatar.png"}
              alt={selectedGroup.name}
              onError={(e) => {
                e.target.src = "/avatar.png"; // Fallback image
              }}
            />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-lg">{selectedGroup.name}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Users size={14} className="mr-1" />
            <span>{selectedGroup.members.length} members</span>
            <span className="mx-2">•</span>
            <span>{onlineGroupMembers.length} online</span>
          </div>
        </div>
      </div>

      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
          <MoreVertical size={20} />
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li>
            <button onClick={() => setIsInfoModalOpen(true)}>
              <Info size={16} />
              Group Info
            </button>
          </li>
        </ul>
      </div>

      {isInfoModalOpen && (
        <GroupInfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupChatHeader;