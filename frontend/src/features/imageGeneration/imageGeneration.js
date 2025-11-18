import api from "../../api/axios";

export const updateGeneratedImageStatus = async ({ aiTaskId, newStatus ,imageUrl}) => {
  try {
    const response = await api.patch(`/gallery/setGeneratedImage/${aiTaskId}`, {
				status: newStatus,
				imageUrls: [imageUrl], // Send the URL array
			});
    return {data:response.data, status: response.status};
  } catch (error) {
    console.error("Failed to update image status:", error);
    throw error;
  }
};
