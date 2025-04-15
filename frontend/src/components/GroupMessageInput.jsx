import { useState, useRef } from "react";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { Send, Image, X } from "lucide-react";

const GroupMessageInput = () => {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [image, setImage] = useState(null);
  const fileInputRef = useRef(null);

  const { selectedGroup, sendGroupMessage } = useGroupChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && !image) || !selectedGroup) return;
    
    await sendGroupMessage(selectedGroup._id, {
      text: message,
      image,
    });
    
    setMessage("");
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!selectedGroup) return null;

  return (
    <div className="p-4 border-t">
      {imagePreview && (
        <div className="relative w-24 h-24 mb-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover rounded-md"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-circle btn-ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          <Image size={20} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            ref={fileInputRef}
          />
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message ${selectedGroup.name}`}
          className="input input-bordered flex-1"
        />
        
        <button
          type="submit"
          className="btn btn-circle btn-primary"
          disabled={!message.trim() && !image}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default GroupMessageInput;