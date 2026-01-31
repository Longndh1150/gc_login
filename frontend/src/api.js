import axios from 'axios';

// Axios インスタンス作成
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// 新規ユーザー登録
export const registerUser = (data) => api.post('/register', data);

// 登録またはログイン用の OTP を送信
export const sendOtp = (
    username,
    type = 'register',
    password = null,
    email = null
) => {
    return api.post('/send-otp', {
        username,
        type,
        password,
        email
    });
};

// JWT トークンの更新
export const refreshToken = () => {
    const token = localStorage.getItem('token');
    return api.post(
        '/refresh-token',
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
};

// ユーザーログイン（ユーザー名・パスワード・OTP）
export const loginUser = (username, password, otp) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('otp', otp);
    return api.post('/login', formData);
};

// === レスポンスインターセプター ===
// 401 エラー（未認証 / トークン期限切れ）をグローバルで処理
api.interceptors.response.use(
    (response) => response, // 正常時はそのままレスポンスを返却
    (error) => {
        if (error.response && error.response.status === 401) {
            // ローカルストレージから認証情報を削除
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // ログイン画面へリダイレクト
            if (window.location.pathname !== '/login') {
                alert("セッションの有効期限が切れました。再度ログインしてください。");
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);