import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { APIClient } from '../services/APIClient';
import { useToast } from '@chakra-ui/react';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    user_nickname: string;
    password: string;
}

export const useAuth = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { 
        user, 
        isAuthenticated,
        setAuth, 
        logout: storeLogout,
        sessionExpired 
    } = useAuthStore();

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            const response = await APIClient.login(credentials);
            setAuth(
                response.user,
                response.accessToken,
                response.refreshToken,
                response.accessExpiration,
                response.refreshExpiration
            );
            navigate('/');
            return true;
        } catch (err: any) {
            toast({
                title: "Login failed",
                description: err.response?.data?.message || "Please check your credentials",
                status: "error",
                duration: 3000,
            });
            return false;
        }
    }, [setAuth, navigate, toast]);

    const register = useCallback(async (data: RegisterData) => {
        try {
            await APIClient.register(data);
            toast({
                title: "Registration successful",
                description: "You can now login with your credentials",
                status: "success",
                duration: 3000,
            });
            return true;
        } catch (err: any) {
            toast({
                title: "Registration failed",
                description: err.response?.data?.message || "Please try again",
                status: "error",
                duration: 3000,
            });
            return false;
        }
    }, [toast]);

    const logout = useCallback(async () => {
        try {
            await APIClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            storeLogout();
            navigate('/auth');
        }
    }, [storeLogout, navigate]);

    return {
        user,
        isAuthenticated,
        sessionExpired,
        login,
        logout,
        register
    };
}; 