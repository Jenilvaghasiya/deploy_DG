import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useEffect, useState } from 'react';
import placeholderImage from "../assets/images/placeholder.svg";

const SmartImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <div className="relative h-full">
      {!loaded && (
        <div className="absolute inset-0 z-10 size-full flex items-center justify-center bg-white/40">
          <div className="w-6 h-6 border-4 border-gray-300 border-t-pink-800 rounded-full animate-spin"></div>
        </div>
      )}

      <LazyLoadImage
        alt={alt}
        src={imgSrc || placeholderImage}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setImgSrc(placeholderImage); // show placeholder if original fails
          setLoaded(true);
        }}
        className={`${className} transition-opacity duration-300`}
      />
    </div>
  );
};

export default SmartImage;

 