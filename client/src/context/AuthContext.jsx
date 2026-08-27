import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("tentraq-user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Fetch current user data on component mount
    /* useEffect(() => {

        const getCurrentUser = async () => {
            try {
                const data = await apiRequest("/api/auth/me", {
                    method: "GET"
                });
                setUser(data.landlord);
                console.log(user);
            } catch (error) {
                console.error("Error fetching current user:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getCurrentUser();
    }, []); */

    const signIn = ({ landlord, token }) => {
        localStorage.setItem("tentraq-token", token);
        localStorage.setItem("tentraq-user", JSON.stringify(landlord));
        setUser(landlord);
    };

    const signOut = () => {
        localStorage.removeItem("tentraq-token");
        localStorage.removeItem("tentraq-user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}