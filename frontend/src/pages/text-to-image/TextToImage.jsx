// import React, { useEffect, useState } from 'react'
// import Button from '../../components/Button'
// import ContextMenu from './ContextMenu'
// import ShirtCard from './ShirtCard'
// import { api_server } from '../../api/axios'
// const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;
// const TextToImage = () => {
//   const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, shirtId: null });
//   const [shirts, setShirts] = useState([]);
//   const [description, setDescription] = useState('');
//   const [variations, setVariations] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [engine, setEngine] = useState("openai");
//   const handleClickOutside = () => {
//     setContextMenu({ visible: false, x: 0, y: 0, shirtId: null });
//   };

//     const handleGenerate =  async () => {

//       // Simulate generating shirts based on the number of variations
//       // const newShirts = Array.from({ length: variations }, (_, index) => ({
//       //   id: `${index + 1}`,
//       //   image: `shirt-image-${index + 1}.png`, // Simulated image data
//       // }));
//       // setShirts(newShirts);
//       try {
//     setLoading(true);
//       console.log(api_server.defaults.baseURL);

//     const response = await api_server.post(`/generate/create`, {
//       prompt: description,
//       use_case:"text_to_image",
//       variant_count:variations
//     });
//     const { images } = response.data;

//     // Map the API response images to the newShirts array
//     const newShirts = Array.from({ length: variations }, (_, index) => ({
//       id: `${index + 1}`,
//       image: API_SERVER_URL+"/"+images[index] || `shirt-image-${index + 1}.png`, // Fallback if image is missing
//     }));

//     setShirts(newShirts);
//     // setCurrentProject(response.data.data);
//     // setLoading(false);
//   } catch (err) {
//     console.error("Failed to fetch project details:", err);
//     // setLoading(false);
//   }finally {
//     setLoading(false); // Stop loader
//   }
//   };

//   useEffect(() => {
//     document.addEventListener('click', handleClickOutside);
//     return () => {
//       document.removeEventListener('click', handleClickOutside);
//     };
//   }, []);
//   return (
//     <div className="min-h-screen text-white p-6 flex flex-col lg:flex-row">
//       {/* Entry Form (Top on small screens, Left on large screens) */}
//       <div className="w-full lg:w-1/3 lg:pr-6 mb-6 lg:mb-0">
//         <h2 className="text-lg mb-4">Describe Your Creation In Detail</h2>
//         <div className="mb-4">
//           <label className="block mb-2">Select AI Engine</label>
//           <select
//             className="w-full p-2 px-3 bg-gray-500 text-white rounded-xl"
//             value={engine}
//             onChange={(e) => setEngine(e.target.value)}
//           >
//             <option value="openai">OpenAI</option>
//             <option value="stable_fusion">Stable Fusion</option>
//           </select>
//         </div>

//         <textarea className="w-full h-40 p-3 bg-gray-500 text-white rounded-xl mb-4" placeholder="Create design for Mens Long Sleeves shirt with Crimson Tatar Embroidery styling" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
//         <div className="mb-4">
//           <label className="block mb-2">Number Of Variations</label>
//           <select className="w-full p-2 px-3 bg-gray-500 text-white rounded-xl" value={variations} onChange={(e) => setVariations(parseInt(e.target.value))}>
//             <option value="1">1</option>
//             <option value="2">2</option>
//             <option value="3">3</option>
//             <option value="4">4</option>
//             <option value="5">5</option>
//           </select>
//         </div>
//         <div className="mb-4">
//           <label className="block text-purple-400 mb-2">FAQS</label>
//           <p className="text-gray-300 text-sm">How do I generate designs? Simply describe your design in the textarea, select the number of variations, and click "Generate". <br /> Can I edit the designs? Yes, right-click on a design to access the edit options.</p>
//         </div>
//         <div className="flex justify-center items-center">
//           <Button variant="primary" onClick={handleGenerate} fullWidth={false}>{loading ? 'Generating...' : 'Generate'}</Button>
//         </div>
//       </div>

