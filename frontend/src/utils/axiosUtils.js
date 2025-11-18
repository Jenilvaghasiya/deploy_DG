import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_STRAPI_URL}`; // 🔁 replace with your actual domain

// Generic function to fetch any content type
export const fetchStrapiContent = async (endpoint) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`, // 🔁 replace with your actual token if needed
        },
    });
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to fetch ${endpoint} content.`);
  }
};

export const saveStrapiContent = async (endpoint, options = {}) => {
  try {
    const { body, headers = {}, ...rest } = options;

    const response = await axios.post(
      `${API_BASE_URL}/api/${endpoint}`,
      JSON.parse(body), // body is a JSON string, parse it back to object
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_STRAPI_API_TOKEN}`,
          ...headers,
        },
        ...rest,
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Strapi Error:", error.response?.data || error.message);
    throw new Error(`Failed to fetch ${endpoint} content.`);
  }
};