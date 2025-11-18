// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export let socket = null; // Shared singleton

export const connectSocket = (user) => {
  console.groupCollapsed("🧩 [connectSocket] Invoked");
  console.log("👉 User passed:", user);
  console.log("👉 Existing socket value before connection:", socket);

  try {
    const localStorageData = JSON.parse(
      window.localStorage.getItem("design-genie-auth-storage")
    ) || {};
    console.log("📦 LocalStorage data fetched:", localStorageData);

    const token = localStorageData?.state?.token || null;
    console.log("🔑 Extracted token:", token);

    if (!user) {
      console.warn("⚠️ No user provided — socket connection aborted.");
      console.groupEnd();
      return;
    }

    if (socket) {
      console.warn("⚠️ Socket already exists — skipping re-initialization.");
      console.groupEnd();
      return;
    }

    const serverUrl = import.meta.env.VITE_SERVER_URL;
    console.log("🌍 Connecting to server URL:", serverUrl);

    socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: { token },
    });

    console.log("🚀 Socket instance created:", socket);

    // Emit join event
    const joinPayload = {
      user_id: user.id,
      tenant_id: user.tenant?.id,
    };
    console.log("📤 Emitting 'join' event with payload:", joinPayload);
    socket.emit("join", joinPayload);

    // On connect
    socket.on("connect", () => {
      console.log("✅ [Socket Event] Connected with ID:", socket.id);
    });

    // On disconnect
    socket.on("disconnect", (reason) => {
      console.log("❌ [Socket Event] Disconnected. Reason:", reason);
    });

    // Error events
    socket.on("connect_error", (error) => {
      console.error("💥 [Socket Event] Connection error:", error.message);
    });

    socket.on("error", (err) => {
      console.error("🔥 [Socket Event] General error:", err);
    });

    console.log("✅ Socket connection setup complete.");
  } catch (error) {
    console.error("❌ [connectSocket] Error during socket setup:", error);
  }

  console.groupEnd();
};

export default function useSocket(user) {
  const socketRef = useRef(null);

  useEffect(() => {
    console.groupCollapsed("🧩 [useSocket Hook] useEffect triggered");
    console.log("👤 User:", user);
    console.log("🔌 Current global socket:", socket);

    if (!user) {
      console.warn("⚠️ No user provided to useSocket — exiting effect.");
      socketRef.current = socket;
      console.groupEnd();
      return;
    }

    if (socket) {
      console.log("ℹ️ Socket already initialized. Reusing existing instance.");
      socketRef.current = socket;
      console.groupEnd();
      return;
    }

    console.log("🆕 No existing socket found — calling connectSocket(user).");
    connectSocket(user);

    socketRef.current = socket;

    console.log("🔁 Assigned socketRef.current:", socketRef.current);
    console.groupEnd();

    // Optional cleanup if needed later
    return () => {
      console.groupCollapsed("🧩 [useSocket Hook] Cleanup triggered");
      console.log("🧹 Current socket before cleanup:", socket);
      if (socket) {
        console.log("🔌 Disconnecting socket...");
        socket.disconnect();
        socket = null;
        console.log("✅ Socket disconnected and reset to null.");
      } else {
        console.log("ℹ️ No active socket to clean up.");
      }
      console.groupEnd();
    };
  }, [user]);

  console.log("📤 Returning socketRef from useSocket:", socketRef);
  return socketRef;
}
