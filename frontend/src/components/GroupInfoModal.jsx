import { useState } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { X, Upload, Loader, Plus, UserMinus, LogOut, Users } from "lucide-react";

const GroupInfoModal = ({ isOpen, onClose }) => {
  const { selectedGroup, updateGroupChat, addGroupMembers, removeGroupMember, isUpdatingGroup } = useGroupChatStore();
  const { authUser } = useAuthStore();
  const { users } = useChatStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(selectedGroup?.name || "");
  const [description, setDescription] = useState(selectedGroup?.description || "");
  const [groupImage, setGroupImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(selectedGroup?.groupImage || "");
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  if (!isOpen || !selectedGroup) return null;

  const isAdmin = selectedGroup.admin._id === authUser._id;
  
  // Filter out users who are already members
  const nonMemberUsers = users.filter(
    user => !selectedGroup.members.some(member => member._id === user._id)
  );

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setGroupImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) return;
    
    const updateData = {
      name,
      description,
    };
    
    if (groupImage) {
      updateData.groupImage = groupImage;
    }
    
    await updateGroupChat(selectedGroup._id, updateData);
    setIsEditing(false);
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    
    await addGroupMembers(selectedGroup._id, selectedNewMembers);
    setIsAddingMembers(false);
    setSelectedNewMembers([]);
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      await removeGroupMember(selectedGroup._id, memberId);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await removeGroupMember(selectedGroup._id, authUser._id);
      onClose();
    }
  };

  const toggleMemberSelection = (userId) => {
    if (selectedNewMembers.includes(userId)) {
      setSelectedNewMembers(selectedNewMembers.filter(id => id !== userId));
    } else {
      setSelectedNewMembers([...selectedNewMembers, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Group Info</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {isEditing ? (
            <div className="space-y-4">
              {/* Edit Group Image */}
              <div className="flex flex-col items-center mb-4">
                <div className="avatar mb-2">
                  <div className="w-24 h-24 rounded-full border-2 border-primary flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Upload size={32} className="mx-auto" />
                        <span className="text-xs">Group Image</span>
                      </div>
                    )}
                  </div>
                </div>
                <label className="btn btn-sm btn-outline">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {/* Edit Group Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Group Name*</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name"
                  required
                />
              </div>

              {/* Edit Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setName(selectedGroup.name);
                    setDescription(selectedGroup.description);
                    setPreviewImage(selectedGroup.groupImage);
                    setGroupImage(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                  disabled={isUpdatingGroup || !name.trim()}
                >
                  {isUpdatingGroup ? <Loader className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Group Info Display */}
              <div className="flex flex-col items-center mb-6">
                <div className="avatar mb-3">
                  <div className="w-24 h-24 rounded-full">
                    <img
                      src={selectedGroup.groupImage || "/group-avatar.png"}
                      alt={selectedGroup.name}
                      onError={(e) => {
                        e.target.src = "/avatar.png"; // Fallback image
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold">{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-gray-500 text-center mt-2">{selectedGroup.description}</p>
                )}
                
                {isAdmin && (
                  <button
                    className="btn btn-sm btn-outline mt-3"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Group
                  </button>
                )}
              </div>

              {/* Members Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold flex items-center">
                    <Users size={18} className="mr-2" />
                    Members ({selectedGroup.members.length})
                  </h4>
                  {isAdmin && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsAddingMembers(true)}
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {isAddingMembers ? (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                      {nonMemberUsers.length === 0 ? (
                        <p className="text-center text-gray-500 py-2">No users to add</p>
                      ) : (
                        nonMemberUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center p-2 hover:bg-base-200 rounded-lg cursor-pointer"
                            onClick={() => toggleMemberSelection(user._id)}
                          >
                            <div className="avatar mr-3">
                              <div className="w-8 h-8 rounded-full">
                                <img
                                  src={user.profilePic || "/avatar.png"}
                                  alt={user.fullName}
                                />
                              </div>
                            </div>
                            <span>{user.fullName}</span>
                            <div className="ml-auto">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={selectedNewMembers.includes(user._id)}
                                onChange={() => {}}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setIsAddingMembers(false);
                          setSelectedNewMembers([]);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddMembers}
                        disabled={selectedNewMembers.length === 0}
                      >
                        Add Selected
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedGroup.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center p-2 rounded-lg hover:bg-base-200"
                      >
                        <div className="avatar mr-3">
                          <div className="w-10 h-10 rounded-full">
                            <img
                              src={member.profilePic || "/avatar.png"}
                              alt={member.fullName}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {member._id === selectedGroup.admin._id ? "Admin" : "Member"}
                          </p>
                        </div>
                        {isAdmin && member._id !== authUser._id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave Group Button */}
              {!isAdmin && (
                <div className="mt-6 flex justify-center">
                  <button
                    className="btn btn-error btn-outline"
                    onClick={handleLeaveGroup}
                  >
                    <LogOut size={16} className="mr-2" />
                    Leave Group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;