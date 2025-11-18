import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { FaCloudUploadAlt, FaBrain, FaMagic, FaPalette } from "react-icons/fa";
import ColorAnalysisDisplay from "./ColorAnalysisDisplay";

const validationSchema = Yup.object({
  garmentImage: Yup.mixed().required("Please upload a garment image"),
});

export default function ColorDetectionGenerator() {
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
    "ai-design-lab:color_analysis:view"
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

  // Real-time socket listener
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on("task_update", handleTaskUpdate);

    handleUsageTimeStart({ socket, module: "color_analysis" });
    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    console.log("color-analysis:->", data);
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
        handleUsageTimeEnd({ socket, module: "color_analysis" });
      } else if (data.status === "failed") {
        toast.error("Color analysis failed. Please try again.");
        setIsProcessing(false);
      }
    }
  };

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
    includeHarmony: false,
    includeFashionInsights: false,
    savePalette: true,
    paletteName: "",
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
      formData.append("image", values.garmentImage);
      formData.append("include_harmony", values.includeHarmony);
      formData.append(
        "include_fashion_insights",
        values.includeFashionInsights
      );
      formData.append("save_palette", values.savePalette);
      formData.append("palette_name", values.paletteName || "");

      if (values.galleryImageId) {
        formData.append("galleryImageId", values.galleryImageId);
      }
      if (values.generatedImageUrl) {
        formData.append("generatedImageUrl", values.generatedImageUrl);
      }

      const response = await multipartRequest.post(
        "/image-variation/color_analysis/create",
        formData
      );
      //  const response = await multipartRequest.post(
      //         "/image-variation/pattern_cutout/create",
      //         formData
      //       );
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
          task_type="color_analysis"
          updatedImageUrls={updatedImageUrls}
          handleImageStatusUpdate={handleImageStatusUpdate}
          hasFinaliseImagePermission={hasFinaliseImagePermission}
          setUpdatedImageUrls={setUpdatedImageUrls}
          setTaskStatus={setTaskStatus}
          imageStatuses={imageStatuses}
        />

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => {
            useEffect(() => {
              loadImageFromLocalStorage(
                "color_analysis",
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
                      <div className="border-shadow-blur border-2 border-dashed border-white/20 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm">
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

                  {/* Color Analysis Settings */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow p-6">
                    <h2 className="text-2xl font-bold mb-4 text-white">
                      Upload Garment Image
                    </h2>

                    {/* Options */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Field
                          type="checkbox"
                          id="harmony"
                          name="includeHarmony"
                          className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                        />
                        <label
                          htmlFor="harmony"
                          className="text-sm font-medium text-gray-300"
                        >
                          Include Harmony Analysis
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Field
                          type="checkbox"
                          id="insights"
                          name="includeFashionInsights"
                          className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                        />
                        <label
                          htmlFor="insights"
                          className="text-sm font-medium text-gray-300"
                        >
                          Include Fashion Insights
                        </label>
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <Field
                            type="checkbox"
                            id="savePalette"
                            name="savePalette"
                            className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                          />
                          <label
                            htmlFor="savePalette"
                            className="text-sm font-medium text-gray-300"
                          >
                            <strong className="text-white">Save palette and link to image</strong>
                            <span className="text-xs text-blue-400 block">
                              Recommended: Save colors for reuse in other
                              generation features
                            </span>
                          </label>
                        </div>

                        {values.savePalette && (
                          <div className="ml-6">
                            <label
                              htmlFor="paletteName"
                              className="block text-sm font-medium text-gray-300 mb-1"
                            >
                              Palette Name (Optional)
                            </label>
                            <Field
                              type="text"
                              id="paletteName"
                              name="paletteName"
                              placeholder="e.g., Summer Colors, Evening Dress Palette, etc."
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave blank to auto-generate from image filename
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                      <div className="flex items-center">
                        <FaMagic className="text-blue-400 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-300">
                            Intelligent Color Detection
                          </h4>
                          <p className="text-sm text-blue-400/80">
                            Our AI automatically determines the optimal number
                            of colors to extract based on your garment's
                            complexity.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                      <Button
                        type="submit"
                        disabled={!values.garmentImage || isTaskQueued}
                        className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all duration-200 hover:scale-105 border border-purple-500/30"
                      >
                        <FaBrain className="mr-3" />
                        <span className="font-semibold">
                          {isTaskQueued
                            ? "Analyzing Colors..."
                            : "Analyze Colors"}
                        </span>
                      </Button>

                      <div className="mt-3 text-center">
                        <p className="text-sm text-gray-400">
                          <FaMagic className="inline mr-1 text-purple-400" />
                          Powered by GPT-4 Vision + FreeTone matching
                        </p>
                      </div>
                    </div>
                  </div>

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
                </Form>
              </>
            );
          }}
        </Formik>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="fixed bottom-0 left-0 right-0 bg-purple-900/90 backdrop-blur-sm text-center py-4 z-50 border-t border-purple-700/50">
            <span className="text-white">AI Color Expert at Work - Analyzing your garment colors...</span>
          </div>
        )}
      </div>

      {/* Generated Results */}
      {generatedPatterns && <ColorAnalysisDisplay data={generatedPatterns} />}
    </div>
  </div>
  );
}
