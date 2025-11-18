import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Download, Plus } from "lucide-react";
// import Image from "next/image"
import placeholderImage from "../../assets/images/placeholder.svg";
import api from "../../api/axios";
import { generateVariationService } from "../../service/generateVariationService";
import { SelectImageTabs } from "../../components/SelectImageTabs";
import { multipartRequest } from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import useSocket from "../../hooks/useSocket";
import { useEffect } from "react";
import { markTaskAsSeen } from "../../features/auth/authService";
import WhileYouWereAway from "./WhileYouWereAway";
import { updateGeneratedImageStatus } from "../../features/imageGeneration/imageGeneration";
import { hasPermission } from "../../lib/utils";
import { BsBookmark, BsCheck } from "react-icons/bs";
import LikeDislikeImage from "./LikeDislikeImage";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import LensFlareEffect from "@/components/LensFlareEffect";
import SmartImage from "@/components/SmartImage";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import UseImageModalButton from "@/components/Common/UseImageModalButton";
import SmartContextImage from "@/components/Common/SmartContextImage";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "./GeneratedImageContainer";
import ApiTour from "@/components/Tour/ApiTour";
import { combineImagesTourSteps } from "@/components/Tour/TourSteps";
import { loadImageFromLocalStorage } from "@/utils/imageService";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const validationSchema = Yup.object({
  aiEngine: Yup.string().optional(),
  numberOfVariations: Yup.number()
    .min(1)
    .max(10)
    .required("Number of variations is required"),
  prompt: Yup.string().optional(),
  baseImage: Yup.mixed().required("Please upload base image"),
  styleImage: Yup.mixed().required("Please upload style image"),
  styleFocus: Yup.string().required("Please select design balance"),
  color_scheme: Yup.string().required("Please select color scheme"),
  outputType: Yup.string().required("Please select output type"),
  custom_colors: Yup.string().optional(),
});

export default function CombineImage() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [showPromptField, setShowPromptField] = useState(false);
  const [previewBaseImage, setPreviewBaseImage] = useState(placeholderImage);
  const [imageFeedback, setImageFeedback] = useState({});
  const [previewStyleImage, setPreviewStyleImage] = useState(placeholderImage);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const taskIdRef = useRef(null);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const hasFinaliseImagePermission = hasPermission(permissionKeys, "ai-design-lab:combine-images:finalise")
  const [taskStatus, setTaskStatus] = useState(null);
  const { fetchCredits } = useCredits();
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
    handleUsageTimeStart({ socket, module: "combine_image" });
    
    return () => {
      socket.off('task_update', handleTaskUpdate);
    };
  }, [socketRef]);

  const handleTaskUpdate = (data) => {
    if (data.task_id === taskIdRef.current) {
      if (data.status === 'completed') {
        console.log(data, "data");
        setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids.length > 0 ? data?.gallery_image_ids : [],
        });
        setGeneratedVariations(data.result);
        setIsGenerating(false);
        markTaskAsSeen(data.task_id);
        setAiTaskId(data.aiTaskId);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "combine_image" });

      } else if (data.status === 'failed') {
        alert('Image processing failed. Please try again.');
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
    numberOfVariations: 1,
    showPromptField: false,
    prompt: "",
    baseImage: null,
    styleImage: null,
    styleFocus: "balanced",
    color_scheme: "auto",
    outputType: "technical_sketch",
    custom_colors: ""
  };

