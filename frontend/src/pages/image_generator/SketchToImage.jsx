import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { markTaskAsSeen } from "../../features/auth/authService";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "./GeneratedImageContainer";

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const validationSchema = Yup.object({
  garmentImage: Yup.mixed().required("Please upload a sketch image"),
  numberOfVariations: Yup.number()
    .min(1)
    .max(5)
    .required("Number of variations is required"),
  prompt: Yup.string().optional(),
  engine: Yup.string().optional(),
});

export default function SketchToImage() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [showPromptField, setShowPromptField] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFeedback, setImageFeedback] = useState({});
  const taskIdRef = useRef(null);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [aiTask, setAiTask] = useState({});
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const { fetchCredits } = useCredits();
  const hasFinaliseImagePermission = hasPermission(
    permissionKeys, 
    "ai-design-lab:sketch-to-image:finalise"
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
        behavior: 'smooth'
      });
    }
  };

  // Real-time socket listener
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('task_update', handleTaskUpdate);
    
    handleUsageTimeStart({ socket, module: "sketch_to_image" });
    return () => {
      socket.off('task_update', handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        console.log("data>>>>>>>>>>>>>>>>>", data, "<<<<<<<<<<<<<<<data");
        setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids.length > 0 ? data?.gallery_image_ids : [],
        });

        // Ensure the result is properly formatted
        const formattedVariations = data.result.map(item => {
          // If the URL doesn't start with http, it might need the base URL
          const fullUrl = item.url.startsWith('http') 
            ? item.url 
            : `${VITE_BASE_URL}/${img.url}`;

          return {
            ...item,
            url: fullUrl
          };
        });
        setGeneratedVariations(formattedVariations);
        setIsGenerating(false);
        setAiTaskId(data.aiTaskId);
        markTaskAsSeen(data.task_id);
        setAiTask(data);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "sketch_to_image" });
      } else if (data.status === "failed") {
        alert("Image processing failed. Please try again.");
        setIsGenerating(false);
      }
    }
  };

  const handleImageStatusUpdate = async ({ aiTaskId, newStatus, imageUrl }) => {
    try {
      const response = await updateGeneratedImageStatus({ aiTaskId, newStatus, imageUrl });
      if (response.status === 200) {
        setUpdatedImageUrls((prev) => new Set(prev).add(imageUrl));
        setImageStatuses(prev => ({ ...prev, [imageUrl]: newStatus }));
        fetchCredits();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong.");
      console.error("Failed to update image status:", error);
    }
  };

  const initialValues = {
    engine: "openai",
    garmentImage: null,
    numberOfVariations: 1,
    showPromptField: false,
    prompt: "",
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
      formData.append("use_case", "sketch_to_image");
      formData.append("engine", values.engine);
      formData.append("image", values.garmentImage);
      formData.append("prompt", values.prompt || "");
      formData.append("variant_count", values.numberOfVariations);

      if (values.galleryImageId) {
        formData.append("galleryImageId", values.galleryImageId);
      }
      if (values.generatedImageUrl) {
        formData.append("generatedImageUrl", values.generatedImageUrl);
      }

      const response = await multipartRequest.post("/image-variation/sketch-to-image/create", formData);
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
      <div ref={containerRef} className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll">
        <div className="p-4 lg:p-5 2xl:px-8">
          <WhileYouWereAway 
            task_type='sketch_to_image' 
            updatedImageUrls={updatedImageUrls} 
            handleImageStatusUpdate={handleImageStatusUpdate} 
            hasFinaliseImagePermission={hasFinaliseImagePermission} 
            setUpdatedImageUrls={setUpdatedImageUrls} 
            setTaskStatus={setTaskStatus} 
            imageStatuses={imageStatuses}
            saveForLaterButtonShow={false}
            finalizeButtonShow={false}
            likeDislikeButtonsShow={false}
          />
          
          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">
            Sketch to Photo
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            Transform your sketches into realistic garment images
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => {
              useEffect(() => {
                loadImageFromLocalStorage("sketch-to-image", setPreviewImage, setFieldValue);
              }, []);

              return (
                <>
                  <SelectImageTabs 
                    title="Upload Sketch" 
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
                  
                  <Form className="space-y-2">
                    {/* Preview */}
                    <div className="space-y-1 !mt-3">
                      <label className="text-sm md:text-base text-white">Preview:</label>
                      <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                        <SmartImage 
                          src={previewImage || placeholderImage} 
                          alt="Sketch preview" 
                          width={600} 
                          height={300} 
                          className="w-full h-72 object-contain rounded-lg" 
                        />
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
                        <span>Show Prompt Field</span>
                      </Button>
                    </div>

                    {/* Prompt Field (conditionally shown) */}
                    {showPromptField && (
                      <div className="space-y-2">
                        <label className="text-sm md:text-base font-medium text-white">
                          Custom Prompt
                        </label>
                        <Field
                          name="prompt"
                          as="textarea"
                          className="w-full p-3 bg-black/15 border text-white rounded-lg resize-none placeholder-zinc-400"
                          rows={3}
                          placeholder="Enter additional details about the garment..."
                        />
                        <ErrorMessage name="prompt" component="div" className="text-red-500 text-sm" />
                      </div>
                    )}

                    {/* Number of Variations */}
                    <div className="space-y-2 dg-sider-bg-range">
                      <label className="text-sm md:text-base font-medium text-white">
                        Number of Variations
                      </label>
                      <div className="space-y-1 !mt-3">
                        <Field name="numberOfVariations">
                          {({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min={1}
                              max={5}
                              step={1}
                              className="w-full px-3 py-2 text-white bg-black/15 border border-solid border-zinc-500 rounded-lg focus:outline-none focus:ring-2"
                              onChange={(e) =>
                                setFieldValue("numberOfVariations", Number(e.target.value))
                              }
                            />
                          )}
                        </Field>
                        <div className="text-sm text-zinc-400 text-right">
                          From 1 to 5 variations
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="flex flex-col items-center !mb-5 gap-2">
                      <Button
                        type="submit"
                        disabled={isGenerating || taskStatus === "queued"}
                        className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                      >
                        Generate
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
              Image generation in progress...
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
            saveForLaterButtonShow={false}
            finalizeButtonShow={false}
            likeDislikeButtonsShow={false}
            aiTask={aiTask}
          />
        )}
      </div>
    </div>
  );
}
