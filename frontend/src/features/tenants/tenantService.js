import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

export const fetchTenants = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/tenants`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.message || "Failed to fetch tenants");
	}

	return data.data;
};

export const deleteTenant = async (id) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/tenants/${id}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) throw new Error("Failed to delete tenant");
};
