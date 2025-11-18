import { useAuthStore } from "../../store/authStore";
// import { BASE_URL } from "../../config/env";
const BASE_URL = import.meta.env.VITE_API_URL;;
const getAuthHeaders = () => ({
  Authorization: `Bearer ${useAuthStore.getState().token}`,
});

export const fetchUsers = async (search) => {
  const url = new URL(`${BASE_URL}/users`);
  if (search) {
    url.searchParams.append("search", search);
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch users");

  return data.data;
};

export const fetchTenants = async (search) => {
  const url = new URL(`${BASE_URL}/tenants`);
  if (search) {
    url.searchParams.append("search", search);
  }
  const res = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch tenants");

  return data.data;
};
