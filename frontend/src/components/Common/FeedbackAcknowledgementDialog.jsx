// components/FeedbackAcknowledgementDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { AiOutlineCheck } from "react-icons/ai";
import { Button } from "../ui/button";

function FeedbackAcknowledgementDialog({ open, setOpen }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[11000] sm:max-w-md !rounded-xl bg-black/25 text-center shadow-lg py-10 px-6 [&>button]:hidden">
        <DialogHeader className="flex flex-col items-center justify-center gap-4">
          <div className="bg-pink-500 rounded-full p-4">
            <AiOutlineCheck className="text-white text-3xl" />
          </div>
          <DialogTitle className="text-lg font-semibold text-white">
            Thank you for your feedback!
          </DialogTitle>
          <p className="text-sm text-white/80 mt-1">
            Your voice shapes the magic behind Design Genie.
          </p>
        </DialogHeader>

        <div className="mt-4 text-sm text-white/70">
          <p>
            We’re always evolving to make your fashion journey more seamless.
            Your input means a lot to us.
          </p>
        </div>

        <DialogFooter className="mt-8 flex justify-center w-full">
          <DialogClose asChild>
            <Button variant="dg_btn" className="w-full">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackAcknowledgementDialog;
