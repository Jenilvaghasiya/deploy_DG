import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

export const fetchDepartments = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/departments`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.message || "Failed to fetch departments");
	}

	return data.data;
};
