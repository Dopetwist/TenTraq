/* export const API_BASE_URL = "http://localhost:5000"; */ // For local development

export const API_BASE_URL = "https://tentraq-api.onrender.com"; // For production deployment

/* This function is a wrapper around the fetch API that automatically includes the authorization token 
in the request headers if it exists in localStorage. It also handles JSON parsing and error handling. */
export const apiRequest = async (path, options = {}) => {
	const token = localStorage.getItem("tentraq-token");
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers
		}
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || "Something went wrong.");
	return data;
};
