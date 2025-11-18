import api from "../api/axios"

const generateVariationService = async (formData) => {
  try {
    const response = await api.post('/generate/create', formData,{
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true // Send cookies with the request
    });
    return response;
  } catch (error) {
    return error.response?.data || { error: 'Unknown error' };
  }
}

export {generateVariationService}