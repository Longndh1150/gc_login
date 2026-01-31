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
    const [step, setStep] = useState(1); // 1: 入力確認, 2: OTP確認
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmPass, setConfirmPass] = useState('');
    const [receivedOtp, setReceivedOtp] = useState(null);
    const { seconds, startCountdown } = useCountdown(60);

    const [dialog, setDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // メッセージダイアログを表示
    const showMessage = (type, title, msg) => {
        setDialog({ isOpen: true, type, title, message: msg });
    };

    // パスワード条件の状態
    const [pwdCriteria, setPwdCriteria] = useState({
        length: false,
        number: false,
        special: false
    });

    // パスワード入力時に条件をチェック
    useEffect(() => {
        setPwdCriteria({
            length: password.length >= 6,
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    }, [password]);

    // すべてのパスワード条件を満たしているか
    const isPasswordValid = () => Object.values(pwdCriteria).every(Boolean);

    // ステップ1：入力確認 → OTP送信
    const handleStep1_Register = async (e) => {
        e.preventDefault();

        if (!isPasswordValid()) {
            return showMessage(
                'error',
                'パスワードが弱すぎます',
                'パスワードの条件を満たしていません。'
            );
        }

        if (password !== confirmPass) {
            return showMessage(
                'error',
                'エラー',
                'パスワードが一致しません。'
            );
        }

        setLoading(true);
        try {
            const res = await sendOtp(username, 'register', null, email || null);

            if (res.data.otp_code) {
                setReceivedOtp(res.data.otp_code);
                showMessage(
                    'success',
                    'OTP送信完了',
                    'OTPコードを画面に表示しました。'
                );
            } else {
                showMessage(
                    'success',
                    'メール確認',
                    `OTPコードを ${email} に送信しました。`
                );
            }

            setStep(2);
            startCountdown();
        } catch (err) {
            showMessage(
                'error',
                '登録できません',
                err.response?.data?.detail || err.message
            );
        } finally {
            setLoading(false);
        }
    };

    // OTP再送信
    const handleResendOtp = async () => {
        if (seconds > 0) return;

        setLoading(true);
        try {
            const res = await sendOtp(username, 'register', null, email || null);

            if (res.data.otp_code) {
                setReceivedOtp(res.data.otp_code);
                showMessage(
                    'success',
                    'OTP再送信',
                    '新しいOTPコードを画面に表示しました。'
                );
            } else {
                showMessage(
                    'success',
                    'OTP再送信',
                    `OTPコードを再度 ${email} に送信しました。`
                );
            }

            startCountdown();
        } catch (err) {
            showMessage(
                'error',
                'エラー',
                err.response?.data?.detail || err.message
            );
        } finally {
            setLoading(false);
        }
    };

    // ステップ2：OTP確認 → 登録完了
    const handleStep2_Confirm = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await registerUser({
                username,
                password,
                otp,
                email: email || null
            });

            setDialog({
                isOpen: true,
                type: 'success',
                title: '登録完了',
                message: 'アカウントが作成されました。ログインしてください。'
            });
        } catch (err) {
            showMessage(
                'error',
                '確認エラー',
                err.response?.data?.detail || err.message
            );
        } finally {
            setLoading(false);
        }
    };

    // ダイアログを閉じる
    const handleCloseDialog = () => {
        setDialog({ ...dialog, isOpen: false });
        if (dialog.title === '登録完了') {
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
                <h2 className="text-3xl font-bold text-center text-brand-dark mb-6">
                    新規登録
                </h2>

                <form
                    onSubmit={step === 1 ? handleStep1_Register : handleStep2_Confirm}
                    className="space-y-4"
                >
                    {/* ユーザー名 */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">
                            ユーザー名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            disabled={step === 2}
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100"
                            required
                        />
                    </div>

                    {/* メールアドレス（任意） */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">
                            メールアドレス{' '}
                            <span className="text-gray-400 font-normal">
                                （任意）
                            </span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={step === 2}
                            placeholder="OTPを受信するメールアドレス"
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100"
                        />
                    </div>

                    {/* パスワード */}
                    <div>
                        <label className="text-sm font-bold text-gray-700">
                            パスワード <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            disabled={step === 2}
                            className="w-full p-2 border rounded focus:border-brand-light outline-none disabled:bg-gray-100"
                            required
                        />

                        {step === 1 && (
                            <div className="mt-2 text-sm space-y-1 bg-gray-50 p-2 rounded">
                                <ValidationItem
                                    isValid={pwdCriteria.length}
                                    text="6文字以上"
                                />
                                <ValidationItem
                                    isValid={pwdCriteria.number}
                                    text="数字を1文字以上含む"
                                />
                                <ValidationItem
                                    isValid={pwdCriteria.special}
                                    text="記号を1文字以上含む"
                                />
                            </div>
                        )}
                    </div>

                    {step === 1 && (
                        <div>
                            <label className="text-sm font-bold text-gray-700">
                                パスワード（確認） <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={confirmPass}
                                onChange={e => setConfirmPass(e.target.value)}
                                className="w-full p-2 border rounded focus:border-brand-light outline-none"
                                required
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in-down">
                            <div>
                                <label className="text-sm font-bold text-brand-light">
                                    OTPコード {email ? '（メール確認）' : '（画面表示）'}
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    placeholder="6桁のOTP"
                                    className="w-full p-2 border-2 border-brand-light rounded text-center font-bold tracking-widest"
                                    required
                                />
                            </div>

                            <div className="text-center text-sm mt-2">
                                <span className="text-gray-500">
                                    コードが届きませんか？
                                </span>{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={seconds > 0 || loading}
                                    className={`font-bold ${seconds > 0
                                            ? 'text-gray-400'
                                            : 'text-brand-light hover:underline'
                                        }`}
                                >
                                    {seconds > 0
                                        ? `${seconds}秒後に再送信`
                                        : 'コードを再送信'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-white font-bold rounded transition flex justify-center items-center gap-2
                        ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : step === 1
                                    ? 'bg-brand-dark hover:bg-opacity-90'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {loading && <ImSpinner8 className="animate-spin" />}
                        {step === 1 ? 'OTP送信' : '登録完了'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm">
                    既にアカウントをお持ちですか？{' '}
                    <Link to="/login" className="text-brand-light font-bold">
                        ログイン
                    </Link>
                </p>
            </div>
        </div>
    );
}

function ValidationItem({ isValid, text }) {
    return (
        <div
            className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-gray-400'
                }`}
        >
            {isValid ? <FaCheckCircle /> : <FaTimesCircle className="text-gray-300" />}
            <span>{text}</span>
        </div>
    );
}