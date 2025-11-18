// CreateTechPack.jsx
import React, { useState, useRef } from "react";
import TechPacksDisplay from "@/components/TechPack/TechPacksDisplay";
import { SelectImageTabs } from "@/components/SelectImageTabs";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Upload, 
  Image as ImageIcon, 
  FileText,
  ArrowRight,
  Sparkles
} from "lucide-react";
import placeholderImage from "@/assets/images/placeholder.svg";
import SmartImage from "@/components/SmartImage";
import { toast } from "react-hot-toast";
import api from "@/api/axios";

const CreateTechPack = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1); // Step 1: Image, Step 2: Tech Pack Form
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(placeholderImage);
  const [techPackFormData, setTechPackFormData] = useState({});
  const [imageMetadata, setImageMetadata] = useState({
    galleryImageId: null,
    generatedImageUrl: null,
    uploadedFile: null,
  });

  // const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
  //   const file = event.target?.files?.[0] || event;
    
  //   if (file) {
  //     // Validate file size
  //     if (file.size > 10 * 1024 * 1024) {
  //       toast.error("File size must be less than 10MB");
  //       return;
  //     }

  //     setSelectedImage(file);
      
  //     // Store metadata based on source
  //     const metadata = {
  //       galleryImageId: extraMeta.galleryImageId || null,
  //       generatedImageUrl: extraMeta.generatedImageUrl || null,
  //       uploadedFile: file,
  //     };
  //     setImageMetadata(metadata);

  //     // Create preview
  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       setPreviewImage(e.target.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleProceedToForm = () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }
    setCurrentStep(2);
  };

  const handleBackToImageSelection = () => {
    setCurrentStep(1);
  };

