import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RenameImageModal({ open, onClose, currentName, onSubmit }) {
  const [newName, setNewName] = useState(currentName || "");

  useEffect(() => {
    if (open) {
      setNewName(currentName || "");
    }
  }, [currentName, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg 2xl:max-w-xl !rounded-xl">
        <DialogHeader>
          <DialogTitle>Rename Image</DialogTitle>
        </DialogHeader>

        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full border border-gray-300 text-white rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          placeholder="Enter new image name"
        />

        <DialogFooter className="flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="dg_btn" className="px-4 py-2">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="dg_btn"
            onClick={() => {
              if (newName.trim() !== "") {
                onSubmit(newName.trim());
                onClose();
              }
            }}
            className="px-4 py-2"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
