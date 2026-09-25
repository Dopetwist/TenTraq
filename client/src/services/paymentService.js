import { apiRequest } from "./api.js";

export const getPayments = (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
    });
    const query = params.toString();
    return apiRequest(`/api/payments${query ? `?${query}` : ""}`);
};

export const getPaymentSummary = () => apiRequest("/api/dashboard/payment-summary");
export const getPayment = (id) => apiRequest(`/api/payments/${id}`);
export const getTenantPayments = (tenantId) => apiRequest(`/api/tenants/${tenantId}/payments`);
export const getRentObligations = (tenantId) => apiRequest(`/api/rent-obligations${tenantId ? `?tenantId=${tenantId}` : ""}`);
export const createRentObligation = (data) => apiRequest("/api/rent-obligations", { method: "POST", body: JSON.stringify(data) });
export const createPayment = (data) => apiRequest("/api/payments", { method: "POST", body: JSON.stringify(data) });
export const updatePayment = (id, data) => apiRequest(`/api/payments/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const reversePayment = (id) => apiRequest(`/api/payments/${id}/reverse`, { method: "PATCH" });
export const getPaymentTenants = () => apiRequest("/api/payment-tenants");
