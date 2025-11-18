import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { MeasurementTable } from "@/pages/image_generator/MeasurementTable";
import { Button } from "../ui/button";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "../InputImagePreviewDialog";

const SizeChartSharingManager = ({
  viewOnly = false,
  isSharedWithMe = false,
  isSharedWithOthers = false,
}) => {
  const [sizeCharts, setSizeCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
    generation_source: "",
  });
console.log(isSharedWithOthers, 'isSharedWithOthers');

  // ✅ fetch charts
  const fetchSizeCharts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/image-variation/getSizeChart", {
        params: {
          ...(isSharedWithMe ? { isSharedWithMe: true } : {}),
          ...(isSharedWithOthers ? { isSharedWithOthers: true } : {}),
        },
      });
      const charts = res.data.data || [];
      setSizeCharts(charts);
      setCurrentIndex(0); // reset to first chart
    } catch (err) {
      console.error("Error fetching size charts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizeCharts();
  }, []);

  // ✅ keep previewInputState in sync with selected chart
  useEffect(() => {
    if (sizeCharts.length > 0) {
      const selected = sizeCharts[currentIndex];
      setPreviewInputState({
        open: false,
        galleryImageIds: selected?.gallery_image_ids || [],
        generation_source: selected?.generation_source || "",
      });
    }
  }, [sizeCharts, currentIndex]);

  const handleSetMeasurement = (updatedData) => {
    setSizeCharts((prevCharts) => {
      const updatedCharts = [...prevCharts];
      if (updatedCharts[currentIndex]) {
        updatedCharts[currentIndex] = {
          ...updatedCharts[currentIndex],
          ...updatedData,
        };
      }
      return updatedCharts;
    });
  };

  const handlePrevious = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () =>
    setCurrentIndex((prev) =>
      prev < sizeCharts.length - 1 ? prev + 1 : prev
    );

  if (loading) return <p>Loading size charts...</p>;
  if (!sizeCharts.length) return <p>No size charts available.</p>;

  const selectedChart = sizeCharts[currentIndex];

  return (
    <div className="space-y-4">
      <MeasurementTable
        measurements={selectedChart.measurements}
        grading_rules={selectedChart.grading_rules}
        tolerance={selectedChart.tolerance}
        size_conversion={selectedChart.size_conversion}
        setMeasurement={handleSetMeasurement}
        sizeChartId={selectedChart._id || selectedChart.id}
        sizeChartName={selectedChart.name}
        sizeChartImage={selectedChart.image}
        isEditable={true} // ✅ now permission-based
        showDuplicateButton={isSharedWithOthers ? true : false}
        isAIGenerated={["ai_generated", "ai_generated_edited"].includes(
            selectedChart.generation_source
        )}
        showSaveAsTemplate={true}
        fetchSizeCharts={fetchSizeCharts}
        isSharedWithMe={isSharedWithMe}
        isSharedWithOthers={isSharedWithOthers}
        sharingpermissions={selectedChart.permissions}
        customButton={
          <div className="flex gap-2">
            <Button
              onClick={() =>
                setPreviewInputState((prev) => ({
                  ...prev,
                  open: true,
                }))
              }
              disabled={!selectedChart?.gallery_image_ids?.length}
              variant="dg_btn"
              title="Input Image(s)"
            >
              <BsImages className="w-4 h-4" />
              <span>
                View{" "}
                {["ai_generated", "ai_generated_edited"].includes(
                  selectedChart?.generation_source
                )
                  ? "Input"
                  : "Linked"}{" "}
                {selectedChart?.gallery_image_ids?.length > 1
                  ? "Images"
                  : "Image"}
              </span>
            </Button>
          </div>
        }
      />

      {/* Pagination Controls */}
      <div className="flex justify-between mt-4">
        <Button onClick={handlePrevious} disabled={currentIndex === 0}>
          Previous
        </Button>
        <span>
          {currentIndex + 1} / {sizeCharts.length}
        </span>
        <Button
          onClick={handleNext}
          disabled={currentIndex === sizeCharts.length - 1}
        >
          Next
        </Button>
      </div>
      <InputImagePreviewDialog
              open={previewInputState.open}
              galleryImageIds={previewInputState.galleryImageIds}
              setOpen={(show) =>
                setPreviewInputState((prev) => ({ ...prev, open: show }))
              }
              isSharedWithMe={isSharedWithMe}
            />
    </div>
  );
};

export default SizeChartSharingManager;