const handleSaveTechPack = async (techPackData) => {
  try {
    console.log("🚀 CreateTechPack handleSaveTechPack called");
    
    // Create FormData instance
    const formData = new FormData();
    
    // Prepare the tech pack data payload
    const techPackPayload = {
      task_id: techPackData.task_id,
      status: "queued",
      generation_source: "manual",
      tech_pack: techPackData.tech_pack,
      analysis: {
        construction_analysis: {
          closures: [],
          finishing: [],
          pockets: [],
          seams: [],
          special_construction: [],
          stitching: []
        },
        description: "",
        fabric_analysis: {
          care_instructions: [],
          color: "",
          composition: "",
          construction: "",
          weight: ""
        },
        garment_type: techPackData.tech_pack.product_overview.garment_type || "",
        gender: techPackData.tech_pack.product_overview.gender || "",
        packaging_analysis: {
          special_requirements: []
        }
      },
      notes: techPackData?.notes || []
    };
    
    // Add the tech pack data as JSON string
    formData.append("tech_pack_data", JSON.stringify(techPackPayload));

    // ✅ ADD UPLOADED FILES TO FORMDATA
    if (techPackData.uploadedFiles && techPackData.uploadedFiles.length > 0) {
      console.log(`📎 Adding ${techPackData.uploadedFiles.length} files to upload`);
      techPackData.uploadedFiles.forEach((file) => {
        formData.append("files", file);
      });
    }

    // Handle main image
    if (imageMetadata.uploadedFile) {
      formData.append("image", imageMetadata.uploadedFile);
    }
    
    // Add image source metadata
    if (imageMetadata.galleryImageId) {
      formData.append("galleryImageId", imageMetadata.galleryImageId);
    } else if (imageMetadata.generatedImageUrl) {
      formData.append("generatedImageUrl", imageMetadata.generatedImageUrl);
    } else if (imageMetadata.projectImageUrl) {
      formData.append("projectImageUrl", imageMetadata.projectImageUrl);
      if (imageMetadata.projectImageId) {
        formData.append("projectImageId", imageMetadata.projectImageId);
      }
    }

    console.log("📤 Creating tech pack via FormData with files...");

    // Make the API call
    const response = await api.post('/image-variation/tech-packs/create-manual', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    let savedTechPack = response.data?.data;
    
    console.log("✅ Tech Pack created:", savedTechPack?._id);
    console.log(`📎 Files uploaded: ${savedTechPack?.uploaded_files_count || 0}`);
    toast.success('Tech Pack created successfully!');
    
    // Attach BOM if exists
    if (techPackData.bom && savedTechPack?._id) {
      try {
        console.log("🔧 Starting BOM attachment for new tech pack:", savedTechPack._id);
        
        const bomToSend = {
          structure: techPackData.bom.structure || 'single',
          viewType: techPackData.bom.viewType || 'table',
          flatItems: techPackData.bom.flatItems || [],
          sections: techPackData.bom.sections || [],
          inheritedWastageAllowance: techPackData.bom.inheritedWastageAllowance || 0,
          inheritedIncludeCost: techPackData.bom.inheritedIncludeCost !== false,
          grandTotal: techPackData.bom.grandTotal || 0,
        };
        
        const bomResponse = await api.post(
          `/image-variation/tech-packs/${savedTechPack._id}/bom/create`, 
          bomToSend,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        console.log("✅ BOM attached successfully:", bomResponse.status);
        toast.success("BOM attached successfully!");
        
        await new Promise(r => setTimeout(r, 500));
        
        const refetchResponse = await api.get(`/image-variation/tech-packs/${savedTechPack._id}`);
        savedTechPack = refetchResponse.data?.data;
        
        console.log("🔄 Refetched - has BOM:", !!savedTechPack.bom);
        
      } catch (bomError) {
        console.error("❌ BOM attachment failed:", bomError.response?.data || bomError.message);
        toast.error("Tech Pack created but BOM attachment failed. You can add it later.");
      }
    }
    
    // Navigate back to listing
    onBack();
    
  } catch (error) {
    console.error('💥 Error creating tech pack:', error);
    toast.error(error?.response?.data?.message || 'Failed to create tech pack. Please try again.');
  }
};

// Update the handleImageUpload function to properly capture metadata
const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
  const file = event.target?.files?.[0] || event;
  
  if (file) {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedImage(file);
    
    // Store metadata based on source
    const metadata = {
      galleryImageId: extraMeta.galleryImageId || null,
      generatedImageUrl: extraMeta.generatedImageUrl || null,
      uploadedFile: file,
      projectImageUrl: extraMeta.projectImageUrl || null,
      projectImageId: extraMeta.projectImageId || null,
    };
    setImageMetadata(metadata);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

  // Step 1: Image Selection
  if (currentStep === 1) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="outline" 
              className="mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20" 
              onClick={onBack}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Tech Packs
            </Button>
            
            <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create New Tech Pack
              </h1>
              <p className="text-gray-300">
                Step 1: Select a source image for your tech pack
              </p>
            </div>
          </div>

          {/* Image Selection */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Select Source Image
              </h2>
              
              {/* SelectImageTabs Integration */}
              <SelectImageTabs
                handleImageUpload={handleImageUpload}
                setFieldValue={(field, value) => {
                  // Handle field value setting if needed
                  console.log('Field:', field, 'Value:', value);
                }}
              />

              {/* Image Preview */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Preview:</label>
                <div className="border-2 border-dashed border-white/30 rounded-xl overflow-hidden bg-black/20">
                  <SmartImage
                    src={previewImage}
                    alt="Selected image preview"
                    width={800}
                    height={400}
                    className="w-full h-96 object-contain"
                  />
                </div>
                {selectedImage && (
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>
                      {imageMetadata.galleryImageId && "Source: Gallery"}
                      {imageMetadata.generatedImageUrl && "Source: Generated"}
                      {!imageMetadata.galleryImageId && !imageMetadata.generatedImageUrl && "Source: Upload"}
                    </span>
                    <span>{selectedImage.name || "Image selected"}</span>
                  </div>
                )}
              </div>

              {/* Proceed Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleProceedToForm}
                  disabled={!selectedImage}
                  className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Tech Pack Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Tips for Best Results
            </h3>
            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
              <li>Select a clear, high-quality image of the garment</li>
              <li>Front view images work best for accurate tech pack generation</li>
              <li>Ensure the garment is well-lit and clearly visible</li>
              <li>You can select from gallery, generated images, or upload your own</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Tech Pack Form
  return (
    <div className="min-h-screen ">
      {/* Step Indicator */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToImageSelection}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Change Image
            </Button>
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm text-gray-400">Step 2:</span>
              <span className="font-semibold">Tech Pack Details</span>
            </div>
          </div>
          
          {/* Mini Preview */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Source Image:</span>
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/20">
              <SmartImage
                src={previewImage}
                alt="Source"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tech Pack Form */}
      <TechPacksDisplay
        mode="create"
        onBack={onBack}
        onSave={handleSaveTechPack}
        isEditable={true}
        onDataChange={(updatedData) => setTechPackFormData(updatedData)}
      />
    </div>
  );
};

export default CreateTechPack;