const handleImageUpload = (event, setFieldValue, type = "base", values, extraMeta = {}) => {
  const file = event?.target?.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const payload = { file, ...extraMeta };
      if (type === "base") {
        console.log(payload, "<<<<<<<<<<<<<<payload")
        setFieldValue("baseImage", payload);
        setPreviewBaseImage(e.target.result);
      } else {
        setFieldValue("styleImage", payload);
        setPreviewStyleImage(e.target.result);
      }
      setFieldValue("prompt", ""); // ✅ Clear the prompt field
      
      // Check if both images will be selected after this upload
      const willHaveBothImages = type === "base" 
        ? values.styleImage !== null // If uploading base, check if style is already selected
        : values.baseImage !== null; // If uploading style, check if base is already selected
      if (willHaveBothImages) {
        // Scroll to bottom after both images are loaded
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };
    reader.readAsDataURL(file);
  }
};

  const handleSubmit = async (values) => {
    console.log("here")
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("use_case", "image_fusion");
      formData.append("engine", values.aiEngine || "openai");
      // formData.append("base_image", values.baseImage);
      // formData.append("style_image", values.styleImage);
      formData.append("prompt", values.prompt || "");
      formData.append("variant_count", values.numberOfVariations);
      formData.append("style_focus", values.styleFocus);
      formData.append("color_scheme", values.color_scheme);
      formData.append("output_type", values.outputType);
      formData.append("custom_colors", values.custom_colors || "");

      if (values.baseImage) {
        formData.append("base_image", values.baseImage.file);

        if (values.baseImage.galleryImageId) {
          formData.append("baseGalleryImageId", values.baseImage.galleryImageId);
        }
        if (values.baseImage.generatedImageUrl) {
          formData.append("baseGeneratedUrl", values.baseImage.generatedImageUrl);
        }
      }

      if (values.styleImage) {
        formData.append("style_image", values.styleImage.file);

        if (values.styleImage.galleryImageId) {
          formData.append("styleGalleryImageId", values.styleImage.galleryImageId);
        }
        if (values.styleImage.generatedImageUrl) {
          formData.append("styleGeneratedUrl", values.styleImage.generatedImageUrl);
        }
      }

      const response = await multipartRequest.post("/image-variation/combine-image/create", formData);
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

  // Effect to scroll when variations are generated
  useEffect(() => {
    if (generatedVariations.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [generatedVariations]);

  return (
    <div className="h-96 grow flex flex-col relative">
      <ApiTour
        tourName="combineImagesTour" 
        steps={combineImagesTourSteps}
      />
      <div 
        ref={containerRef}
        className="w-full relative z-10 h-96 grow flex flex-col overflow-auto custom-scroll"
      >
        <div className="p-4 lg:p-5 2xl:px-10">
          <WhileYouWereAway task_type='combine_image' updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} setTaskStatus={setTaskStatus} imageStatuses={imageStatuses} />
          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">Combine Images</h1>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => {
            useEffect(() => {
              loadImageFromLocalStorage("combine-image", setPreviewBaseImage, setFieldValue);
            }, []);
              return(<>
              <Form className="space-y-2">

                {/* <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium text-white">Upload Base Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setFieldValue, "base")}
                    className="block w-full text-sm text-white"
                  />
                  <ErrorMessage name="baseImage" component="div" className="text-red-500 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium text-white">Upload Style Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setFieldValue, "style")}
                    className="block w-full text-sm text-white"
                  />
                  <ErrorMessage name="styleImage" component="div" className="text-red-500 text-sm" />
                </div> */}

                {/* <InputImagePreviewDialog
                  open={previewInputState.open}
                  galleryImageIds={previewInputState.galleryImageIds}
                  setOpen={(show) =>
                    setPreviewInputState((prev) => ({ ...prev, open: show }))
                  }
                /> */}

                {/* Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 mb-5 select-image-tabs">
                  
                  {/* Base Image Preview */}
                  <div>
                  <SelectImageTabs
                    title="Upload Base Image"
                    handleImageUpload={(event, setFieldValue, extraMeta) => 
                      handleImageUpload(event, setFieldValue, "base", values, extraMeta)
                    }
                    setFieldValue={setFieldValue}
                    showMoodboardField={true}
                  />
                      <label className="text-sm md:text-base text-white block mb-1">Base Image Preview:</label>
                      <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                      <SmartImage
                        src={previewBaseImage || placeholderImage}
                        alt="Base preview"
                          width={600}
                          height={300}
                        className="w-full h-64 md:h-72 object-contain rounded-lg"
                      />
                    </div>
                    <ErrorMessage name="baseImage" component="div" className="text-red-400 text-sm mt-1" />
                  </div>

                  {/* Style Image Preview */}
                  <div>
                    <SelectImageTabs
                    title="Upload Style Image"
                    handleImageUpload={(event, setFieldValue, extraMeta) => 
                      handleImageUpload(event, setFieldValue, "style", values, extraMeta)
                    }
                    setFieldValue={setFieldValue}
                    imageUnicId ="Style_upload"
                    showMoodboardField={true}
                  />
                    <label className="text-sm md:text-base text-white block mb-1">Style Image Preview:</label>
                      <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                      <SmartImage
                        src={previewStyleImage || placeholderImage}
                        alt="Style preview"
                          width={600}
                          height={300}
                        className="w-full h-64 md:h-72 object-contain rounded-lg"
                      />
                    </div>
                    <ErrorMessage name="styleImage" component="div" className="text-red-400 text-sm mt-1" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 design-balance">
                  <label className="text-sm md:text-base font-semibold text-white">Design Balance</label>
                  <RadioGroup value={values.styleFocus} onValueChange={(value) => setFieldValue("styleFocus", value)} className="gap-1.5 lg:gap-3 pl-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="balanced" id="balanced" />
                      <label htmlFor="balanced" className="text-white text-sm md:text-base cursor-pointer">Balanced (50/50)</label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="first_dominant" id="first_dominant" />
                      <label htmlFor="first_dominant" className="text-white text-sm md:text-base cursor-pointer">First Design Dominant (70/30)</label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="second_dominant" id="second_dominant" />
                      <label htmlFor="second_dominant" className="text-white text-sm md:text-base cursor-pointer">Second Design Dominant (30/70)</label>
                    </div>
                  </RadioGroup>
                  <ErrorMessage name="styleFocus" component="div" className="text-red-500 text-sm" />
                </div>

                <div className="flex flex-col gap-2 color-scheme">
                  <label className="text-sm md:text-base font-semibold text-white">Color Scheme</label>
                  <RadioGroup
                    value={values.color_scheme}
                    onValueChange={(value) => setFieldValue("color_scheme", value)}
                    className="gap-1.5 lg:gap-3 pl-4"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="auto" id="auto" />
                      <label htmlFor="auto" className="text-white text-sm md:text-base cursor-pointer">
                        Auto-blend Both Designs
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="first_dominant" id="first_dominant_color" />
                      <label htmlFor="first_dominant_color" className="text-white text-sm md:text-base cursor-pointer">
                        First Design Colors
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="second_dominant" id="second_dominant_color" />
                      <label htmlFor="second_dominant_color" className="text-white text-sm md:text-base cursor-pointer">
                        Second Design Colors
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="complementary" id="complementary" />
                      <label htmlFor="complementary" className="text-white text-sm md:text-base cursor-pointer">
                        Complementary Colors
                      </label>
                    </div>
                  </RadioGroup>

                  <ErrorMessage name="styleFocus" component="div" className="text-red-500 text-sm" />
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
                      className="w-full p-3 border-shadow-blur border border-solid border-white/35 text-white rounded-lg resize-none placeholder-white"
                      rows={3}
                      placeholder="Enter additional prompt details..."
                    />
                    <ErrorMessage name="prompt" component="div" className="text-red-500 text-sm" />
                  </div>
                )}

                {/* Select AI Engine */}
                {/* <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium text-white">
                    Select Output Type
                  </label>
                  <Select
                    value={values.outputType}
                    onValueChange={(value) => setFieldValue("outputType", value)}
                  >
                    <SelectTrigger className="w-full text-white border bg-black">
                      <SelectValue placeholder="Select an Output Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border">
                      <SelectItem value="technical_sketch">Technical Sketch</SelectItem>
                      <SelectItem value="realistic">Realistic Garment</SelectItem>
                      <SelectItem value="both">Both Types</SelectItem>
                    </SelectContent>
                  </Select>
                  <ErrorMessage name="aiEngine" component="div" className="text-red-500 text-sm" />
                </div> */}

                {/* Number of Variations */}
                <div className="space-y-2 dg-sider-bg-range choose-variation-number">
                  <label className="text-sm md:text-base font-medium text-white">Number of Variations</label>
                  <div className="space-y-1 !mt-3">
                    <Field name="numberOfVariations">
                      {({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={1}
                          max={5}
                          step={1}
                          className="w-full px-3 py-2 text-white bg-white/10 border border-solid border-white/35 rounded-lg focus:outline-none focus:ring-2"
                          onChange={(e)=>
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
                <div className="flex flex-col items-center !mb-5 gap-2 generate-image">
                  <Button
                    type="submit"
                    disabled={isGenerating || taskStatus === "queued"}
                    className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium  py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                  >
                    Create Combination
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
              Image combination is in progress...
            </div>
          )}
        </div>

        {/* Generated Variations */}
        {generatedVariations.length > 0 && (
          // <div className="mt-8">
          //   <h2 className="text-2xl font-bold text-white text-left py-3 px-10 bg-black/25 rounded-t-lg">Your Generated Images</h2>
          //   <div className="relative">
          //     <LensFlareEffect/>
          //     <div className="relative z-10 p-6">
          //       <div className="flex flex-wrap justify-center items-stretch gap-4">
          //         {generatedVariations.map((variation, index) => (
          //           <Card key={index} className="!bg-white/75 overflow-hidden border-shadow-blur rounded-xl grow w-full sm:w-1/3 md:w-1/4 xl:w-1/5 sm:max-w-1/2 md:max-w-1/3 xl:max-w-1/4 py-0">
          //             <CardContent className="p-0">
          //               <div className="relative after:block after:pt-[100%]">
          //                    <SmartContextImage
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
          //                 <div className="p-4 flex justify-center gap-1 flex-wrap">
          //                    <Button
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
                            
          //                   {hasFinaliseImagePermission && <Button 
          //                     variant="outline"
          //                     className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
          //                     onClick={() =>
          //                       handleImageStatusUpdate({
          //                         aiTaskId,
          //                         newStatus: "finalized",
          //                         imageUrl: variation,
          //                       })
          //                     }
          //                   >
          //                     <BsCheck size={14} />
          //                     <span span className="ml-1">Finalise</span>
          //                   </Button>}
          //                   {/* <UseImageModalButton aiTaskId={aiTaskId} imageUrl={variation}/> */}
          //                   <LikeDislikeImage imageFeedback={imageFeedback} setImageFeedback={setImageFeedback} variation={variation} setUpdatedImageUrls={setUpdatedImageUrls} />
          //                 </div>
          //               )}
          //             </CardContent>
          //           </Card>
          //         ))}
          //       </div>
          //     </div>
          //   </div>
          // </div>

          <GeneratedImageContainer generatedVariations={generatedVariations} aiTaskId={aiTaskId} updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} previewInputState={previewInputState} setPreviewInputState={setPreviewInputState} imageStatuses={imageStatuses} />
        )}
      </div>
    </div>
  );
}