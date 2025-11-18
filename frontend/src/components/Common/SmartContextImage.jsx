import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { BsBookmark, BsCheck, BsImages } from "react-icons/bs";
import UseImageModalButton from "./UseImageModalButton";
import LikeDislikeImage from "@/pages/image_generator/LikeDislikeImage";
const SmartContextImage = ({
  src,
  alt,
  className,
  variation,
  hasFinaliseImagePermission,
  aiTaskId,
  setImageFeedback,
  imageFeedback,
  setUpdatedImageUrls,
  onSaveImage,
  onFinaliseImage,
  onViewInputImages,
  hasGalleryImages,
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
              <div className="w-6 h-6 border-4 border-gray-300 border-t-pink-800 rounded-full animate-spin"></div>
            </div>
          )}
          <LazyLoadImage
            alt={alt}
            src={src}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={`${className} transition-opacity duration-300`}
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 text-sm bg-zinc-800">
        {/* <ContextMenuItem
          onClick={onViewInputImages}
          disabled={!hasGalleryImages}
        >
          <BsImages className="mr-2" size={14} />
          View Input Images
        </ContextMenuItem>

        <ContextMenuItem onClick={onSaveImage}>
          <BsBookmark className="mr-2" size={14} />
          Save for Later
        </ContextMenuItem>

        {hasFinaliseImagePermission && (
          <ContextMenuItem onClick={onFinaliseImage}>
            <BsCheck className="mr-2" size={14} />
            Finalise
          </ContextMenuItem>
        )}

        <ContextMenuSeparator /> */}

        <UseImageModalButton
          imageUrl={variation}
          aiTaskId={aiTaskId}
          asContextItem={true}
        />

        {/* <ContextMenuSeparator />
        <div className=" flex justify-center gap-1 flex-wrap">
          <LikeDislikeImage
            variation={variation}
            setImageFeedback={setImageFeedback}
            imageFeedback={imageFeedback}
            setUpdatedImageUrls={setUpdatedImageUrls}
          />
        </div> */}

      </ContextMenuContent>
    </ContextMenu>
  );
};

export default SmartContextImage;
