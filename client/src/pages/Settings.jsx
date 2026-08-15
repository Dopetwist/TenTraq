import { SquarePen } from "lucide-react";

function Settings() {
    return (
        <div id="settings-section">
            <h2>Settings</h2>
            
            <div className="settings-container">
                <div className="settings-box">
                    <p className="settings-title">Account name:</p>
                    <p>John Doe <span><SquarePen size={18} /></span></p>
                </div>
                <div className="settings-box">
                    <p className="settings-title">Email:</p>
                    <p>john@gmail.com <span><SquarePen size={18} /></span></p>
                </div>
                <div className="settings-box">
                    <p className="settings-title">Change Password</p>
                </div>
                <div className="settings-box">
                    <p className="settings-title">Delete Account</p>
                </div>
            </div>
        </div>
    )
}

export default Settings;