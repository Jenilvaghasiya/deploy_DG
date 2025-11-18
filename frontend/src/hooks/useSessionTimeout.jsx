import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { socket } from "./useSocket";

const EVENTS = ["load", "mousemove", "mousedown", "click", "scroll", "keypress"];

// small logger wrapper
const log = (...args) => {
  // console.log(`[SessionTimeout ${new Date().toLocaleTimeString()}]`, ...args);
};

export default function useSessionTimeout(defaultTimeout = 3600 * 1000) {
  const timer = useRef(null);
  const sessionTimeoutLength = useAuthStore((state) => state.sessionTimeoutLength);
  const logoutStore = useAuthStore((state) => state.logout);

  const timeout = sessionTimeoutLength ? sessionTimeoutLength * 60 * 1000 : null;

  const logout = () => {
    log("⏹ Logging out due to inactivity");

    logoutStore();

    if (socket) {
      socket.disconnect();
      log("❌ Socket manually disconnected");
    }

    EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    log("🧹 Event listeners removed after logout");
  };

  const resetTimer = () => {
    if (!timeout) return; // no timeout set

    if (timer.current) {
      clearTimeout(timer.current);
      // log("🔄 Cleared old timer");
    }

    timer.current = setTimeout(logout, timeout);
    // log(
    //   `⏳ Activity detected → New timer started (${timeout / 1000 / 60} min)`
    // );
  };

  useEffect(() => {
    if (!timeout) {
      log("⚡ No session timeout configured → inactivity tracking disabled");
      return;
    }

    log(`✅ Session timeout enabled: ${timeout / 1000 / 60} min`);

    EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    log(`📡 Event listeners attached: ${EVENTS.join(", ")}`);

    resetTimer();

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        log("🧹 Timer cleared on unmount");
      }
      EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      log("🧹 Event listeners removed on cleanup");
    };
  }, [timeout]);

  return { resetTimer, logout };
}
