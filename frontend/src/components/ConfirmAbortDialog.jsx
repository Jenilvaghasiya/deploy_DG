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
import { StopCircle, X } from "lucide-react";
import api from "@/api/axios";
import { toast } from "react-hot-toast";
import { useState } from "react";

function ConfirmAbortDialog({
  taskId,
  onSuccess, // callback after successful abort
  title = "Confirm Abort",
  message = "Are you sure you want to abort this task?",
  triggerLabel = "Abort",
}) {
  const [loading, setLoading] = useState(false);

  const handleAbort = async () => {
    if (!taskId) {
      toast.error("No active task to abort");
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/image-variation/abort/${taskId}`);
      toast.success("Generation cancelled");
      onSuccess?.(); // callback to update parent state
    } catch (error) {
      console.error("Failed to cancel task:", error);
      toast.error("Failed to cancel generation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          className={
            "max-w-48 border-2 border-solid border-red-500 rounded-lg text-white text-center text-lg font-medium py-1 p-3 transition-all duration-200 ease-linear flex bg-red-600 hover:bg-red-700"
          }
          disabled={loading}
        >
          <StopCircle className="mr-2" size={20} />
          {loading ? "Aborting..." : triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-md !rounded-xl"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">{message}</div>

        <DialogFooter className="flex justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="dg_btn">Cancel</Button>
          </DialogClose>

          <DialogClose asChild>
            <Button
              variant="dg_btn"
              onClick={handleAbort}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Aborting..." : "Abort"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmAbortDialog;
