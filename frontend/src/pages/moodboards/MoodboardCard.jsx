  import {Button} from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import ImagePreviewDialog from "./ImagePreviewDialog";
import { AiOutlineTag } from "react-icons/ai";
import SmartImage from "@/components/SmartImage";
import ShareModal from "@/components/Common/ShareModal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useNavigateWithGalleryImage } from "@/hooks/useNavigateWithGalleryImage";
const BASE_URL = import.meta.env.VITE_SERVER_URL;

// Utility to truncate to N chars
function truncateText(text, maxLength = 80) {
  return text?.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function parseTextWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text?.split(urlRegex) || []; // safe split
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function MoodboardCard({ board, onEdit, onDownload, onDelete, hasEditMoodboardPermission, hasDeleteMoodboardPermission, isSharedWithMe = false, isSharedWithOthers= false, }) {  
  const largerArray = new Array(6).fill(null).length > (board?.images?.length || 0) ? new Array(6).fill(null) : board?.images;
console.log(board, 'boardboard');
  const navigateWithImage = useNavigateWithGalleryImage();

  return (
    <div className="flex flex-col border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur overflow-hidden">
      {/* Images */}
      <div className="p-2.5 lg:p-4 space-y-2 text-sm text-zinc-200 overflow-auto h-56 2xl:h-64 custom-scroll border-b border-solid border-white/35">
        <div className="grid grid-cols-3 gap-2">
          {largerArray.map((image, index) => (
            <div key={index} className="aspect-square bg-zinc-800 rounded-md overflow-hidden">
              {index < (board?.images?.length || 0) ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className="w-full h-full">
                      <ImagePreviewDialog 
                        imageUrl={`${board?.images?.[index]?.url}`} 
                        imageData={board?.images?.[index]}
                      >
                        <div className="cursor-pointer">
                          <SmartImage 
                            src={`${board?.images?.[index]?.url}`} 
                            alt={`Moodboard Image ${index + 1}`} 
                            className="w-full h-full text-xs object-cover cursor-pointer" 
                          />
                        </div>
                      </ImagePreviewDialog>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem 
                      onClick={() => {
                        console.log(board?.images?.[index],"imageimageimage")
                        navigateWithImage(`tech-packs?tab=generate`,  board?.images?.[index]?._id)
                      }}
                    >
                      Use in Tech Pack
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                  {/* Optional: Placeholder */}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <div className="p-4 grow flex flex-col gap-2">
        <div>
          <h3 className="font-medium text-lg mb-1">{board?.name}</h3>
          <div className="text-sm text-zinc-300 mb-1">Created: {board?.created_at ? new Date(board.created_at).toLocaleDateString() : "N/A"}</div>
          <div className="text-sm text-zinc-300 line-clamp-1">Description: {board?.comment || 'N/A'}</div>
          <div className="text-sm text-zinc-300 line-clamp-1">Notes: {board?.notes || 'N/A'}</div>
        </div>
        {/* TextData preview */}
        <div className="space-y-2 text-sm text-zinc-200 overflow-auto max-h-64 custom-scroll">
          {(board?.textData || []).slice(0, 6).map((item, index) => {
            const isTruncated = item?.text?.length > 80;
            return (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="bg-muted/10 p-2 2xl:p-3 rounded-[10px] cursor-pointer hover:bg-[#d665b475] break-all">
                    <div className="mb-1 text-sm">
                      {parseTextWithLinks(truncateText(item?.text))}
                      {isTruncated && (
                        <span className="ml-1 text-blue-400 underline">(read more)</span>
                      )}
                    </div>

                    {/* Text Metadata */}
                    <div className="text-xs text-zinc-100 flex items-center justify-between">
                      {item?.source && (
                        <div className="mb-1">
                          <span className="font-medium">Source:</span> {item.source}
                        </div>
                      )}

                      {item?.tags?.length > 0 && (
                        <div className="flex items-start gap-1">
                          <AiOutlineTag className="size-4 mt-1 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1 items-center">
                            {item.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="bg-white/15 px-1.5 pb-1 pt-0.5 rounded text-xs leading-none block"
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
                <DialogContent className="sm:max-w-lg 2xl:max-w-xl !rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Full Text</DialogTitle>
                    <DialogDescription className="max-h-[60vh] overflow-auto">
                      <div className="mb-4 text-base break-all">
                        {parseTextWithLinks(item?.text)}
                      </div>

                      {/* Full Metadata */}
                      <div className="bg-black/15 border border-solid border-black/25 p-3 rounded-lg text-sm xl:text-base">
                        {item?.source && (
                          <div className="mb-2">
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
                                  className="border border-solid border-purple-400 px-2 py-0.5 rounded-md text-sm text-purple-400"
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
                      <Button variant="dg_btn" className="hover:text-white cursor-pointer outline-none py-2.5 text-sm">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 md:mt-auto">
  {hasEditMoodboardPermission && (!isSharedWithMe || board?.permissions?.edit) && (
  <Button
    className="flex-1 sm:flex-none"
    onClick={() => onEdit(board?.id || board?._id)}
  >
    Edit
  </Button>
)}


  <Button
    className="flex-1 sm:flex-none"
    onClick={() => onDownload(board)}
  >
    Download
  </Button>

  {!isSharedWithMe && !isSharedWithOthers && (
    <div className="flex-1 sm:flex-none">
      <ShareModal
        resourceType={"Moodboard"}
        resourceId={board?.id || board?._id}
      />
    </div>
  )}

  {hasDeleteMoodboardPermission && !isSharedWithMe && !isSharedWithOthers && (
    <Button
      className="flex-1 sm:flex-none"
      variant="destructive"
      onClick={() => {
        onDelete(board?.id || board?._id, board?.name)
      }}
    >
      Delete
    </Button>
  )}
</div>

      </div>
    </div>
  );
}

export default MoodboardCard;
