import { useState, useEffect } from "react";
import { SquarePen, X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Settings() {

    const { user } = useAuth();

    const [ isClicked, setIsClicked ] = useState(false);
    const [ updatedName, setUpdatedName ] = useState(user?.full_name || "");
    /* const [ userName, setUserName ] = useState();

    useEffect(() => {
        const getUserName = async () => {
            try {
                const response = await axios.get();
                console.log(response.data);
            } catch (error) {
                console.error(error.message);
            }
        }

        getUserName();
    }, []); */

    return (
        <div id="settings-section">
            <h2>Settings</h2>
            
            <div className="settings-container">
                <div className="settings-box">
                    <p className="settings-title">Account name:</p>
                    <div className="settings-details">
                        <div className="settings-modify">
                            {isClicked ? (
                                <div className="settings-input-container">
                                    <form>
                                        <input 
                                        type="text"
                                        className="user-name"
                                        name="full_name"
                                        value={updatedName}
                                        placeholder="Enter your name"
                                        onChange={(e) => {
                                            setUpdatedName(e.target.value);
                                        }}
                                        autoFocus
                                        />

                                        <div className="input-btns">
                                            <button 
                                            type="button"
                                            className="edit-action-btn"
                                            onClick={() => setIsClicked(false)}
                                            >
                                                <X size={16} color="#EF4444" />
                                            </button>
                                            <button 
                                            type="submit"
                                            className="edit-action-btn"
                                            >
                                                <Check size={16} color="#10B981" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : <p>{user?.full_name || "John Doe"}</p>
                            }
                        </div> 
                        {!isClicked && (
                            <button
                            type="button"
                            className="settings-edit-btn"
                            onClick={() => setIsClicked(true)}
                            >
                                <SquarePen size={18} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="settings-box">
                    <p className="settings-title">Email:</p>
                    <div className="settings-details">
                        <div className="settings-modify">
                            <p>john@gmail.com</p>
                        </div> 
                        <button
                        type="button"
                        className="settings-edit-btn"
                        >
                            <SquarePen size={18} />
                        </button>
                    </div>
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