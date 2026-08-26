import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("tentraq-user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

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