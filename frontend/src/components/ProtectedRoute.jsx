import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }) {
	const { isAuthenticated, logout } = useAuthStore();

	if (!isAuthenticated()) {
		logout(); // Clear invalid/expired token
		return <Navigate to="/login" replace />;
	}

	return children;
}
