import api from "../../api/axios.js";

export const onboardTenant = async ({ tenant, admin_user }) => {
	try {
		const response = await api.post("/onboarding", {
			tenant,
			admin_user,
		});
		return response.data.data;
	} catch (err) {
		if (err.response) {
			throw {
				message: err.response.data?.message || "Request failed",
				data: err.response.data,
			};
		} else {
			throw { message: err.message || "Network error" };
		}
	}
};
