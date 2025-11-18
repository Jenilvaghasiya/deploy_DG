import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

export const getUsers = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/users`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) throw new Error("Failed to fetch users");
	const json = await res.json();
	return json.data;
};

export const getTenantUsers = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/users/tenant`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) throw new Error("Failed to fetch users");
	const json = await res.json();
	return json.data;
};

export const getRevokedTenantUsers = async () => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/users/revoked-users`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) throw new Error("Failed to fetch users");
	const json = await res.json();
	return json.data;
};

export const transferRevokedUserData = async (data) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/users/revoked-users/transfer-data`, {
		method:'POST',
		headers: {
			"Content-Type": "application/json",   
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	});
	return res;
};

export const updateUser = async (id, data) => {
	const token = useAuthStore.getState().token;

	const res = await fetch(`${BASE_URL}/users/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	});
	if (!res.ok) throw new Error("Failed to update user");
	const json = await res.json();
	return json.data;
};

export const deleteUser = async (id, data) => {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data), // 👈 send payload here
  });

  if (!res.ok) throw new Error("Failed to delete user");
};
