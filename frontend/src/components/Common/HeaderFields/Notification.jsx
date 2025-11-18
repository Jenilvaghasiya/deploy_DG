import { useEffect, useMemo, useRef, Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { FaRegBell } from "react-icons/fa";
import {
  getAllNotifications,
  markAsReadNotification,
  markAsUnreadNotification, // You'll need to add this API call
} from "../../../features/notifications/notificationService";
import { useNotificationStore } from "../../../store/notificationStore";
import { useAuthStore } from "../../../store/authStore";
import useSocket from "../../../hooks/useSocket";
import { cn } from "@/lib/utils";

const NotificationBell = ({btnClassName}) => {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const { notifications, setNotifications, markAllAsRead, markSingledNotificationAsRead, markSingledNotificationAsUnread } =
    useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const prevUnreadCount = useRef(0);

  const unreadCount = useMemo(() => {
    return Array.isArray(notifications)
      ? notifications.filter((n) => !n.isRead).length
      : 0;
  }, [notifications]);

  const navigate = useNavigate();

  const handleNotificationClick = async (notification) => {
    const id = notification.id || notification._id;

    if (!notification.isRead) {
      // Mark as read immediately when clicked
      markSingledNotificationAsRead(id);
      await markAsReadNotification(id);
    }

    // Navigate according to notification type
    if (notification.type === "direct_message" && notification.meta.senderId) {
      navigate(`/messages/direct?userId=${notification.meta.senderId}`);
    } else if (notification.type === "broadcast") {
      navigate(`/messages/broadcast`);
    }
  };

  const handleToggleReadStatus = async (e, notification) => {
    e.stopPropagation(); // Prevent triggering the notification click
    const id = notification.id || notification._id;

    if (notification.isRead) {
      // Mark as unread
      markSingledNotificationAsUnread(id);
      await markAsUnreadNotification(id);
    } else {
      // Mark as read
      markSingledNotificationAsRead(id);
      await markAsReadNotification(id);
    }
  };

  // Sound effect
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      audioRef.current?.play().catch(console.warn);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;
    loadNotifications(0);
  }, [user?.id, socketRef]);

  // Real-time events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("notifications", (msg) => {
      try {
        const parsed = JSON.parse(msg);
        setNotifications((prev) => [parsed, ...prev]);
      } catch (err) {
        console.error("Socket notification parse error:", err);
      }
    });

    socket.on("task_update", async () => {
      loadNotifications(0);
    });

    return () => {
      socket.off("notifications");
      socket.off("task_update");
    };
  }, [socketRef, user?.id]);

  const loadNotifications = async (start) => {
    if (!user?.id || loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await getAllNotifications(user.id, start, LIMIT);
      const newNotifications = res.data || [];

      if (start === 0) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setSkip(start + LIMIT);
      setHasMore(newNotifications.length === LIMIT);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      loadNotifications(skip);
    }
  };

  async function handleMarkAsRead(notificationID) {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    try {
      const response = await markAsReadNotification(notificationID);

      if (!notificationID) {
        markAllAsRead();
      } else {
        markSingledNotificationAsRead(notificationID)
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };


  return (
    <>
      <audio
        ref={(el) => {
          if (el) el.volume = 0.5;
          audioRef.current = el;
        }}
        src="/sounds/genie_sound_trimmed.mp3"
        preload="auto"
      />

      <DropdownMenu>
        <DropdownMenuTrigger className={cn("cursor-pointer relative p-1 md:p-2 text-gray-300 hover:text-pink-400 transition-colors duration-200", btnClassName && btnClassName)}>
          <FaRegBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 md:top-0.5 -right-0.5 md:right-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] rounded-full size-3.5 flex items-center justify-center font-bold">{unreadCount}</span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="min-w-52 md:min-w-64 max-w-80 max-h-80 overflow-y-auto 
          !rounded-2xl 
          bg-black/60 backdrop-blur-md 
          border border-pink-300/20 
          shadow-2xl 
          text-white custom-scroll"
          onScroll={handleScroll}
          ref={containerRef}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-pink-300/20">
            <DropdownMenuLabel className="text-sm font-semibold text-white">Notifications</DropdownMenuLabel>
            {notifications.some(n => !n?.isRead) && (
              <button onClick={() => handleMarkAsRead(null)} className="text-xs text-pink-300 hover:text-pink-100 hover:underline font-medium transition-colors cursor-pointer">Mark all as read</button>
            )}
          </div>

          <div className="py-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-300 italic text-center">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification, index) => (
                <Fragment key={notification.id || index}>
                  <DropdownMenuItem asChild>
                    <div
                      className={cn(
                        "group py-3 px-4 cursor-pointer transition-all duration-200 rounded-none hover:bg-pink-500 hover:text-white relative",
                        notification.type === "announcement"
                          ? "bg-yellow-500/10 border-l-4 border-yellow-400"
                          : notification.type === "maintenance"
                            ? "bg-red-500/10 border-l-4 border-red-500"
                            : !notification.isRead
                              ? "border-l-4 border-pink-500 hover:bg-pink-500/30"
                              : ""
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="w-full pr-20">
                        <p className="text-sm leading-tight break-words whitespace-normal mb-1">
                          {notification.notificationText || notification.message}
                        </p>
                        <p className="text-xs text-zinc-200 group-hover:text-zinc-700">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      
                      {/* Mark as unread button - only shows for read notifications */}
                      {notification.isRead && (
                        <button
                          onClick={(e) => handleToggleReadStatus(e, notification)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-pink-400 hover:text-pink-600 hover:underline hover:cursor-pointer font-medium transition-colors"
                        >
                          Mark as unread
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>

                  <div className="mx-4 my-0 border-t border-gray-700"></div>
                </Fragment>
              ))
            )}

            {loading && (
              <div className="p-3 text-center text-sm text-gray-400">
                Loading...
              </div>
            )}
            {!hasMore && !loading && notifications.length > 0 && (
              <div className="p-3 text-center text-xs text-gray-500">
                No more notifications
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default NotificationBell;