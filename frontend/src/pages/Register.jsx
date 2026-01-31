import { useState, useEffect } from 'react';
import { ImSpinner8 } from 'react-icons/im';
import OtpToast from '../components/OtpToast';
import { sendOtp, registerUser } from '../api';
import useCountdown from '../hooks/useCountdown';
import { Link, useNavigate } from 'react-router-dom';
import MessageDialog from '../components/MessageDialog';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function Register() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [receivedOtp, setReceivedOtp] = useState(null);
    const { seconds, startCountdown } = useCountdown(60);

    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const showMessage = (type, title, msg) => {
        setDialog({ isOpen: true, type, title, message: msg });
    };

    //  Password criteria state
    const [pwdCriteria, setPwdCriteria] = useState({
        length: false,
        number: false,
        special: false
    });

    // Check password criteria on change
    useEffect(() => {
        setPwdCriteria({
            length: password.length >= 6,
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    // Validate if all password criteria are met
    const isPasswordValid = () => Object.values(pwdCriteria).every(Boolean);

    const handleStep1_Register = async (e) => {
        e.preventDefault();

        if (!isPasswordValid()) return showMessage('error', 'Weak Password', 'Password does not meet the required criteria!');
        if (password !== confirmPass) return showMessage('error', 'Error', 'Passwords do not match!');

        setLoading(true);
        try {
            const res = await sendOtp(username, 'register', null, email || null);
            if (res.data.otp_code) {
                setReceivedOtp(res.data.otp_code);
                showMessage('success', 'OTP Sent', 'The OTP code is now visible on screen.');
            } else {
                showMessage('success', 'Check Email', `The OTP code has been sent to ${email}.`);
            }
            setStep(2);
            startCountdown();
        } catch (err) {
            showMessage('error', 'Cannot Register', err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (seconds > 0) return;
        setLoading(true);
        try {
            const res = await sendOtp(username, 'register', null, email || null);

            if (res.data.otp_code) {
                setReceivedOtp(res.data.otp_code);
                showMessage('success', 'OTP Resent', 'The new OTP code is now visible on screen.');
            } else {
                showMessage('success', 'OTP Resent', `The OTP code has been resent to ${email}`);
            }

            startCountdown();
        } catch (err) {
            showMessage('error', 'Error', err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStep2_Confirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await registerUser({ username, password, otp, email: email || null });
            setDialog({
                isOpen: true,
                type: 'success',
                title: 'Registration Successful',
                message: 'Your account has been created. You can log in now.',
            });
        } catch (err) {
            showMessage('error', 'Confirmation Error', err.response?.data?.detail || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setDialog({ ...dialog, isOpen: false });
        if (dialog.title === 'Registration Successful') {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center font-sans">
            <OtpToast code={receivedOtp} onClose={() => setReceivedOtp(null)} />

            <MessageDialog
                isOpen={dialog.isOpen}
                onClose={handleCloseDialog}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-brand-dark mb-6">Register</h2>

                <form onSubmit={step === 1 ? handleStep1_Register : handleStep2_Confirm} className="space-y-4">

                    {/* Username */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">Username <span className="text-red-500">*</span></label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} disabled={step === 2}
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100" required />
                    </div>

                    {/* Email (Optional) */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={step === 2}
                            placeholder="Enter email to receive OTP"
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100" />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={step === 2}
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100" required />

                        {step === 1 && (
                            <div className="mt-2 text-sm space-y-1 bg-gray-50 p-2 rounded">
                                <ValidationItem isValid={pwdCriteria.length} text="At least 6 characters" />
                                <ValidationItem isValid={pwdCriteria.number} text="At least 1 number" />
                                <ValidationItem isValid={pwdCriteria.special} text="At least 1 special character" />
                            </div>
                        )}
                    </div>

                    {step === 1 && (
                        <div>
                            <label className="text-sm font-bold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                className="w-full p-2 border rounded focus:border-brand-light outline-none" required />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in-down">
                            <div>
                                <label className="text-sm font-bold text-brand-light">
                                    Enter OTP {email ? "(Check Email)" : "(On Screen)"}
                                </label>
                                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                                    placeholder="6-digit OTP" className="w-full p-2 border-2 border-brand-light rounded text-center font-bold tracking-widest" required />
                            </div>

                            <div className="text-center text-sm mt-2">
                                <span className="text-gray-500">Didn't receive the code? </span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={seconds > 0 || loading}
                                    className={`font-bold ${seconds > 0 ? 'text-gray-400' : 'text-brand-light hover:underline'}`}
                                >
                                    {seconds > 0 ? `Try again in ${seconds}s` : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-white font-bold rounded transition flex justify-center items-center gap-2
                        ${loading ? 'bg-gray-400 cursor-not-allowed' : (step === 1 ? 'bg-brand-dark hover:bg-opacity-90' : 'bg-green-600 hover:bg-green-700')}
                        `}
                    >
                        {loading && <ImSpinner8 className="animate-spin" />}
                        {step === 1 ? "SEND OTP" : "COMPLETE REGISTRATION"}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm">
                    Already have an account? <Link to="/login" className="text-brand-light font-bold">Log in</Link>
                </p>
            </div>
        </div>
    );
}

function ValidationItem({ isValid, text }) {
    return (
        <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
            {isValid ? <FaCheckCircle /> : <FaTimesCircle className="text-gray-300" />}
            <span>{text}</span>
        </div>
    );
}