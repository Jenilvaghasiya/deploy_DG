import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Save, X, Upload, Image as ImageIcon, Link, Copy, View, Sparkles, ChevronDown, MoreVertical, Share2 } from "lucide-react";
import api from "../../api/axios";
import LinkSizeChartToProjectModal from "@/components/LinkSizeChartToProjectModal";
import SelectImageFromGalleryModal from "@/components/SelectImageFromGalleryModal";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LinkSizeChartToImageModal from "./Size_chart_Gallery/LinkSizeChartToImageModal";
import SaveAsTemplateDialog from "@/components/SaveAsTemplateDialog";
import TablePreviewWrapper from "./SizeChartDropdown";
import CreateSizeChartDialog from "./CreateSizeChartDialog";
import ShareModal from "@/components/Common/ShareModal";

const BASE_API_URL = import.meta.env.VITE_API_URL;

export function MeasurementTable({
  measurements,
  tolerance,
  grading_rules,
  size_conversion,
  setMeasurement,
  sizeChartId,
  taskId,
  sizeChartName,
  sizeChartImage,
  isEditable = true,
  showDuplicateButton = true,
  customButton = null,
  isAIGenerated = false,
  fetchSizeCharts = () => "",
  otherData={},
  showSaveAsTemplate = true,
  tableTitle = "Size Chart Preview",
  showSelectButton = true,
  isSharedWithOthers = false,
  isSharedWithMe = false,
  sharingpermissions = []
}) {    
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingMeasurements, setEditingMeasurements] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [newMeasurementPoint, setNewMeasurementPoint] = useState("");
  const [newSizeChartName, setNewSizeChartName] = useState(null);
  const [newSize, setNewSize] = useState("");
  const cellRefs = useRef({});
  const [outlineFile, setOutlineFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState("measurement");

  useEffect(() => {
   if (isModalOpen && measurements) {
    try {
      setEditingMeasurements(JSON.parse(JSON.stringify(measurements)));
    } catch (error) {
      console.error('Failed to parse measurements:', measurements, error);
    }
  }

  }, [isModalOpen, measurements]);

const noData =
  (!measurements || Object.keys(measurements).length === 0) &&
  (!grading_rules || Object.keys(grading_rules).length === 0) &&
  (!tolerance || Object.keys(tolerance).length === 0) &&
  (!size_conversion || Object.keys(size_conversion).length === 0);

if (noData) {
  return <p>No size chart data available.</p>;
}

  const allSizes = Array.from(
    new Set(
      Object.values(measurements).flatMap((sizeObj) => Object.keys(sizeObj))
    )
  );

  const allEditingSizes = Array.from(
    new Set(
      Object.values(editingMeasurements).flatMap((sizeObj) => Object.keys(sizeObj))
    )
  );

  const handleDuplicateTableForImages = async (selectedGalleryImages) => {
  try {
    const selectedGalleryImagesIDs =
      selectedGalleryImages?.length > 0
        ? selectedGalleryImages.map((image) => image.id)
        : [];

    // 1️⃣ Copy the size chart for selected images
    const response = await api.post("/image-variation/copy-size-chart", {
      size_chart_id: sizeChartId,
      gallery_image_ids: selectedGalleryImagesIDs,
    });

    console.log(response.status, "status");

    if (response.status === 201) {
      // 2️⃣ Extract the duplicated chart info if returned by backend
      const duplicatedCharts = response.data?.data || [];

      // 3️⃣ Link each duplicated chart as an asset
      for (const chart of duplicatedCharts) {
        await api.post("gallery/tree/link", {
          assetId: chart.id,                // duplicated size chart id
          assetType: "sizechart",           // type
          assetName: chart.name || "Size Chart", // name (fallback)
          parentId: chart.parentId || null, // optional
          rootId: chart.rootId || null,     // optional
        });
      }

      // 4️⃣ Refresh and notify
      fetchSizeCharts();
      toast.success("Size chart duplicated and linked successfully!");
    } else {
      toast.error("Something went wrong");
    }
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.message || "Error duplicating chart");
  }
};


  const tableLabels = {
  measurement: "Size Measurement",
  tolerance: "Tolerance",
  grading: "Grading Rules",
  international: "International Size Conversion"
};


  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setStatusMessage({
          type: "error",
          text: "Only JPEG, JPG, and PNG files are allowed!"
        });
        setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({
          type: "error",
          text: "File size must be less than 5MB!"
        });
        setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
        return;
      }

      setOutlineFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setOutlineFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate thumbnail preview
