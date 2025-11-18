import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";
import {
  BsDownload,
  BsPencil,
  BsCheck,
  BsBookmark,
  BsHandThumbsUp,
  BsHandThumbsDown,
  BsImages,
  BsLink,
  BsMagic,
  BsThreeDotsVertical,
  BsTable,
} from "react-icons/bs";
import { BiRename } from "react-icons/bi";
import { CiZoomIn } from "react-icons/ci";
import { CgListTree } from "react-icons/cg";
const TABS = {
  FINALIZED: "finalized",
  SAVED: "saved",
  GENERATED: "generated",
  UPLOADED: "uploaded",
};
const ImageDropdownMenu = ({
  activeTab,
  image,
  hasEditGalleryPermission,
  hasFinaliseGalleryPermission,
  handleDownloadImage,
  handleEditImage,
  handleStatusChange,
  handleLikeDislike,
  setPreviewInputState,
  setSelectedImageForLinking,
  setServiceImage,
  setShowServiceModal,
  setShowRenameModal,
  handleOpenSizeChart,
  setShowChooseAsset
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="bg-black/70 p-1 rounded-full cursor-pointer">
          <BsThreeDotsVertical size={16} className="text-white" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="backdrop-blur-md shadow-lg rounded-xl text-white bg-white/10 border-white/30">
        {activeTab !== TABS.UPLOADED &&
          activeTab !== TABS.FINALIZED &&
          hasFinaliseGalleryPermission && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(image.id, "finalized")}
              className={"cursor-pointer"}
            >
              <BsCheck size={14} className="mr-2 text-white" /> Finalize
            </DropdownMenuItem>
          )}
        {activeTab !== TABS.UPLOADED && (
          <DropdownMenuItem
            onClick={() => handleDownloadImage(image)}
            className={"cursor-pointer"}
          >
            <BsDownload size={14} className="mr-2 text-white" /> Download
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
  asChild
  className="p-2 cursor-pointer hover:bg-white hover:text-black focus:bg-white focus:text-black"
>
  <ImagePreviewDialog imageUrl={image.url} imageData={image} className={'text-white'}>
    <div className="flex items-center cursor-pointer py-1.5 px-2 rounded-sm hover:bg-white hover:text-black focus:bg-white focus:text-black">
      <CiZoomIn size={14} className="mr-2" />
      View Large
    </div>
  </ImagePreviewDialog>
</DropdownMenuItem>


        {hasEditGalleryPermission && (
          <DropdownMenuItem
            onClick={() => handleEditImage(image)}
            className={"cursor-pointer"}
          >
            <BsPencil size={14} className="mr-2 text-white" /> Edit
          </DropdownMenuItem>
        )}

        {activeTab !== TABS.UPLOADED &&
          activeTab !== TABS.SAVED &&
          activeTab !== TABS.FINALIZED &&
          hasEditGalleryPermission && (
            <DropdownMenuItem
              onClick={() => handleStatusChange(image.id, "saved")}
              className={"cursor-pointer"}
            >
              <BsBookmark size={14} className="mr-2 text-white" /> Save
            </DropdownMenuItem>
          )}

        {activeTab === TABS.GENERATED && (
          <DropdownMenuItem
            onClick={() => handleLikeDislike(image.id, true)}
            className={"cursor-pointer"}
          >
            <BsHandThumbsUp size={14} className="mr-2 text-white" /> Like
          </DropdownMenuItem>
        )}
        {activeTab === TABS.GENERATED && (
          <DropdownMenuItem
            onClick={() => handleLikeDislike(image.id, false)}
            className={"cursor-pointer"}
          >
            <BsHandThumbsDown size={14} className="mr-2 text-white" /> Dislike
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => {
            setSelectedImageForLinking(image);
          }}
          className={"cursor-pointer"}
        >
          <BsLink size={14} className="mr-2 text-white" /> Link to Project
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setServiceImage(image);
            setShowServiceModal(true);
          }}
          className={"cursor-pointer"}
        >
          <BsMagic size={14} className="mr-2 text-white" /> Use in Service
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setShowRenameModal(image);
          }}
          className={"cursor-pointer"}
        >
          <BiRename size={14} className="mr-2 text-white" /> Rename Image
        </DropdownMenuItem>
        {image?.sizeChart && (
          <DropdownMenuItem
            onClick={() => {
              handleOpenSizeChart(image);
            }}
            className={"cursor-pointer"}
          >
            <BsTable size={14} className="mr-2 text-white" /> View Size Chart
          </DropdownMenuItem>
        )}
        {activeTab !== TABS.UPLOADED && (
          <DropdownMenuItem
            disabled={!image?.gallery_image_ids?.length}
            onClick={() =>
              setPreviewInputState({
                open: true,
                galleryImageIds: image?.gallery_image_ids ?? [],
              })
            }
            className={"cursor-pointer"}
          >
            <BsImages size={14} className="mr-2 text-white" /> Input Images
          </DropdownMenuItem>
        )}
        {activeTab !== TABS.UPLOADED && (
                         <DropdownMenuItem
                  onClick={() => setShowChooseAsset({ open: true, imageId: image.id })}
                >
                  <CgListTree className="mr-2 text-white" size={14} /> Tree View
                </DropdownMenuItem>
                      )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ImageDropdownMenu;
