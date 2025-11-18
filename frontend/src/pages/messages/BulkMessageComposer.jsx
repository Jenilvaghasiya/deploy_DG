import { Button } from "@/components/ui/button";
import { Send, X, ArrowLeft } from "lucide-react";
import { useState } from "react";

export function BulkMessageComposer({ selectedUsers, onSend, onCancel, onBack }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSend(message);
      setMessage("");
    } catch (error) {
      console.error("Failed to send bulk message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-800">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 🔙 Back button */}
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-white">Send Bulk Message</h3>
        </div>

        {/* ❌ Close button */}
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg cursor-pointer hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-700 max-h-max">
        <p className="text-sm text-gray-400 mb-2">
          Sending to {selectedUsers.length} recipient
          {selectedUsers.length !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-pink-600/20 border border-pink-500/50 rounded-full px-3 py-1.5 mb-2"
            >
              <div className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-white text-xs font-semibold">
                {user.full_name?.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-white">{user.full_name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1  text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 border border-gray-700 placeholder-gray-500"
          disabled={sending}
        />
      </div>

      <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={sending}>
          Cancel
        </Button>
        <Button
          variant="dg_btn"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send to {selectedUsers.length}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
