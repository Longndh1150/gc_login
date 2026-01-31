import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

export default function MessageDialog({ isOpen, onClose, title, message, type = 'info' }) {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: <FaCheckCircle className="text-5xl text-green-500 mx-auto" />,
            btnColor: 'bg-green-600 hover:bg-green-700',
            titleColor: 'text-green-600'
        },
        error: {
            icon: <FaTimesCircle className="text-5xl text-red-500 mx-auto" />,
            btnColor: 'bg-red-600 hover:bg-red-700',
            titleColor: 'text-red-600'
        },
        info: {
            icon: <FaInfoCircle className="text-5xl text-blue-500 mx-auto" />,
            btnColor: 'bg-blue-600 hover:bg-blue-700',
            titleColor: 'text-blue-600'
        }
    };

    const currentConfig = config[type] || config.info;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm text-center transform transition-all scale-100 animate-bounce-in">

                <div className="mb-4">
                    {currentConfig.icon}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${currentConfig.titleColor}`}>
                    {title}
                </h3>

                <p className="text-gray-600 mb-6">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className={`w-full py-2 px-4 text-white font-bold rounded transition ${currentConfig.btnColor}`}
                >
                    閉じる
                </button>

            </div>
        </div>
    );
}