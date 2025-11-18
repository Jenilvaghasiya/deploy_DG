export const loadImageFromLocalStorage = (expectedService, setPreviewImage, setFieldValue) => {
  const stored = localStorage.getItem("pre_upload_image");
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.image_url && parsed.service_type === expectedService) {
      fetch(parsed.image_url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "from_gallery.jpg", { type: blob.type });
          setPreviewImage(parsed.image_url);
          setFieldValue("garmentImage", file);
        });
    }
  } catch (e) {
    console.error("Failed to parse pre_upload_image:", e);
  } finally {
    localStorage.removeItem("pre_upload_image");
  }
};