const renderThumbnail = () => (
  <div className="border border-black/25 rounded-lg p-3 sm:p-4 md:p-5 bg-black/25 text-white max-w-full grow overflow-hidden">
    {/* Header Section - Responsive */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
      {/* Title and AI Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
        <span className="text-sm sm:text-base font-medium sm:font-semibold truncate">
          {tableTitle}
        </span>
        {isAIGenerated && (
          <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs font-medium bg-purple-600 text-purple-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-purple-600 shadow-sm tracking-wide uppercase">
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-200 animate-pulse-slow" />
            <span className="font-semibold">AI Generated</span>
          </span>
        )}
      </div>

      {/* Dropdown Menu - Responsive */}
      {showSelectButton && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="dg_btn" 
              className="w-full sm:w-auto sm:ml-auto text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <span className="truncate max-w-[120px] sm:max-w-none">
                {tableLabels[selectedTable] || "Choose Table"}
              </span>
              <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 sm:w-56 bg-white/90 backdrop-blur-sm">
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setSelectedTable("measurement")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              Size Measurement
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSelectedTable("tolerance")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              Tolerance
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSelectedTable("grading")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              Grading Rules
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSelectedTable("international")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              International Size Conversion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>

    {/* Table Preview - Responsive with horizontal scroll on mobile */}
    <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-5 px-3 sm:px-4 md:px-5">
      <div className="min-w-[280px]">
        <TablePreviewWrapper
          measurements={measurements}
          tolerance={tolerance}
          grading_rules={grading_rules}
          size_conversion={size_conversion}
          otherData={otherData}
          allSizes={allSizes}
          isAIGenerated={isAIGenerated}
          selectedTable={selectedTable}
        />
      </div>
    </div>

    {/* Action Buttons - Responsive Grid */}
    <div className="mt-3 sm:mt-4">
      {/* Mobile: Stack buttons vertically or 2-column grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5 sm:justify-center">
        
        {/* Edit Button */}
        {(isEditable || sharingpermissions.edit === true) && (
          <Button
            variant="dg_btn"
            onClick={() => {
              setIsModalOpen(true);
              setTimeout(() => setEditingCell({ 
                point: Object.keys(measurements)[0], 
                size: allSizes[0] 
              }), 100);
            }}
            className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
          >
            <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">View/Edit/Rename</span>
          </Button>
        )}

        {/* Custom Button */}
        {customButton && (
          <div className="w-full sm:w-auto">
            {React.cloneElement(customButton, {
              className: cn(
                customButton.props.className,
                "w-full sm:w-auto text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
              )
            })}
          </div>
        )}

        {/* Duplicate Button */}
        {showDuplicateButton && (
          <div className="w-full sm:w-auto">
            <SelectImageFromGalleryModal 
              onImagesSelected={(input) => handleDuplicateTableForImages(input)} 
              buttonText={
                <>
                  <span className="hidden xs:inline">Duplicate Chart</span>
                  <span className="xs:hidden">Duplicate</span>
                </>
              }
              icon={<Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              buttonClassName="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
            />
          </div>
        )}

        {/* Save As Template & Share - Only on larger screens or in dropdown on mobile */}
        {showSaveAsTemplate && !isSharedWithMe && (
          <>
            {/* Desktop: Show both buttons */}
            <div className="hidden sm:flex sm:gap-2.5">
              <Button
                variant="dg_btn"
                onClick={() => setShowTemplateDialog(true)}
                className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
              >
                <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span>Save As Template</span>
              </Button>
              <ShareModal 
                resourceType={'SizeChart'} 
                resourceId={sizeChartId}
                buttonClassName="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
              />
            </div>

            {/* Mobile: Dropdown for Save/Share */}
            <div className="sm:hidden col-span-1 xs:col-span-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="dg_btn" 
                    className="w-full text-xs px-2 py-2 min-h-[36px]"
                  >
                    <MoreVertical className="w-3 h-3 mr-1" />
                    More Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white/90 backdrop-blur-sm">
                  <DropdownMenuItem 
                    onClick={() => setShowTemplateDialog(true)}
                    className="text-xs py-2"
                  >
                    <Save className="w-3 h-3 mr-2" />
                    Save As Template
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {/* Handle share */}}
                    className="text-xs py-2"
                  >
                    <Share2 className="w-3 h-3 mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

  const handleCellEdit = (point, size, value) => {
    setEditingMeasurements(prev => ({
      ...prev,
      [point]: {
        ...prev[point],
        [size]: value === "" ? "" : Number(value),
      },
    }));
  };

  const handleKeyDown = (e, point, size) => {
    const points = Object.keys(editingMeasurements);
    const sizes = allEditingSizes;
    const currentPointIndex = points.indexOf(point);
    const currentSizeIndex = sizes.indexOf(size);

    let newPoint = point;
    let newSize = size;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Move left
          if (currentSizeIndex > 0) {
            newSize = sizes[currentSizeIndex - 1];
          } else if (currentPointIndex > 0) {
            newPoint = points[currentPointIndex - 1];
            newSize = sizes[sizes.length - 1];
          }
        } else {
          // Move right
          if (currentSizeIndex < sizes.length - 1) {
            newSize = sizes[currentSizeIndex + 1];
          } else if (currentPointIndex < points.length - 1) {
            newPoint = points[currentPointIndex + 1];
            newSize = sizes[0];
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentPointIndex > 0) {
          newPoint = points[currentPointIndex - 1];
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentPointIndex < points.length - 1) {
          newPoint = points[currentPointIndex + 1];
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentSizeIndex > 0) {
          newSize = sizes[currentSizeIndex - 1];
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentSizeIndex < sizes.length - 1) {
          newSize = sizes[currentSizeIndex + 1];
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (currentPointIndex < points.length - 1) {
          newPoint = points[currentPointIndex + 1];
        }
        break;
      case 'Escape':
        setEditingCell(null);
        return;
      default:
        return;
    }

    if (newPoint !== point || newSize !== size) {
      setEditingCell({ point: newPoint, size: newSize });
      setTimeout(() => {
        const cellKey = `${newPoint}-${newSize}`;
        cellRefs.current[cellKey]?.focus();
      }, 0);
    }
  };

  const addMeasurementPoint = () => {
    if (!newMeasurementPoint.trim()) return;
    
    const newPoint = newMeasurementPoint.toLowerCase().replace(/\s+/g, '_');
    if (editingMeasurements[newPoint]) {
      alert('Measurement point already exists!');
      return;
    }

    const newPointData = {};
    allEditingSizes.forEach(size => {
      newPointData[size] = "";
    });

    setEditingMeasurements(prev => ({
      ...prev,
      [newPoint]: newPointData
    }));
    setNewMeasurementPoint("");
  };

  const addSize = () => {
    if (!newSize.trim()) return;
    
    if (allEditingSizes.includes(newSize)) {
      alert('Size already exists!');
      return;
    }

    setEditingMeasurements(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(point => {
        updated[point] = { ...updated[point], [newSize]: "" };
      });
      return updated;
    });
    setNewSize("");
  };

  const removeMeasurementPoint = (pointToRemove) => {
    setEditingMeasurements(prev => {
      const updated = { ...prev };
      delete updated[pointToRemove];
      return updated;
    });
  };

  const removeSize = (sizeToRemove) => {
    setEditingMeasurements(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(point => {
        delete updated[point][sizeToRemove];
      });
      return updated;
    });
  };

  const handleSaveAll = async () => {
    try {
      const formData = new FormData();
      
      // Add measurements and sizeChartId
      formData.append('measurements', JSON.stringify(editingMeasurements));
      formData.append('sizeChartId', sizeChartId);
      if (newSizeChartName?.trim()) {
        formData.append("name", newSizeChartName.trim());
      }
      // Add image if selected
      if (outlineFile) {
        formData.append('image', outlineFile);
      }
      
      const response = await api.post("/image-variation/updateSizeChart", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        const updatedResults = response.data?.data?.results || [];

        setMeasurement((prev) => ({
          ...prev,
          measurements: editingMeasurements,
          results: updatedResults,
        }));

        setStatusMessage({
          type: "success",
          text: "Changes saved successfully!",
        });

        // Reset image selection
        setOutlineFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setTimeout(() => {
          setStatusMessage({ type: "", text: "" });
          setIsModalOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving measurements:", error);
      setStatusMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to save changes!" 
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <>
      {renderThumbnail()}
      
      <CreateSizeChartDialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={{
          measurements,
          grading_rules,
          tolerance,
          size_conversion,
          market: otherData?.market || "",
          unit: otherData?.unit || "",
          name: sizeChartName || "",
        }}
        isEdit={true}
        onSuccess={fetchSizeCharts}
        sizeChartId={sizeChartId}
        isSharedWithMe={isSharedWithMe}
        sharingpermissions={sharingpermissions}
      />

      <SaveAsTemplateDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        sizeChartId={sizeChartId}
        onSuccess={(template) => {
          console.log("Template created:", template);
        }}
      />
    </>
  );
}
