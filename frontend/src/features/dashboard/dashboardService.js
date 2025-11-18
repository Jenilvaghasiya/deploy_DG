// import { BASE_URL } from "../../config/env";
import { useAuthStore } from "../../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL;;
const getAuthHeaders = () => ({
  Authorization: `Bearer ${useAuthStore.getState().token}`,
});

const buildUrl = (baseUrl, filters) => {
  const url = new URL(baseUrl);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
};

export const fetchTimeOnPlatform = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/time-on-platform`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "Failed to fetch time on platform");

  return data.data;
};

export const fetchUsageTime = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/usage-time`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch usage time");

  return data.data;
};

export const fetchOutputStats = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/output-stats`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch output stats");

  return data.data;
};

export const fetchCreditConsumption = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/credit-consumption`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "Failed to fetch credit consumption");

  return data.data;
};

export const fetchFreeOutputs = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/free-outputs`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch free outputs");

  return data.data;
};

export const fetchActivityLog = async (filters) => {
  const url = buildUrl(`${BASE_URL}/dashboard/activity-log`, filters);
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch activity log");

  return data.data;
};
