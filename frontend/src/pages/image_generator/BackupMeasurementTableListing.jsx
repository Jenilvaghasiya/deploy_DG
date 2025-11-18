import React, { useEffect, useState } from "react";
import { MeasurementTable } from "./MeasurementTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import api from "../../api/axios";
import LinkSizeChartToProjectModal from "@/components/LinkSizeChartToProjectModal";
import LinkUnlinkButton from "./LinkUnlinkButton";
import AddLinkUnlinkButton from "./AddLinkUnlinkButton";
import { cn } from "@/lib/utils";
const BASE_API_URL = import.meta.env.VITE_API_URL;
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import LinkSizeChartToImageModal from "./Size_chart_Gallery/LinkSizeChartToImageModal";

export function MeasurementsDialogViewer({
  measurementTableData = {},
  buttonTitle = "View Generated Measurement Tables",
  sizeChartIds = null,
  projectID = null,
  onSuccess = () => "",
  projectButtonType,
  setSizeChartIDs,
  sizeChartIDs,
  showLinkProjectButton = false,
  btnClass = "",
}) {
  const [measurementsList, setMeasurementsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [openLinkModal, setOpenLinkModal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);  
  const [localMeasurements, setLocalMeasurements] = useState({
    measurements: [],
    sizeChartId: null,
    results: [],
     generation_source:null
  });
  const [isExporting, setIsExporting] = useState(false);
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
    generation_source:null
  });

  const fetchSizeCharts = async () => {
    try {
      const response = await api.get("/image-variation/getSizeChart");
      const { data = [] } = response.data;
      console.log(data, '*******************');
      console.log();
      
      setMeasurementsList(data);
    } catch (error) {
      console.error("Error fetching size charts:", error);
    }
  };

  useEffect(() => {
    fetchSizeCharts();
  }, [measurementTableData]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchSizeCharts();
    }
  }, [isDialogOpen]);


  useEffect(() => {
    if (measurementsList.length > 0) {
      const {
        measurements,
        tolerance,
        grading_rules,
        size_conversion,
        id,
        results = [],
        // gallery_image_id,
        gallery_image_ids = [],
        generation_source
      } = measurementsList[currentIndex];
      setLocalMeasurements({ tolerance,grading_rules, size_conversion, measurements, sizeChartId: id, results, generation_source });
      setPreviewInputState({
        open: false,
        // galleryImageIds: gallery_image_id ? [gallery_image_id] : [],
        galleryImageIds: gallery_image_ids,
        generation_source
      });
    }
  }, [measurementsList, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((idx) => Math.min(idx + 1, measurementsList.length - 1));
  };

  // Convert image URL to base64
  const getImageAsBase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

  // Export as Excel with images as separate files
  const exportAsExcel = async () => {
    setIsExporting(true);
    try {
      const current = measurementsList[currentIndex] || {};
      const { task_id, measurements = {}, results = [] } = current;

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Prepare data for Excel
      const tableData = [];
      if (Object.keys(measurements).length > 0) {
        // Get all size keys from all measurements
        const allSizes = new Set();
        Object.values(measurements).forEach((measurementSizes) => {
          Object.keys(measurementSizes).forEach((size) => allSizes.add(size));
        });
        const sizeHeaders = Array.from(allSizes).sort();

        // Create header row
        const headers = ["Measurement", ...sizeHeaders];
        tableData.push(headers);

        // Add data rows for each measurement type
        Object.entries(measurements).forEach(([measurementType, sizes]) => {
          const row = [measurementType];
          sizeHeaders.forEach((size) => {
            row.push(sizes[size] || "");
          });
          tableData.push(row);
        });
      }

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      XLSX.utils.book_append_sheet(wb, ws, "Size Chart");

      // If there are images, create a zip file with Excel + images
      if (results.length > 0) {
        const zip = new JSZip();

        // Add Excel file to zip
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        zip.file(`${task_id || "size-chart"}.xlsx`, excelBuffer);

        // Add images to zip
        for (let i = 0; i < results.length; i++) {
          try {
            const response = await fetch(results[i]);
            const blob = await response.blob();
            zip.file(`image_${i + 1}.jpg`, blob);
          } catch (error) {
            console.error(`Error adding image ${i + 1}:`, error);
          }
        }

        // Download zip file
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${task_id || "size-chart"}_with_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download Excel file only
        const excelBlob = new Blob(
          [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
          {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );
        const url = URL.createObjectURL(excelBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${task_id || "size-chart"}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error exporting Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  // Export as PDF with images and table
  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const current = measurementsList[currentIndex] || {};
      const { task_id, measurements = {}, results = [] } = current;

      const pdf = new jsPDF();
      let yPosition = 20;

      // Add title
      pdf.setFontSize(16);
      pdf.text(`Size Chart - ${task_id || "Untitled"}`, 20, yPosition);
      yPosition += 20;

      // Add images if available
      if (results.length > 0) {
        pdf.setFontSize(12);
        pdf.text("Images:", 20, yPosition);
        yPosition += 10;

        for (let i = 0; i < results.length; i++) {
          try {
            const imageBase64 = await getImageAsBase64(results[i]);
            if (imageBase64) {
              // Add new page if needed
              if (yPosition > 200) {
                pdf.addPage();
                yPosition = 20;
              }

              pdf.addImage(imageBase64, "JPEG", 20, yPosition, 150, 100);
              yPosition += 110;
            }
          } catch (error) {
            console.error(`Error adding image ${i + 1} to PDF:`, error);
          }
        }
      }

      // Add table
      if (Object.keys(measurements).length > 0) {
        // Add new page if needed
        if (yPosition > 150) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.text("Measurements Table:", 20, yPosition);
        yPosition += 10;

        // Prepare table data
        const allSizes = new Set();
        Object.values(measurements).forEach((measurementSizes) => {
          Object.keys(measurementSizes).forEach((size) => allSizes.add(size));
        });
        const sizeHeaders = Array.from(allSizes).sort();

        const headers = ["Measurement", ...sizeHeaders];
        const tableData = [];

        Object.entries(measurements).forEach(([measurementType, sizes]) => {
          const row = [measurementType];
          sizeHeaders.forEach((size) => {
            row.push(sizes[size] || "");
          });
          tableData.push(row);
        });

        // Add table using autoTable
        autoTable(pdf, {
          head: [headers],
          body: tableData,
          startY: yPosition,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
        });
      }

      // Save PDF
      pdf.save(`${task_id || "size-chart"}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Error exporting PDF file");
    } finally {
      setIsExporting(false);
    }
  };

  // Grab current task for header info
  const current = measurementsList[currentIndex] || {};
  const { task_id } = current;

  console.log(localMeasurements, "localMeasurements");
  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
      <DialogTrigger
        className={cn(
          "dg-btn max-w-fit p-4 py-2 rounded-lg bg-white/25 backdrop-blur-2xl border border-solid border-gray-300 hover:border-transparent text-base text-white font-medium cursor-pointer mx-auto",
          btnClass
        )}
      >
        {buttonTitle}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto border-white/20">
        <DialogHeader>
          <DialogTitle>{current.name ?
            'Name' : "Task" }: {current.name || task_id}
          </DialogTitle>
          <DialogDescription>
            Viewing{" "}
            {measurementsList.length > 0
              ? `measurement ${currentIndex + 1} of ${measurementsList.length}`
              : "no measurements available"}
          </DialogDescription>
        </DialogHeader>

        {/* Export Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={exportAsExcel}
            disabled={
              isExporting ||
              measurementsList.length === 0 ||
              Object.keys(localMeasurements.measurements || {}).length === 0
            }
            // className="flex items-center gap-2"
            variant="dg_btn"
            className={'text-sm'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export as Excel"}
          </Button>
          <Button
            onClick={exportAsPDF}
            disabled={
              isExporting ||
              measurementsList.length === 0 ||
              Object.keys(localMeasurements.measurements || {}).length === 0
            }
            // className="flex items-center gap-2"
            variant="dg_btn"
            className={'text-sm'}
          >
            <FileText className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export as PDF"}
          </Button>

          {/* <LinkSizeChartToProjectModal /> */}
        </div>

        {localMeasurements.results?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-white">
              Attached Images
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localMeasurements.results.map((url, idx) => (
                <div key={idx} className="">
                  <img
                    src={`${url}`}
                    alt={`Generated result ${idx + 1}`}
                    className="w-full object-contain object-left max-h-52"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {measurementsList.length > 0 && (
          <MeasurementTable
            measurements={localMeasurements?.measurements || []}
            tolerance={localMeasurements?.tolerance || []}
            grading_rules={localMeasurements?.grading_rules || []}
            size_conversion={localMeasurements?.size_conversion || []}
            sizeChartId={localMeasurements?.sizeChartId}
            showLinkProjectButton={showLinkProjectButton}
            taskId={current?.task_id}
            sizeChartName={current?.name}
            fetchSizeCharts={fetchSizeCharts}
            showLinkProjectButton={true}
            isAIGenerated={["ai_generated", "ai_generated_edited"].includes(localMeasurements.generation_source)}
            customButton={
                <div className="flex gap-2">
              <Button
                onClick={() => {
                  setPreviewInputState((prev) => ({
                    ...prev,
                    open: true,
                  }));
                }}
                disabled={previewInputState.galleryImageIds.length === 0}
                variant="dg_btn"
                title="Linked Image(s)"
              >
                <BsImages className="w-4 h-4" />
                <span>
                  View{" "}
                  {/* {["ai_generated", "ai_generated_edited"].includes(previewInputState?.generation_source)
                    ? "Linked"
                    : "Input"}{" "} */}
                    Linked{" "}
                  {previewInputState?.galleryImageIds?.length > 1 ? "Images" : "Image"}
                </span>
              </Button>
              <Button
                className={"text-black"}
                onClick={() => setOpenLinkModal(true)}
                variant="dg_btn"
              >
                {loadingLink ? "Linking..." : "Link to Image"}
              </Button>
              </div>
            }
            setMeasurement={(updater) => {
              setLocalMeasurements((prevLocal) => {
                const newData =
                  typeof updater === "function"
                    ? updater(prevLocal)
                    : { ...prevLocal, ...updater };

                setMeasurementsList((prevList) => {
                  const newList = [...prevList];
                  newList[currentIndex] = {
                    ...newList[currentIndex],
                    measurements: newData.measurements,
                    results: newData.results,
                  };
                  return newList;
                });

                return newData;
              });
            }}
            otherData={current}
          />
        )}

        <InputImagePreviewDialog
          open={previewInputState.open}
          galleryImageIds={previewInputState.galleryImageIds}
          setOpen={(show) =>
            setPreviewInputState((prev) => ({ ...prev, open: show }))
          }
        />

        <DialogFooter className="flex flex-row justify-between w-full mt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={'w-fit grow md:w-auto md:grow-0'}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex >= measurementsList.length - 1}
            className={'w-fit grow md:w-auto md:grow-0'}
          >
            Next
          </Button>

          {projectButtonType === "EDIT" && (
            <LinkUnlinkButton
              sizeChartId={localMeasurements?.sizeChartId}
              connectedTableIDs={sizeChartIds}
              projectID={projectID}
              currentTableID={localMeasurements?.sizeChartId}
              onSuccess={onSuccess}
            />
          )}
          {projectButtonType === "CREATE" && (
            <AddLinkUnlinkButton
              sizeChartIDs={sizeChartIDs}
              setSizeChartIDs={setSizeChartIDs}
              currentTableID={localMeasurements?.sizeChartId}
              onSuccess={onSuccess}
            />
          )}
          {/* <LinkSizeChartToImageModal
              open={openLinkModal}
              onClose={() => setOpenLinkModal(false)}
              onSelectProject={(project) => {
                setLoadingLink(true);
                setTimeout(() => {
                  setLoadingLink(false);
                  setOpenLinkModal(false);
                }, 1000);
              }}
              linkedImages={previewInputState.galleryImageIds}
            /> */}

            <LinkSizeChartToImageModal
              open={openLinkModal}
              onClose={() => setOpenLinkModal(false)}
              sizeChartId={localMeasurements?.sizeChartId}   // pass current chart ID
              linkedImages={previewInputState.galleryImageIds}
              onSuccess={fetchSizeCharts} // refresh list after linking
            />
          <DialogClose asChild>
            <Button variant="default" className={'w-fit grow md:w-auto md:grow-0'}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
