import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import SmartImage from "@/components/SmartImage";
import placeholderImage from "../../../assets/images/placeholder.svg";
import { SelectImageTabs } from "@/components/SelectImageTabs";
import { loadImageFromLocalStorage } from "@/utils/imageService";

const validationSchema = Yup.object({
  outlineImage: Yup.mixed().required("Please upload an outline image"),
});

export default function ManualTechPackCreator() {
  const [previewImage, setPreviewImage] = useState(placeholderImage);

  const initialValues = {
    outlineImage: null,
    galleryImageId: null,
    generatedImageUrl: null,
    productName: "",
    description: "",
  };

  const handleImageUpload = (event, setFieldValue, extraMeta = {}) => {
    const file = event.target.files?.[0];
    if (file) {
      setFieldValue("outlineImage", file);

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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values) => {
    console.log("Tech pack data:", values);

    const formData = new FormData();
    formData.append("outlineImage", values.outlineImage);
    if (values.galleryImageId) {
      formData.append("galleryImageId", values.galleryImageId);
    }
    if (values.generatedImageUrl) {
      formData.append("generatedImageUrl", values.generatedImageUrl);
    }
    formData.append("productName", values.productName);
    formData.append("description", values.description);
  };

  return (
    <div className="text-white p-4 lg:p-6 h-full overflow-auto custom-scroll">
      <div className="container max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Manual Tech Pack Creator</h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue }) => {
            useEffect(() => {
              loadImageFromLocalStorage("tech-pack-creation", setPreviewImage, setFieldValue);
            }, []);

            return (
              <Form className="space-y-6">
                {/* Image Selection Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Select Outline Image</h3>
                  <div className="select-image-tabs">
                    <SelectImageTabs
                      handleImageUpload={handleImageUpload}
                      setFieldValue={setFieldValue}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base text-white">
                      Outline Image Preview:
                    </label>
                    <div className="border-shadow-blur border-2 border-dashed border-white rounded-2xl overflow-hidden">
                      <SmartImage
                        src={previewImage || placeholderImage}
                        alt="Outline image preview"
                        width={600}
                        height={300}
                        className="w-full h-72 object-contain rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Tech Pack Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tech Pack Details</h3>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium">
                      Product Name
                    </label>
                    <Field
                      name="productName"
                      type="text"
                      className="w-full px-3 py-2 text-white bg-black/15 border border-solid border-zinc-500 rounded-lg focus:outline-none focus:ring-2"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm md:text-base font-medium">
                      Description
                    </label>
                    <Field
                      name="description"
                      as="textarea"
                      className="w-full p-3 bg-black/15 border border-solid border-zinc-500 text-white rounded-lg resize-none placeholder-gray-400"
                      rows={4}
                      placeholder="Enter product description..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200"
                  >
                    Create Tech Pack
                  </Button>
                </div>
              </Form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}
