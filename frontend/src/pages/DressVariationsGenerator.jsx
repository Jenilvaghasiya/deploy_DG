import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Plus } from "lucide-react";
// import Image from "next/image"
import placeholderImage from "../assets/images/placeholder.svg";
import api from "../api/axios";
import { generateVariationService } from "../service/generateVariationService";
import { SelectImageTabs } from "../components/SelectImageTabs";
import { multipartRequest } from "../api/axios";
import { useAuthStore } from "../store/authStore";
import useSocket from "../hooks/useSocket";
import { useEffect } from "react";
import { updateGeneratedImageStatus } from "../features/imageGeneration/imageGeneration";
import { hasPermission } from "../lib/utils";
import WhileYouWereAway from "./image_generator/WhileYouWereAway";
import { BsBookmark, BsCheck } from "react-icons/bs";
import LikeDislikeImage from "./image_generator/LikeDislikeImage";
import { loadImageFromLocalStorage } from "../utils/imageService";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import LensFlareEffect from "@/components/LensFlareEffect";
import SmartImage from "@/components/SmartImage";
import { markTaskAsSeen } from "@/features/auth/authService";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import UseImageModalButton from "@/components/Common/UseImageModalButton";
import SmartContextImage from "@/components/Common/SmartContextImage";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "./image_generator/GeneratedImageContainer";
import ApiTour from "@/components/Tour/ApiTour";
import { variationsTourSteps } from "@/components/Tour/TourSteps";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const validationSchema = Yup.object({
  aiEngine: Yup.string().required("Please select an AI engine"),
  garmentImage: Yup.mixed().required("Please upload a garment image"),
  numberOfVariations: Yup.number()
    .min(1)
    .max(10)
    .required("Number of variations is required"),
  prompt: Yup.string().optional()
});

