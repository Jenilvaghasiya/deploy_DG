import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

// Custom hook for navigation with gallery image ID
export const useNavigateWithGalleryImage = () => {
  const navigate = useNavigate();

  const navigateToPathWithImage = useCallback((path, imageId) => {
    // Ensure the path starts with / for absolute navigation
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    
    // Remove any trailing slashes
    const cleanPath = absolutePath.endsWith('/') ? absolutePath.slice(0, -1) : absolutePath;
    
    // Check if the path already has query parameters
    const hasQueryParams = cleanPath.includes('?');
    
    // Build the final URL with the galleryImageID
    const finalUrl = hasQueryParams 
      ? `${cleanPath}&galleryImageID=${imageId}`
      : `${cleanPath}?galleryImageID=${imageId}`;
    
    // Navigate to the new URL
    navigate(finalUrl);
  }, [navigate]);

  return navigateToPathWithImage;
};
