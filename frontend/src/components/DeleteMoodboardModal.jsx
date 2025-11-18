import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import api from "@/api/axios";


function DeleteMoodboardModal({ 
  moodboardId, 
  moodboardName = "Untitled",
  open, 
  onOpenChange,
  onDeleteSuccess 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!moodboardId) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/moodboards/${moodboardId}`);
      toast.success(`Moodboard "${moodboardName}" deleted successfully!`);
      onDeleteSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to delete moodboard"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md !rounded-xl bg-zinc-900" 
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-zinc-300">
          Delete moodboard "
          <span className="text-pink-400">{moodboardName}</span>"? 
          This action cannot be undone.
        </div>

        <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
          <Button
            variant="dg_btn"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button 
            variant="destructive" 
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteMoodboardModal;