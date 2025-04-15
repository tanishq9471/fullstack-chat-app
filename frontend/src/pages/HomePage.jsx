import { useChatStore } from "../store/useChatStore";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { useState } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import AIAssistantChat from "../components/AIAssistantChat";
import CreateGroupButton from "../components/CreateGroupButton";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupChatStore();
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar showAIAssistant={showAIAssistant} setShowAIAssistant={setShowAIAssistant} />

            {selectedUser ? (
              <ChatContainer />
            ) : selectedGroup ? (
              <GroupChatContainer />
            ) : showAIAssistant ? (
              <AIAssistantChat />
            ) : (
              <NoChatSelected />
            )}
          </div>
        </div>
      </div>
      
      {/* Floating button to create a new group */}
      <CreateGroupButton />
    </div>
  );
};
export default HomePage;
