import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL;
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL;

// Utility function to check if JWT token is expired
const isTokenExpired = (token) => {
	if (!token) return true;

	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		const currentTime = Date.now() / 1000;
		return payload.exp < currentTime;
	} catch (error) {
		return true; // Invalid token format
	}
};

// Function to handle auth errors consistently
const handleAuthError = () => {
	const { logout } = useAuthStore.getState();
	logout();
	// Use replace to prevent back navigation to protected routes
	if (!window.location.pathname.includes("/login")) {
		window.location.replace("/login");
	}
};

// Request interceptor function
const addAuthTokenInterceptor = (axiosInstance) => {
	return axiosInstance.interceptors.request.use(
		(config) => {
			const { token } = useAuthStore.getState();

			if (token) {
				// Check if token is expired before making request
				if (isTokenExpired(token)) {
					handleAuthError();
					return Promise.reject(new Error("Token expired"));
				}
				config.headers.Authorization = `Bearer ${token}`;
			}
			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);
};

// Response interceptor function
const addResponseInterceptor = (axiosInstance) => {
	return axiosInstance.interceptors.response.use(
		(response) => response,
		(error) => {
			// Handle 401 Unauthorized responses
			if (error.response?.status === 401) {
				handleAuthError();
			}
			return Promise.reject(error);
		}
	);
};

// Create axios instances
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export const api_server = axios.create({
	baseURL: API_SERVER_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export const server = axios.create({
	baseURL: SERVER_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export const multipartRequest = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "multipart/form-data",
	},
});

// Add interceptors to all instances that need authentication
// Main API instance
addAuthTokenInterceptor(api);
addResponseInterceptor(api);

// API Server instance
addAuthTokenInterceptor(api_server);
addResponseInterceptor(api_server);

// Server instance (if it needs auth)
addAuthTokenInterceptor(server);
addResponseInterceptor(server);

// Multipart request instance
addAuthTokenInterceptor(multipartRequest);
addResponseInterceptor(multipartRequest);

export default api;
