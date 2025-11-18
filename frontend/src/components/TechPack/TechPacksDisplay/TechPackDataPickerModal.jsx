import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import TechPackDataPickerListing from "./TechPackDataPickerListing";


const TechPackPickerModal = ({ onPick }) => {
  const [open, setOpen] = useState(false);

  // Handle when a tech pack is picked
  const handlePick = (techPack) => {
    if (onPick) onPick(techPack);
    setOpen(false); // close modal
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <DialogTrigger asChild>
        <Button
          variant="dg_btn"
          className="flex items-center gap-2 bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
        >
          <FolderOpen className="w-4 h-4" />
          Pick & Choose Data
        </Button>
      </DialogTrigger>

      {/* Modal Content */}
      <DialogContent
        className="w-full h-[90vh] overflow-hidden flex flex-col !rounded-xl text-white border-slate-700 custom-scroll"
        style={{ zIndex: 9999 }}
      >
        <DialogHeader className="border-b border-slate-800 pb-2">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-400" />
            Pick & Choose Tech Pack Data
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 custom-scroll">
          {/* Inject your full TechPackDataPickerListing here */}
          <TechPackDataPickerListing
            onPick={handlePick} // pass callback for selected data
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800 mt-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechPackPickerModal;
