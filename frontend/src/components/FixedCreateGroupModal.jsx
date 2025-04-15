import { useState, useEffect, useRef } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useChatStore } from "../store/useChatStore";
import { X, Loader, Upload } from "lucide-react";
import toast from "react-hot-toast";

const FixedCreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const modalRef = useRef(null);

  const { createGroupChat, isCreatingGroup } = useGroupChatStore();
  const { users, getUsers, isUsersLoading } = useChatStore();

  // Sync the local state with the prop
  useEffect(() => {
    if (isOpen) {
      setLocalIsOpen(true);
      console.log("Modal opened, fetching users");
      getUsers();
    }
  }, [isOpen, getUsers]);

  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (localIsOpen && modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (localIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [localIsOpen]);

  const handleClose = () => {
    console.log("Closing modal");
    setLocalIsOpen(false);
    resetForm();
    onClose();
  };

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

  const toggleMemberSelection = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    try {
      console.log("Creating group with members:", selectedMembers);
      
      const groupData = {
        name: groupName,
        members: selectedMembers,
        description,
        groupImage,
      };
      
      console.log("Submitting group data:", groupData);
      
      const newGroup = await createGroupChat(groupData);
      console.log("Response from createGroupChat:", newGroup);
      
      if (newGroup) {
        toast.success("Group created successfully!");
        handleClose();
      } else {
        toast.error("Failed to create group. Please try again.");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("An error occurred while creating the group: " + (error.message || "Unknown error"));
    }
  };

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setGroupImage(null);
    setPreviewImage("");
  };

  if (!localIsOpen) {
    return null;
  }

  console.log("Rendering modal content, users:", users);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-base-100 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Group</h2>
          <button 
            onClick={handleClose} 
            className="btn btn-ghost btn-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group Image */}
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
              Upload Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Group Name*</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          {/* Description */}
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

          {/* Member Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Select Members*</span>
            </label>
            {isUsersLoading ? (
              <div className="flex justify-center p-4">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                {users.length === 0 ? (
                  <p className="text-center text-gray-500 py-2">No users found</p>
                ) : (
                  users.map((user) => (
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
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup || !groupName.trim() || selectedMembers.length === 0}
            >
              {isCreatingGroup ? <Loader className="animate-spin" /> : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FixedCreateGroupModal;