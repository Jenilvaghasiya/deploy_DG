import React, { useState, useRef, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import placeholderImage from "../../assets/images/placeholder.svg";
import { SelectImageTabs } from "../../components/SelectImageTabs";
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
import TechPacksDisplay from "@/components/TechPack/TechPacksDisplay";
import { multipartRequest } from "@/api/axios";
import { FaChevronRight } from "react-icons/fa";

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

export default function TechPackGenerator() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [showPromptField, setShowPromptField] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [techPackGenerated, setTechPackGenerated] = useState(false);
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
    "ai-design-lab:tech-packs:view"
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

    handleUsageTimeStart({ socket, module: "tech_packs" });
    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    console.log("techPacks:->", data);

    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids.length > 0 ? data?.gallery_image_ids : [],
        });
         setGeneratedVariations({
      ...data.result,   // existing result
      task_id: data.task_id, // add the task_id here
    });
        setTechPackGenerated(true);
        setIsGenerating(false);
        setAiTaskId(data.aiTaskId);
        markTaskAsSeen(data.task_id);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "tech_packs" });
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
    engine: "openai",
    garmentImage: null,
    numberOfVariations: 1,
    showPromptField: false,
    prompt: "",
    galleryImageId: null,
    generatedImageUrl: null,
    projectImageId: null,      // Add this
    projectImageUrl: null, 
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

// Handle project image metadata
    if (extraMeta.projectImageId) {
      setFieldValue("projectImageId", extraMeta.projectImageId);
    } else {
      setFieldValue("projectImageId", null);
    }
    
        if (extraMeta.projectImageUrl) {
      setFieldValue("projectImageUrl", extraMeta.projectImageUrl);
    } else {
      setFieldValue("projectImageUrl", null);
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
    
    // Handle different image sources
    if (values.projectImageUrl) {
      // For project images, send the URL
      formData.append("projectImageUrl", values.projectImageUrl);
      if (values.projectImageId) {
        formData.append("projectImageId", values.projectImageId);
      }
    } else if (values.generatedImageUrl) {
      // For generated images
      formData.append("generatedImageUrl", values.generatedImageUrl);
    } else if (values.galleryImageId) {
      // For gallery images
      formData.append("galleryImageId", values.galleryImageId);
    } else if (values.garmentImage && values.garmentImage.size > 0) {
      // For uploaded files
      formData.append("image", values.garmentImage);
    } else {
      alert("Please select an image");
      setIsGenerating(false);
      return;
    }
    
    formData.append("prompt", values.prompt || "");

    const response = await multipartRequest.post(
      "/image-variation/tech-packs/create-ai",
      formData
    );
    
    const { task_id } = response.data.data;
    taskIdRef.current = task_id;
    fetchCredits();
    
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
      <div ref={containerRef} className="w-full relative z-10">
        <div className="p-4 lg:p-5 2xl:px-8">
          <WhileYouWereAway
            task_type="tech_packs"
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            setTaskStatus={setTaskStatus}
            imageStatuses={imageStatuses}
          />

          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">
            Tech Pack Generator
          </h1>
          <p className="text-sm text-zinc-400 mb-4">
            Create detailed technical specifications for your garment designs
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => {

              useEffect(() => {
                loadImageFromLocalStorage(
                  "tech-packs",
                  setPreviewImage,
                  setFieldValue
                );
              }, []);

              return (
                <>
                  <SelectImageTabs
                    title="Upload Sketch"
                    handleImageUpload={handleImageUpload}
                    setFieldValue={setFieldValue}
                    showMoodboardField={true}
                    showProjectsField={true}
                    setPreviewImage={setPreviewImage}  // Pass the setPreviewImage function
                    scrollToBottom={scrollToBottom}
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
                      <label className="text-sm md:text-base text-white">
                        Preview:
                      </label>
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
                        <ErrorMessage
                          name="prompt"
                          component="div"
                          className="text-red-500 text-sm"
                        />
                      </div>
                    )}

                    {/* Generate Button */}
                    <div className="flex flex-col items-center !mb-5 gap-2">
                      <Button
                        type="submit"
                        disabled={isTaskQueued}
                        className="max-w-60 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                      >
                        {isTaskQueued
                          ? "Generating..."
                          : "Generate"}
                        <FaChevronRight className="w-4 h-4" />
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
            <div className="fixed bottom-0 left-0 right-0 bg-white text-black text-center py-4 z-50 border-t border-purple-700">
              Image generation in progress...
            </div>
          )}
        </div>


        {generatedVariations && techPackGenerated && (
          <div className="mt-6">
            <TechPacksDisplay data={generatedVariations} />
          </div>
        )}
      </div>
    </div>
  );
}
