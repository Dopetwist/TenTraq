import { useEffect, useState } from "react";
import { getEmailRecipients, sendTenantEmail } from "../services/emailService.js";

function EmailPage() {
    const [recipients, setRecipients] = useState({ tenants: [], properties: [] });
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
    const [recipientLoadError, setRecipientLoadError] = useState("");
    const [recipientLoadAttempt, setRecipientLoadAttempt] = useState(0);
    const [recipientType, setRecipientType] = useState("");
    const [tenantId, setTenantId] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        let isCurrent = true;

        const loadRecipients = async () => {
            setIsLoadingRecipients(true);
            setRecipientLoadError("");

            try {
                const data = await getEmailRecipients();
                if (isCurrent) setRecipients(data);
            } catch (error) {
                if (isCurrent) setRecipientLoadError(error.message);
            } finally {
                if (isCurrent) setIsLoadingRecipients(false);
            }
        };

        loadRecipients();
        return () => {
            isCurrent = false;
        };
    }, [recipientLoadAttempt]);

    const hasEmailAddress = (tenant) =>
        typeof tenant.email === "string" && tenant.email.trim().length > 0;
    const tenantsWithEmail = recipients.tenants.filter(hasEmailAddress);
    const getPropertyTenantCount = (selectedPropertyId) =>
        tenantsWithEmail.filter((tenant) => String(tenant.property_id) === String(selectedPropertyId)).length;
    const canSend = recipientType === "all"
        ? tenantsWithEmail.length > 0
        : recipientType === "single"
            ? Boolean(tenantId)
            : recipientType === "property"
                ? Boolean(propertyId) && getPropertyTenantCount(propertyId) > 0
                : false;

    const handleRecipientTypeChange = (event) => {
        setRecipientType(event.target.value);
        setTenantId("");
        setPropertyId("");
        setFeedback(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFeedback(null);
        setIsSending(true);

        try {
            await sendTenantEmail({
                recipientType,
                ...(recipientType === "single" ? { tenantId } : {}),
                ...(recipientType === "property" ? { propertyId } : {}),
                subject,
                message
            });
            setFeedback({ type: "success", text: "Email sent successfully." });
        } catch (error) {
            setFeedback({ type: "error", text: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div id="email-section">
            <div className="email-container">
                <h2>Send an Email</h2>
                <form onSubmit={handleSubmit}>
                    <fieldset className="email-recipient-fieldset">
                        <legend>Send to</legend>
                        <div className="radio-section">
                            <div className="inner-radio">
                                <input
                                    type="radio"
                                    name="recipientType"
                                    id="single"
                                    value="single"
                                    checked={recipientType === "single"}
                                    onChange={handleRecipientTypeChange}
                                    required
                                />
                                <label htmlFor="single">Single Tenant</label>
                            </div>

                            <div className="inner-radio">
                                <input
                                    type="radio"
                                    name="recipientType"
                                    id="all"
                                    value="all"
                                    checked={recipientType === "all"}
                                    onChange={handleRecipientTypeChange}
                                />
                                <label htmlFor="all">All Tenants</label>
                            </div>

                            <div className="inner-radio">
                                <input
                                    type="radio"
                                    name="recipientType"
                                    id="property-tenants"
                                    value="property"
                                    checked={recipientType === "property"}
                                    onChange={handleRecipientTypeChange}
                                />
                                <label htmlFor="property-tenants">Property Tenants</label>
                            </div>
                        </div>
                    </fieldset>

                    <div className="email-form-field">
                        <label htmlFor="subject">Subject</label>
                        <input
                            type="text"
                            name="subject"
                            id="subject"
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Enter subject"
                            maxLength={200}
                            required
                        />
                    </div>

                    {recipientType === "single" && (
                        <div className="email-form-field">
                            <label htmlFor="tenant">Tenant</label>
                            <select
                                id="tenant"
                                name="tenantId"
                                value={tenantId}
                                onChange={(event) => setTenantId(event.target.value)}
                                disabled={isLoadingRecipients || recipients.tenants.length === 0}
                                required
                            >
                                <option value="">
                                    {isLoadingRecipients ? "Loading tenants..." : "Select a tenant"}
                                </option>
                                {recipients.tenants.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id} disabled={!hasEmailAddress(tenant)}>
                                        {tenant.full_name} ({hasEmailAddress(tenant) ? tenant.email.trim() : "No email address"})
                                    </option>
                                ))}
                            </select>
                            {!isLoadingRecipients && !recipientLoadError && tenantsWithEmail.length === 0 && (
                                <p className="email-field-hint">No tenants with email addresses are available.</p>
                            )}
                        </div>
                    )}

                    {recipientType === "property" && (
                        <div className="email-form-field">
                            <label htmlFor="property">Property</label>
                            <select
                                id="property"
                                name="propertyId"
                                value={propertyId}
                                onChange={(event) => setPropertyId(event.target.value)}
                                disabled={isLoadingRecipients || recipients.properties.length === 0}
                                required
                            >
                                <option value="">
                                    {isLoadingRecipients ? "Loading properties..." : "Select a property"}
                                </option>
                                {recipients.properties.map((property) => {
                                    const tenantCount = getPropertyTenantCount(property.id);
                                    return (
                                        <option
                                            key={property.id}
                                            value={property.id}
                                            disabled={tenantCount === 0}
                                        >
                                            {property.property_name} ({tenantCount} {tenantCount === 1 ? "recipient" : "recipients"})
                                        </option>
                                    );
                                })}
                            </select>
                            {!isLoadingRecipients && recipients.properties.length === 0 && (
                                <p className="email-field-hint">No properties are available.</p>
                            )}
                            {!isLoadingRecipients && propertyId && getPropertyTenantCount(propertyId) === 0 && (
                                <p className="email-field-hint">
                                    Choose a property with tenants who have email addresses.
                                </p>
                            )}
                        </div>
                    )}
                    {recipientType === "all" && !isLoadingRecipients && !recipientLoadError && tenantsWithEmail.length === 0 && (
                        <p className="email-field-hint">No tenant email addresses are available.</p>
                    )}

                    <div className="email-form-field">
                        <label htmlFor="message">Message</label>
                        <textarea
                            name="message"
                            id="message"
                            rows={10}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Write a message..."
                            maxLength={10000}
                            required
                        />
                    </div>

                    {recipientLoadError && (
                        <>
                            <p className="email-feedback error" role="alert">
                                Unable to load recipients: {recipientLoadError}
                            </p>
                            <button
                                type="button"
                                className="email-retry-button"
                                onClick={() => setRecipientLoadAttempt((attempt) => attempt + 1)}
                            >
                                Retry loading recipients
                            </button>
                        </>
                    )}
                    {feedback && (
                        <p
                            className={`email-feedback ${feedback.type}`}
                            role={feedback.type === "error" ? "alert" : "status"}
                        >
                            {feedback.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        id="send"
                        disabled={isSending || isLoadingRecipients || Boolean(recipientLoadError) || !canSend}
                    >
                        {isSending ? "Sending..." : "Send Email"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EmailPage;