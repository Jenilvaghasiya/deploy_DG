import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import LinkUnlinkButton from "@/pages/image_generator/LinkUnlinkButton";
import { MeasurementTable } from "@/pages/image_generator/MeasurementTable";
import api from "@/api/axios";
import AddLinkUnlinkButton from "@/pages/image_generator/AddLinkUnlinkButton";

export function SizeChartViewer({
  measurementTableData = [], // 🔹 now comes from parent
  sizeChartIds = null,
  projectID = null,
  onSuccess = () => "",
  onSelectSizeChart = () => {},
  projectButtonType,
  setSizeChartIDs,
  sizeChartIDs,
  showLinkProjectButton = false,
  customButton = null,
  showLinkToImageButton = false,
  isOpen = false,
  onClose = () => {},
  showMultipleSelection = false,
  selectedCharts = [],
  onActiveChartChange = () => {},
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingLink, setLoadingLink] = useState(false);
  const [localMeasurements, setLocalMeasurements] = useState({
    measurements: [],
    sizeChartId: null,
    results: [],
    generation_source: null,
  });
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
    generation_source: null,
  });

  useEffect(() => {
    // Update local measurements whenever index or parent data changes
    if (measurementTableData.length > 0) {
      const {
        measurements,
        id,
        tolerance,
        grading_rules,
        size_conversion,
        results = [],
        // gallery_image_id,
        gallery_image_ids,
        generation_source,
      } = measurementTableData[currentIndex] || {};
      setLocalMeasurements({
        measurements,
        tolerance,
        grading_rules, 
        size_conversion,
        sizeChartId: id,
        results,
        generation_source,
      });
      setPreviewInputState({
        open: false,
        galleryImageIds: gallery_image_ids,
        generation_source,
      });

      if (onActiveChartChange && id) {
        onActiveChartChange(id);
      }
    }
  }, [measurementTableData, currentIndex, onActiveChartChange]);

  const handlePrev = () => setCurrentIndex((idx) => Math.max(idx - 1, 0));
  const handleNext = () =>
    setCurrentIndex((idx) => Math.min(idx + 1, measurementTableData.length - 1));

  if (!isOpen) return null;

  const current = measurementTableData[currentIndex] || {};

  return (
    <div className="sm:max-w-4xl max-h-[80vh] overflow-y-auto border border-white/20 p-4 rounded-lg bg-zinc-900">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">
          {current.name ? "Name" : "Task"}: {current.name || current.task_id}
        </h2>
        <p className="text-sm text-zinc-400">
          Viewing{" "}
          {measurementTableData.length > 0
            ? `measurement ${currentIndex + 1} of ${measurementTableData.length}`
            : "no measurements available"}
        </p>
      </div>

      {localMeasurements.results?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-white">Attached Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localMeasurements.results.map((url, idx) => (
              <div key={idx}>
                <img
                  src={url}
                  alt={`Generated result ${idx + 1}`}
                  className="w-full object-contain max-h-52 rounded border border-zinc-700"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {measurementTableData.length > 0 && (
        <MeasurementTable
          measurements={localMeasurements.measurements || []}
          tolerance={localMeasurements?.tolerance || []}
          grading_rules={localMeasurements?.grading_rules || []}
          size_conversion={localMeasurements?.size_conversion || []}
          sizeChartId={localMeasurements.sizeChartId}
          taskId={current?.task_id}
          sizeChartName={current?.name}
          showDuplicateButton={false}
          showLinkProjectButton={false}
          showLinkToImageButton={false}
          isEditable={false}
          isAIGenerated={["ai_generated", "ai_generated_edited"].includes(
            localMeasurements.generation_source
          )}
          customButton={
            <div className="flex gap-2">
              <Button
                onClick={() => setPreviewInputState((prev) => ({ ...prev, open: true }))}
                disabled={previewInputState.galleryImageIds.length === 0}
                variant="dg_btn"
                title="Input Image(s)"
              >
                <BsImages className="w-4 h-4" />
                <span>
                  View{" "}
                  {["ai_generated", "ai_generated_edited"].includes(
                    previewInputState?.generation_source
                  )
                    ? "Input"
                    : "Linked"}{" "}
                  {previewInputState?.galleryImageIds?.length > 1
                    ? "Images"
                    : "Image"}
                </span>
              </Button>
            </div>
          }
          setMeasurement={(updater) => {
            const newData =
              typeof updater === "function"
                ? updater(localMeasurements)
                : { ...localMeasurements, ...updater };
            setLocalMeasurements(newData);
          }}
        />
      )}

      <InputImagePreviewDialog
        open={previewInputState.open}
        galleryImageIds={previewInputState.galleryImageIds}
        setOpen={(show) =>
          setPreviewInputState((prev) => ({ ...prev, open: show }))
        }
      />

      <div className="flex flex-row justify-between w-full mt-4 gap-2">
        <Button
          className={"text-black"}
          variant="dg_btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        {showMultipleSelection && (
          <Button
            onClick={() => onSelectSizeChart(measurementTableData[currentIndex]?.id)}
            variant="dg_btn"
          >
            {selectedCharts.includes(measurementTableData[currentIndex]?.id)
              ? "Selected"
              : "Select"}
          </Button>
        )}
        <Button
          className={"text-black"}
          variant="dg_btn"
          onClick={handleNext}
          disabled={currentIndex >= measurementTableData.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

