import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("tentrackr-user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const signIn = ({ landlord, token }) => {
        localStorage.setItem("tentrackr-token", token);
        localStorage.setItem("tentrackr-user", JSON.stringify(landlord));
        setUser(landlord);
    };

    const signOut = () => {
        localStorage.removeItem("tentrackr-token");
        localStorage.removeItem("tentrackr-user");
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