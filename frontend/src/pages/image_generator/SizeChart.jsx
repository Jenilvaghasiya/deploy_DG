import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, Plus, Settings } from "lucide-react";
// import Image from "next/image"
import placeholderImage from "../../assets/images/placeholder.svg";
import api, { api_server } from "../../api/axios";
import { generateVariationService } from "../../service/generateVariationService";
import { SelectImageTabs } from "../../components/SelectImageTabs";
import { multipartRequest } from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import useSocket from "../../hooks/useSocket";
import { useEffect } from "react";
import MeasurementList from "./MeasurementList";
import { MeasurementTable } from "./MeasurementTable";
import WhileYouWereAway from "./WhileYouWereAway";
import { markTaskAsSeen } from "../../features/auth/authService";
import { updateGeneratedImageStatus } from "../../features/imageGeneration/imageGeneration";
import { cn, hasPermission } from "../../lib/utils";
import ImageConflictModal from "./ImageConflictModal";
import { BsBookmark, BsCheck } from "react-icons/bs";
import LikeDislikeImage from "./LikeDislikeImage";
import { loadImageFromLocalStorage } from "@/utils/imageService";
import { handleUsageTimeEnd, handleUsageTimeStart } from "@/utils/usageTime";
import LensFlareEffect from "@/components/LensFlareEffect";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import TemplateListDialog from "./TemplateList";
import CreateSizeChartDialog from "./CreateSizeChartDialog";
import ApiTour from "@/components/Tour/ApiTour";
import { sizeChartTourSteps } from "@/components/Tour/TourSteps";
import { MeasurementsDialogViewer } from "./BackupMeasurementTableListing";
import { useCredits } from "@/hooks/useCredits";
const BASE_API_URL = import.meta.env.VITE_API_URL;
const garmentOptions = [
  {
    label: null,
    items: [{ value: "auto", label: "Auto-detect from image" }],
  },
  {
    label: "1. Tops",
    items: [
      { value: "t-shirt", label: "T-shirt" },
      { value: "shirt-formal", label: "Shirt (Formal)" },
      { value: "shirt-casual", label: "Shirt (Casual)" },
      { value: "shirt-flannel", label: "Shirt (Flannel)" },
      { value: "blouse", label: "Blouse" },
      { value: "tank-top", label: "Tank Top / Camisole" },
      { value: "polo-shirt", label: "Polo Shirt" },
      { value: "crop-top", label: "Crop Top" },
      { value: "tunic", label: "Tunic" },
      { value: "henley", label: "Henley" },
      { value: "sweatshirt", label: "Sweatshirt" },
      { value: "hoodie", label: "Hoodie" },
      { value: "tube-top", label: "Tube Top" },
      { value: "peplum-top", label: "Peplum Top" },
      { value: "kaftan-top", label: "Kaftan" },
    ],
  },
  {
    label: "2. Bottoms",
    items: [
      { value: "trousers-formal", label: "Trousers / Pants (Formal)" },
      { value: "trousers-chinos", label: "Trousers / Pants (Chinos)" },
      { value: "trousers-joggers", label: "Trousers / Pants (Joggers)" },
      { value: "jeans", label: "Jeans / Denim Pants" },
      { value: "leggings", label: "Leggings / Jeggings" },
      { value: "skirt-mini", label: "Skirt (Mini)" },
      { value: "skirt-midi", label: "Skirt (Midi)" },
      { value: "skirt-maxi", label: "Skirt (Maxi)" },
      { value: "skirt-pencil", label: "Skirt (Pencil)" },
      { value: "skirt-pleated", label: "Skirt (Pleated)" },
      { value: "skirt-skater", label: "Skirt (Skater)" },
      { value: "shorts-bermuda", label: "Shorts (Bermuda)" },
      { value: "shorts-cargo", label: "Shorts (Cargo)" },
      { value: "shorts-hot", label: "Shorts (Hot Pants)" },
      { value: "culottes", label: "Culottes" },
      { value: "palazzo-pants", label: "Palazzo Pants" },
      { value: "capris", label: "Capris / 3/4ths" },
    ],
  },
  {
    label: "3. Dresses & One-Piece Garments",
    items: [
      { value: "shift-dress", label: "Shift Dress" },
      { value: "aline-dress", label: "A-line Dress" },
      { value: "maxi-dress", label: "Maxi Dress" },
      { value: "bodycon-dress", label: "Bodycon Dress" },
      { value: "wrap-dress", label: "Wrap Dress" },
      { value: "ball-gown", label: "Ball Gown" },
      { value: "sheath-dress", label: "Sheath Dress" },
      { value: "shirt-dress", label: "Shirt Dress" },
      { value: "jumpsuit", label: "Jumpsuit" },
      { value: "playsuit", label: "Playsuit / Romper" },
      { value: "saree-gown", label: "Saree Gown" },
      { value: "kurti-dress", label: "Kurti Dress" },
    ],
  },
  {
    label: "4. Outerwear",
    items: [
      { value: "jacket-bomber", label: "Jacket (Bomber)" },
      { value: "jacket-puffer", label: "Jacket (Puffer)" },
      { value: "jacket-biker", label: "Jacket (Biker)" },
      { value: "jacket-denim", label: "Jacket (Denim)" },
      { value: "jacket-quilted", label: "Jacket (Quilted)" },
      { value: "blazer", label: "Blazer" },
      { value: "coat-trench", label: "Coat (Trench)" },
      { value: "coat-peacoat", label: "Coat (Peacoat)" },
      { value: "coat-overcoat", label: "Coat (Overcoat)" },
      { value: "coat-duffle", label: "Coat (Duffle)" },
      { value: "cape", label: "Cape / Poncho" },
      { value: "windcheater", label: "Windcheater" },
      { value: "raincoat", label: "Raincoat / Mac" },
      { value: "shrug", label: "Shrug" },
      { value: "kimono-jacket", label: "Kimono Jacket" },
    ],
  },
  {
    label: "5. Ethnic & Traditional Garments - Indian",
    items: [
      { value: "kurta-kurti", label: "Kurta / Kurti" },
      { value: "salwar-kameez", label: "Salwar Kameez" },
      { value: "lehenga-choli", label: "Lehenga Choli" },
      { value: "saree", label: "Saree" },
      { value: "dhoti", label: "Dhoti" },
      { value: "sherwani", label: "Sherwani" },
      { value: "anarkali", label: "Anarkali" },
      { value: "patiala-suit", label: "Patiala Suit" },
      { value: "churidar", label: "Churidar" },
    ],
  },
  {
    label: "5. Ethnic & Traditional Garments - Global",
    items: [
      { value: "kimono", label: "Kimono (Japan)" },
      { value: "hanbok", label: "Hanbok (Korea)" },
      { value: "dirndl", label: "Dirndl (Germany)" },
      { value: "qipao", label: "Cheongsam / Qipao (China)" },
      { value: "abaya", label: "Abaya / Jalabiya (Middle East)" },
      { value: "kaftan-traditional", label: "Kaftan (North Africa)" },
      { value: "dashiki", label: "Dashiki / Kente (West Africa)" },
      { value: "sarong", label: "Sarong / Lungi (SEA/South Asia)" },
    ],
  },
  {
    label: "6. Sportswear / Activewear",
    items: [
      { value: "tracksuit", label: "Tracksuit" },
      { value: "sports-bra", label: "Sports Bra" },
      { value: "performance-leggings", label: "Performance Leggings" },
      { value: "compression-shirt", label: "Compression Shirts" },
      { value: "gym-shorts", label: "Gym Shorts" },
      { value: "rashguard", label: "Rashguard" },
      { value: "swimwear-bikini", label: "Swimwear (Bikini)" },
      { value: "swimwear-one-piece", label: "Swimwear (One-piece)" },
      { value: "swimwear-trunks", label: "Swimwear (Trunks)" },
      { value: "swimwear-jammer", label: "Swimwear (Jammer)" },
      { value: "swimwear-board-shorts", label: "Swimwear (Board Shorts)" },
    ],
  },
  {
    label: "7. Loungewear & Sleepwear",
    items: [
      { value: "pajamas", label: "Pajamas" },
      { value: "nightgown", label: "Nightgown" },
      { value: "robe", label: "Robe / Bathrobe" },
      { value: "lounge-pants", label: "Lounge Pants" },
      { value: "sleepshirt", label: "Sleepshirt" },
      { value: "onesie", label: "Onesie" },
      { value: "kaftan-nightwear", label: "Kaftan Nightwear" },
      { value: "camisole-set", label: "Camisole and Shorts Set" },
    ],
  },
  {
    label: "8. Undergarments & Intimates",
    items: [
      { value: "bra-wired", label: "Bra (Wired)" },
      { value: "bra-sports", label: "Bra (Sports)" },
      { value: "bra-bralette", label: "Bra (Bralette)" },
      { value: "bra-bandeau", label: "Bra (Bandeau)" },
      { value: "panties-briefs", label: "Panties (Briefs)" },
      { value: "panties-bikini", label: "Panties (Bikini)" },
      { value: "panties-thong", label: "Panties (Thong)" },
      { value: "boxers", label: "Boxers / Trunks / Briefs (Men)" },
      { value: "undershirt", label: "Undershirt / Vest" },
      { value: "lingerie", label: "Lingerie" },
      { value: "shapewear", label: "Shapewear / Body Suit" },
    ],
  },
  {
    label: "9. Formalwear",
    items: [
      { value: "suit", label: "Suit" },
      { value: "tuxedo", label: "Tuxedo" },
      { value: "formal-gown", label: "Formal Gown / Evening Gown" },
      { value: "cocktail-dress", label: "Cocktail Dress" },
      { value: "waistcoat", label: "Waistcoat / Vest" },
      { value: "blazer-suit-set", label: "Blazer Suit Set" },
    ],
  },
];

