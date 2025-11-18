// components/SizeChartDialog.jsx
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

import { SizeChartViewer } from "../Tab/SizeChartViewer";
import { Button } from "@/components/ui/button";

function SizeChartDialog({ isOpen, onClose, onSelectSizeChart, children, sizeChartData = [] }) {
  const [internalOpen, setInternalOpen] = useState(isOpen);
  const [selectedCharts, setSelectedCharts] = useState([]);

  const handleOpenChange = (open) => {
    setInternalOpen(open);
    if (!open) onClose?.();
  };

const handleSelect = (id) => {
  setSelectedCharts((prev) => {
    if (prev.includes(id)) {
      // If already selected, remove it (deselect)
      return prev.filter((item) => item !== id);
    } else {
      // Otherwise, add it
      return [...prev, id];
    }
  });
};


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl overflow-hidden 2xl:max-w-3xl !rounded-xl">
        <DialogHeader>
          <DialogTitle>Size Chart Viewer</DialogTitle>
        </DialogHeader>

        <div className="w-full h-full">
          <SizeChartViewer
            isOpen={true}
            onClose={() => setInternalOpen(false)}
            onSelectSizeChart={handleSelect}
            showLinkToImageButton={false}
            showMultipleSelection={true}
            selectedCharts={selectedCharts}
            measurementTableData={sizeChartData} // 🔹 project size charts here
          />
        </div>

        <DialogFooter>
             <Button
    onClick={() => {
        console.log('selectedCharts', selectedCharts);

        
      onSelectSizeChart?.(selectedCharts); // send all selected IDs to parent
      onClose(false);
    }}
    variant="dg_btn"
  >
    Confirm
  </Button>
          {/* <DialogClose asChild>
            <Button
              variant="dg_btn"
              className="hover:text-white cursor-pointer"
            >
              Close
            </Button>
          </DialogClose> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SizeChartDialog;
