import React, { useEffect, useState } from "react";
import api from "@/api/axios"; // your axios instance
import { SizeChartViewer } from "./SizeChartViewer";
import { Loader, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChooseSizeChart = ({ isOpen, onSelectSizeChart, viewOnly = false,selectedCharts=[] }) => {
  const [sizeCharts, setSizeCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSizeCharts();
    }
  }, [isOpen]);

  const fetchSizeCharts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/image-variation/getSizeChart");
      setSizeCharts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching size charts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChart = (chartId) => {
    setSelectedChartId(chartId);
    if (onSelectSizeChart) {
      onSelectSizeChart(chartId);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        {viewOnly ? "All Size Charts" : "Choose Size Chart"}
      </h2>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin w-6 h-6 text-zinc-400" />
        </div>
      )}

      {/* Size Chart Viewer with all charts - it handles pagination internally */}
      {!loading && sizeCharts.length > 0 && (
        <div>
          <SizeChartViewer
            measurementTableData={sizeCharts} // Pass ALL charts
            isOpen={isOpen}
            onClose={() => {}}
            sizeChartIds={selectedChartId ? [selectedChartId] : []}
            projectID={null}
            projectButtonType={null}
            setSizeChartIDs={() => {}}
            sizeChartIDs={[]}
            showLinkProjectButton={false}
            onSelectSizeChart={viewOnly ? () => {} : handleSelectChart}
            showLinkToImageButton={!viewOnly} // This might show the select button
            onActiveChartChange={setSelectedChartId}
          />
          
          {/* Custom Select Button if SizeChartViewer doesn't show one */}
          {!viewOnly && (
            <div className="mt-4 flex justify-center">
              <Button
              variant="dg_btn"
                onClick={() => {
                    handleSelectChart(selectedChartId);
                  }}
                  className={'px-6 py-2 rounded-md flex items-center gap-2 transition-colors'}
                  disabled={
                    Array.isArray(selectedCharts) &&
                    selectedCharts.includes(selectedChartId)
                  }
                  >
                  {Array.isArray(selectedCharts) && selectedCharts.includes(selectedChartId)
                    ? (
                    <>
                      <Check className="w-4 h-4" />
                      Selected
                    </>
                    )
                    : "Select Chart"}
              </Button>
            </div>
          )}
          {!loading && sizeCharts.length === 0 && (
            <p className="text-sm text-zinc-400">No size charts available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChooseSizeChart;