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
import placeholderImage from "../../assets/images/placeholder.svg";
import { SelectImageTabs } from "../../components/SelectImageTabs";
import { multipartRequest } from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import useSocket from "../../hooks/useSocket";
import { updateGeneratedImageStatus } from "../../features/imageGeneration/imageGeneration";
import { hasPermission } from "../../lib/utils";
import WhileYouWereAway from "./WhileYouWereAway";
import { loadImageFromLocalStorage } from "../../utils/imageService";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import SmartImage from "@/components/SmartImage";
import { markTaskAsSeen } from "@/features/auth/authService";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "./GeneratedImageContainer";

const validationSchema = Yup.object({
  garmentImage: Yup.mixed().required("Please upload a garment image"),
  variantCount: Yup.number()
    .min(1)
    .max(5)
    .required("Number of variants is required"),
  prompt: Yup.string().optional(),
  palette: Yup.string().optional(),
  customColors: Yup.string().optional(),
  texture: Yup.string().optional(),
  pattern: Yup.string().optional(),
  engine: Yup.string().required("Please select an engine"),
});

export default function ColorVariation() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [showPromptField, setShowPromptField] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFeedback, setImageFeedback] = useState({});
  const taskIdRef = useRef(null);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const { fetchCredits } = useCredits();
  const hasFinaliseImagePermission = hasPermission(
    permissionKeys,
    "ai-design-lab:color-variations:finalise"
  );
  const [taskStatus, setTaskStatus] = useState(null);
  const isTaskQueued = isGenerating || taskStatus === "queued";
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });
  const [imageStatuses, setImageStatuses] = useState({});

  // Add ref for scrolling to bottom
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

    handleUsageTimeStart({ socket, module: "color_variations" });
    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        console.log(data, "data");
        setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids.length > 0 ? data?.gallery_image_ids : [],
        });
        setGeneratedVariations(data.result);
        setIsGenerating(false);
        setAiTaskId(data.aiTaskId);
        markTaskAsSeen(data.task_id);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "color_variations" });
      } else if (data.status === "failed") {
        alert("Image processing failed. Please try again.");
        setIsGenerating(false);
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
    variantCount: 1,
    size: "1024x1024",
    prompt: "",
    palette: "auto",
    customColors: "",
    texture: "auto",
    pattern: "auto",
    engine: "gpt_image_1",
    galleryImageId: null,
    generatedImageUrl: null,
  };

  const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
    const file = event.target.files?.[0];
    if (file) {
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

      setFieldValue("prompt", "");
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        // Scroll to bottom after image is loaded and preview is updated
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values) => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("use_case", "color_variations");
      formData.append("engine", values.engine);
      formData.append("variant_count", values.variantCount);
      formData.append("size", values.size || "1024x1024");
      formData.append("prompt", values.prompt || "");
      formData.append("palette", values.palette === "auto" ? "" : values.palette);
      formData.append("custom_colors", values.customColors || "");
      formData.append("texture", values.texture === "auto" ? "" : values.texture);
      formData.append("pattern", values.pattern === "auto" ? "" : values.pattern);
      formData.append("async", "true");
      formData.append("image", values.garmentImage);

      if (values.galleryImageId) {
        formData.append("galleryImageId", values.galleryImageId);
      }
      if (values.generatedImageUrl) {
        formData.append("generatedImageUrl", values.generatedImageUrl);
      }

      const response = await multipartRequest.post(
        "/image-variation/color-variations/create",
        formData
      );
      const { task_id } = response.data.data;
      taskIdRef.current = task_id;

      // Scroll to bottom after form submission
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error("Error submitting task:", err?.response?.data?.message);
      alert(err?.response?.data?.message || "Something went wrong.");
      setIsGenerating(false);
    }
  };

  // Effect to scroll when variations are generated
  useEffect(() => {
    if (generatedVariations.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [generatedVariations]);

  return (
    <div className="h-20 grow flex flex-col relative">
      <div
        ref={containerRef}
        className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll"
      >
        <div className="p-4 lg:p-5 2xl:px-8">
          <WhileYouWereAway
            task_type="color_variations"
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            setTaskStatus={setTaskStatus}
            imageStatuses={imageStatuses}
          />

          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">
            Color Variations
          </h1>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => {
              useEffect(() => {
                loadImageFromLocalStorage(
                  "color-variations",
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
                    {/* Preview */}
                    <div className="space-y-1 !mt-3">
                      <label className="text-sm md:text-base text-white">
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

                    {/* Number of Variants and Image Size */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm md:text-base font-medium text-white">
                          Variants (1-5)
                        </label>
                        <Field name="variantCount">
                          {({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min={1}
                              max={5}
                              step={1}
                              className="w-full px-3 py-2 text-white bg-black/15 border border-solid border-zinc-500 rounded-lg focus:outline-none focus:ring-2"
                              onChange={(e) =>
                                setFieldValue(
                                  "variantCount",
                                  Number(e.target.value)
                                )
                              }
                            />
                          )}
                        </Field>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm md:text-base font-medium text-white">
                          Engine
                        </label>
                        <Select
                          value={values.engine}
                          onValueChange={(value) =>
                            setFieldValue("engine", value)
                          }
                        >
                          <SelectTrigger className="w-full text-white border bg-black/15">
                            <SelectValue placeholder="Select an engine" />
                          </SelectTrigger>
                          <SelectContent className="bg-black text-white border">
                            <SelectItem value="gpt_image_1">
                              GPT Image 1 (Recommended)
                            </SelectItem>
                            <SelectItem value="openai">
                              OpenAI (DALL·E)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Show Prompt Field Button */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPromptField(!showPromptField);
                          setFieldValue("showPromptField", !showPromptField);
                        }}
                        className="flex items-center space-x-2 text-black hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] hover:text-white border-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Show Advanced Options</span>
                      </Button>
                    </div>

                    {/* Advanced Options (conditionally shown) */}
                    {showPromptField && (
                      <>
                        {/* Optional Direction */}
                        <div className="space-y-2">
                          <label className="text-sm md:text-base font-medium text-white">
                            Optional Direction
                          </label>
                          <Field
                            name="prompt"
                            as="textarea"
                            className="w-full p-3 bg-black/15 border text-white rounded-lg resize-none placeholder-zinc-400"
                            rows={3}
                            placeholder="e.g., Explore pastel palette with subtle satin sheen and minimal micro-check pattern"
                          />
                          <p className="text-xs text-zinc-400">
                            If left empty, the system will generate tasteful
                            surface-only variations.
                          </p>
                        </div>

                        {/* Palette, Custom Colors, and Texture */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm md:text-base font-medium text-white">
                              Palette
                            </label>
                            <Select
                              value={values.palette}
                              onValueChange={(value) =>
                                setFieldValue("palette", value)
                              }
                            >
                              <SelectTrigger className="w-full text-white border bg-black/15">
                                <SelectValue placeholder="Auto" />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border">
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="pastel">Pastel</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="warm">Warm</SelectItem>
                                <SelectItem value="cool">Cool</SelectItem>
                                <SelectItem value="earth">
                                  Earth Tones
                                </SelectItem>
                                <SelectItem value="neon">Neon</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm md:text-base font-medium text-white">
                              Custom Colors
                            </label>
                            <Field
                              name="customColors"
                              type="text"
                              placeholder="e.g., cherry red, slate blue"
                              className="w-full px-3 py-2 text-white bg-black/15 border border-solid border-zinc-500 rounded-lg focus:outline-none focus:ring-2 placeholder-zinc-400"
                            />
                            <p className="text-xs text-zinc-400">
                              Comma-separated color names or hex codes
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm md:text-base font-medium text-white">
                              Texture
                            </label>
                            <Select
                              value={values.texture}
                              onValueChange={(value) =>
                                setFieldValue("texture", value)
                              }
                            >
                              <SelectTrigger className="w-full text-white border bg-black/15">
                                <SelectValue placeholder="Auto" />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border">
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="matte">Matte</SelectItem>
                                <SelectItem value="satin">Satin</SelectItem>
                                <SelectItem value="silk">Silk</SelectItem>
                                <SelectItem value="denim">Denim</SelectItem>
                                <SelectItem value="leather">Leather</SelectItem>
                                <SelectItem value="wool">Wool</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Pattern */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pattern */}
                          <div className="space-y-2">
                            <label className="text-sm md:text-base font-medium text-white">
                              Pattern
                            </label>
                            <Select
                              value={values.pattern}
                              onValueChange={(value) =>
                                setFieldValue("pattern", value)
                              }
                            >
                              <SelectTrigger className="w-full text-white border bg-black/15">
                                <SelectValue placeholder="Auto" />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border">
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="solid">Solid</SelectItem>
                                <SelectItem value="stripes">Stripes</SelectItem>
                                <SelectItem value="checks">Checks</SelectItem>
                                <SelectItem value="floral">Floral</SelectItem>
                                <SelectItem value="polka">Polka</SelectItem>
                                <SelectItem value="geometric">
                                  Geometric
                                </SelectItem>
                                <SelectItem value="houndstooth">
                                  Houndstooth
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                              {/* Size */}
                           <div className="space-y-2">
                            <label className="text-sm md:text-base font-medium text-white">
                              Image Size
                            </label>
                            <Select
                              value={values.size}
                              onValueChange={(value) =>
                                setFieldValue("size", value)
                              }
                            >
                              <SelectTrigger className="w-full text-white border bg-black/15">
                                <SelectValue placeholder="Image Size" />
                              </SelectTrigger>
                              <SelectContent className="bg-black text-white border">
                                <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Generate Button */}
                    <div className="flex flex-col items-center !mb-5 gap-2">
                      <Button
                        type="submit"
                        disabled={isGenerating || taskStatus === "queued"}
                        className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                      >
                        Generate Variations
                      </Button>

                      {/* Abort Button - Only shown when generating */}
                      <div className="mb-3">
                        {isTaskQueued && taskIdRef.current && (
                          <ConfirmAbortDialog
                            taskId={taskIdRef.current}
                            onSuccess={() => {
                              setIsGenerating(false);
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

          {isGenerating && (
            <div className="fixed bottom-0 left-0 right-0 bg-white text-center py-4 z-50 border-t border-purple-700">
              Color variation generation in progress...
            </div>
          )}
        </div>

        {/* Generated Variations */}
        {generatedVariations.length > 0 && (
          <GeneratedImageContainer
            generatedVariations={generatedVariations}
            aiTaskId={aiTaskId}
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            previewInputState={previewInputState}
            setPreviewInputState={setPreviewInputState}
            imageStatuses={imageStatuses}
          />
        )}
      </div>
    </div>
  );
}
