export const API_BASE_URL = "https://tentraq-api.onrender.com";

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