export default function DressVariationsGenerator() {
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
  const permissionKeys = permissions.map(p => p.key);
  const { fetchCredits } = useCredits();
  const hasFinaliseImagePermission = hasPermission(permissionKeys, "ai-design-lab:image-variations:finalise")
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
    
    handleUsageTimeStart({ socket, module: "image_variation" });
    return () => {
      socket.off('task_update', handleTaskUpdate);
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
        handleUsageTimeEnd({ socket, module: "image_variation" });
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
    aiEngine: "openai",
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
      formData.append("use_case", "dress_variations");
      formData.append("engine", values.aiEngine);
      formData.append("image", values.garmentImage);
      formData.append("prompt", values.prompt || "");
      formData.append("variant_count", values.numberOfVariations);

      if (values.galleryImageId) {
        formData.append("galleryImageId", values.galleryImageId);
      }
      if (values.generatedImageUrl) {
        formData.append("generatedImageUrl", values.generatedImageUrl);
      }

      const response = await multipartRequest.post("/image-variation/create", formData);
      const { task_id } = response.data.data;
      taskIdRef.current = task_id;
      
      // Scroll to bottom after form submission
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      // checkTaskStatus(task_id);
    } catch (err) {
      console.error("Error submitting task:", err?.response?.data?.message);
      alert(err?.response?.data?.message || "Something went wrong.");
      setIsGenerating(false);
    }
  };

  const checkTaskStatus = async (task_id) => {
    try {
      const res = await api.get(`/image-variation/status/${task_id}`);
      
      // If already completed, update immediately
      if (res.data.data?.status === 'completed') {
        setGeneratedVariations(res.data.data.result);
      }
      // If failed, show error
      else if (res.data.data?.status === 'failed') {
        alert('Image processing failed');
      }
    } catch (err) {
      // Status check failed - rely on socket updates
      console.log('Task status pending, waiting for socket updates...');
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

  console.log(previewInputState,'previewInputState')
  return (
    <div className="h-20 grow flex flex-col relative">
      <ApiTour
        tourName="variationsTour" 
        steps={variationsTourSteps}
      />
      <div ref={containerRef} className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll">
        <div className="p-4 lg:p-5 2xl:px-8">
          <WhileYouWereAway task_type='image_variation' updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} setTaskStatus={setTaskStatus} imageStatuses={imageStatuses} />
          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">Variations</h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => {
            
            useEffect(() => {
              loadImageFromLocalStorage("variation-generation", setPreviewImage, setFieldValue);
            }, []);
            
            return (<>
              <div className="select-image-tabs">
                <SelectImageTabs handleImageUpload={handleImageUpload} setFieldValue={setFieldValue} />
                   <InputImagePreviewDialog
                    open={previewInputState.open}
                    galleryImageIds={previewInputState.galleryImageIds}
                    setOpen={(show) =>
                      setPreviewInputState((prev) => ({ ...prev, open: show }))
                    }
                  />
                    </div>
              <Form className="space-y-2">
                {/* Preview */}
                <div className="space-y-1 !mt-3">
                  <label className="text-sm md:text-base text-white">Preview:</label>
                  <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                    <SmartImage src={previewImage || placeholderImage} alt="Garment preview" width={600} height={300} className="w-full h-72 object-contain rounded-lg" />
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
                    className="flex items-center space-x-2 prompt-field text-black hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] hover:text-white border-none">
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
                      className="w-full p-3 bg-black border text-white rounded-lg resize-none placeholder-white"
                      rows={3}
                      placeholder="Enter additional prompt details..."
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
                          max={4}
                          step={1}
                          className="w-full px-3 py-2 text-white bg-black/15 border border-solid border-zinc-500 rounded-lg focus:outline-none focus:ring-2"
                          onChange={(e)=>
                            setFieldValue("numberOfVariations", Number(e.target.value))
                          }
                        />
                      )}
                    </Field>
                    <div className="text-sm text-zinc-400 text-right">
                      From 1 to 4 variations
                    </div>
                  </div>
                </div>
  
  
                {/* Generate Button */}
                <div className="flex flex-col items-center !mb-5 gap-2">
                  <Button
                    type="submit"
                    disabled={isGenerating || taskStatus === "queued"}
                    className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium  py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
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
            )}
          }
        </Formik>
        {isGenerating && (
          <div className="fixed bottom-0 left-0 right-0 bg-white text-center py-4 z-50 border-t border-purple-700">
            Variation generation in progress...
          </div>
        )}

       </div>
        {/* Generated Variations */}
       {generatedVariations.length > 0 && (
          // <>
          //   <h2 className="text-2xl font-bold text-white text-left py-3 px-10 bg-black/25 rounded-t-lg">
          //     Your Garment Variations
          //   </h2>
          //   <div className="relative">
          //     <LensFlareEffect />
          //     <div className="relative z-10 p-6">
          //       <div className="flex flex-wrap justify-center items-stretch gap-4">
          //         {generatedVariations.map((variation, index) => (
          //           <Card
          //             key={index}
          //             className="!bg-white/75 overflow-hidden border-shadow-blur rounded-xl grow w-full sm:w-1/3 md:w-1/4 xl:w-1/5 sm:max-w-1/2 md:max-w-1/3 xl:max-w-1/4 py-0"
          //           >
          //             <CardContent className="p-0">
          //               <div className="relative after:block after:pt-[100%]">
          //                     <SmartContextImage
          //                   src={`${BASE_API_URL}/genie-image/${variation}` || placeholderImage}
          //                   alt={`Variation ${index + 1}`}
          //                   className="w-full h-full absolute top-0 left-0 max-w-full object-cover"
          //                   variation={variation}
          //                   aiTaskId={aiTaskId}
          //                   hasFinaliseImagePermission={hasFinaliseImagePermission}
          //                   setImageFeedback={setImageFeedback}
          //                   imageFeedback={imageFeedback}
          //                   setUpdatedImageUrls={setUpdatedImageUrls}
          //                   onSaveImage={() =>
          //                     handleImageStatusUpdate({
          //                       aiTaskId,
          //                       newStatus: "saved",
          //                       imageUrl: variation,
          //                     })
          //                   }
          //                   onFinaliseImage={() =>
          //                     handleImageStatusUpdate({
          //                       aiTaskId,
          //                       newStatus: "finalized",
          //                       imageUrl: variation,
          //                     })
          //                   }
          //                   onViewInputImages={() => {
          //                     setPreviewInputState(prev=>({
          //                           ...prev,
          //                           open: true,
          //                         }));
          //                   }}
          //                   hasGalleryImages={ previewInputState.galleryImageIds.length >
          //                         0}
          //                 />
          //               </div>
                          
          //               {!updatedImageUrls.has(variation) && (
          //                 <div className="p-4 flex flex-wrap justify-center gap-1">
          //                   <Button
          //                       disabled={
          //                         !previewInputState.galleryImageIds.length >
          //                         0
          //                       }
          //                       onClick={() => {
          //                         setPreviewInputState(prev=>({
          //                           ...prev,
          //                           open: true,
          //                         }));
          //                       }}
          //                       className={`flex items-center justify-center w-full bg-pink-500 hover:bg-pink-600 text-white p-1.5 rounded  ${
          //                         previewInputState.galleryImageIds?.length >
          //                         0
          //                           ? "cursor-pointer"
          //                           : "cursor-not-allowed"
          //                       }`}
          //                       title="Input Image(s)"
          //                     >
          //                       <BsImages size={14} />
          //                        <span className="ml-1">View input Images</span>
          //                     </Button>
          //                   <Button
          //                     variant="outline"
          //                     className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
          //                     onClick={() =>
          //                       handleImageStatusUpdate({
          //                         aiTaskId,
          //                         newStatus: "saved",
          //                         imageUrl: variation,
          //                       })
          //                     }
          //                   >
          //                     <BsBookmark size={14} />
          //                     <span className="ml-1">Save for Later</span>
          //                   </Button>

          //                   {hasFinaliseImagePermission && (
          //                     <Button
          //                       variant="outline"
          //                       className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
          //                       onClick={() =>
          //                         handleImageStatusUpdate({
          //                           aiTaskId,
          //                           newStatus: "finalized",
          //                           imageUrl: variation,
          //                         })
          //                       }
          //                     >
          //                       <BsCheck size={14} />
          //                       <span className="ml-1">Finalise</span>
          //                     </Button>
          //                   )}

          //                   {/* <UseImageModalButton aiTaskId={aiTaskId} imageUrl={variation}/> */}
          //                   <LikeDislikeImage
          //                     imageFeedback={imageFeedback}
          //                     setImageFeedback={setImageFeedback}
          //                     variation={variation}
          //                     setUpdatedImageUrls={setUpdatedImageUrls}
          //                   />
          //                 </div>
          //               )}
          //             </CardContent>
          //           </Card>
          //         ))}
          //       </div>
          //     </div>
          //   </div>
          // </>

          <GeneratedImageContainer generatedVariations={generatedVariations} aiTaskId={aiTaskId} updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} previewInputState={previewInputState} setPreviewInputState={setPreviewInputState} imageStatuses={imageStatuses} />
        )}
      </div>
    </div>
  );
}
