import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, RefreshCw } from "lucide-react";
import { MeasurementTable } from "./MeasurementTable";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";

const ImageConflictModal = ({ 
  isOpen, 
  data,
  onClose, 
  onConfirm, 
  setIsGenerating
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });
  
  const existingTasks = data?.data || [];  
  const handleConfirm = async (action) => {
    setIsGenerating(true)
    setIsProcessing(true);
    try {
      await onConfirm(action);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePrev = () => {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  };
  
  const handleNext = () => {
    setCurrentIndex((idx) => Math.min(idx + 1, existingTasks.length - 1));
  };
  
  const currentTask = existingTasks[currentIndex] || {};
  // const galleryIdsFromTask = Array.isArray(currentTask?.gallery_image_ids)
  // ? currentTask.gallery_image_ids
  // : currentTask?.gallery_image_id
  // ? [currentTask.gallery_image_id]
  // : [];

  const galleryIdsFromTask = currentTask?.gallery_image_ids || [];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-full">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <DialogTitle className="text-white text-lg font-semibold">
              Size Chart Already Exists
            </DialogTitle>
          </div>
          <DialogDescription className="text-white mt-2">
            A size chart for this image already exists. How would you like to
            proceed?
          </DialogDescription>
        </DialogHeader>
        {/* ✅ Show MeasurementTable if data exists */}
        {existingTasks.length > 0 ? (
          <div className="space-y-6">
            <div className="border border-gray-600 rounded-lg p-4 bg-black/20">
              <MeasurementTable
                measurements={currentTask.measurements}
                tolerance={currentTask?.tolerance || []}
                grading_rules={currentTask?.grading_rules || []}
                size_conversion={currentTask?.size_conversion || []}
                setMeasurement={() => {}}
                sizeChartId={currentTask.id}
                taskId={currentTask.task_id}
                sizeChartName={
                  currentTask.name || `Task ${currentTask.task_id}`
                }
                sizeChartImage={currentTask.image || null}
                isEditable={false}
                showDuplicateButton={false}
                showLinkProjectButton={false}
                customButton={
                  <Button
                    onClick={() =>
                      setPreviewInputState({
                        open: true,
                        galleryImageIds: galleryIdsFromTask,
                      })
                    }
                    disabled={galleryIdsFromTask.length === 0}
                    variant="dg_btn"
                  >
                    <BsImages className="w-4 h-4" />
                    <span>
                      View Linked{" "}
                      {galleryIdsFromTask.length > 1 ? "Images" : "Image"}
                    </span>
                  </Button>
                }
                otherData={currentTask}
              />
            </div>

            {/* Pagination Controls */}
            {existingTasks.length > 1 && (
              <div className="flex justify-between mt-2">
                <Button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  variant="outline"
                  className={'w-fit'}
                >
                  Previous
                </Button>
                <span className="text-gray-400">
                  {currentIndex + 1} of {existingTasks.length}
                </span>
                <Button
                  onClick={handleNext}
                  disabled={currentIndex >= existingTasks.length - 1}
                  variant="outline"
                  className={'w-fit'}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No measurement data available for this chart.
          </p>
        )}

        <div className="py-5 space-y-4">
          <button
            onClick={() => handleConfirm("keepCopy")}
            disabled={isProcessing}
            className="w-full flex items-start gap-3 p-4 bg-blue-500/20 rounded-lg border border-blue-400 shadow hover:border-blue-500 hover:shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h4 className="text-white font-semibold mb-1 flex items-center">
                Keep Copy
                {isProcessing && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                )}
              </h4>
              <p className="text-sm text-blue-100">
                Save as a new version alongside the existing charts.
              </p>
              <p className="text-xs text-blue-200 mt-1">
                This keeps both the old and the new size charts.
              </p>
            </div>
          </button>

          <button
            onClick={() => handleConfirm("replace")}
            disabled={isProcessing}
            className="w-full flex items-start gap-3 p-4 bg-red-500/20 rounded-lg border border-red-400 shadow hover:border-red-500 hover:shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h4 className="text-white font-semibold mb-1 flex items-center">
                Replace
                {isProcessing && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                )}
              </h4>
              <p className="text-sm text-red-100">
                Replace the existing size chart with the new one.
              </p>
              <p className="text-xs text-red-200 mt-1">
                This will remove the existing chart and unlink it from linked
                projects.
              </p>
            </div>
          </button>
        </div>
        <InputImagePreviewDialog
          open={previewInputState.open}
          galleryImageIds={previewInputState.galleryImageIds}
          setOpen={(show) =>
            setPreviewInputState((prev) => ({ ...prev, open: show }))
          }
        />
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
          <Button
            onClick={onClose}
            disabled={isProcessing}
            variant={"dg_btn"}
            className={"bg-gray-600"}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageConflictModal;