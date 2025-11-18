import api from "../../api/axios";

export const verifyOtp = async ({ email, otp }) => {
	try {
		await api.post("/auth/verify-otp", { email, otp });
	} catch (err) {
		throw {
			message: err.response?.data?.message || "OTP verification failed",
			data: err.response?.data,
		};
	}
};

export const resendOtp = async ({ email }) => {
	try {
		await api.post("/auth/send-otp", { email });
	} catch (err) {
		throw {
			message: err.response?.data?.message || "Failed to resend OTP",
			data: err.response?.data,
		};
	}
};

export const verifyTempUserOtp = async ({ email, otp }) => {
	try {
		const res = await api.post("/onboarding/verify-otp", { email, otp });
		return res; // ✅ return the full response
	} catch (err) {
		throw {
			message: err.response?.data?.message || "OTP verification failed",
			data: err.response?.data,
		};
	}
};

export const resendTempUserOtp = async ({ email }) => {
	try {
		await api.post("/onboarding/send-otp", { email });
	} catch (err) {
		throw {
			message: err.response?.data?.message || "Failed to resend OTP",
			data: err.response?.data,
		};
	}
};

export const login = async ({ email, password, otp }) => {
	try {
		const response = await api.post("/auth/login", { email, password, otp });
		return response.data.data;
	} catch (err) {
		const status = err.response?.status;
		const data = err.response?.data;

		if (status === 403) {
			const error = new Error(data?.message || "User not verified");
			error.code = 403;
			error.email = email;
			throw error;
		}
		
		if (status === 406) {
			// 2FA verification required
			const error = new Error(data?.message || "2FA verification required");
			error.code = 406;
			error.email = email;
			error.data = data?.data || {}; // Contains phoneNumber and other metadata
			throw error;
		}
		throw {
			message: data?.message || "Login failed",
			data,
		};
	}
};

export const fetchUserProfile = async () => {
	try {
		const response = await api.get("/users/me");
		return response.data.data;
	} catch (err) {
		throw {
			message: err.response?.data?.message || "Failed to fetch user",
			data: err.response?.data,
		};
	}
};

export const fetchUserProfileWithToken = async (token) => {
	try {
		const response = await api.get("/users/me", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data.data;
	} catch (err) {
		throw {
			message: err.response?.data?.message || "Failed to fetch user",
			data: err.response?.data,
		};
	}
};


export const sendForgotPasswordOtp = async (email) => {
	try {
		const response = await api.post("/auth/forgot-password", { email });
		return response.data;
	} catch (err) {
		throw {
			message:
				err.response?.data?.message ||
				"Failed to send forgot password OTP",
			data: err.response?.data,
		};
	}
};

export const resetPasswordWithOtp = async (email, otp, newPassword) => {
	try {
		const response = await api.post("/auth/reset-password", {
			email,
			otp,
			newPassword,
		});
		return response.data;
	} catch (err) {
		throw {
			message: err.response?.data?.message || "Failed to reset password",
			data: err.response?.data,
		};
	}
};


 export const markTaskAsSeen = async (taskId) => {  
    try {
      const response = await api.post("/image-variation/mark-seen", {
        task_id: taskId,
      });
      console.log("Task marked as seen:", response.data);
	  return response.data;
    } catch (error) {
      console.error("Error marking task as seen:", error);
	  throw error;
    }
  };


   export const submitReview = async (data) => {  
    try {
      const response = await api.post("/image-variation/submit-review",data);
      console.log("Task marked as seen:", response.data);
	  return response.data;
    } catch (error) {
      console.error("Error marking task as seen:", error);
	  throw error;
    }
 };