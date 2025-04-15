import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Send, Bot } from "lucide-react";

const AIAssistantChat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get("/ai-assistant/messages");
        setMessages(res.data);
      } catch (error) {
        toast.error("Failed to load messages");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      // Add user message to UI immediately for better UX
      const userMessage = {
        _id: Date.now().toString(),
        senderId: authUser._id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isTemp: true // Flag to identify temporary messages
      };
      
      setMessages(prev => [...prev, userMessage]);
      setText("");
      
      // Add typing indicator
      const typingMessage = {
        _id: 'typing-indicator',
        senderId: 'ai-assistant',
        text: "...",
        createdAt: new Date().toISOString(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingMessage]);
      
      // Send message to backend
      const res = await axiosInstance.post("/ai-assistant/send", { text: userMessage.text });
      
      // Remove typing indicator and temporary message
      setMessages(prev => prev.filter(msg => msg._id !== 'typing-indicator' && !msg.isTemp));
      
      // Add both messages from response
      setMessages(prev => [...prev, res.data.userMessage, res.data.aiMessage]);
      
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
      
      // Remove typing indicator if there was an error
      setMessages(prev => prev.filter(msg => msg._id !== 'typing-indicator'));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <div className="p-4 border-b flex items-center">
        <div className="avatar">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
        </div>
        <div className="ml-3">
          <h3 className="font-semibold">ChatGPT Assistant</h3>
          <p className="text-xs text-gray-500">AI-powered assistant</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <h3 className="font-semibold text-lg mb-2">Welcome to ChatGPT Assistant</h3>
                <p className="text-center mb-2">
                  I'm your AI assistant powered by ChatGPT. I can help answer questions, provide information, and assist with various tasks.
                </p>
                <p className="text-sm">Send a message to get started!</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={message._id}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                ref={index === messages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    {message.senderId === authUser._id ? (
                      <img
                        src={authUser.profilePic || "/avatar.png"}
                        alt="profile pic"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot size={20} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {message.isTyping ? "typing..." : formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble flex flex-col">
                  {message.isTyping ? (
                    <span className="loading loading-dots loading-sm"></span>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="p-4 w-full">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Ask the AI assistant..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-sm btn-circle"
            disabled={!text.trim()}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantChat;