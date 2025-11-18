import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import placeholderImage from "../../../assets/images/placeholder.svg";
import { SelectImageTabs } from "../../../components/SelectImageTabs";
import { multipartRequest } from "../../../api/axios";
import { useAuthStore } from "../../../store/authStore";
import useSocket from "../../../hooks/useSocket";
import { updateGeneratedImageStatus } from "../../../features/imageGeneration/imageGeneration";
import { hasPermission } from "../../../lib/utils";
import WhileYouWereAway from "../WhileYouWereAway";
import { loadImageFromLocalStorage } from "../../../utils/imageService";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import SmartImage from "@/components/SmartImage";
import { markTaskAsSeen } from "@/features/auth/authService";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "../GeneratedImageContainer";
import {
  FaUpload,
  FaImage,
  FaTshirt,
  FaLayerGroup,
  FaFileExport,
  FaRuler,
  FaArrowsAlt,
  FaPlus,
  FaMapPin,
  FaStickyNote,
  FaRocket,
  FaChevronRight,
  FaCut,
  FaBrain,
  FaAward,
  FaCog,
  FaShapes,
  FaMagic,
} from "react-icons/fa";
import PatternCutoutDisplay from "@/components/PatternCutoutDisplay";

const validationSchema = Yup.object({
  garmentImage: Yup.mixed().required("Please upload a garment image"),
  garmentType: Yup.string().required("Please select a garment type"),
  extractionMode: Yup.string().required("Please select extraction precision"),
  outputFormat: Yup.string().required("Please select output format"),
  desiredPieceCount: Yup.number()
    .min(4)
    .max(10)
    .required("Desired piece count is required"),
  notes: Yup.string().optional(),
});

export default function PatternCutouts() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [generatedPatterns, setGeneratedPatterns] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFeedback, setImageFeedback] = useState({});
  const taskIdRef = useRef(null);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const { fetchCredits } = useCredits();
  const hasFinaliseImagePermission = hasPermission(
    permissionKeys,
    "ai-design-lab:pattern-cutouts:view"
  );
  const [taskStatus, setTaskStatus] = useState(null);
  const isTaskQueued = isProcessing || taskStatus === "queued";
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });
  const [imageStatuses, setImageStatuses] = useState({});
  const containerRef = useRef(null);

  // Function to scroll to bottom smoothly
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };


  console.log(generatedPatterns,'generatedPatternsgeneratedPatterns')

  // Real-time socket listener
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("task_update", handleTaskUpdate);

    handleUsageTimeStart({ socket, module: "pattern_cutout" });
    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    console.log("pattern-cutout:->", data);
    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids?.length > 0 ? data?.gallery_image_ids : [],
        });
        setGeneratedPatterns(data.result);
        setIsProcessing(false);
        setAiTaskId(data.aiTaskId);
        markTaskAsSeen(data.task_id);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "pattern_cutout" });
      } else if (data.status === "failed") {
        toast.error("Pattern extraction failed. Please try again.");
        setIsProcessing(false);
      }
    }
  };

  console.log(generatedPatterns,'generatedPatternsgeneratedPatternsgeneratedPatterns')

  const handleImageStatusUpdate = async ({ aiTaskId, newStatus, imageUrl }) => {
    try {
      const response = await updateGeneratedImageStatus({
        aiTaskId,
        newStatus,
        imageUrl,
      });
      if (response.status === 200) {
        setUpdatedImageUrls((prev) => new Set(prev).add(imageUrl));
        setImageStatuses((prev) => ({ ...prev, [imageUrl]: newStatus }));
        fetchCredits();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
      console.error("Failed to update image status:", error);
    }
  };

  const initialValues = {
    garmentImage: null,
    garmentType: "auto",
    extractionMode: "basic",
    outputFormat: "png",
    includeMeasurements: true,
    includeGrainlines: false,
    includeSeamAllowance: true,
    includeNotches: false,
    desiredPieceCount: 4,
    notes: "",
    galleryImageId: null,
    generatedImageUrl: null,
  };

  const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFieldValue("garmentImage", file);

      // Save meta depending on tab
      if (extraMeta.galleryImageId) {
        setFieldValue("galleryImageId", extraMeta.galleryImageId);
      } else {
        setFieldValue("galleryImageId", null);
      }

      if (extraMeta.generatedImageUrl) {
        setFieldValue("generatedImageUrl", extraMeta.generatedImageUrl);
      } else {
        setFieldValue("generatedImageUrl", null);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("use_case", "pattern_cutouts");
      formData.append("image", values.garmentImage);
      formData.append("garment_type", values.garmentType);
      formData.append("extraction_mode", values.extractionMode);
      formData.append("output_format", values.outputFormat);
      formData.append("include_measurements", values.includeMeasurements);
      formData.append("include_grainlines", values.includeGrainlines);
      formData.append("include_seam_allowance", values.includeSeamAllowance);
      formData.append("include_notches", values.includeNotches);
      formData.append("desired_piece_count", values.desiredPieceCount);
      formData.append("notes", values.notes || "");
      formData.append("async", "true");
      formData.append("engine", "auto");
      formData.append("remove_background", "true");
      formData.append("extract_pattern", "true");
      formData.append("pattern_type", "dress");
      formData.append("colors", "pdf");

      if (values.galleryImageId) {
        formData.append("galleryImageId", values.galleryImageId);
      }
      if (values.generatedImageUrl) {
        formData.append("generatedImageUrl", values.generatedImageUrl);
      }

      const response = await multipartRequest.post(
        "/image-variation/pattern_cutout/create",
        formData
      );
      const { task_id } = response.data.data;
      taskIdRef.current = task_id;

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error("Error submitting task:", err?.response?.data?.message);
      toast.error(err?.response?.data?.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  // Effect to scroll when patterns are generated
  useEffect(() => {
    if (generatedPatterns) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [generatedPatterns]);

  return (
    <div className="h-full grow flex flex-col relative">
      <div
        ref={containerRef}
        className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll"
      >
        <div className="p-4 lg:p-5 2xl:px-8">
          <WhileYouWereAway
            task_type="pattern_cutout"
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            setTaskStatus={setTaskStatus}
            imageStatuses={imageStatuses}
          />
          {/* <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">
            Pattern Cutouts
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            AI-Powered Async Fashion Design Revolution
          </p> */}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => {
              useEffect(() => {
                loadImageFromLocalStorage(
                  "pattern-cutout",
                  setPreviewImage,
                  setFieldValue
                );
              }, []);

              return (
                <>
                  <SelectImageTabs
                    handleImageUpload={handleImageUpload}
                    setFieldValue={setFieldValue}
                  />
                  <InputImagePreviewDialog
                    open={previewInputState.open}
                    galleryImageIds={previewInputState.galleryImageIds}
                    setOpen={(show) =>
                      setPreviewInputState((prev) => ({ ...prev, open: show }))
                    }
                  />

                  <Form className="space-y-4">
                    {/* Upload Section */}
                    <div className="space-y-3">
                      {/* Preview */}
                      <div className="space-y-1">
                        <label className="text-sm md:text-base text-white flex items-center gap-2">
                          Preview:
                        </label>
                        <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                          <SmartImage
                            src={previewImage || placeholderImage}
                            alt="Garment preview"
                            width={600}
                            height={300}
                            className="w-full h-72 object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pattern Extraction Settings */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <FaCog className="w-4 h-4 text-yellow-400" />
                        Pattern Extraction Settings
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Garment Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white flex items-center gap-2">
                            <FaTshirt className="w-3 h-3" />
                            Garment Type
                          </label>
                          <Select
                            value={values.garmentType}
                            onValueChange={(value) =>
                              setFieldValue("garmentType", value)
                            }
                          >
                            <SelectTrigger className="w-full text-white border bg-black/15">
                              <SelectValue placeholder="Auto-detect" />
                            </SelectTrigger>
                            <SelectContent className="bg-black text-white border">
                              <SelectItem value="auto">
                                🔍 Auto-detect (Recommended)
                              </SelectItem>
                              <SelectItem value="dress">👗 Dress</SelectItem>
                              <SelectItem value="top">
                                👕 Top/Shirt/Blouse
                              </SelectItem>
                              <SelectItem value="jacket">
                                🧥 Jacket/Coat
                              </SelectItem>
                              <SelectItem value="pants">
                                👖 Pants/Trousers
                              </SelectItem>
                              <SelectItem value="skirt">👗 Skirt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Extraction Mode */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white flex items-center gap-2">
                            <FaLayerGroup className="w-3 h-3" />
                            Extraction Precision
                          </label>
                          <Select
                            value={values.extractionMode}
                            onValueChange={(value) =>
                              setFieldValue("extractionMode", value)
                            }
                          >
                            <SelectTrigger className="w-full text-white border bg-black/15">
                              <SelectValue placeholder="Basic" />
                            </SelectTrigger>
                            <SelectContent className="bg-black text-white border">
                              <SelectItem value="basic">
                                🎯 Basic - Essential Components
                              </SelectItem>
                              <SelectItem value="detailed">
                                🔬 Detailed - Include Linings & Details
                              </SelectItem>
                              <SelectItem value="construction">
                                🏭 Construction - Seam Allowances & Notches
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Output Format */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white flex items-center gap-2">
                            <FaFileExport className="w-3 h-3" />
                            Output Format
                          </label>
                          <Select
                            value={values.outputFormat}
                            onValueChange={(value) =>
                              setFieldValue("outputFormat", value)
                            }
                          >
                            <SelectTrigger className="w-full text-white border bg-black/15">
                              <SelectValue placeholder="PNG" />
                            </SelectTrigger>
                            <SelectContent className="bg-black text-white border">
                              <SelectItem value="png">
                                🖼️ High-Resolution PNG Images
                              </SelectItem>
                              <SelectItem value="pdf">
                                📄 Professional PDF Pattern Sheets
                              </SelectItem>
                              <SelectItem value="svg">
                                ⚡ Scalable SVG Vector Files
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Show Advanced Options Button */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowAdvancedOptions(!showAdvancedOptions)
                        }
                        className="flex items-center space-x-2 text-black hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] hover:text-white border-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Show Professional Options</span>
                      </Button>
                    </div>

                    {/* Professional Options (conditionally shown) */}
                    {showAdvancedOptions && (
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          <FaAward className="w-4 h-4 text-green-400" />
                          Professional Options
                        </h3>

                        <div className="space-y-3 bg-black/10 p-4 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Field
                              type="checkbox"
                              name="includeMeasurements"
                              id="includeMeasurements"
                              className="w-4 h-4 accent-purple-500"
                            />
                            <label
                              htmlFor="includeMeasurements"
                              className="text-white text-sm flex items-center gap-2"
                            >
                              <FaRuler className="w-3 h-3" />
                              Include measurements on pattern pieces
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Field
                              type="checkbox"
                              name="includeGrainlines"
                              id="includeGrainlines"
                              className="w-4 h-4 accent-purple-500"
                            />
                            <label
                              htmlFor="includeGrainlines"
                              className="text-white text-sm flex items-center gap-2"
                            >
                              <FaArrowsAlt className="w-3 h-3" />
                              Show fabric grainlines
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Field
                              type="checkbox"
                              name="includeSeamAllowance"
                              id="includeSeamAllowance"
                              className="w-4 h-4 accent-purple-500"
                            />
                            <label
                              htmlFor="includeSeamAllowance"
                              className="text-white text-sm flex items-center gap-2"
                            >
                              <FaPlus className="w-3 h-3" />
                              Add seam allowances (1.5cm)
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Field
                              type="checkbox"
                              name="includeNotches"
                              id="includeNotches"
                              className="w-4 h-4 accent-purple-500"
                            />
                            <label
                              htmlFor="includeNotches"
                              className="text-white text-sm flex items-center gap-2"
                            >
                              <FaMapPin className="w-3 h-3" />
                              Mark construction notches
                            </label>
                          </div>

                          <div className="mt-4">
                            <label
                              htmlFor="desiredPieceCount"
                              className="text-white text-sm font-medium flex items-center gap-2 mb-2"
                            >
                              <FaShapes className="w-3 h-3" />
                              Desired Pattern Pieces (4-10)
                            </label>
                            <Field
                              type="number"
                              name="desiredPieceCount"
                              id="desiredPieceCount"
                              min={4}
                              max={10}
                              className="w-32 px-3 py-2 bg-black/15 border border-solid border-zinc-500 rounded-lg text-white"
                            />
                            <p className="text-gray-400 text-xs mt-1">
                              Target number of pattern pieces to generate.
                            </p>
                            <ErrorMessage
                              name="desiredPieceCount"
                              component="div"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label
                            htmlFor="notes"
                            className="text-white text-sm mb-2 flex items-center gap-2"
                          >
                            <FaStickyNote className="w-3 h-3" />
                            Special Instructions (Optional)
                          </label>
                          <Field
                            as="textarea"
                            name="notes"
                            id="notes"
                            rows={3}
                            className="w-full p-3 bg-black/15 border border-solid border-zinc-500 rounded-lg text-white resize-none placeholder-zinc-400"
                            placeholder="Add any specific requirements, size adjustments, or special construction notes..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex flex-col items-center !mb-5 gap-2">
                      <Button
                        type="submit"
                        disabled={isTaskQueued}
                        className="max-w-64 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex items-center justify-center gap-2 hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                      >
                        <FaRocket className="w-4 h-4" />
                        {isTaskQueued
                          ? "Generating Patterns..."
                          : "Generate Patterns"}
                        <FaChevronRight className="w-4 h-4" />
                      </Button>

                      {/* Abort Button - Only shown when processing */}
                      <div className="mb-3">
                        {isTaskQueued && taskIdRef.current && (
                          <ConfirmAbortDialog
                            taskId={taskIdRef.current}
                            onSuccess={() => {
                              setIsProcessing(false);
                              taskIdRef.current = null;
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </Form>
                </>
              );
            }}
          </Formik>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="fixed bottom-0 left-0 right-0 bg-white text-black text-center py-4 z-50 border-t border-purple-700">
              Master Tailor at Work - Pattern extraction in progress...
            </div>
          )}
        </div>

          {generatedPatterns && <div className="">
     <PatternCutoutDisplay data={generatedPatterns} />
    </div>}

        {/* Generated Patterns */}
        {/* {generatedPatterns.length > 0 && (
          <GeneratedImageContainer
            generatedVariations={generatedPatterns}
            aiTaskId={aiTaskId}
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            previewInputState={previewInputState}
            setPreviewInputState={setPreviewInputState}
            imageStatuses={imageStatuses}
            title="Your Pattern Results"
            subtitle="Professional pattern pieces extracted from your design"
          />
        )} */}
      </div>
    </div>
  );
}
