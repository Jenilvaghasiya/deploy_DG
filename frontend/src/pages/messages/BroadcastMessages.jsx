import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import {
	fetchBroadcastMessages,
	sendBroadcastMessage,
} from "../../features/messages/messageService";
import useSocket from "../../hooks/useSocket";
import MessageInput from "../../components/MessageInput";
import { hasPermission } from "../../lib/utils";
import { broadcastMessagesTourSteps } from "@/components/Tour/TourSteps";
import ApiTour from "@/components/Tour/ApiTour";

export default function BroadcastMessages() {
	const { user } = useAuthStore();
	const permissions = user?.role?.permissions || [];
	const socketRef = useSocket(user);
	const messagesContainerRef = useRef();
	const endRef = useRef();

	const permissionKeys = permissions.map(p => p.key);
	const hasCreateBroadcastMessagePermission = hasPermission(permissionKeys, "workspace:broadcast-messages:create");

	const [messages, setMessages] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingMessages, setLoadingMessages] = useState(true);

	useEffect(() => {
		loadMessages();
	}, []);

	useEffect(() => {
		const socket = socketRef.current;
		if (!socket) return;

		socket.on("receive-broadcast", (msg) => {
			setMessages((prev) => [...prev, msg]);
			scrollToEnd();
		});

		return () => socket?.off("receive-broadcast");
	}, [socketRef]);

	const loadMessages = async () => {
		setLoadingMessages(true);
		try {
			const data = await fetchBroadcastMessages();
			setMessages(data);
			scrollToEnd();
		} catch (err) {
			console.error("Failed to fetch messages", err);
		} finally {
			setLoadingMessages(false);
		}
	};

	const scrollToEnd = () => {
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
			sender_id: { id: user.id, full_name: user.full_name },
			created_at: new Date().toISOString(),
			_isOptimistic: true,
		};

		setMessages((prev) => [...prev, tempMessage]);
		scrollToEnd();

		setLoading(true);
		try {
			await sendBroadcastMessage(text);
			// Remove optimistic message after sending
			setMessages((prev) =>
				prev.filter((msg) => msg.id !== tempMessage.id)
			);
		} catch (err) {
			console.error("Failed to send", err);
			// Remove optimistic message on error
			setMessages((prev) =>
				prev.filter((msg) => msg.id !== tempMessage.id)
			);
		} finally {
			setLoading(false);
		}
	};

	// Format date for display
	const formatMessageTime = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// const formatMessageDate = (dateString) => {
		
	// 	const date = new Date(dateString);
	// 	return date.toLocaleDateString(undefined, {
	// 		weekday: "short",
	// 		month: "short",
	// 		day: "numeric",
	// 	});
	// };

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
		<>
		<ApiTour
        	tourName="broadCastMessageTour" 
        	steps={broadcastMessagesTourSteps}
      	/>
			{/* Header */}
			<div className="p-6 py-3 border-b flex items-center gap-3 shrink-0">
				<div>
					<h1 className="font-bold text-white">Tenant Announcements</h1>
					<p className="text-xs text-gray-300">Broadcasts to all team members</p>
				</div>
			</div>

			{/* Messages */}
			<div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scroll">
				{loadingMessages ? (
					<div className="flex items-center justify-center h-full">
						<div className="animate-pulse text-gray-500 text-sm">
							Loading announcements...
						</div>
					</div>
				) : messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-center p-6">
						<div className="text-3xl mb-2 text-gray-300">📢</div>
						<h3 className="text-base font-medium text-gray-300 mb-1">No announcements yet</h3>
						<p className="text-xs text-gray-300">Be the first to make an announcement to your team</p>
					</div>
				) : (
					<div className="p-4 space-y-4">
						{dates.map((date) => (
							<div key={date} className="space-y-3">
								<div className="flex items-center justify-center">
									<div className="text-xs leading-none text-white bg-black px-2 py-1 rounded-full shadow-[0_0_4px_0_rgba(255,255,255,0.25)]">{date}</div>
								</div>

								{groupedMessages[date].map((msg) => {
									const isMine =
										msg.sender_id?.id === user.id;
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
												{!isMine && (
													<div className="text-xs mb-1 text-pink-300 font-medium">
														{
															msg.sender_id
																?.full_name
														}
													</div>
												)}
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

			{/* Input */}
				{hasCreateBroadcastMessagePermission && (
				<div className="message-input">
					<MessageInput onSend={handleSend} loading={loading} />
				</div>
				)}		
			</>
	);
}
