import { FaCopy, FaTimes } from 'react-icons/fa';

export default function OtpToast({ code, onClose }) {
    if (!code) return null;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="fixed top-5 right-5 bg-white border-l-4 border-brand-light shadow-2xl p-4 rounded flex items-center gap-4 animate-bounce-in z-50">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">OTP コード: </p>
                <p className="text-2xl font-mono font-bold text-brand-dark tracking-widest">{code}</p>
                <p className="text-xs text-red-500">この認証コードの有効期限は1分です</p>
            </div>
            <button onClick={copyToClipboard} className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-brand-dark" title="Copy">
                <FaCopy />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                <FaTimes />
            </button>
        </div>
    );
}