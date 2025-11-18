import { multipartRequest } from "@/api/axios";
import { SelectImageTabs } from "@/components/SelectImageTabs";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import placeholderImage from "../../assets/images/placeholder.svg";
import ApiTour from "@/components/Tour/ApiTour";
import { postListSteps } from "@/components/Tour/TourSteps";

const StrapiPostForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(placeholderImage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload handler
  const handleImageUpload = (event, setFieldValue, extraMeta) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    // Optionally store extra metadata in formData
    setFieldValue("imageMeta", extraMeta);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image before posting.");
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", selectedFile);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description);

      await multipartRequest.post("/social/post/create", uploadFormData);

      toast.success("Post created successfully!");
      // Reset form
      setFormData({ title: "", description: "" });
      setSelectedFile(null);
      setPreviewImage(placeholderImage);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full my-2 mx-auto text-white rounded-lg shadow-lg overflow-y-auto custom-scroll main">
      <ApiTour
        tourName="postListTour" 
        steps={postListSteps}
      />
      <div className="p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 title">Create Post</h2>

        <div className="mb-4">
          <h5>Title</h5>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="What's on your mind?"
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 SelectImageTabs">
          <SelectImageTabs
            title="Upload Post Image"
            handleImageUpload={handleImageUpload}
            setFieldValue={(field, value) =>
              setFormData((prev) => ({ ...prev, [field]: value }))
            }
            showUploadExistingField={true}
            showMoodboardField={false}
            imageUnicId="post-upload-input"
            showGalleryTabs={{
              uploaded: true,
              generated: false,
              saved: false,
              finalized: true,
            }}
          />

          <div className="space-y-1 !mt-3 image">
            <label className="text-sm md:text-base text-white">Preview:</label>
            <div className="border-2 border-dashed border-white rounded-2xl overflow-hidden">
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

        <div className="mb-4 description">
          <h5>Caption</h5>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="What's on your mind?"
            rows="4"
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <Button
            variant={"dg_btn"}
            onClick={handleSubmit}
            disabled={loading || !selectedFile}
            className="save-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StrapiPostForm;