const validationSchema = Yup.object({
  garmentImage: Yup.mixed().required("Please upload a garment image"),
  numberOfVariations: Yup.number()
    .min(1)
    .max(10)
    .required("Number of variations is required"),
  prompt: Yup.string().optional(),
  garmentType: Yup.string().required("Please select a garment type"),
  targetMarket: Yup.string().required("Please select a target market"),
  measurementUnit: Yup.string().required("Please select a measurement unit"),
  notes: Yup.string().required("Please enter custom size range"),
});

export default function SizeChart() {
  const { user } = useAuthStore();
  const { fetchCredits } = useCredits();
  const socketRef = useSocket(user);
  const [showPromptField, setShowPromptField] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [generatedVariations, setGeneratedVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const taskIdRef = useRef(null);
  const [imageFeedback, setImageFeedback] = useState({});
  const [measurementData, setMeasurementData] = useState(null);
  const [measurementTableData, setMeasurementTableData] = useState(null);
  const [sizeChartAllData, setSizeChartAllData] = useState(null);
  const [showCustomTolerance, setShowCustomTolerance] = useState(false);
  const [sizeChartId, setSizeChartId] = useState(null);
  const [aiTaskId, setAiTaskId] = useState(null);
  const [updatedImageUrls, setUpdatedImageUrls] = useState(new Set());
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const hasFinaliseImagePermission = hasPermission(permissionKeys, "ai-design-lab:ai-size-chart:finalise")
  const [taskStatus, setTaskStatus] = useState(null);
  const [conflictModalAndData, setConflictModalAndData] = useState({
    open: false,
    data: null,
  });
  const [pendingFormData, setPendingFormData] = useState(null);
  // const [conflictImageName, setConflictImageName] = useState("");
  const isTaskQueued = isGenerating || taskStatus === "queued";
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });
  const [data, setData] = useState({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // const
  // Add ref for scrolling to bottom
  const containerRef = useRef(null);
  const garmentLabelRef = useRef(null);


  const scrollToGarmentLabel = () => {
  garmentLabelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
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
    socket.on("task_update", handleTaskUpdate);

    handleUsageTimeStart({ socket, module: "size_chart" });
    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [socketRef]);



  const handleTaskUpdate = (data) => {
    if (data.task_id === taskIdRef.current) {
      if (data.status === "completed") {
        console.log("Task completed with data:", data);
         setPreviewInputState({
          open: false,
          galleryImageIds:
            data?.gallery_image_ids.length > 0 ? data?.gallery_image_ids : [],
        });
        setGeneratedVariations(data.result);
        setSizeChartId(data?.sizeChartId);
        setMeasurementTableData(data.measurements)
        setSizeChartAllData(data)
        markTaskAsSeen(data.task_id);
        // fetchTaskStatus(data.task_id);
        setAiTaskId(data.aiTaskId);
        setIsGenerating(false);
        setData(data);

        const socket = socketRef.current;
        handleUsageTimeEnd({ socket, module: "size_chart" });
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
      }
    } catch (error) {
      console.error("Failed to update image status:", error);
    }
  };

  const initialValues = {
    garmentImage: null,
    numberOfVariations: 1,
    showPromptField: false,
    prompt: "",
    garmentType: "auto",
    targetMarket: "",
    measurementUnit: "",
    notes: "",
    customToleranceEnabled: false,
    toleranceValues: {
      tolerance_chest: "0.5",
      tolerance_waist: "0.5",
      tolerance_hip:    "0.5",
      tolerance_length: "0.5",
      tolerance_sleeve: "0.5",
      tolerance_inseam: "0.25",
    },
    includeGrading: true,
    includeTolerance: true,
    internationalSizeConversion: false,
    galleryImageId: null,
    generatedImageUrl: null,
  };
console.log(measurementTableData, 'measurementTableDatameasurementTableData');

  // const handleImageUpload = (event, setFieldValue, imageData) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     setFieldValue("garmentImage", file);
  //     setFieldValue("prompt", "");
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //     const previewUrl = e.target.result;
  //     setFieldValue("imageData", imageData);
  //     setPreviewImage(previewUrl);
  //     setFieldValue("garmentImageUrl", previewUrl);

  //        // Scroll to bottom after image is loaded and preview is updated
  //       setTimeout(() => {
  //         scrollToGarmentLabel();
  //       }, 100);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
    console.log("extraMeta>>>>>>>", extraMeta)
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

  const handleGarmentTypeChange = (value) => {
    console.log(value, "garmenttype");
    if (value === "auto") return;
    api
      .post("/image-variation/get-garment-type-data", {
        garment_type: value,
      })
      .then((response) => {
        console.log(response, "logsss");
        if (response?.data?.data && response?.data?.data?.status === 'success') {
          setMeasurementData(response?.data?.data);
        }else{
          console.error("Failed to fetch measurement data:", response?.data?.message);
          setMeasurementData(null);
        }
      })
      .catch((e) => {
        console.error(e);
        setMeasurementData(null);
      });
  };

  const handleSubmit = async (values) => {
    console.log("=== FORM SUBMISSION DATA ===");
    console.log("All Form Values:", values);
    console.log("- garmentImage:", values.garmentImage);
    console.log("- numberOfVariations:", values.numberOfVariations);
    console.log("- showPromptField:", values.showPromptField);
    console.log("- prompt:", values.prompt);
    console.log("- garmentType:", values.garmentType);
    console.log("- targetMarket:", values.targetMarket);
    console.log("- measurementUnit:", values.measurementUnit);
    console.log("- notes (Custom Size Range):", values.notes);
    console.log("- customToleranceEnabled:", values.customToleranceEnabled);
    console.log("- toleranceValues:", values.toleranceValues);
    console.log("- includeGrading:", values.includeGrading);
    console.log("- includeTolerance:", values.includeTolerance);
    console.log(
      "- internationalSizeConversion:",
      values.internationalSizeConversion
    );
  console.log("=== END FORM DATA ===");
  
  setIsGenerating(true);
  
  const formData = new FormData();
  try {

    formData.append("image", values.garmentImage);
    formData.append("image_url", values.imageData?.url || "");
    formData.append("task_id", values.imageData?.id);
    formData.append("image_status", values.imageData?.status);
    formData.append("garment_type", values.garment_type || "auto");
    formData.append('market', values.targetMarket || "US");
    formData.append("unit", values.measurementUnit || "inches");
    formData.append("custom_size_range", values.notes || "");
    formData.append("include_grading", values?.includeGrading || false);
    formData.append("include_tolerance", values?.includeTolerance || false);
    formData.append("include_conversion", values?.internationalSizeConversion || false);
    
    if(values.customToleranceEnabled){
      formData.append("tolerance_chest", values.toleranceValues.tolerance_chest || "0.5");
      formData.append("tolerance_waist", values.toleranceValues.tolerance_waist || "0.5");
      formData.append("tolerance_hip", values.toleranceValues.tolerance_hip || "0.5");
      formData.append("tolerance_length", values.toleranceValues.tolerance_length || "0.5");
      formData.append("tolerance_sleeve", values.toleranceValues.tolerance_sleeve || "0.5");
      formData.append("tolerance_inseam", values.toleranceValues.tolerance_inseam || "0.5");
    }

    if (values.galleryImageId) {
      formData.append("galleryImageId", values.galleryImageId);
    }
    if (values.generatedImageUrl) {
      formData.append("generatedImageUrl", values.generatedImageUrl);
    }
    
    // Make the API call
    const response = await multipartRequest.post("/image-variation/generate-size-chart", formData);

    const { task_id } = response.data.data;
    taskIdRef.current = task_id;

       setTimeout(() => {
        scrollToGarmentLabel();
      }, 100);
    fetchCredits();
    // checkTaskStatus(task_id);
  } catch (err) {
    console.error("Error submitting variation task:", err,err.status === 409);
    setIsGenerating(false);
    
    if (err.status === 409) {
      // Handle conflict - image already exists
      // setConflictImageName(values.garmentImage?.name || "uploaded image");
      console.log("handling conflict")
      setPendingFormData(formData);
      setConflictModalAndData({
        open: true,
        data: err.response?.data || {},  // <-- backend response
      });
      setIsGenerating(false);
      return;
    }
    
     console.error("Error submitting task:", err?.response?.data?.message);
      alert(err?.response?.data?.message || "Something went wrong.");
  }
};

const handleConflictResolution = async (action) => {
  if (!pendingFormData) return;
  
  try {
    // Add the confirmation action to the form data
    pendingFormData.append("confirmation", action);
    
    // Retry the API call with the confirmation
    const response = await multipartRequest.post("/image-variation/generate-size-chart", pendingFormData);
    console.log(response.data, ' ppppppppppppp');
    
    const { task_id } = response.data.data;
    console.log("Task ID received after conflict resolution:", task_id);
    taskIdRef.current = task_id;
    
    // Close modal and reset state
    setConflictModalAndData({open: false, data: null});
    setPendingFormData(null);
    // setConflictImageName("");
    
  } catch (err) {
     console.error("Error submitting task:", err?.response?.data?.message);
      alert(err?.response?.data?.message || "Something went wrong.");
    setIsGenerating(false);
  }
};

  useEffect(() => {
    const fetchSizeChart = async () => {
      try {
        const response = await api.get("/image-variation/getSizeChart");
        const { data } = response.data;
        console.log("Fetched size chart:", data);
        // setMeasurementData(data);
      } catch (error) {
        console.error("Error fetching size chart:", error);
      }
    };

    fetchSizeChart();
  }, []);
console.log(measurementData, ' 44444444444444444444444444444444');

  const handleModalClose = () => {
  setConflictModalAndData({open: false, data: null});
  setPendingFormData(null);
  // setConflictImageName("");
  setIsGenerating(false);
};

  // Effect to scroll when variations are generated
  useEffect(() => {
    if (measurementTableData && Object.keys(measurementTableData).length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [measurementTableData]);

  return (
    <div className="h-20 grow flex flex-col relative z-10">
      {/* <ApiTour
        tourName="sizeChartTour" 
        steps={sizeChartTourSteps}
      /> */}
    <div className="w-full relative z-10 h-20 grow flex flex-col overflow-auto custom-scroll pb-6 sm:pb-10" ref={containerRef}>
      {/* Heading */}
      
        <WhileYouWereAway task_type='size_chart' updatedImageUrls={updatedImageUrls} handleImageStatusUpdate={handleImageStatusUpdate} hasFinaliseImagePermission={hasFinaliseImagePermission} setUpdatedImageUrls={setUpdatedImageUrls} setTaskStatus={setTaskStatus} mainHeading="Size Chart Generation in Queue" subText="Your recent size chart generation request is currently in the processing queue. Please wait until this task is completed before initiating a new request."/>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, handleChange, handleBlur, errors }) => {
              // Log values changes for debugging
              // console.log("Current Formik values:", values);
              // console.log("current errors", errors);

              useEffect(() => {
                loadImageFromLocalStorage("size-chart-image", setPreviewImage, setFieldValue);
              }, []);

            return (<>
                <div className="flex flex-wrap gap-4 select-image-tabs">
                  <SelectImageTabs handleImageUpload={handleImageUpload} setFieldValue={setFieldValue} />
                  {/* <Button variant={'dg_btn'} className={'mt-0.5'} onClick={() => setShowTemplateModal(true)}>New Size Chart</Button> */}
                </div>
                <Form className="space-y-2">

                  {/* Preview */}
                  <div className="space-y-1 !mt-3">
                    <label className="text-sm md:text-base text-white">
                      Preview:
                    </label>
                    <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                      <img
                        src={previewImage || placeholderImage}
                        alt="Garment preview"
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
                      className="flex items-center space-x-2  text-black hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] hover:text-white border-none"
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
                        className="w-full p-3 bg-black border border-black text-white rounded-lg resize-none placeholder-white"
                        rows={3}
                        placeholder="Enter additional prompt details..."
                      />
                      <ErrorMessage
                        name="prompt"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                  )}

                  {/* Select Garment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base font-medium text-white"  ref={garmentLabelRef}>
                      Garment Type
                    </Label>
                    <Select
                      value={values.garmentType}
                      onValueChange={(value) => {
                        console.log("Garment type changed to:", value);
                        setFieldValue("garmentType", value);
                        handleGarmentTypeChange(value);
                      }}
                    >
                      
                      <SelectTrigger className="w-full text-white border bg-white/10 border-white/35 [&>svg]:!text-white [&>svg]:!opacity-100">
                        <SelectValue placeholder="Auto-detect from image" />
                      </SelectTrigger>
                      <SelectContent
                        className="bg-black/25 backdrop-blur-xl text-white border border-solid border-white/35 max-h-[500px] overflow-y-auto"
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        <div
                          className="pr-2" 
                          style={{ 
                            maxHeight: '500px',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#9C25E6 #000',
                            scrollBehavior: 'smooth'
                          }}
                        >
                          {garmentOptions.map((group, idx) => (
                            <SelectGroup key={idx}>
                              {group.label && (
                                <SelectLabel className="text-white px-2 py-1">
                                  {group.label}
                                </SelectLabel>
                              )}
                              {group.items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>
                    <ErrorMessage
                      name="garmentType"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Target Market and Measurement Unit */}
                  <div className="grid grid-cols-2 gap-4 text-white">
                    <div className="space-y-2">
                      <Label htmlFor="target-market" className="text-sm font-medium">Target Market</Label>
                      <Select
                        value={values.targetMarket}
                        onValueChange={(value) => {
                          console.log("Target market changed to:", value);
                          setFieldValue("targetMarket", value);
                        }}
                      >
                        <SelectTrigger id="target-market" className="w-full text-white border bg-white/10 border-white/35 [&>svg]:!text-white [&>svg]:!opacity-100">
                          <SelectValue placeholder="Select target market" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/25 backdrop-blur-xl text-white border border-solid border-white/35">
                          <SelectItem value="US">US</SelectItem>
                          <SelectItem value="EU">EU</SelectItem>
                          <SelectItem value="UK">UK</SelectItem>
                          <SelectItem value="Asia">Asia</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="targetMarket"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="measurement-unit"
                        className="text-sm font-medium"
                      >
                        Measurement Unit
                      </Label>
                      <Select
                        value={values.measurementUnit}
                        onValueChange={(value) => {
                          console.log("Measurement unit changed to:", value);
                          setFieldValue("measurementUnit", value);
                        }}
                      >
                        <SelectTrigger id="measurement-unit" className="w-full text-white border bg-white/10 border-white/35 [&>svg]:!text-white [&>svg]:!opacity-100">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/25 backdrop-blur-xl text-white border border-solid border-white/35">
                          <SelectItem value="inches">Inches</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                        </SelectContent>
                      </Select>
                      <ErrorMessage
                        name="measurementUnit"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Custom Size Range */}
                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium text-white">
                      Custom Size Range
                    </label>
                    <Field
                      type="text"
                      name="notes"
                      placeholder="XXS, XS, S, M, L, XL, XXL"
                      className="text-sm w-full px-3 py-2 border bg-white/10 border-white/35 text-white rounded-md focus:outline-none"
                      onChange={(e) => {
                        console.log("Notes changed to:", e.target.value);
                        handleChange(e);
                      }}
                    />
                    <ErrorMessage
                      name="notes"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>

                  {/* Measurement Points Card */}
                  <div>
                    <Card className="bg-black/30 border-white/20">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">
                          Measurement Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Standard Measurement Points */}
                        <MeasurementList measurementData={measurementData} />
                        {/* Custom Measurement Points */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-white">
                            Standard Measurement Points
                          </Label>
                          <p className="text-sm text-gray-400">
                            Select a garment type or upload an image
                          </p>
                        </div>

                        <Button
                          type="button"
                          onClick={() =>
                            setShowCustomTolerance(!showCustomTolerance)
                          }
                        variant={'dg_btn'}
                        className={"sm: text-sm"}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Custom Tolerance Settings
                        </Button>

                        <div className="space-y-6">
                          {showCustomTolerance && (
                            <Card className="bg-black/25 border-black/25">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-white">
                                    Custom Tolerance Values
                                  </Label>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="custom-tolerance-switch"
                                      className={"cursor-pointer"}
                                      checked={values.customToleranceEnabled}
                                      onCheckedChange={(checked) => {
                                        console.log(
                                          "Custom tolerance enabled:",
                                          checked
                                        );
                                        setFieldValue(
                                          "customToleranceEnabled",
                                          checked
                                        );
                                      }}
                                    />
                                    <Label
                                      htmlFor="custom-tolerance-switch"
                                      className="text-sm text-white cursor-pointer"
                                    >
                                      {values.customToleranceEnabled
                                        ? "Enabled"
                                        : "Disabled"}
                                    </Label>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-white">
                                        Chest/Bust
                                      </Label>
                                      <Input
                                        value={values.toleranceValues.tolerance_chest}
                                        type="number"
                                        onChange={(e) => {
                                          console.log(
                                            "Chest/Bust tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_chest",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-300">
                                        Waist
                                      </Label>
                                      <Input
                                        type="number"
                                        value={values.toleranceValues.tolerance_waist}
                                        onChange={(e) => {
                                          console.log(
                                            "Waist tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_waist",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-300">
                                        Hip
                                      </Label>
                                      <Input
                                        value={values.toleranceValues.tolerance_hip}
                                        type="number"
                                        onChange={(e) => {
                                          console.log(
                                            "Hip tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_hip",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-300">
                                        Length
                                      </Label>
                                      <Input
                                        value={values.toleranceValues.tolerance_length}
                                        type="number"
                                        onChange={(e) => {
                                          console.log(
                                            "Length tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_length",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-300">
                                        Sleeve
                                      </Label>
                                      <Input
                                        value={values.toleranceValues.tolerance_sleeve}
                                        type="number"
                                        onChange={(e) => {
                                          console.log(
                                            "Sleeve tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_sleeve",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-gray-300">
                                        Shoulder
                                      </Label>
                                      <Input
                                        value={values.toleranceValues.tolerance_inseam}
                                        type="number"
                                        onChange={(e) => {
                                          console.log(
                                            "Shoulder tolerance changed to:",
                                            e.target.value
                                          );
                                          setFieldValue(
                                            "toleranceValues.tolerance_inseam",
                                            e.target.value
                                          );
                                        }}
                                        disabled={!values.customToleranceEnabled}
                                        className={`h-8 text-sm bg-black/50 border-white/30 text-white ${
                                          !values.customToleranceEnabled
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      type="button"
                                      variant="dg_btn"
                                      size="sm"
                                      onClick={() => {
                                        setFieldValue("toleranceValues", {
                                          tolerance_chest: "0.5",
                                          tolerance_waist: "0.5",
                                          tolerance_hip: "0.5",
                                          tolerance_length: "0.5",
                                          tolerance_sleeve: "0.5",
                                          tolerance_inseam: "0.25",
                                        });
                                      }}
                                      disabled={!values.customToleranceEnabled}
                                      className={cn(!values.customToleranceEnabled ? "opacity-50 cursor-not-allowed" : "")}
                                    >
                                      Reset to defaults
                                    </Button>
                                  </div>

                                  {values.customToleranceEnabled && (
                                    <div className="flex items-center space-x-2 text-sm text-green-400">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span>
                                        Custom tolerance values will be applied
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Checkboxes */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="include-grading"
                                className={"cursor-pointer"}
                                checked={values.includeGrading}
                                onCheckedChange={(checked) => {
                                  console.log(
                                    "Include grading changed to:",
                                    checked
                                  );
                                  setFieldValue("includeGrading", checked);
                                }}
                              />
                              <Label
                                htmlFor="include-grading"
                                className="text-sm text-white cursor-pointer"
                              >
                                Include Grading{" "}
                                <span className="text-gray-400">
                                  (size differences)
                                </span>
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="include-tolerance"
                                className={"cursor-pointer"}
                                checked={values.includeTolerance}
                                onCheckedChange={(checked) => {
                                  console.log(
                                    "Include tolerance changed to:",
                                    checked
                                  );
                                  setFieldValue("includeTolerance", checked);
                                }}
                              />
                              <Label
                                htmlFor="include-tolerance"
                                className="text-sm text-white cursor-pointer"
                              >
                                Include Tolerance{" "}
                                <span className="text-gray-400">
                                  (allowed variations)
                                </span>
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="international-size"
                                className={"cursor-pointer"}
                                checked={values.internationalSizeConversion}
                                onCheckedChange={(checked) => {
                                  console.log(
                                    "International size conversion changed to:",
                                    checked
                                  );
                                  setFieldValue(
                                    "internationalSizeConversion",
                                    checked
                                  );
                                }}
                              />
                              <Label
                                htmlFor="international-size"
                                className="text-sm text-white cursor-pointer"
                              >
                                International Size Conversion
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Generate Button */}
                  <div className="flex flex-col items-center !mb-5 gap-2">
                  <Button
                      type="submit"
                      disabled={isGenerating || taskStatus === "queued"}
                      className="max-w-48 mx-auto border-2 border-solid border-gray-400 rounded-lg w-full text-white text-center text-lg font-medium py-2 p-3 transition-all duration-200 ease-linear min-h-12 flex items-center justify-center gap-2 hover:bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit"
                    >
                      Generate Size Chart
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
              Size chart generation in progress...
            </div>
          )}
      

          {/* BACKUP  */}
        {/* <MeasurementsDialogViewer measurementTableData={measurementTableData}/>  */}
        {/* Generated Variations */}
        {measurementTableData && Object.keys(measurementTableData).length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white text-left py-3 px-10 bg-black/25 rounded-t-lg">
              Your Generated Size Chart
            </h2>
            <div className="relative">
              <LensFlareEffect/>
              <div className="relative z-10 p-6">
                <div className="flex flex-wrap gap-4 overflow-auto custom-scroll justify-center">
                  {/* {generatedVariations.map((variation, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden border-shadow-blur rounded-xl"
                    >
                      <CardContent className="p-0">
                        <div className="relative after:block after:pt-[100%]">
                          <img
                            src={`${BASE_API_URL}/genie-image/${variation}` || placeholderImage}
                            alt={`Variation ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full absolute top-0 left-0 max-w-full object-cover"
                          />
                        </div>
                        {!updatedImageUrls.has(variation) && (
                          <div className="p-4 flex justify-center gap-1 flex-wrap">
                            <Button 
                              variant="outline"
                              className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
                              onClick={() =>
                                handleImageStatusUpdate({
                                  aiTaskId,
                                  newStatus: "saved",
                                  imageUrl: variation,
                                })
                              }
                            >
                              <BsBookmark size={14} />
                              <span className="ml-1">Save for Later</span>
                            </Button>
                            
                            {hasFinaliseImagePermission && <Button 
                              variant="outline"
                              className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
                              onClick={() =>
                                handleImageStatusUpdate({
                                  aiTaskId,
                                  newStatus: "finalized",
                                  imageUrl: variation,
                                })
                              }
                            >
                                <BsCheck size={14} />
                              <span span className="ml-1">Finalise</span>
                            </Button>}
                            <LikeDislikeImage imageFeedback={imageFeedback} setImageFeedback={setImageFeedback} variation={variation} setUpdatedImageUrls={setUpdatedImageUrls}/>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))} */}
                  <div className="bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl shadow-xl p-4">
                    <MeasurementTable 
                      measurements={measurementTableData} 
                      tolerance={sizeChartAllData?.tolerance || []}
                      grading_rules={sizeChartAllData?.grading_rules || []}
                      size_conversion={sizeChartAllData?.size_conversion || []}
                      setMeasurement={setMeasurementTableData} 
                      sizeChartId={sizeChartId}    
                      isAIGenerated={true} 
                      customButton={
                          <Button
                            onClick={() => {
                              setPreviewInputState((prev) => ({
                                ...prev,
                                open: true,
                              }));
                            }}
                            disabled={previewInputState.galleryImageIds.length === 0}
                            variant="dg_btn"
                            title="Input Image(s)"
                          >
                            <BsImages className="w-4 h-4" />
                            <span>
                              View linked{" "}
                              {previewInputState.galleryImageIds.length > 1
                                ? "Images"
                                : "Image"}
                            </span>
                          </Button>
                        }
                      otherData={data}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <InputImagePreviewDialog
        open={previewInputState.open}
        galleryImageIds={previewInputState.galleryImageIds}
        setOpen={(show) =>
          setPreviewInputState((prev) => ({ ...prev, open: show }))
        }
      />
      <ImageConflictModal
        isOpen={conflictModalAndData.open}
        data={conflictModalAndData.data} 
        onClose={handleModalClose}
        onConfirm={handleConflictResolution}
        setIsGenerating={setIsGenerating}
      />

      {/* <TemplateListDialog
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={(tpl) => {
          setSelectedTemplate(tpl);
          // setShowTemplateModal(false);
          setShowCreateModal(true);
        }}
        onCreateManual={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setShowCreateModal(true);
        }}
      /> */}

      <CreateSizeChartDialog
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)  
          fetchSizeCharts()
        }}
        initialData={selectedTemplate || {}}
      />
    </div>
  );
}
