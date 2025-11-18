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
import { ChevronLeft, ChevronRight, Download, Eye, FileSpreadsheet, FileText, Link2,Calendar, Clock } from "lucide-react";
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
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";

export function MeasurementsDialogViewer({
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
  }, []);


useEffect(() => {
  const fetchGalleryImageData = async (imageIds) => {
    const promises = imageIds.map(async (id) => {
      try {
        const response = await api.get(`/gallery/single/${id}`);
        return response.data.data; // Returns the full gallery image object
      } catch (error) {
        console.error(`Error fetching gallery image ${id}:`, error);
        return null;
      }
    });
    return (await Promise.all(promises)).filter(Boolean);
  };

  if (measurementsList.length > 0) {
    const {
      measurements,
      tolerance,
      grading_rules,
      size_conversion,
      id,
      results = [],
      gallery_image_ids = [],
      generation_source
    } = measurementsList[currentIndex];
    
    console.log('🔍 gallery_image_ids:', gallery_image_ids);
    
    setLocalMeasurements({ tolerance, grading_rules, size_conversion, measurements, sizeChartId: id, results, generation_source });
    
    // Fetch full gallery image objects
    if (gallery_image_ids.length > 0) {
      fetchGalleryImageData(gallery_image_ids).then(galleryImages => {
        console.log('🔍 Fetched gallery images:', galleryImages);
        setPreviewInputState({
          open: false,
          galleryImageIds: galleryImages, // Now these are full objects with url, name, etc.
          generation_source
        });
      });
    } else {
      setPreviewInputState({
        open: false,
        galleryImageIds: [],
        generation_source
      });
    }
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
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper function to get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years !== 1 ? 's' : ''} ago`;
    }
  };
  // Grab current task for header info
  const current = measurementsList[currentIndex] || {};
  const { task_id } = current;

  console.log(localMeasurements, "localMeasurements");
  
  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section - Responsive */}
        <div className="bg-gradient-to-r backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8 border border-gray-700/50 shadow-xl sm:shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                {current.name ? 'Size Chart' : "Task"}: {current.name || task_id}
              </h3>
              {/* <p className="text-xs sm:text-sm text-gray-300 mt-1 sm:mt-2 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="truncate">
                  Viewing{" "}
                  {measurementsList.length > 0
                    ? `measurement ${currentIndex + 1} of ${measurementsList.length}`
                    : "no measurements available"}
                </span>
              </p> */}
            </div>
            
            {/* Pagination Counter - Responsive */}
            <div className="flex items-center gap-2 bg-gray-800/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full self-start sm:self-auto">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">{currentIndex + 1}</span>
              <span className="text-gray-400">/</span>
              <span className="text-sm sm:text-base md:text-lg text-gray-400">{measurementsList.length}</span>
            </div>
          </div>
            {current.created_at && (
              <div className="flex flex-col mt-4 sm:flex-row sm:items-center gap-2 sm:gap-4">
                {/* Full Date/Time Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gray-800/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gray-600/50 shadow-md">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm text-gray-200 font-medium">
                    Created: {formatDate(current.created_at)}
                  </span>
                </div>

                {/* Relative Time Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-purple-600/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-purple-500/30">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-pulse-slow" />
                  <span className="text-xs sm:text-sm text-purple-300 font-medium">
                    {getRelativeTime(current.created_at)}
                  </span>
                </div>
              </div>
            )}

        </div>

        {/* Export Actions Bar - Mobile Responsive with Dropdown on small screens */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-700/50 shadow-lg sm:shadow-xl">
          {/* Desktop View */}
          <div className="hidden sm:flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={exportAsExcel}
              disabled={
                isExporting ||
                measurementsList.length === 0 ||
                Object.keys(localMeasurements.measurements || {}).length === 0
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transition-all duration-300 hover:shadow-green-500/25 text-sm sm:text-base"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {isExporting ? "Exporting..." : "Export as Excel"}
            </Button>
            <Button
              onClick={exportAsPDF}
              disabled={
                isExporting ||
                measurementsList.length === 0 ||
                Object.keys(localMeasurements.measurements || {}).length === 0
              }
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg transition-all duration-300 hover:shadow-red-500/25 text-sm sm:text-base"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {isExporting ? "Exporting..." : "Export as PDF"}
            </Button>
          </div>

          {/* Mobile View - Dropdown Menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-700/50 border-gray-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={exportAsExcel}
                  disabled={
                    isExporting ||
                    measurementsList.length === 0 ||
                    Object.keys(localMeasurements.measurements || {}).length === 0
                  }
                  className="text-white hover:bg-gray-700"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportAsPDF}
                  disabled={
                    isExporting ||
                    measurementsList.length === 0 ||
                    Object.keys(localMeasurements.measurements || {}).length === 0
                  }
                  className="text-white hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Images Gallery - Responsive Grid */}
        {localMeasurements.results?.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 border border-gray-700/50 shadow-lg sm:shadow-xl">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <BsImages className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg">Attached Images</span>
              <span className="bg-blue-600/20 text-blue-400 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {localMeasurements.results.length}
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {localMeasurements.results.map((url, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={`${url}`}
                      alt={`Generated result ${idx + 1}`}
                      className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-contain bg-gray-900/50 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black/60 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs text-white">
                    Image {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Measurement Table Container - Responsive */}
        {measurementsList.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 border border-gray-700/50 shadow-lg sm:shadow-xl overflow-x-auto">
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
           {previewInputState.galleryImageIds.length > 0 && previewInputState.galleryImageIds.map((imageData, index) => {
  const imageUrl = imageData?.url || '';
  const galleryId = imageData?._id || imageData?.id;

  console.log(`🖼️ Image ${index + 1}:`, { imageData, imageUrl, galleryId });

  return (
    <ImagePreviewDialog
      key={galleryId || index}
      imageUrl={imageUrl}
      imageData={imageData}
      galleryImageId={galleryId}
      enableHD={false}
      isSharedWithMe={false}
      onOutlineGenerated={(outlineData) => {
        console.log('Outline generated:', outlineData);
        fetchSizeCharts();
      }}
    >
      <Button
        variant={'dg_btn'}
        className="w-full sm:w-auto text-white shadow-lg transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
        title={`View Linked Image ${index + 1}`}
      >
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span>
          View Linked Image{previewInputState?.galleryImageIds?.length > 1 ? ` ${index + 1}` : ''}
        </span>
      </Button>
    </ImagePreviewDialog>
  );
})}
                  <Button
                    variant={'dg_btn'}
                    className="w-full sm:w-auto  text-sm sm:text-base"
                    onClick={() => setOpenLinkModal(true)}
                  >
                    <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
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
          </div>
        )}

        {/* Navigation and Actions Footer - Mobile Optimized */}
        <div className="bg-gray-800/40 backdrop-blur-lg rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 border border-gray-700/50 shadow-lg sm:shadow-xl">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Navigation Buttons - Full width on mobile */}
            <div className="flex gap-2 justify-between sm:gap-3 w-full">
              <Button
                variant="dg_btn"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1  text-white disabled:opacity-30 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </Button>
              <Button
                variant="dg_btn"
                onClick={handleNext}
                disabled={currentIndex >= measurementsList.length - 1}
                className="flex-1  text-white disabled:opacity-30 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </div>

            {/* Action Buttons - Stack on mobile */}
            {(projectButtonType === "EDIT" || projectButtonType === "CREATE") && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:justify-end">
                {projectButtonType === "EDIT" && (
                  <LinkUnlinkButton
                    sizeChartId={localMeasurements?.sizeChartId}
                    connectedTableIDs={sizeChartIds}
                    projectID={projectID}
                    currentTableID={localMeasurements?.sizeChartId}
                    onSuccess={onSuccess}
                    className="w-full sm:w-auto"
                  />
                )}
                {projectButtonType === "CREATE" && (
                  <AddLinkUnlinkButton
                    sizeChartIDs={sizeChartIDs}
                    setSizeChartIDs={setSizeChartIDs}
                    currentTableID={localMeasurements?.sizeChartId}
                    onSuccess={onSuccess}
                    className="w-full sm:w-auto"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {/* <InputImagePreviewDialog
          open={previewInputState.open}
          galleryImageIds={previewInputState.galleryImageIds}
          setOpen={(show) =>
            setPreviewInputState((prev) => ({ ...prev, open: show }))
          }
        /> */}

        <LinkSizeChartToImageModal
          open={openLinkModal}
          onClose={() => setOpenLinkModal(false)}
          sizeChartId={localMeasurements?.sizeChartId}
          linkedImages={previewInputState.galleryImageIds}
          onSuccess={fetchSizeCharts}
        />
      </div>
    </div>
  );
}

// export function MeasurementsDialogViewer({
//   buttonTitle = "View Generated Measurement Tables",
//   sizeChartIds = null,
//   projectID = null,
//   onSuccess = () => "",
//   projectButtonType,
//   setSizeChartIDs,
//   sizeChartIDs,
//   showLinkProjectButton = false,
//   btnClass = "",
// }) {
//   const [measurementsList, setMeasurementsList] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [openLinkModal, setOpenLinkModal] = useState(false);
//   const [loadingLink, setLoadingLink] = useState(false);  
//   const [localMeasurements, setLocalMeasurements] = useState({
//     measurements: [],
//     sizeChartId: null,
//     results: [],
//      generation_source:null
//   });
//   const [isExporting, setIsExporting] = useState(false);
//   const [previewInputState, setPreviewInputState] = useState({
//     open: false,
//     galleryImageIds: [],
//     generation_source:null
//   });

//   const fetchSizeCharts = async () => {
//     try {
//       const response = await api.get("/image-variation/getSizeChart");
//       const { data = [] } = response.data;
//       console.log(data, '*******************');
//       console.log();
      
//       setMeasurementsList(data);
//     } catch (error) {
//       console.error("Error fetching size charts:", error);
//     }
//   };


//   useEffect(() => {
//       fetchSizeCharts();
//   }, []);


//   useEffect(() => {
//     if (measurementsList.length > 0) {
//       const {
//         measurements,
//         tolerance,
//         grading_rules,
//         size_conversion,
//         id,
//         results = [],
//         // gallery_image_id,
//         gallery_image_ids = [],
//         generation_source
//       } = measurementsList[currentIndex];
//       setLocalMeasurements({ tolerance,grading_rules, size_conversion, measurements, sizeChartId: id, results, generation_source });
//       setPreviewInputState({
//         open: false,
//         // galleryImageIds: gallery_image_id ? [gallery_image_id] : [],
//         galleryImageIds: gallery_image_ids,
//         generation_source
//       });
//     }
//   }, [measurementsList, currentIndex]);

//   const handlePrev = () => {
//     setCurrentIndex((idx) => Math.max(idx - 1, 0));
//   };

//   const handleNext = () => {
//     setCurrentIndex((idx) => Math.min(idx + 1, measurementsList.length - 1));
//   };

//   // Convert image URL to base64
//   const getImageAsBase64 = async (url) => {
//     try {
//       const response = await fetch(url);
//       const blob = await response.blob();
//       return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = reject;
//         reader.readAsDataURL(blob);
//       });
//     } catch (error) {
//       console.error("Error converting image to base64:", error);
//       return null;
//     }
//   };

//   // Export as Excel with images as separate files
//   const exportAsExcel = async () => {
//     setIsExporting(true);
//     try {
//       const current = measurementsList[currentIndex] || {};
//       const { task_id, measurements = {}, results = [] } = current;

//       // Create workbook and worksheet
//       const wb = XLSX.utils.book_new();

//       // Prepare data for Excel
//       const tableData = [];
//       if (Object.keys(measurements).length > 0) {
//         // Get all size keys from all measurements
//         const allSizes = new Set();
//         Object.values(measurements).forEach((measurementSizes) => {
//           Object.keys(measurementSizes).forEach((size) => allSizes.add(size));
//         });
//         const sizeHeaders = Array.from(allSizes).sort();

//         // Create header row
//         const headers = ["Measurement", ...sizeHeaders];
//         tableData.push(headers);

//         // Add data rows for each measurement type
//         Object.entries(measurements).forEach(([measurementType, sizes]) => {
//           const row = [measurementType];
//           sizeHeaders.forEach((size) => {
//             row.push(sizes[size] || "");
//           });
//           tableData.push(row);
//         });
//       }

//       // Create worksheet
//       const ws = XLSX.utils.aoa_to_sheet(tableData);
//       XLSX.utils.book_append_sheet(wb, ws, "Size Chart");

//       // If there are images, create a zip file with Excel + images
//       if (results.length > 0) {
//         const zip = new JSZip();

//         // Add Excel file to zip
//         const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//         zip.file(`${task_id || "size-chart"}.xlsx`, excelBuffer);

//         // Add images to zip
//         for (let i = 0; i < results.length; i++) {
//           try {
//             const response = await fetch(results[i]);
//             const blob = await response.blob();
//             zip.file(`image_${i + 1}.jpg`, blob);
//           } catch (error) {
//             console.error(`Error adding image ${i + 1}:`, error);
//           }
//         }

//         // Download zip file
//         const zipBlob = await zip.generateAsync({ type: "blob" });
//         const url = URL.createObjectURL(zipBlob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `${task_id || "size-chart"}_with_images.zip`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//       } else {
//         // Download Excel file only
//         const excelBlob = new Blob(
//           [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
//           {
//             type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//           }
//         );
//         const url = URL.createObjectURL(excelBlob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `${task_id || "size-chart"}.xlsx`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//       }
//     } catch (error) {
//       console.error("Error exporting Excel:", error);
//       alert("Error exporting Excel file");
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   // Export as PDF with images and table
//   const exportAsPDF = async () => {
//     setIsExporting(true);
//     try {
//       const current = measurementsList[currentIndex] || {};
//       const { task_id, measurements = {}, results = [] } = current;

//       const pdf = new jsPDF();
//       let yPosition = 20;

//       // Add title
//       pdf.setFontSize(16);
//       pdf.text(`Size Chart - ${task_id || "Untitled"}`, 20, yPosition);
//       yPosition += 20;

//       // Add images if available
//       if (results.length > 0) {
//         pdf.setFontSize(12);
//         pdf.text("Images:", 20, yPosition);
//         yPosition += 10;

//         for (let i = 0; i < results.length; i++) {
//           try {
//             const imageBase64 = await getImageAsBase64(results[i]);
//             if (imageBase64) {
//               // Add new page if needed
//               if (yPosition > 200) {
//                 pdf.addPage();
//                 yPosition = 20;
//               }

//               pdf.addImage(imageBase64, "JPEG", 20, yPosition, 150, 100);
//               yPosition += 110;
//             }
//           } catch (error) {
//             console.error(`Error adding image ${i + 1} to PDF:`, error);
//           }
//         }
//       }

//       // Add table
//       if (Object.keys(measurements).length > 0) {
//         // Add new page if needed
//         if (yPosition > 150) {
//           pdf.addPage();
//           yPosition = 20;
//         }

//         pdf.setFontSize(12);
//         pdf.text("Measurements Table:", 20, yPosition);
//         yPosition += 10;

//         // Prepare table data
//         const allSizes = new Set();
//         Object.values(measurements).forEach((measurementSizes) => {
//           Object.keys(measurementSizes).forEach((size) => allSizes.add(size));
//         });
//         const sizeHeaders = Array.from(allSizes).sort();

//         const headers = ["Measurement", ...sizeHeaders];
//         const tableData = [];

//         Object.entries(measurements).forEach(([measurementType, sizes]) => {
//           const row = [measurementType];
//           sizeHeaders.forEach((size) => {
//             row.push(sizes[size] || "");
//           });
//           tableData.push(row);
//         });

//         // Add table using autoTable
//         autoTable(pdf, {
//           head: [headers],
//           body: tableData,
//           startY: yPosition,
//           theme: "grid",
//           styles: { fontSize: 8 },
//           headStyles: { fillColor: [41, 128, 185] },
//         });
//       }

//       // Save PDF
//       pdf.save(`${task_id || "size-chart"}.pdf`);
//     } catch (error) {
//       console.error("Error exporting PDF:", error);
//       alert("Error exporting PDF file");
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   // Grab current task for header info
//   const current = measurementsList[currentIndex] || {};
//   const { task_id } = current;

//   console.log(localMeasurements, "localMeasurements");
//  return (
//   <div className="max-w-4xl mx-auto p-6">
//     <div className="mb-6">
//       <h1 className="text-2xl font-bold text-white">
//         {current.name ? 'Name' : "Task"}: {current.name || task_id}
//       </h1>
//       <p className="text-gray-400 mt-2">
//         Viewing{" "}
//         {measurementsList.length > 0
//           ? `measurement ${currentIndex + 1} of ${measurementsList.length}`
//           : "no measurements available"}
//       </p>
//     </div>

//     {/* Export Buttons */}
//     <div className="flex gap-2 mb-4">
//       <Button
//         onClick={exportAsExcel}
//         disabled={
//           isExporting ||
//           measurementsList.length === 0 ||
//           Object.keys(localMeasurements.measurements || {}).length === 0
//         }
//         variant="dg_btn"
//         className={'text-sm'}
//       >
//         <FileSpreadsheet className="w-4 h-4" />
//         {isExporting ? "Exporting..." : "Export as Excel"}
//       </Button>
//       <Button
//         onClick={exportAsPDF}
//         disabled={
//           isExporting ||
//           measurementsList.length === 0 ||
//           Object.keys(localMeasurements.measurements || {}).length === 0
//         }
//         variant="dg_btn"
//         className={'text-sm'}
//       >
//         <FileText className="w-4 h-4" />
//         {isExporting ? "Exporting..." : "Export as PDF"}
//       </Button>
//     </div>

//     {localMeasurements.results?.length > 0 && (
//       <div className="mt-4">
//         <h3 className="text-lg font-semibold mb-2 text-white">
//           Attached Images
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {localMeasurements.results.map((url, idx) => (
//             <div key={idx} className="">
//               <img
//                 src={`${url}`}
//                 alt={`Generated result ${idx + 1}`}
//                 className="w-full object-contain object-left max-h-52"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     )}
    
//     {measurementsList.length > 0 && (
//       <MeasurementTable
//         measurements={localMeasurements?.measurements || []}
//         tolerance={localMeasurements?.tolerance || []}
//         grading_rules={localMeasurements?.grading_rules || []}
//         size_conversion={localMeasurements?.size_conversion || []}
//         sizeChartId={localMeasurements?.sizeChartId}
//         showLinkProjectButton={showLinkProjectButton}
//         taskId={current?.task_id}
//         sizeChartName={current?.name}
//         fetchSizeCharts={fetchSizeCharts}
//         showLinkProjectButton={true}
//         isAIGenerated={["ai_generated", "ai_generated_edited"].includes(localMeasurements.generation_source)}
//         customButton={
//           <div className="flex gap-2">
//             <Button
//               onClick={() => {
//                 setPreviewInputState((prev) => ({
//                   ...prev,
//                   open: true,
//                 }));
//               }}
//               disabled={previewInputState.galleryImageIds.length === 0}
//               variant="dg_btn"
//               title="Linked Image(s)"
//             >
//               <BsImages className="w-4 h-4" />
//               <span>
//                 View{" "}
//                 Linked{" "}
//                 {previewInputState?.galleryImageIds?.length > 1 ? "Images" : "Image"}
//               </span>
//             </Button>
//             <Button
//               className={"text-black"}
//               onClick={() => setOpenLinkModal(true)}
//               variant="dg_btn"
//             >
//               {loadingLink ? "Linking..." : "Link to Image"}
//             </Button>
//           </div>
//         }
//         setMeasurement={(updater) => {
//           setLocalMeasurements((prevLocal) => {
//             const newData =
//               typeof updater === "function"
//                 ? updater(prevLocal)
//                 : { ...prevLocal, ...updater };

//             setMeasurementsList((prevList) => {
//               const newList = [...prevList];
//               newList[currentIndex] = {
//                 ...newList[currentIndex],
//                 measurements: newData.measurements,
//                 results: newData.results,
//               };
//               return newList;
//             });

//             return newData;
//           });
//         }}
//         otherData={current}
//       />
//     )}

//     <InputImagePreviewDialog
//       open={previewInputState.open}
//       galleryImageIds={previewInputState.galleryImageIds}
//       setOpen={(show) =>
//         setPreviewInputState((prev) => ({ ...prev, open: show }))
//       }
//     />

//     <div className="flex flex-row justify-between w-full mt-4">
//       <Button
//         variant="outline"
//         onClick={handlePrev}
//         disabled={currentIndex === 0}
//         className={'w-fit grow md:w-auto md:grow-0'}
//       >
//         Previous
//       </Button>
//       <Button
//         variant="outline"
//         onClick={handleNext}
//         disabled={currentIndex >= measurementsList.length - 1}
//         className={'w-fit grow md:w-auto md:grow-0'}
//       >
//         Next
//       </Button>

//       {projectButtonType === "EDIT" && (
//         <LinkUnlinkButton
//           sizeChartId={localMeasurements?.sizeChartId}
//           connectedTableIDs={sizeChartIds}
//           projectID={projectID}
//           currentTableID={localMeasurements?.sizeChartId}
//           onSuccess={onSuccess}
//         />
//       )}
//       {projectButtonType === "CREATE" && (
//         <AddLinkUnlinkButton
//           sizeChartIDs={sizeChartIDs}
//           setSizeChartIDs={setSizeChartIDs}
//           currentTableID={localMeasurements?.sizeChartId}
//           onSuccess={onSuccess}
//         />
//       )}

//       <LinkSizeChartToImageModal
//         open={openLinkModal}
//         onClose={() => setOpenLinkModal(false)}
//         sizeChartId={localMeasurements?.sizeChartId}
//         linkedImages={previewInputState.galleryImageIds}
//         onSuccess={fetchSizeCharts}
//       />
//     </div>
//   </div>
// );
// }
