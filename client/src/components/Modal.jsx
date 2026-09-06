
function Modal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", 
    cancelText = "Cancel", isLoading = false }) {
        
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <p>{message}</p>

                <div className="modal-actions">
                    <button onClick={onCancel} className="cancel-btn">
                        {cancelText}
                    </button>

                    <button 
                        onClick={onConfirm} 
                        className="delete-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;