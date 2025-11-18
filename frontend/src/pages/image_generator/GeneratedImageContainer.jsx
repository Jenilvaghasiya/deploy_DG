import React, { useState } from "react";
import api from "../../api/axios";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MeasurementTable } from "./MeasurementTable";
import { Button } from "@/components/ui/button";
import { BsBookmark, BsCheck, BsImages } from "react-icons/bs";
import LikeDislikeImage from "./LikeDislikeImage";
import LensFlareEffect from "@/components/LensFlareEffect";
import SmartImage from "@/components/SmartImage";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import UseImageModalButton from "@/components/Common/UseImageModalButton";
import SmartContextImage from "@/components/Common/SmartContextImage";
import { useAuthStore } from "@/store/authStore";
import useSocket from "@/hooks/useSocket";
import ConfirmAbortDialog from "@/components/ConfirmAbortDialog";
import ImageZoomDialog from "@/components/ImageZoomDialog";
import { useCredits } from "@/hooks/useCredits";
const BASE_API_URL = import.meta.env.VITE_API_URL;
import placeholderImage from "../../assets/images/placeholder.svg"

const GeneratedImageContainer = ({
  generatedVariations,
  aiTaskId,
  updatedImageUrls,
  handleImageStatusUpdate,
  hasFinaliseImagePermission,
  setUpdatedImageUrls,
  showActionButtons = true,
  imageStatuses,
  previewInputState,
  setPreviewInputState,
  mainHeading = "Image Generation in Queue",
  subText = "Your recent image generation request is currently in the processing queue. Please wait until this task is completed before initiating a new request.",
  saveForLaterButtonShow = true,
  finalizeButtonShow = true,
  likeDislikeButtonsShow = true,
  aiTask = {}
}) => {
  const { fetchCredits } = useCredits();
  const [imageFeedback, setImageFeedback] = React.useState({});
  
  useEffect(()=>{
    fetchCredits();
  }, [generatedVariations]);
  
  console.log(generatedVariations , 'generatedVariationsgeneratedVariations');
  return (
    <>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white text-left py-3 px-10 bg-black/25 rounded-t-lg">
          Your Generated Images
        </h2>
        <div className="relative">
          <LensFlareEffect />
          <div className="relative z-10 p-6">
            <div className="flex flex-wrap justify-center items-stretch gap-4">
              {generatedVariations.map((variation, index) => (
                <Card
                  key={index}
                  className="!bg-white/75 border-0 overflow-hidden border-shadow-blur rounded-xl grow w-full h-fit sm:w-1/3 md:w-1/4 xl:w-1/5 sm:max-w-1/2 md:max-w-1/3 xl:max-w-1/4 py-0"
                >
                  <CardContent className="p-0">
                    <div className="relative after:block after:pt-[100%]">
                      <SmartContextImage
                        src={
                          aiTask?.task && aiTask?.task === "sketch_to_image"
                            ? variation?.url?.startsWith("http")
                              ? variation.url
                              : `${BASE_API_URL}/genie-image/${variation?.url}` || placeholderImage
                            : variation?.startsWith("http")
                              ? variation
                              : `${BASE_API_URL}/genie-image/${variation}` || placeholderImage
                        }
                        alt={`Variation ${index + 1}`}
                        className="w-full h-full absolute top-0 left-0 max-w-full object-cover"
                        variation={variation}
                        aiTaskId={aiTaskId}
                        hasFinaliseImagePermission={hasFinaliseImagePermission}
                        setImageFeedback={setImageFeedback}
                        imageFeedback={imageFeedback}
                        setUpdatedImageUrls={setUpdatedImageUrls}
                        onSaveImage={() =>
                          handleImageStatusUpdate({
                            aiTaskId,
                            newStatus: "saved",
                            imageUrl: variation,
                          })
                        }
                        onFinaliseImage={() =>
                          handleImageStatusUpdate({
                            aiTaskId,
                            newStatus: "finalized",
                            imageUrl: variation,
                          })
                        }
                        onViewInputImages={() => {
                          setPreviewInputState((prev) => ({
                            ...prev,
                            open: true,
                          }));
                        }}
                        hasGalleryImages={
                          previewInputState?.galleryImageIds?.length > 0
                        }
                      />
                    </div>
                    {!updatedImageUrls.has(variation) && (
                      <div className="p-4 flex justify-center gap-1 flex-wrap">
                        {/* ✅ Preview Button using ImageZoomDialog */}
                        <ImageZoomDialog
                          imageUrl={ 
                            aiTask?.task && aiTask?.task === "sketch_to_image"
                              ? variation?.url?.startsWith('http')
                                ? variation.url
                                : `${BASE_API_URL}/genie-image/${variation?.url}`
                              : variation?.startsWith('http')
                                ? variation
                                : `${BASE_API_URL}/genie-image/${variation}`
                          }
                          triggerLabel="Preview Image"
                          showTitle={true}
                          className="bg-zinc-700 hover:bg-zinc-500 text-white p-1.5 rounded cursor-pointer flex items-center justify-center w-full"
                        />
                        { previewInputState?.galleryImageIds?.length > 0 && (
                          <Button
                            disabled={
                              !previewInputState?.galleryImageIds?.length > 0
                            }
                            onClick={() => {
                              setPreviewInputState((prev) => ({
                                ...prev,
                                open: true,
                              }));
                            }}
                            className={`flex items-center justify-center w-full bg-pink-500 hover:bg-pink-600 text-white p-1.5 rounded  ${
                              previewInputState?.galleryImageIds?.length > 0
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            }`}
                            title="Input Image(s)"
                          >
                            <BsImages size={14} />
                            <span className="ml-1">View input Images</span>
                          </Button>
                        )}
                        {saveForLaterButtonShow && (
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
                        )}

                        {hasFinaliseImagePermission && finalizeButtonShow && (
                          <Button
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
                            <span span className="ml-1">
                              Finalise
                            </span>
                          </Button>
                        )}
                        {/* <UseImageModalButton aiTaskId={aiTaskId} imageUrl={variation}/> */}
                        {likeDislikeButtonsShow && (
                          <LikeDislikeImage
                            imageFeedback={imageFeedback}
                            setImageFeedback={setImageFeedback}
                            variation={variation}
                            setUpdatedImageUrls={setUpdatedImageUrls}
                          />
                        )}
                      </div>
                    )}

                    {/* Finalized Strip */}
                    {imageStatuses[variation] === "finalized" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-center py-1 font-medium text-sm">
                        This image is finalized
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InputImagePreviewDialog
        open={previewInputState?.open}
        galleryImageIds={previewInputState?.galleryImageIds}
        setOpen={(show) =>
          setPreviewInputState((prev) => ({ ...prev, open: show }))
        }
      />
    </>
  );
};

export default GeneratedImageContainer;
