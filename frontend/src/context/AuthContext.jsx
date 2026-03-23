import React, { createContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Verify token expiration
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp < currentTime) {
                        console.log("Token expired.");
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        // Fetch user data
                        const userData = await getMe();
                        setUser(userData);
                    }
                } catch (error) {
                    console.error("Failed to load user:", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        if (data.token) {
            localStorage.setItem('token', data.token);
            const userData = await getMe();
            setUser(userData);
            return userData;
        }
        throw new Error('No token returned');
    };

    const register = async (fullname, email, password) => {
        await apiRegister(fullname, email, password);
        // Auto-login after registration is generally good practice
        return await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
