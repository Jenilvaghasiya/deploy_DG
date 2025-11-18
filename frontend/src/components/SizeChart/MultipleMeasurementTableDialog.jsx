// components/MultipleMeasurementTableDialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { MeasurementTable } from "@/pages/image_generator/MeasurementTable";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

function MultipleMeasurementTableDialog({
  open,
  setOpen,
  sizeCharts = [],       // array of charts
  fetchSizeCharts = () => {},       // function to refetch from backend
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localCharts, setLocalCharts] = useState(sizeCharts);

  // Reset index when dialog opens
  useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open]);

  // Sync with prop updates
  useEffect(() => {
    setLocalCharts(sizeCharts);
  }, [sizeCharts]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : localCharts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < localCharts.length - 1 ? prev + 1 : 0));
  };

  const currentChart = localCharts[currentIndex];

  if (!currentChart) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && fetchSizeCharts) {
          fetchSizeCharts(); // refetch after closing
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl 2xl:max-w-4xl !rounded-xl">
        <DialogHeader>
          <DialogTitle>
            Measurement Table ({currentIndex + 1} / {localCharts.length})
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl shadow-xl p-4">
          <MeasurementTable
            measurements={currentChart.measurements}
            tolerance={currentChart?.tolerance || []}
            grading_rules={currentChart?.grading_rules || []}
            size_conversion={currentChart?.size_conversion || []}
            sizeChartId={currentChart.id}
            taskId={currentChart?.task_id}
            sizeChartName={currentChart?.name}
            isEditable={true}
            isAIGenerated={currentChart.generation_source === "ai_generated"}
            showDuplicateButton={false}
            showLinkProjectButton={false}
            setMeasurement={(updater) => {
              setLocalCharts((prevList) => {
                const newList = [...prevList];
                const updated =
                  typeof updater === "function"
                    ? updater(newList[currentIndex])
                    : { ...newList[currentIndex], ...updater };

                newList[currentIndex] = updated;
                return newList;
              });
            }}
            otherData={currentChart}
          />
        </div>

        <DialogFooter className="mt-4 flex justify-between w-full">
          <div className="flex gap-2">
            {localCharts.length > 1 && (
              <>
                <Button variant="outline" onClick={handlePrev}>
                  Previous
                </Button>
                <Button variant="outline" onClick={handleNext}>
                  Next
                </Button>
              </>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="dg_btn">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MultipleMeasurementTableDialog;
