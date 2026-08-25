const API_URL = "http://localhost:5000";

export const apiRequest = async (path, options = {}) => {
	const token = localStorage.getItem("tentrackr-token");
	const response = await fetch(`${API_URL}${path}`, {
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
