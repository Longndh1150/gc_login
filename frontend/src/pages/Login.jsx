import { useState } from 'react';
import { sendOtp, loginUser } from '../api';
import OtpToast from '../components/OtpToast';
import useCountdown from '../hooks/useCountdown';
import { Link, useNavigate } from 'react-router-dom';
import MessageDialog from '../components/MessageDialog';

export default function Login() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Check Password, 2: Check OTP
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [receivedOtp, setReceivedOtp] = useState(null);
    const { seconds, startCountdown } = useCountdown(60);

    const [dialog, setDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' // 'success', 'error', 'info'
    });

    // close dialog handler
    const closeDialog = () => setDialog({ ...dialog, isOpen: false });

    // show message dialog handler
    const showMessage = (type, title, msg) => {
        setDialog({ isOpen: true, type, title, message: msg });
    };

    // Stage 1: Verify password and send OTP
    const handleStep1_Login = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await sendOtp(username, 'login', password);

            if (res.data.otp_code) setReceivedOtp(res.data.otp_code);
            setStep(2);
            startCountdown();

            showMessage('success', 'Success', 'Password verified. OTP has been sent. Please check your email or the OTP displayed on the screen.');
        } catch (err) {
            showMessage('error', 'Login Failed', err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP handler
    const handleResendOtp = async () => {
        if (seconds > 0) return;

        setLoading(true);
        try {
            const res = await sendOtp(username, 'login', password);

            if (res.data.otp_code) {
                setReceivedOtp(res.data.otp_code);
                showMessage('success', 'Success', 'New OTP has been displayed on screen.');
            } else {
                showMessage('success', 'Success', 'Please check your email for the OTP.');
            }

            startCountdown(); // Reset lại đồng hồ
        } catch (err) {
            showMessage('error', 'Error', 'Cannot resend OTP. ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Stage 2: Confirm OTP and login
    const handleStep2_Confirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginUser(username, password, otp);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', username);
            navigate('/');
        } catch (err) {
            showMessage('error', 'Invalid OTP', 'The OTP is incorrect or has expired!');
        } finally {
            setLoading(false);
            setOtp('');
        }
    };

    return (
        <div className="min-h-screen bg-brand-gray flex items-center justify-center font-sans">
            <OtpToast code={receivedOtp} onClose={() => setReceivedOtp(null)} />

            <MessageDialog
                isOpen={dialog.isOpen}
                onClose={closeDialog}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />

            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-brand-dark">
                <h2 className="text-3xl font-bold text-center text-brand-dark mb-6">Login</h2>

                <form onSubmit={step === 1 ? handleStep1_Login : handleStep2_Confirm} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            disabled={step === 2}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-brand-light disabled:bg-gray-100"
                            value={username} onChange={(e) => setUsername(e.target.value)} required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            disabled={step === 2}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-brand-light disabled:bg-gray-100"
                            value={password} onChange={(e) => setPassword(e.target.value)} required
                        />
                    </div>

                    {step === 2 && (
                        <div className="animate-fade-in-down">
                            <div>
                                <label className="block text-sm font-medium text-brand-light">OTP Code</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border-2 border-brand-light rounded-md focus:outline-none text-center tracking-widest font-bold"
                                    value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="######"
                                    autoFocus
                                />
                            </div>

                            <div className="text-center text-sm">
                                <span className="text-gray-500">Can't receive OTP? </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={seconds > 0 || loading}
                                    className={`font-bold transition-colors ${seconds > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-brand-light hover:underline'
                                        }`}
                                >
                                    {seconds > 0 ? `Resend after ${seconds}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-white font-bold rounded transition 
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : (step === 1 ? 'bg-brand-light hover:bg-blue-500' : 'bg-green-600 hover:bg-green-700')}`}>
                        {step === 1 ? "LOGIN" : "CONFIRM"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    Haven't registered yet? <Link to="/register" className="text-brand-light font-bold hover:underline">Register now</Link>
                </p>
            </div>
        </div>
    );
}   