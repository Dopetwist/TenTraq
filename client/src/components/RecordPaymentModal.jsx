import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPayment, getRentObligations } from "../services/paymentService.js";
import { useToast } from "../context/ToastContext.jsx";

const initialForm = {
    tenant_id: "",
    rent_obligation_id: "",
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "bank_transfer",
    reference: "",
    notes: ""
};

function RecordPaymentModal({ isOpen, onClose, tenants, onCreated }) {
    const [form, setForm] = useState(initialForm);
    const [obligations, setObligations] = useState([]);
    const [loadingObligations, setLoadingObligations] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const { showToast } = useToast();

    useEffect(() => {
        if (!form.tenant_id) {
            setObligations([]);
            return;
        }
        setLoadingObligations(true);
        getRentObligations(form.tenant_id)
            .then(setObligations)
            .catch((requestError) => setError(requestError.message))
            .finally(() => setLoadingObligations(false));
    }, [form.tenant_id]);

    if (!isOpen) return null;

    const selectedObligation = obligations.find((obligation) => String(obligation.id) === form.rent_obligation_id);
    const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await createPayment({ ...form, amount: form.amount.trim() });
            setForm(initialForm);
            onClose();
            onCreated();
            showToast("Payment recorded successfully.");
        } catch (requestError) {
            setError(requestError.message);
            showToast(requestError.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal payment-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-heading">
                    <div><p className="modal-eyebrow">Ledger entry</p><h2>Record Payment</h2></div>
                    <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal"><X size={18} /></button>
                </div>
                <form className="payment-form" onSubmit={handleSubmit}>
                    <label>Tenant<select name="tenant_id" value={form.tenant_id} onChange={(event) => setForm({ ...form, tenant_id: event.target.value, rent_obligation_id: "", amount: "" })} required><option value="">Select tenant</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.full_name} · {tenant.property_name}</option>)}</select></label>
                    <label>Rent obligation<select name="rent_obligation_id" value={form.rent_obligation_id} onChange={(event) => setForm({ ...form, rent_obligation_id: event.target.value, amount: "" })} disabled={!form.tenant_id || loadingObligations} required><option value="">{loadingObligations ? "Loading..." : "Select obligation"}</option>{obligations.filter((obligation) => obligation.outstanding > 0 && obligation.status !== "paid").map((obligation) => <option key={obligation.id} value={obligation.id}>{obligation.periodStart} to {obligation.periodEnd}</option>)}</select></label>
                    {selectedObligation && <p className="payment-balance">Outstanding: <strong>{selectedObligation.outstanding}</strong></p>}
                    <div className="payment-form-grid"><label>Amount<input name="amount" value={form.amount} onChange={setField} inputMode="decimal" min="0.01" step="0.01" required /></label><label>Payment date<input name="payment_date" type="date" value={form.payment_date} onChange={setField} required /></label></div>
                    <label>Payment method<select name="payment_method" value={form.payment_method} onChange={setField}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="pos">POS</option><option value="online">Online</option><option value="other">Other</option></select></label>
                    <label>Reference<input name="reference" value={form.reference} onChange={setField} placeholder="Optional transaction reference" /></label>
                    <label>Notes<textarea name="notes" value={form.notes} onChange={setField} rows="3" placeholder="Optional notes" /></label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <div className="modal-actions"><button type="button" onClick={onClose} className="cancel-btn">Cancel</button><button type="submit" className="confirm-btn" disabled={submitting}>{submitting ? "Recording..." : "Record Payment"}</button></div>
                </form>
            </div>
        </div>
    );
}

export default RecordPaymentModal;
