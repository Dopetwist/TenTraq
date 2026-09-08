import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getCurrentUser = async () => {
            const token = localStorage.getItem("tentraq-token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const data = await apiRequest("/api/auth/me");
                setUser(data.landlord);
            } catch (error) {
                console.error("Error fetching current user:", error);
                localStorage.removeItem("tentraq-token");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getCurrentUser();
    }, []);

    const signIn = ({ landlord, token }) => {
        localStorage.setItem("tentraq-token", token);
        setUser(landlord);
    };

    const signOut = () => {
        localStorage.removeItem("tentraq-token");
        setUser(null);
    };

    const updateUser = (updates) => {
        setUser((currentUser) => currentUser ? { ...currentUser, ...updates } : currentUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}