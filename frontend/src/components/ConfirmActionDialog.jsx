// components/ConfirmActionDialog.jsx
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
import { AlertTriangle } from "lucide-react";

function ConfirmActionDialog({
  onConfirm,
  children,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // "default" | "danger"
  showIcon = true,
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md !rounded-xl bg-zinc-900 border border-zinc-700"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {showIcon && variant === "danger" && (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-zinc-300 py-4">{message}</div>

        <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              {cancelText}
            </Button>
          </DialogClose>

          <DialogClose asChild>
            <Button 
              variant={variant === "danger" ? "destructive" : "dg_btn"} 
              onClick={onConfirm}
              className={variant === "danger" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmText}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmActionDialog;