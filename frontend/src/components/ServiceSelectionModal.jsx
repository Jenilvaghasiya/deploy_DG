// components/ServiceSelectionModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FaBrush, FaImage, FaTable } from "react-icons/fa";
import CombineImage from '../assets/images/combine_image.png';
import { IoCutOutline } from "react-icons/io5";
import { TbRulerMeasure2 } from "react-icons/tb";
import ImageVariation from '../assets/images/image_variations_white.png';
import { BsPencil } from "react-icons/bs";

export default function ServiceSelectionModal({ open, onClose, image, onSelect, handleEditImage }) {
  const navigate = useNavigate();

  const handleSelect = (type) => {
    console.log("Selected service:", type, image);
    const uploadData = {
      image_id: image.id,
      image_url: image.url,
      service_type: type,
    };

    localStorage.setItem("pre_upload_image", JSON.stringify(uploadData));
    onSelect(type);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={'sm:max-w-2xs'}>
        <DialogHeader>
          <DialogTitle>Select Action</DialogTitle>
        </DialogHeader>
        <div className="bg-black/25 max-w-72 rounded-lg py-1">
        <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto'} onClick={() => handleSelect("variation-generation")}>
            {/* <span className="size-8 shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" x="0" y="0" viewBox="0 0 512 512" class="size-full block">
                    <g>
                        <path d="M479.98 463.07V300.56c0-8.84-7.16-16-16-16H301.46c-8.84 0-16 7.16-16 16v162.51c0 8.84 7.16 16 16 16h162.51c8.84 0 16.01-7.16 16.01-16zm-32-16H317.46V316.56h130.51v130.51zM379.11 234.63a15.99 15.99 0 0 0 0-16L273.88 36.36a16.004 16.004 0 0 0-27.72 0L140.93 218.63c-2.86 4.95-2.86 11.05 0 16s8.14 8 13.86 8h210.47c5.71 0 11-3.05 13.85-8zm-196.61-24 77.52-134.28 77.52 134.28zM235.68 381.82c0-56.15-45.68-101.83-101.83-101.83S32.02 325.67 32.02 381.82 77.7 483.64 133.85 483.64s101.83-45.68 101.83-101.82zm-171.66 0c0-38.5 31.32-69.83 69.83-69.83s69.83 31.32 69.83 69.83-31.32 69.83-69.83 69.83-69.83-31.33-69.83-69.83z" fill="currentColor"></path>
                    </g>
                </svg>
            </span> */}
            <img src={ImageVariation} alt="Image Variations" className="size-5"/>
            Variations
        </Button>
        <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("combine-image")}>
            <img src={CombineImage} alt="Combine Images" className="size-5"/>
            Combine Images
        </Button>
          <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("sketch-to-image")}>
            {/* <span className="size-8 shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 64 64" className="size-full block">
                    <g>
                        <path d="M60.792 29.171a4.007 4.007 0 0 0-5.658 0l-.734.729-2.4 2.4V15a1 1 0 0 0-2 0v19.307L34.433 49.874a1 1 0 0 0-.242.391L32.279 56H13a1 1 0 0 0 0 2h20a1.014 1.014 0 0 0 .316-.051l6.419-2.14a1 1 0 0 0 .391-.242L50 45.693V56h-3a3 3 0 0 0-3 3v3H11a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h38a1 1 0 0 1 1 1v4a1 1 0 0 0 2 0V7a3 3 0 0 0-3-3h-9.2l-.723-2.008a2.995 2.995 0 0 0-3.85-1.808L24.848 4H11a3 3 0 0 0-3 3v3.194l-4.028 1.481a3.032 3.032 0 0 0-1.792 3.868L8 31.7V61a3 3 0 0 0 3 3h34a1 1 0 0 0 .707-.293l6-6A1 1 0 0 0 52 57v-3.93l2.028-.745a3.032 3.032 0 0 0 1.792-3.868l-2.274-6.31L60.1 35.6l.731-.732a4 4 0 0 0-.036-5.694ZM35.917 2.061a.986.986 0 0 1 .756.032 1.009 1.009 0 0 1 .523.576L37.675 4h-7.031ZM4.062 14.865a1.027 1.027 0 0 1 .6-1.313L8 12.325v13.469Zm52.487 15.72a2.013 2.013 0 0 1 2.865.038 2 2 0 0 1 0 2.828l-.024.025-2.866-2.866ZM35.577 52.432l1.991 1.991-2.987 1ZM47 58h1.586L46 60.586V59a1 1 0 0 1 1-1Zm6.338-7.552L52 50.94v-7.184l1.938 5.379a1.027 1.027 0 0 1-.6 1.313Zm-13.919 3-2.865-2.865L55.11 32.024l2.866 2.866Z" fill="currentColor"></path>
                        <path d="M12 21v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V21a1 1 0 0 0-1-1H13a1 1 0 0 0-1 1Zm2 1h8v8h-8ZM17.351 17.24a1 1 0 1 0 1.3 1.52 13.22 13.22 0 0 1 10.2-3.024l-.557.557a1 1 0 1 0 1.414 1.414l2-2a1 1 0 0 0 0-1.414l-2-2a1 1 0 0 0-1.433 1.386 15.145 15.145 0 0 0-10.924 3.561ZM40 10a5 5 0 1 0 5 5 5.006 5.006 0 0 0-5-5Zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3ZM16 54h14a1 1 0 0 0 0-2H16a1 1 0 0 0 0 2ZM13 50h10a1 1 0 0 0 0-2H13a1 1 0 0 0 0 2ZM33 49a1 1 0 0 0-1-1h-5a1 1 0 0 0 0 2h5a1 1 0 0 0 1-1ZM39.87 43.493a1 1 0 0 0-.013-1.008l-6-10a1.039 1.039 0 0 0-1.714 0l-6 10A1 1 0 0 0 27 44h12a1 1 0 0 0 .87-.507ZM28.766 42 33 34.944 37.234 42ZM44 21.917a1 1 0 0 0-2 .166c.251 3-.764 6.067-3 9.127V30a1 1 0 0 0-2 0v4a1 1 0 0 0 1.243.97l4-1a1 1 0 1 0-.486-1.94l-1.075.269A15.372 15.372 0 0 0 44 21.917ZM22 37h4a1 1 0 0 0 0-2h-4a5.006 5.006 0 0 0-5 5v2.586l-.293-.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0-1.414-1.414l-.293.293V40a3 3 0 0 1 3-3Z" fill="currentColor"></path>
                    </g>
                </svg>
            </span> */}
            <FaImage className="mx-1" />
            Sketch to Photo
        </Button>
          <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("size-chart-image")}>
            {/* <span className="size-8 shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 512 512" class="size-full block">
                    <g>
                        <path d="M101.67 177.17c1.75 2.41 5.42 2.93 7.77 1.09l23.4-17.65v185.43c0 7.62 6.2 13.82 13.82 13.82h218.69c7.62 0 13.82-6.2 13.82-13.82V160.6l23.4 17.65c1.17.89 2.66 1.26 4.11 1.06a5.55 5.55 0 0 0 3.66-2.15l55.22-73.28a5.545 5.545 0 0 0-1.09-7.76l-87.5-65.98c-14.14-10.7-31.75-16.59-49.57-16.59H184.62c-17.82 0-35.43 5.89-49.57 16.58l-87.5 65.98a5.546 5.546 0 0 0-1.09 7.76zm266.4 168.87c0 1.5-1.22 2.73-2.73 2.73H146.65c-1.5 0-2.73-1.22-2.73-2.73v-9.71h224.15zM303.21 24.65c-6.3 40.1-81.9 39.65-88.53 0zM141.73 38.99c12.23-9.25 27.46-14.34 42.88-14.34h18.9c7.16 54.51 103.63 54.53 110.87 0 19.5-1.06 40.29 1.85 55.9 14.35l83.08 62.65-48.54 64.42-27.86-21.01a5.554 5.554 0 0 0-5.81-.54 5.549 5.549 0 0 0-3.07 4.96v175.76H143.92V149.48c0-2.1-1.19-4.02-3.07-4.96a5.552 5.552 0 0 0-5.81.54l-27.85 21.01-48.55-64.42zM497.7 387.57H14.3c-7.34 0-13.3 5.97-13.3 13.3v84.27c0 7.34 5.97 13.3 13.3 13.3h483.4c7.34 0 13.3-5.97 13.3-13.3v-84.27c0-7.33-5.97-13.3-13.3-13.3zm2.21 97.57c0 1.22-.99 2.21-2.21 2.21h-28.27v-22.17a5.54 5.54 0 1 0-11.08 0v22.17h-22.17v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-16.63v-22.17a5.54 5.54 0 1 0-11.08 0v22.17h-22.17v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-22.17v-22.17a5.54 5.54 0 1 0-11.08 0v22.17h-22.17v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-16.63v-22.17a5.54 5.54 0 1 0-11.08 0v22.17h-22.17v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-22.17v-22.17a5.54 5.54 0 1 0-11.08 0v22.17h-22.17v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-16.63v-22.17a5.54 5.54 0 1 0-11.08 0v22.17H120.3v-33.26a5.54 5.54 0 1 0-11.08 0v33.26h-22.3v-22.17a5.54 5.54 0 1 0-11.08 0v22.17H53.66v-33.26a5.54 5.54 0 1 0-11.08 0v33.26H14.3a2.21 2.21 0 0 1-2.21-2.21v-84.27c0-1.22.99-2.21 2.21-2.21h483.4c1.22 0 2.21.99 2.21 2.21z" fill="currentColor"></path>
                    </g>
                </svg>
            </span> */}
            <TbRulerMeasure2 className="mx-1"/>
            Size Chart
        </Button>
        <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("tech-packs")}>
            <FaTable  className="mx-1"/>
            Tech Pack
        </Button>
        <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("pattern-cutout")}>
            <IoCutOutline className="mx-1" />
            Pattern Cutouts
        </Button>
        <Button className={'text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600'} onClick={() => handleSelect("color-variations")}>
          <FaBrush  className="mx-1"/>
            Color Variations
        </Button>
        <Button
          className={
            "text-base justify-normal bg-transparent hover:bg-transparent rounded-none flex items-center group w-full py-2 h-auto border-t border-solid border-zinc-600"
          }
          onClick={() => {
            if (typeof handleEditImage === "function") {
              handleEditImage(image); // open the editor
              onClose(); // close the modal
            }
          }}
        >
          <BsPencil className="mx-1" />
          Image Editor
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
