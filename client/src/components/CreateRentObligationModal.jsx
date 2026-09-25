import { useState } from "react";
import { X } from "lucide-react";
import { createRentObligation } from "../services/paymentService.js";
import { useToast } from "../context/ToastContext.jsx";

function CreateRentObligationModal({ isOpen, tenantId, onClose, onCreated }) {

    const [form, setForm] = useState({ amount_due: "", due_date: "", period_start: "", period_end: "", notes: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    if (!isOpen) return null;
    const setField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

    const submit = async (event) => {
        event.preventDefault(); 
        setError(""); 
        setSubmitting(true);
        
        try { 
            await createRentObligation({ ...form, tenant_id: tenantId }); 
            setForm({ amount_due: "", due_date: "", period_start: "", period_end: "", notes: "" }); 
            onClose(); 
            onCreated(); 
            showToast("Rent obligation created successfully."); 
        } catch (requestError) { 
            setError(requestError.message); 
            showToast(requestError.message, "error"); 
        }
        finally { 
            setSubmitting(false); 
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal payment-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-heading">
                    <div>
                        <p className="modal-eyebrow">Rent ledger</p>
                        <h2>New Rent Obligation</h2>
                    </div>
                    <button 
                    type="button" 
                    className="modal-close-btn" 
                    onClick={onClose} 
                    aria-label="Close modal"
                    >
                        <X size={18} />
                    </button>
                </div>
                <form className="payment-form" onSubmit={submit}>
                    <label>
                        Amount due
                        <input 
                        name="amount_due" 
                        value={form.amount_due} 
                        onChange={setField} 
                        inputMode="decimal" 
                        min="0.01" 
                        step="0.01" 
                        required 
                        />
                    </label>
                    <div className="payment-form-grid">
                        <label>
                            Due date
                            <input name="due_date" type="date" value={form.due_date} onChange={setField} required />
                        </label>
                        <label>
                            Period start
                            <input name="period_start" type="date" value={form.period_start} onChange={setField} required />
                        </label>
                    </div>
                    <label>
                        Period end
                        <input name="period_end" type="date" value={form.period_end} onChange={setField} required />
                    </label>
                    <label>
                        Notes
                        <textarea name="notes" value={form.notes} onChange={setField} rows="3" />
                    </label>

                    {error && <p className="form-error" role="alert">{error}</p>}
                    
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                        <button type="submit" className="confirm-btn" disabled={submitting}>
                            {submitting ? "Creating..." : "Create Obligation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateRentObligationModal;
