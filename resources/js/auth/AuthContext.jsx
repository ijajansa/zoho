import { createContext, useContext, useEffect, useState } from 'react';
import api, { TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setLoading(false);
            return;
        }

        api.get('/user')
            .then(({ data }) => setUser(data.data.user))
            .catch(() => localStorage.removeItem(TOKEN_KEY))
            .finally(() => setLoading(false));
    }, []);

    const finishAuthentication = (data) => {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
    };

    const login = async (credentials) => {
        const { data } = await api.post('/login', credentials);
        finishAuthentication(data.data);
        return data;
    };

    const register = async (details) => {
        const { data } = await api.post('/register', details);
        finishAuthentication(data.data);
        return data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // Local credentials must still be cleared if the server is unavailable.
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
