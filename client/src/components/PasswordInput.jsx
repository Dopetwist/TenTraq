import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({ id, name, value, onChange, minLength, autoComplete, required }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="password-input-wrapper">
            <input
                id={id}
                type={isVisible ? "text" : "password"}
                name={name}
                minLength={minLength}
                value={value}
                onChange={onChange}
                required={required}
                autoComplete={autoComplete}
            />
            <button
                className="password-visibility-toggle"
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                aria-label={isVisible ? "Hide password" : "Show password"}
                aria-pressed={isVisible}
                title={isVisible ? "Hide password" : "Show password"}
            >
                {isVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
        </div>
    );
}

export default PasswordInput;