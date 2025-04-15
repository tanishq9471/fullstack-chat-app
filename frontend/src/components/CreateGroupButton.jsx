import { useState } from "react";
import { UserPlus } from "lucide-react";
import BasicGroupModal from "./BasicGroupModal";

const CreateGroupButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-10 tooltip tooltip-left" data-tip="Create New Group">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-circle shadow-lg size-16"
        >
          <UserPlus size={28} />
        </button>
      </div>
      
      <BasicGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CreateGroupButton;