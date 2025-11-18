import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function UnprotectedRoute({ children }) {
	const { isAuthenticated } = useAuthStore();

	if (isAuthenticated()) {
		return <Navigate to="/user-projects" replace />;
	}

	return children;
}
