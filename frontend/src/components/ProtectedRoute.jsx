import { refreshToken } from '../api';
import { jwtDecode } from "jwt-decode";
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useIdleTimer from '../hooks/useIdleTimer';

export default function ProtectedRoute({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isExpired, setIsExpired] = useState(false);

    // Logout handler
    const handleLogout = (reason) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsExpired(true);
    };

    // Idle timer hooks
    // Settings: 30 minutes = 1800000 ms
    // If user is idle for 30 minutes, auto logout
    useIdleTimer(1800000, () => {
        handleLogout("You have been logged out due to inactivity.");
    });

    // Verify token health on mount and set interval to check periodically
    useEffect(() => {
        if (!token) return;

        // Verify token health function
        const checkTokenHealth = async () => {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                const timeLeft = decoded.exp - currentTime;

                // Token expired case
                if (timeLeft <= 0) {
                    handleLogout("Token expired.");
                    return;
                }

                // If token is about to expire in the next 5 minutes, refresh it
                if (timeLeft < 300) {
                    try {
                        const res = await refreshToken();
                        const newToken = res.data.access_token;

                        localStorage.setItem('token', newToken);
                        setToken(newToken);
                    } catch (err) {
                        console.error("Error refreshing token:", err);
                        handleLogout("Cannot refresh token.");
                    }
                }
            } catch (error) {
                handleLogout("Token is invalid.");
            }
        };

        checkTokenHealth();

        // Interval Setting: A check every 1 minute
        const intervalId = setInterval(checkTokenHealth, 60000);

        return () => clearInterval(intervalId);
    }, [token]);

    if (!localStorage.getItem('token') || isExpired) {
        return <Navigate to="/login" replace />;
    }

    return children;
}