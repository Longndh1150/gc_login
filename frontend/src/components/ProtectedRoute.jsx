import { refreshToken } from '../api';
import { jwtDecode } from "jwt-decode";
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useIdleTimer from '../hooks/useIdleTimer';

export default function ProtectedRoute({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isExpired, setIsExpired] = useState(false);

    // ログアウト処理
    const handleLogout = (reason) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsExpired(true);
    };

    // アイドルタイマー設定
    // 設定値：30分 = 1,800,000ms
    // 一定時間操作がない場合、自動的にログアウト
    useIdleTimer(1800000, () => {
        handleLogout("一定時間操作がなかったため、ログアウトされました。");
    });

    // 初回マウント時および定期的にトークンの状態を確認
    useEffect(() => {
        if (!token) return;

        // トークン状態確認処理
        const checkTokenHealth = async () => {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                const timeLeft = decoded.exp - currentTime;

                // トークンの有効期限切れ
                if (timeLeft <= 0) {
                    handleLogout("トークンの有効期限が切れました。");
                    return;
                }

                // 有効期限が5分未満の場合、トークンを更新
                if (timeLeft < 300) {
                    try {
                        const res = await refreshToken();
                        const newToken = res.data.access_token;

                        localStorage.setItem('token', newToken);
                        setToken(newToken);
                    } catch (err) {
                        console.error("トークン更新中にエラーが発生しました:", err);
                        handleLogout("トークンを更新できませんでした。");
                    }
                }
            } catch (error) {
                handleLogout("無効なトークンです。");
            }
        };

        checkTokenHealth();

        // 定期チェック：1分ごとに実行
        const intervalId = setInterval(checkTokenHealth, 60000);

        return () => clearInterval(intervalId);
    }, [token]);

    // 未認証または期限切れの場合、ログイン画面へリダイレクト
    if (!localStorage.getItem('token') || isExpired) {
        return <Navigate to="/login" replace />;
    }

    return children;
}