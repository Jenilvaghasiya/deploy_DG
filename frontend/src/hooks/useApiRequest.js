import { useState } from "react";

export const useApiRequest = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});

	const sendRequest = async (apiFn, ...args) => {
		setLoading(true);
		setError("");
		setFieldErrors({});

		try {
			const result = await apiFn(...args);
			return result;
		} catch (err) {
			const data = err?.data || err?.response?.data;

			setError(data?.message || err.message || "Something went wrong");

			if (Array.isArray(data?.data)) {
				const errors = {};
				data.data.forEach(({ field, message }) => {
					errors[field] = message;
				});
				setFieldErrors(errors);
			}

			return null;
		} finally {
			setLoading(false);
		}
	};

	return { sendRequest, loading, error, fieldErrors };
};
