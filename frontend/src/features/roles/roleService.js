import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

export const fetchRoles = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/roles`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.message || "Failed to fetch roles");
	}

	return data.data;
};

export const createRole = async (data) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/roles`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	});

	const result = await res.json();

	if (!res.ok) throw new Error(result.message || "Failed to create role");

	return result.data;
};

export const deleteRole = async (id) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/roles/${id}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) throw new Error("Failed to delete role");
};

export const getRolePermissions = async (roleId) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/rbac/${roleId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to fetch permissions");
	return data.data;
};

export const assignPermissionsToRole = async (roleId, permissionIds) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/rbac/assign`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			role_id: roleId,
			permission_ids: permissionIds,
		}),
	});

	const data = await res.json();
	if (!res.ok)
		throw new Error(data.message || "Failed to assign permissions");
	return data.data;
};
