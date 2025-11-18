import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, UserX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ConfirmDeleteUserDialog({
  onDelete,
  children,
  title = "Delete User Account",
  userEmail,
  userFullname,
}) {
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const confirmationPhrase = "DELETE";
  const isDeleteEnabled = confirmText === confirmationPhrase;

  const handleDelete = () => {
    if (isDeleteEnabled) {
      onDelete({ reason }); // Pass reason as optional
      setConfirmText(""); 
      setReason("");
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setConfirmText("");
      setReason("");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md !rounded-xl"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert
            variant="destructive"
            className="border border-red-700/40 bg-red-950 text-red-300 rounded-lg"
          >
            <UserX className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong className="text-red-400">Warning:</strong> This action is
              permanent and cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              You are about to permanently delete the following user:
            </p>
            <div className="rounded-lg bg-gray-800/70 p-3 space-y-1 border border-gray-700">
              <p className="text-sm font-medium text-gray-100">
                {userFullname}
              </p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-white">This will:</p>
            <ul className="text-sm text-white space-y-1 ml-4">
              <li>• Prevent the user from logging in.</li>
              <li>• Remove the user’s access to all services and features.</li>
              <li>• Allow their content to be reassigned to another user.</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label
              htmlFor="confirm-delete"
              className="text-sm font-medium text-white block"
            >
              Type{" "}
              <span className="font-mono bg-red-100 px-1 py-0.5 rounded text-red-700">
                {confirmationPhrase}
              </span>{" "}
              to confirm
            </label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${confirmationPhrase} to enable delete`}
              className="font-mono text-red-600"
              autoComplete="off"
            />
          </div>

          {/* Optional Reason Input */}
          <div className="space-y-2">
            <label
              htmlFor="delete-reason"
              className="text-sm font-medium text-white block"
            >
              Reason (optional)
            </label>
            <Input
              id="delete-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a reason for deletion (optional)"
              className="text-gray-200"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isDeleteEnabled}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserX className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeleteUserDialog;
