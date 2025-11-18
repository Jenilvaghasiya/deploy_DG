import React, { useState } from "react";
import api from "../../api/axios";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MeasurementTable } from "./MeasurementTable";
import { markTaskAsSeen } from "../../features/auth/authService";
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
const BASE_API_URL = import.meta.env.VITE_API_URL;
import placeholderImage from "../../assets/images/placeholder.svg";
import { useCredits } from "@/hooks/useCredits";
import PatternCutoutDisplay from "@/components/PatternCutoutDisplay";
import ColorAnalysisDisplay from "./color_detection/ColorAnalysisDisplay";
import TechPacksDisplay from "@/components/TechPack/TechPacksDisplay";

const WhileYouWereAway = ({
  task_type,
  updatedImageUrls,
  handleImageStatusUpdate,
  hasFinaliseImagePermission,
  setUpdatedImageUrls,
  setTaskStatus,
  showActionButtons = true,
  mainHeading = "Image Generation in Queue",
  subText = "Your recent image generation request is currently in the processing queue. Please wait until this task is completed before initiating a new request.",
  imageStatuses = {},
  saveForLaterButtonShow = true,
  finalizeButtonShow = true,
  likeDislikeButtonsShow = true,
}) => {
  const [data, setData] = React.useState();
  const { fetchCredits } = useCredits();

  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });
  const { user } = useAuthStore();
  const socketRef = useSocket(user);

  const [localMeasurements, setLocalMeasurements] = React.useState({
    measurements: {},
    sizeChartId: null,
  });
  const [imageFeedback, setImageFeedback] = React.useState({});

  async function fetchLatestUnseenTask(task_type) {
    try {
      const response = await api.post("/image-variation/latest-unseen", {
        task_type,
      });
      if (response.data.data) {
        fetchCredits();

        return response.data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching latest unseen task:", error);
      return null;
    }
  }
  const plainBGTask = [
    "tech_packs",
    "color_analysis",
    "pattern_cutout"
  ]
  const latestSeenTask = React.useCallback(async () => {
    try {
      const data = await fetchLatestUnseenTask(task_type);
      setData(data);
    } catch (error) {
      console.error("Error fetching latest unseen task:", error);
    }
  }, [task_type]);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleEvent = () => {
      if (data?.latestTask?.status === "queued") {
        latestSeenTask();
      }
    };

    socket.on("task_update", handleEvent);

    return () => {
      socket.off("task_update", handleEvent);
    };
  }, [socketRef, latestSeenTask, data]);

  useEffect(() => {
    if (data?.sizeChartData?.measurements && data?.sizeChartData?.id) {
      setLocalMeasurements({
        measurements: data.sizeChartData.measurements,
        sizeChartId: data.sizeChartData.id,
        grading_rules: data?.sizeChartData?.grading_rules,
        tolerance: data?.sizeChartData?.tolerance,
        size_conversion: data?.sizeChartData?.size_conversion,
      });
    }
  }, [data]);
  
  useEffect(() => {
    if (data?.latestTask?.status) {
      setTaskStatus?.(data.latestTask.status);
    }
  }, [data?.latestTask?.status, setTaskStatus]);

  const handleMarkTaskAsSeen = async (taskId, refreshListing = true) => {
    try {
      await markTaskAsSeen(taskId);
      if (refreshListing) {
        latestSeenTask();
      }
    } catch (error) {
      console.error("Error marking task as seen:", error);
    }
  };

  useEffect(() => {
    latestSeenTask();
    return () => setData(null);
  }, [latestSeenTask, task_type]);

  const imageArray = data?.latestTask?.result || [];
  const tableData = data?.sizeChartData?.measurements || null;

  // Glassmorphic wrapper classes
  const glassCard =
    "bg-white/20 backdrop-blur-md border border-white/25 rounded-2xl shadow-xl";
  const glassButton =
    "mt-4 px-6 py-2 rounded-full bg-white/30 backdrop-blur-sm text-white font-medium hover:bg-white/40 transition cursor-pointer";

  if (
    data?.latestTask?.status === "completed" &&
    (imageArray.length || localMeasurements?.measurements)
  ) {
    return (
      <div className="lg:-m-8 xl:-mx-10 mb-8">
        <div className="w-full p-0 lg:p-8 2xl:px-10 mb-4">
        <div className={`${glassCard} p-4 md:p-6`}>
          <h2 className="text-lg lg:text-2xl 2xl:text-3xl font-semibold text-white mb-2">
          While You Were Away
          </h2>
          <p className="text-white/80 text-sm md:text-base">
          While you were away, we processed your images. Here are your
          ready-to-review variations.
          </p>
        </div>
        </div>
        <div className="relative">
        {!plainBGTask.includes(task_type) && <LensFlareEffect />}
        <div className="relative z-10 p-2 lg:p-6">
          <div className="flex flex-wrap justify-center items-stretch gap-4">
          {task_type !== "size_chart" &&
            imageArray.map((variation, index) => (
            <Card
              key={index}
              className={`${glassCard} !bg-white/75 overflow-hidden border-shadow-blur rounded-xl grow w-full h-fit sm:w-1/3 md:w-1/4 xl:w-1/5 sm:max-w-1/2 md:max-w-1/3 xl:max-w-1/4 py-0`}
              onClick={() =>
              handleMarkTaskAsSeen(data.latestTask.task_id, false)
              }
            >
              <CardContent className="p-0">
              <div className="relative after:block after:pt-[100%]">
                <SmartContextImage
                showContextMenu={showActionButtons}
                src={
                  variation?.startsWith("http")
                  ? variation
                  : `${BASE_API_URL}/genie-image/${variation}` ||
                    placeholderImage
                }
                alt={`Variation ${index + 1}`}
                className="w-full h-full absolute top-0 left-0 object-cover"
                variation={variation}
                hasGalleryImages={
                  data?.latestTask?.gallery_image_ids?.length > 0
                }
                setPreviewInputState={setPreviewInputState}
                hasFinaliseImagePermission={
                  hasFinaliseImagePermission
                }
                aiTaskId={data?.latestTask?.id}
                imageFeedback={imageFeedback}
                setImageFeedback={setImageFeedback}
                setUpdatedImageUrls={setUpdatedImageUrls}
                onViewInputImages={() =>
                  setPreviewInputState({
                  open: true,
                  galleryImageIds:
                    data?.latestTask?.gallery_image_ids?.length > 0
                    ? data?.latestTask?.gallery_image_ids
                    : [],
                  })
                }
                onSaveImage={() =>
                  handleImageStatusUpdate({
                  aiTaskId: data.latestTask.id,
                  newStatus: "saved",
                  imageUrl: variation,
                  })
                }
                onFinaliseImage={() =>
                  handleImageStatusUpdate({
                  aiTaskId: data.latestTask.id,
                  newStatus: "finalized",
                  imageUrl: variation,
                  })
                }
                />
              </div>
              {!updatedImageUrls?.has(variation) && (
                <div className="p-4 flex justify-center gap-1 flex-wrap">
                {showActionButtons ? (
                  <>
                  {/* ✅ Preview Button using ImageZoomDialog */}
                  <ImageZoomDialog
                    imageUrl={
                    variation?.startsWith("http")
                      ? variation
                      : `${BASE_API_URL}/genie-image/${variation}`
                    }
                    triggerLabel="Preview Image"
                    showTitle={true}
                    className="bg-zinc-700 hover:bg-zinc-500 text-white p-1.5 rounded cursor-pointer flex items-center justify-center w-full"
                  />
                  {data?.latestTask?.gallery_image_ids?.length >
                    0 && (
                    <Button
                    disabled={
                      !data?.latestTask?.gallery_image_ids
                      ?.length > 0
                    }
                    onClick={() => {
                      console.log(
                      "preview....",
                      data?.latestTask
                      );
                      setPreviewInputState({
                      open: true,
                      galleryImageIds:
                        data?.latestTask?.gallery_image_ids
                        ?.length > 0
                        ? data?.latestTask?.gallery_image_ids
                        : [],
                      });
                    }}
                    className={`flex items-center justify-center w-full bg-pink-500 hover:bg-pink-600 text-white p-1.5 rounded  ${
                      data?.latestTask?.gallery_image_ids
                      ?.length > 0
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                    }`}
                    title="Input Image(s)"
                    >
                    <BsImages size={14} />
                    <span className="ml-1">
                      View input Images
                    </span>
                    </Button>
                  )}
                  {saveForLaterButtonShow && (
                    <Button
                    variant="outline"
                    className="flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
                    onClick={() => {
                      handleImageStatusUpdate({
                      aiTaskId: data.latestTask.id,
                      newStatus: "saved",
                      imageUrl: variation,
                      });
                      console.log("data", data.latestTask.id);
                      console.log("clicked");
                    }}
                    title="Save for later"
                    >
                    <BsBookmark size={14} />
                    <span className="ml-1">Save for Later</span>
                    </Button>
                  )}
                  {hasFinaliseImagePermission &&
                    finalizeButtonShow && (
                    <Button
                      variant="outline"
                      className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
                      onClick={() =>
                      handleImageStatusUpdate({
                        aiTaskId: data.latestTask.id,
                        newStatus: "finalized",
                        imageUrl: variation,
                      })
                      }
                      title="Mark as finalized"
                    >
                      <BsCheck size={14} />
                      <span className="ml-1">Finalise</span>
                    </Button>
                    )}
                  {/* <UseImageModalButton imageUrl={variation} aiTaskId={data.latestTask.id} /> */}
                  </>
                ) : (
                  <>
                  {" "}
                  <Button
                    variant="outline"
                    className="flex items-center justify-center w-full bg-green-500  text-white p-1.5 rounded"
                    disabled={true}
                  >
                    <BsCheck size={14} />
                    <span className="ml-1">Image Finalised</span>
                  </Button>
                  </>
                )}
                {likeDislikeButtonsShow && (
                  <LikeDislikeImage
                  variation={variation}
                  setImageFeedback={setImageFeedback}
                  imageFeedback={imageFeedback}
                  setUpdatedImageUrls={setUpdatedImageUrls}
                  />
                )}
                </div>
              )}

              {/* Finalized Strip */}
              {imageStatuses[variation] === "finalized" && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-center py-1 text-xs font-medium">
                This image is finalized
                </div>
              )}
              </CardContent>
            </Card>
            ))}

          {task_type === "color_analysis" && (
            <ColorAnalysisDisplay data={data?.colorAnalysis} />
          )}
          {task_type === 'pattern_cutout' && (
            <PatternCutoutDisplay data={data?.patternCutout} />
          )}
          {task_type === 'tech_packs' && (
            <TechPacksDisplay data={data?.techPackData} />
          )}
          {localMeasurements?.measurements &&
            Object.keys(localMeasurements.measurements).length > 0 && (
            <div className={`${glassCard} p-4`}>
              <MeasurementTable
              measurements={localMeasurements.measurements}
              tolerance={localMeasurements?.tolerance || []}
              grading_rules={localMeasurements?.grading_rules || []}
              size_conversion={localMeasurements?.size_conversion || []}
              sizeChartId={localMeasurements.sizeChartId}
              isAIGenerated={true}
              setMeasurement={(updater) => {
                setLocalMeasurements((prev) => {
                const updatedMeasurements =
                  typeof updater === "function"
                  ? updater(prev.measurements)
                  : updater;

                const newLocal = {
                  ...prev,
                  measurements: updatedMeasurements,
                };

                setData((prevData) => ({
                  ...prevData,
                  sizeChartData: {
                  ...prevData.sizeChartData,
                  measurements: updatedMeasurements,
                  },
                }));

                return newLocal;
                });
              }}
              customButton={
                <Button
                onClick={() => {
                  setPreviewInputState((prev) => ({
                  galleryImageIds:
                    data?.latestTask?.gallery_image_ids?.length > 0
                    ? data?.latestTask?.gallery_image_ids
                    : [],
                  open: true,
                  }));
                }}
                disabled={
                  data?.latestTask?.gallery_image_ids?.length === 0
                }
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
              />
            </div>
            )}
          </div>
        </div>
        </div>

        <div className="flex justify-center max-w-full">
        <button
          onClick={() => handleMarkTaskAsSeen(data.latestTask.task_id)}
          className={glassButton}
        >
          Mark as Seen
        </button>
        </div>
        <InputImagePreviewDialog
        open={previewInputState.open}
        galleryImageIds={previewInputState.galleryImageIds}
        setOpen={(show) =>
          setPreviewInputState((prev) => ({ ...prev, open: show }))
        }
        />
      </div>
    );
  }

  if (data?.latestTask?.status === "failed") {
    return (
      <div className="lg:p-6">
        <div className={`${glassCard} p-6 text-center`}>
          <h2 className="text-3xl font-semibold text-red-400 mb-3">
            Oops! Task Failed
          </h2>
          <p className="text-white/80 mb-4">
            Sorry, we couldn’t complete your image generation. Try again or
            contact support if the issue persists.
          </p>
          <button
            onClick={() => handleMarkTaskAsSeen(data.latestTask.task_id)}
            className={`${glassButton} bg-red-400/30 hover:bg-red-400/40`}
          >
            Mark as Seen
          </button>
        </div>
      </div>
    );
  }

  if (data?.latestTask?.status === "queued") {
    return (
      <div className="p-6">
        <div className={`${glassCard} p-6 text-center`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Professional-looking spinner */}
            <svg
              className="w-12 h-12 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
              />
            </svg>

            <h2 className="text-2xl font-semibold text-white">{mainHeading}</h2>

            <p className="text-white/80 max-w-md">{subText}</p>

            <p className="text-sm text-white/60">
              This ensures optimal performance and prevents overlapping
              requests.
            </p>

            <ConfirmAbortDialog
              taskId={data.latestTask.task_id}
              onSuccess={() => {
                latestSeenTask();
                setData(null);
                setTaskStatus(null);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default WhileYouWereAway;
