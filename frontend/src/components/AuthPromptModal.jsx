import React from "react";
import { X, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AuthPromptModal = ({ isOpen, onClose, actionType = "interact" }) => {
  const navigate = useNavigate();

  const actionMessages = {
    like: "like posts",
    comment: "add comments",
    review: "write reviews",
    report: "report posts",
    interact: "interact with posts",
  };

  const message = actionMessages[actionType] || actionMessages.interact;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" border border-gray-800 text-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <DialogHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Authentication Required
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Please login to {message}
          </DialogDescription>
        </DialogHeader>

        {/* Buttons */}
        <div className="mt-6 space-y-3 flex flex-col items-center">
          <Button
            variant="dg_btn"
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className=""
          >
            <FaUserCircle className="w-5 h-5" />
            <span>Login to Continue</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              navigate("/onboarding");
            }}
            className=""
          >
            Don’t have an account?{" "}
            <span className="text-blue-400 ml-1">Sign Up</span>
          </Button>
        </div>
        {/* Footer */}
        <p className="text-center text-gray-100 text-sm mt-6">
          Join our community to share your thoughts and connect with others
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptModal;
