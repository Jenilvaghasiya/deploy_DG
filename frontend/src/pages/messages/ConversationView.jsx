import { use, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  fetchDirectMessages,
  sendDirectMessage,
} from "../../features/messages/messageService";
import useSocket from "../../hooks/useSocket";
import MessageInput from "../../components/MessageInput";
import api from "@/api/axios";

export default function ConversationView({ user: targetUser, hasCreateUserPermission }) {  
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const messagesContainerRef = useRef(null);
  const endRef = useRef(null);
//     const location = useLocation();
//   const { meta } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
const [targetUserData,setTargetUserData]= useState(null);

  useEffect(() => {
    if (!targetUser?.id) return;

	fetchUserById()
    loadMessages();
  }, [targetUser]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !targetUser?.id) return;

    socket.on("receive-dm", (msg) => {
      if (
        (msg.sender_id.id || msg.sender_id) === targetUser.id ||
        msg.recipient_id === targetUser.id
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    return () => socket.off("receive-dm");
  }, [socketRef, targetUser]);


async function fetchUserById() {
	const responce = await api.get(`/messages/get/recipient/${targetUser?.id}`)
	setTargetUserData(responce.data?.data)		
}
  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await fetchDirectMessages(targetUser.id);
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Optimistic update
    const tempMessage = {
      id: Date.now().toString(),
      content: text,
      sender_id: { id: user.id },
      recipient_id: targetUser.id,
      created_at: new Date().toISOString(),
      _isOptimistic: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    setLoading(true);
    try {
      await sendDirectMessage({
        recipient_id: targetUser.id,
        content: text,
      });
      // Remove optimistic message after sending
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempMessage.id)
      );
    } catch (err) {
      console.error("Failed to send message", err);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempMessage.id)
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date to display
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((msg) => {
      const date = new Date(msg.created_at);
      const dateKey = date.toLocaleDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(msg);
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);
  const dates = Object.keys(groupedMessages);

  return (
    <div className="flex flex-col h-full w-full border-shadow-blur">
      {/* Header */}
      <div className="p-[15px] border-b border-gray-300 bg-zinc-800 flex items-center gap-2 flex-shrink-0">
        <div className="size-9 rounded-full bg-pink-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {targetUserData?.full_name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-white font-medium text-sm truncate">
            {targetUserData?.full_name}
          </p>
          <p className="text-xs text-gray-300 truncate">
            {targetUserData?.email}
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scroll">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-500 text-sm">
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-6">
            <div>
              <div className="text-3xl mb-2 text-gray-600">
                👋
              </div>
              <h3 className="text-base font-medium text-gray-300 mb-1">
                No messages yet
              </h3>
              <p className="text-xs text-gray-500">
                Start a conversation with {targetUserData?.full_name}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {dates.map((date) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-center">
                  <div className="text-xs text-white bg-gray-700 px-2 py-0.5 rounded-full">
					{new Date(date).toLocaleDateString("en-GB")}
                  </div>
                </div>

                {groupedMessages[date].map((msg) => {
                  const isMine =
                    (msg.sender_id.id || msg.sender_id) ===
                    user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`inline-block p-2 px-3 rounded-lg text-sm ${
                          isMine
                            ? "bg-pink-600 text-white"
                            : "bg-[#2a2a2a] text-white"
                        } ${
                          msg._isOptimistic
                            ? "opacity-70"
                            : ""
                        }`}
                        style={{
                          maxWidth: "70%",
                          wordBreak: "break-word",
                        }}
                      >
                        <p>{msg.content}</p>
                        <p className="text-[10px] text-right mt-0.5 opacity-70">
                          {formatMessageTime(
                            msg.created_at
                          )}
                          {msg._isOptimistic &&
                            " • Sending..."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={endRef}></div>
          </div>
        )}
      </div>

      {/* Message Input */}
      {hasCreateUserPermission && <MessageInput onSend={handleSend} loading={loading} />}
    </div>
  );
}
 