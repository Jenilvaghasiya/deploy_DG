// components/ConfirmDeleteDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

function ConfirmDeleteDialog({
  onDelete,
  children,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this?",
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md !rounded-xl"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-zinc-300">{message}</div>

        <DialogFooter className="flex flex-row justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button
              variant="dg_btn"
            >
              Cancel
            </Button>
          </DialogClose>

          <DialogClose asChild>
            <Button variant="dg_btn" onClick={onDelete}>
              Delete
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
