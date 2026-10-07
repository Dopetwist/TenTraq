import { apiRequest } from "./api.js";

export const getEmailRecipients = () => apiRequest("/api/email-recipients");

export const sendTenantEmail = (data) =>
    apiRequest("/api/send-email", {
        method: "POST",
        body: JSON.stringify(data)
    });