//         {/* Shirt Placeholders (Bottom on small screens, Right on large screens) */}
//         <div className="w-full lg:w-2/3 relative">
//         {loading ? (
//       <div className="absoluteEU flex justify-center items-center absolute inset-0 bg-black bg-opacity-50">
//         <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
//       </div>
//       ) :shirts.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             {shirts.map((shirt) => (
//               <ShirtCard key={shirt.id} id={shirt.id} image={shirt.image} setContextMenu={setContextMenu} />
//             ))}
//           </div>
//         ) : (
//           <div className="text-center text-white block max-w-2/4 w-full mx-auto">No designs generated yet. Click "Generate" to create your shirt designs.</div>
//         )}
//       </div>

//       {/* Context Menu */}
//       <ContextMenu contextMenu={contextMenu} setContextMenu={setContextMenu} />
//     </div>
//   )
// }

// export default TextToImage















/////////////////



import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Yup from "yup";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import api, { api_server } from "../../api/axios";
import useSocket from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import WhileYouWereAway from "../image_generator/WhileYouWereAway";
import { markTaskAsSeen } from "../../features/auth/authService";
import { updateGeneratedImageStatus } from "../../features/imageGeneration/imageGeneration";
import { hasPermission } from "../../lib/utils";
import { BsBookmark, BsCheck } from "react-icons/bs";
import LikeDislikeImage from "../image_generator/LikeDislikeImage";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import LensFlareEffect from "@/components/LensFlareEffect";
import SmartImage from "@/components/SmartImage";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "react-hot-toast";
import UseImageModalButton from "@/components/Common/UseImageModalButton";
import SmartContextImage from "@/components/Common/SmartContextImage";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import GeneratedImageContainer from "../image_generator/GeneratedImageContainer";
import { textToSketchTourSteps } from "@/components/Tour/TourSteps";
import ApiTour from "@/components/Tour/ApiTour";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const validationSchema = Yup.object({
  aiEngine: Yup.string().required("Please select an AI engine"),
  prompt: Yup.string().required("Description is required"),
  numberOfVariations: Yup.number()
    .min(1)
    .max(10)
    .required("Number of variations is required"),
  advanced_prompt: Yup.string().optional(),
});

