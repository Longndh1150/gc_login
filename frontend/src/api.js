import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// Register new user
export const registerUser = (data) => api.post('/register', data);

// Send OTP for registration or login
export const sendOtp = (username, type = 'register', password = null, email = null) => {
    return api.post('/send-otp', {
        username,
        type,
        password,
        email
    });
};

// Refresh JWT token
export const refreshToken = () => {
    const token = localStorage.getItem('token');
    return api.post('/refresh-token', {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Login user with username, password and OTP
export const loginUser = (username, password, otp) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('otp', otp);
    return api.post('/login', formData);
};

// Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response, // If successful, just return the response
    (error) => {
        // If error is 401 (Unauthorized or token expired)
        if (error.response && error.response.status === 401) {
            // Delete token and user info from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to login page
            if (window.location.pathname !== '/login') {
                alert("Session expired. Please log in again.");
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);