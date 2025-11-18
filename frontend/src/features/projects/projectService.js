import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

export const fetchProjects = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/projects`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const data = await res.json();	
	if (!res.ok) throw new Error(data.message || "Failed to fetch projects");

	return data.data;
};

export const createProject = async (projectData) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/projects`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(projectData),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to create project");

	return data.data;
};

export const deleteProject = async (projectId) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error("Failed to delete project");
};

export const addUserToProject = async (projectId, userId) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/projects/${projectId}/users`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ user_id: userId }),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to add user");

	return data.data;
};

export const removeUserFromProject = async (projectId, userId) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/projects/${projectId}/users`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ user_id: userId }),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to remove user");

	return data.data;
};