export default function TextToImage() {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const taskIdRef = useRef(null);
  const [imageFeedback, setImageFeedback] = useState({});
  const [showPromptField, setShowPromptField] = useState(false);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const { fetchCredits } = useCredits();
  const permissionKeys = permissions.map((p) => p.key);
  const hasFinaliseImagePermission = hasPermission(
    permissionKeys,
    "ai-design-lab:text-to-image:finalise"
  );
  const [taskStatus, setTaskStatus] = useState(null);
  const containerRef = useRef(null);
  const [imageStatuses, setImageStatuses] = useState({});

  // Function to scroll to bottom smoothly
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const isTaskQueued = isGenerating || taskStatus === "queued";

  // Real-time socket listener
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on("task_update", handleTaskUpdate);
    handleUsageTimeStart({ socket, module: "text_to_image" });

    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);


  const handleTaskUpdate = (data) => {
    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        setGeneratedVariations(data.result);
        setIsGenerating(false);
        markTaskAsSeen(data.task_id);
        setAiTaskId(data.aiTaskId);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "text_to_image" });

      } else if (data.status === "failed") {
        alert("Image generation failed. Please try again.");
        setIsGenerating(false);
      }
    }
  };

  useEffect(() => {
    if (generatedVariations.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [generatedVariations]);

  const handleImageStatusUpdate = async ({ aiTaskId, newStatus, imageUrl }) => {
    try {
      const response = await updateGeneratedImageStatus({
        aiTaskId,
        newStatus,
        imageUrl,
      });
      if (response.status === 200) {
        setUpdatedImageUrls((prev) => new Set(prev).add(imageUrl));
        setImageStatuses(prev => ({ ...prev, [imageUrl]: newStatus }));
        fetchCredits();
      }
    } catch (error) {
      console.log('error',error?.response?.data?.message)
      toast.error(error?.response?.data?.message || "Something went wrong.");
      console.error("Failed to update image status:", error);
    }
  };

  const initialValues = {
    aiEngine: "openai",
    prompt: "",
    advanced_prompt: "",
    numberOfVariations: 1,
    showPromptField: false,
  };

  const handleSubmit = async (values) => {
    setIsGenerating(true);
    // setGeneratedVariations([]);

    try {
      const response = await api.post("/image-variation/text-to-image/create", {
        engine: values.aiEngine,
        prompt: values.prompt,
        use_case: "text_to_sketch",
        variant_count: values.numberOfVariations,
        advanced_prompt: values.advanced_prompt || "",
      });

      const { task_id } = response.data.data;
      taskIdRef.current = task_id;
    } catch (err) {
      console.error("Error submitting text-to-sketch task:", err);
      alert("Something went wrong generating images.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-20 grow flex flex-col relative">
      <ApiTour
        tourName="textToSketchTour" 
        steps={textToSketchTourSteps}
      />
      <div className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll" ref={containerRef}>
        <div className="p-4 lg:p-8 2xl:px-10">
          <WhileYouWereAway
            task_type="text_to_image"
            updatedImageUrls={updatedImageUrls}
            handleImageStatusUpdate={handleImageStatusUpdate}
            hasFinaliseImagePermission={hasFinaliseImagePermission}
            setUpdatedImageUrls={setUpdatedImageUrls}
            setTaskStatus={setTaskStatus}
            imageStatuses={imageStatuses}
          />
          {/* Heading */}
          <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left mb-2">Text to Sketch</h1>
          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ values, setFieldValue }) => (
              <Form className="space-y-4">
                {/* Prompt Field */}
                <div className="space-y-2">
                  <Field name="prompt" as="textarea" className="w-full p-3 border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur text-white resize-none placeholder-zinc-300" rows={5} placeholder="Describe your garment in detail..." />
                  <ErrorMessage
                    name="prompt"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>

                {/* Show Advance Prompt Field Button */}
                {/* <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPromptField(!showPromptField);
                      setFieldValue("showPromptField", !showPromptField);
                    }}
                    className="flex items-center space-x-2  text-white hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] hover:text-white border-none">
                    <Plus className="w-4 h-4" />
                    <span>Show Advance Prompt Field</span>
                  </Button>
                </div> */}

                {/* Prompt Field (conditionally shown) */}
                {showPromptField && (
                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium text-white">Avance Prompt</label>
                    <Field name="advanced_prompt" as="textarea" className="w-full p-3 bg-black/15 border border-solid border-zinc-600 text-white rounded-lg resize-none placeholder-white" rows={3} placeholder="Enter additional prompt details..." />
                    <ErrorMessage name="advanced_prompt" component="div" className="text-red-500 text-sm" />
                  </div>
                )}

                {/* Select AI Engine */}
                {/* <div className="space-y-2">
                  <label className="text-sm md:text-base font-medium text-white">
                    Select AI Engine
                  </label>
                  <Select
                    value={values.aiEngine}
                    onValueChange={(value) => setFieldValue("aiEngine", value)}
                  >
                    <SelectTrigger className="w-full text-white border bg-black">
                      <SelectValue placeholder="Select an AI Engine" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="stable_diffusion">Stable Fusion</SelectItem>
                    </SelectContent>
                  </Select>
                  <ErrorMessage name="aiEngine" component="div" className="text-red-500 text-sm" />
                </div> */}

                {/* Number of Variations */}
                <div className="space-y-2 dg-sider-bg-range variations-select">
                  <div className="space-y-1 !mt-3">
                    <label
                      htmlFor="numberOfVariations"
                      className="text-white font-medium"
                    >
                      Number of Variations
                    </label>
                    <Field name="numberOfVariations">
                      {({ field }) => (
                        <input
                          {...field}
                          type="number"
                          id="numberOfVariations"
                          min={1}
                          max={2}
                          step={1}
                          name="numberOfVariations"
                          onChange={(e) =>
                            setFieldValue(
                              "numberOfVariations",
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 text-white bg-white/10 border border-solid border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </Field>
                    <div className="text-sm text-zinc-400">
                      From 1 to 2 variations
                    </div>
                  </div>
                </div>

                {/* Information Text */}
                <div className="mb-4">
                  <label className="block text-purple-400 mb-2">FAQS</label>
                  <p className="text-gray-300 text-sm">How do I generate designs? Simply describe your design in detail, select the number of variations, and click "Generate".
                    <br />
                    Can I edit the designs? Yes, right-click on a design to access edit options.
                  </p>
                </div>

                {/* Generate Button */}
                <div className="flex flex-col items-center !mb-5 gap-2">
                  <Button
                    type="submit"
                    disabled={isTaskQueued}
                    className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                  >
                    {isTaskQueued ? "Generating..." : "Generate Images"}
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
            )}
          </Formik>

          {isGenerating && (
            <div className="fixed bottom-0 align-middle left-0 right-0 bg-white text-center py-4 z-50 border-t border-purple-700">Sketch generation in progress...</div>
          )}
      </div>

        {/* Generated Variations */}
        {generatedVariations.length > 0 && (
        //  <>
        //     <h2 className="text-2xl font-bold text-white text-left py-3 px-10 bg-black/25 rounded-t-lg">Your Generated Images</h2>
        //     <div className="relative">
        //       <LensFlareEffect/>
        //       <div className="relative z-10 p-6">
        //         <div className="flex flex-wrap justify-center items-stretch gap-4">
        //           {generatedVariations.map((variation, index) => (
        //             <Card
        //               key={index}
        //               className="!bg-white/75 overflow-hidden border-shadow-blur rounded-xl grow w-full sm:w-1/3 md:w-1/4 xl:w-1/5 sm:max-w-1/2 md:max-w-1/3 xl:max-w-1/4 py-0"
        //             >
        //               <CardContent className="p-0">
        //                 <div className="relative after:block after:pt-[100%]">
        //                 <SmartContextImage
        //                     src={`${BASE_API_URL}/genie-image/${variation}` || placeholderImage}
        //                     alt={`Variation ${index + 1}`}
        //                     className="w-full h-full absolute top-0 left-0 max-w-full object-cover"
        //                     variation={variation}
        //                     aiTaskId={aiTaskId}
        //                     hasFinaliseImagePermission={hasFinaliseImagePermission}
        //                     setImageFeedback={setImageFeedback}
        //                     imageFeedback={imageFeedback}
        //                     setUpdatedImageUrls={setUpdatedImageUrls}
        //                     onSaveImage={() =>
        //                       handleImageStatusUpdate({
        //                         aiTaskId,
        //                         newStatus: "saved",
        //                         imageUrl: variation,
        //                       })
        //                     }
        //                     onFinaliseImage={() =>
        //                       handleImageStatusUpdate({
        //                         aiTaskId,
        //                         newStatus: "finalized",
        //                         imageUrl: variation,
        //                       })
        //                     }
        //                     onViewInputImages={() => {
        //                       if (!data?.latestTask?.gallery_image_ids?.length) return;
        //                       setPreviewInputState({
        //                         open: true,
        //                         galleryImageIds: data.latestTask.gallery_image_ids,
        //                       });
        //                     }}
        //                     hasGalleryImages={false}
        //                   />

        //                 </div>
        //                 {!updatedImageUrls.has(variation) && (
        //                   <div className="p-4 flex flex-wrap justify-center gap-1">
        //                     <Button
        //                       variant="outline"
        //                       className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
        //                       onClick={() =>
        //                         handleImageStatusUpdate({
        //                           aiTaskId,
        //                           newStatus: "saved",
        //                           imageUrl: variation,
        //                         })
        //                       }
        //                     >
        //                       <BsBookmark size={14} />
        //                       <span className="ml-1">Save for Later</span>
        //                     </Button>

        //                     {hasFinaliseImagePermission && (
        //                       <Button
        //                         variant="outline"
        //                         className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
        //                         onClick={() =>
        //                           handleImageStatusUpdate({
        //                             aiTaskId,
        //                             newStatus: "finalized",
        //                             imageUrl: variation,
        //                           })
        //                         }
        //                       >
        //                         <BsCheck size={14} />
        //                         <span span className="ml-1">
        //                           Finalise
        //                         </span>
        //                       </Button>
        //                     )}
        //                     {/* <UseImageModalButton aiTaskId={aiTaskId} imageUrl={variation}/> */}
        //                     <LikeDislikeImage
        //                       imageFeedback={imageFeedback}
        //                       setImageFeedback={setImageFeedback}
        //                       variation={variation}
        //                       setUpdatedImageUrls={setUpdatedImageUrls}
        //                     />
        //                   </div>
        //                 )}
        //               </CardContent>
        //             </Card>
        //           ))}
        //         </div>
        //       </div>
        //     </div>
        //  </>

          <GeneratedImageContainer generatedVariations={generatedVariations} aiTaskId={aiTaskId} updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} imageStatuses={imageStatuses} />
        )}
      </div>
    </div>
  );
}
