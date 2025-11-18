import { BASE_URL } from "../../config/env";

const BASE = `${BASE_URL}/invitations`;

export const fetchInviteDetails = async (token) => {
	const res = await fetch(`${BASE}/${token}`);
	if (!res.ok) throw new Error("Invalid or expired invitation");
	const data = await res.json();
	return data.data;
};

export const getTenantInvitations = async (token, tenantId) => {
	const res = await fetch(`${BASE}/tenants/${tenantId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error("Failed to fetch invitations");

	const data = await res.json();
	return data.data;
};

export const getPendingTenantInvitations = async (token, tenantId) => {
	const res = await fetch(`${BASE}/tenants/${tenantId}/pending`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error("Failed to fetch invitations");

	const data = await res.json();
	return data.data;
};

export const inviteUser = async (payload, token) => {
	const res = await fetch(`${BASE}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	});

	const data = await res.json();
	if (!res.ok) throw new Error(data.message || "Failed to send invite");
	return data.data;
};

export const acceptInvitation = async (token, body) => {
	const res = await fetch(`${BASE}/${token}/accept`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.message || "Failed to accept invite");
	}
	return res.json();
};

export const resendInvitation = async (token, invitationId) => {
	const res = await fetch(`${BASE}/${invitationId}/resend`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		const err = await res.json();
		throw new Error(err.message || "Failed to resend invitation");
	}
	return res.json();
};

export const deleteInvitation = async (token, invitationId) => {
  const response = await fetch(`${BASE}/${invitationId}/delete`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete invitation");
  }

  return await response.json();
};