import { useState, useEffect, useCallback } from "react";
import {Button} from "../../components/ui/button";
import MoodboardCard from "./MoodboardCard";
import api from "../../api/axios";
import { BsPlusCircle } from "react-icons/bs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import ImagePreviewDialog from "./ImagePreviewDialog";
import Loader from "../../components/Common/Loader";
import { AiOutlineTag } from "react-icons/ai";
import DownloadDialog from "./DownloadDialog";
import SmartImage from "@/components/SmartImage";
const BASE_URL = import.meta.env.VITE_SERVER_URL;
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useNavigateWithGalleryImage } from "@/hooks/useNavigateWithGalleryImage";

// utils/transformMoodboard.js
export const transformMoodboardImages = (moodboard) => {
  return {
    ...moodboard,
    images: (moodboard.gallery_images || []).map((img) => ({
      url: img.galleryImage.url,
      name: img.name,
      description: img.description || null,
      source: img.source,
      tags: img.tags || [],
      _id: img._id,
    })),
  };
};


function MoodboardGrid({
  viewMode,
  setMode,
  onEdit,
  onDelete,
  refreshKey,
  sortOption,
  hasEditMoodboardPermission,
  hasDeleteMoodboardPermission,
  hasCreateMoodboardPermission,
  isSharedWithMe = false,
  isSharedWithOthers= false,
}) {
   const navigateWithImage = useNavigateWithGalleryImage();
  const [moodboards, setMoodboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);

  const fetchMoodboards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/moodboards", {
        params: { 
          populate: true, 
          sort: sortOption,
						...(isSharedWithMe ? { isSharedWithMe: true } : {}),
						...(isSharedWithOthers ? { isSharedWithOthers: true } : {}),
        },
      });
      setMoodboards(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch moodboards");
      setLoading(false);
    }
  }, [sortOption]);

  useEffect(() => {
    fetchMoodboards();
  }, [fetchMoodboards, refreshKey]);

  function truncateText(text, maxLength = 80) {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }

  function parseTextWithLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  }

  const handleDownload = async (board) => {
    setLoading(true);
    setSelectedBoard(board);
    setShowDownloadDialog(true);
    setLoading(false); // open modal
  };

  if (loading) {
    // return <div className="text-center text-zinc-400">Loading...</div>;
    return <Loader />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <>
      {viewMode === "list" ? (
        <div className="space-y-4">
          {moodboards?.map((board) => {
            board.images = board?.gallery_images?.map((img) => ({
              url: img?.galleryImage?.url,
              name: img?.name,
              description: img?.description || null,
              source: img?.source,
              tags: img?.tags || [],
              _id: img?.galleryImage?._id,
            })) || [];


            const imagesWithPlaceholders = [
              ...board.images,
              ...Array(Math.max(0, 6 - board.images.length)).fill(null),
            ];
            console.log(imagesWithPlaceholders, 'imagesWithPlaceholdersimagesWithPlaceholders');
            
            return (
              <div
                key={board.id}
                className="flex overflow-hidden border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur transition-all"
              >
                <div className="flex-shrink-0 w-32 md:w-48 xl:w-72 bg-zinc-800 p-2 flex flex-col">
                  {/* Remove the fixed h-48 and overflow-y-auto, let it grow naturally */}
                  <div className="grow w-full">
                    <div className="grid grid-cols-3 gap-1 w-full">
              {imagesWithPlaceholders.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square bg-zinc-700 rounded-sm flex items-center justify-center"
                >
                  {image ? (
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <div className="w-full h-full">
                          <ImagePreviewDialog
                            imageUrl={image?.url?.startsWith("http") ? image.url : `${BASE_URL}/${image?.url}`}
                            imageData={image}
                          >
                            <div className="w-full h-full">
                              <SmartImage
                                src={image?.url?.startsWith("http") ? image.url : `${BASE_URL}/${image?.url}`}
                                alt={`Moodboard Image ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.parentNode.innerHTML =
                                    "<div class='w-full h-full flex items-center justify-center text-zinc-700 text-xs'></div>";
                                }}
                              />
                            </div>
                          </ImagePreviewDialog>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem 
                          onClick={() => {
                            console.log("Image ID:", image?.id || image?._id);
                            navigateWithImage(`tech-packs?tab=generate`,  board?.images?.[index]?._id)
                          }}
                        >
                          Use in Tech Pack
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs"></div>
                  )}
                </div>
              ))}
                    </div>
                  </div>
                </div>

                {/* Text preview + Info */}
                <div className="w-2/4 grow p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{board?.name || "Untitled"}</h3>
                    <div className="text-sm text-zinc-400 mt-1">Created: {board?.created_at ? new Date(board.created_at).toLocaleDateString() : "Unknown"}</div>
                    <div className="text-sm text-zinc-400 mt-1 break-words ellips-2">{board?.comment || "No comment"}</div>
                    <div className="text-sm text-zinc-400 mt-1">Notes: {board?.notes || "No notes"}</div>


                    {/* TextData preview */}
                    <div className="mt-2 space-y-1 max-h-32 overflow-auto pr-2">
                      {(board?.textData || []).slice(0, 6).map((item, index) => {
                        const isTruncated = item?.text?.length > 80;

                        return (
                          <Dialog key={index}>
                            <DialogTrigger asChild>
                              <div className="bg-muted/10 p-3 rounded-[10px] cursor-pointer hover:bg-[#d665b475] text-zinc-200 text-sm">
                                <div className="mb-1 text-sm">
                                  {parseTextWithLinks(truncateText(item?.text || ""))}
                                  {isTruncated && (
                                    <span className="ml-1 text-blue-400 underline">(read more)</span>
                                  )}
                                </div>

                                {/* Text Metadata */}
                                <div className="text-xs text-zinc-300">
                                  {item.source && (
                                    <div className="mb-1">
                                      <span className="font-medium">Source:</span> {item.source}
                                    </div>
                                  )}

                                  {item?.tags?.length > 0 && (
                                    <div className="flex items-start">
                                      <AiOutlineTag className="mr-1 mt-0.5 flex-shrink-0" />
                                      <div className="flex flex-wrap gap-1">
                                        {item.tags.map((tag, tagIndex) => (
                                          <span
                                            key={tagIndex}
                                            className="bg-purple-900/50 px-1.5 py-0.5 rounded text-[0.7rem]"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg 2xl:max-w-xl">
                              <DialogHeader>
                                <DialogTitle>Full Text</DialogTitle>
                                <DialogDescription className="max-h-[60vh] overflow-auto">
                                  <div className="mb-4 text-base">
                                    {parseTextWithLinks(item?.text || "")}
                                  </div>

                                  {/* Full Metadata */}
                                  <div className="bg-black/15 border border-solid border-black/25 p-3 rounded-lg text-sm xl:text-base">
                                    {item.source && (
                                      <div className="mb-2">
                                        <span className="font-medium">Source:</span> {item.source}
                                      </div>
                                    )}

                                    {item?.tags?.length > 0 && (
                                      <div className="flex items-start gap-2">
                                        <AiOutlineTag className="mt-1 flex-shrink-0 size-5 text-purple-500" />
                                        <div className="flex flex-wrap gap-1">
                                          {item.tags.map((tag, tagIndex) => (
                                            <span
                                              key={tagIndex}
                                              className="border border-solid border-purple-400 px-2 py-0.5 rounded text-sm text-purple-400"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline" className="hover:text-white cursor-pointer outline-none py-2.5 text-sm">Close</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {hasEditMoodboardPermission && (!isSharedWithMe || board?.permissions?.edit) && 
                    <Button fullWidth={false} onClick={() => onEdit(board?.id)}>
                      Edit
                    </Button>}
                    <Button
                      fullWidth={false}
                      onClick={() => {
                        setSelectedBoard(board);
                        setShowDownloadDialog(true);
                      }}
                    >
                      Download
                    </Button>
                    {hasDeleteMoodboardPermission && !isSharedWithMe && <Button
                      fullWidth={false}
                      variant="destructive"
                      onClick={() => {
                        console.log(board,'boardtodelete')
                        onDelete(board?.id||board?._id, board.name)
                      }}
                    >
                      Delete
                    </Button>}
                  </div>
                </div>
              </div>
            )
          })}

          {/* "Add new moodboard" */}
          {hasCreateMoodboardPermission && !isSharedWithMe && <div
            onClick={() => setMode("create")}
            className="flex items-center justify-center h-16 cursor-pointer transition-colors border border-dashed shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur"
          >
            <div className="flex items-center justify-center">
              <BsPlusCircle size={20} className="mr-2 text-pink-500" />
              <span className="text-lg">Add New Moodboard</span>
            </div>
          </div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 2xl:gap-6">
          {Array.isArray(moodboards) && moodboards.map((board) => {
            board.images = board?.gallery_images?.map((img) => ({
              url: img?.galleryImage?.url,
              name: img?.name,
              description: img?.description || null,
              source: img?.source,
              tags: img?.tags || [],
              _id: img?.galleryImage?._id,
            })) || [];

            console.log(moodboards,'moodboardsmoodboardsmoodboardsmoodboards')
            return (
              <MoodboardCard
                key={board?.id}
                board={board}
                onEdit={onEdit}
                onDownload={handleDownload}
                onDelete={onDelete}
                hasEditMoodboardPermission={hasEditMoodboardPermission}
                hasDeleteMoodboardPermission={hasDeleteMoodboardPermission}
                isSharedWithMe={isSharedWithMe}
                isSharedWithOthers={isSharedWithOthers}
              />

            )
          })}
          {hasCreateMoodboardPermission && !isSharedWithMe && !isSharedWithOthers && <div
            onClick={() => setMode("create")}
            className="flex items-center justify-center h-64 cursor-pointer border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur transition-colors"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <BsPlusCircle size={24} className="text-white" />
              </div>
              <span className="text-lg">Add New Moodboard</span>
            </div>
          </div>}
        </div>
      )
      }

      {showDownloadDialog && selectedBoard && (
        <DownloadDialog
          moodboard={selectedBoard}
          onClose={() => setShowDownloadDialog(false)}
          setError={setError}
        />
      )}
    </>
  );
}

export default MoodboardGrid;
