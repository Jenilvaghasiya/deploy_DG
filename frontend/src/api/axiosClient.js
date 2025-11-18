import axios from 'axios';
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
const axiosClient = axios.create({
  baseURL: VITE_BASE_URL, // Replace with your API's base URL
  timeout: 30000, // Optional: 5 seconds timeout
});

// Optional: Add interceptors for adding tokens, logging, etc.
axiosClient.interceptors.request.use(
  (config) => {
    // Example: If you need to add an authorization token:
    const token = localStorage.getItem('token'); // or from your state/store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle global responses and specific errors
axiosClient.interceptors.response.use(
  (response) => response.data, // Automatically unwrap data
  (error) => {
    // Check if error response is available
    if (error.response) {
      const { status, data } = error.response;

      // Handle 403 Forbidden
      if (status === 403) {
        console.warn('Forbidden: You do not have permission to access this resource.');
        // Optionally, you can redirect the user or show a specific message
      }

      // Handle other status codes as needed
      if (status === 401) {
        console.warn('Unauthorized: Please log in again.');
        // Possibly log out the user or redirect to login
      }

      if (status === 404) {
        console.warn('Not Found: The requested resource does not exist.');
      }

      // Optionally handle 500 or others
      if (status >= 500) {
        console.error('Server Error:', data?.message || 'Something went wrong on the server.');
      }
    } else {
      // Network errors (no response)
      console.error('Network Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;