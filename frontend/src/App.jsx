import Login from './pages/Login';
import Register from './pages/Register';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ダッシュボードコンポーネント
function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const message = "ダッシュボードへようこそ！";

  // ログアウト処理
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-gray">
      <nav className="bg-brand-dark text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Goal Connect System</h1>
        <div className="flex items-center gap-4">
          <span>
            こんにちは、<b className="text-brand-light">{user}</b> さん
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 text-sm"
          >
            ログアウト
          </button>
        </div>
      </nav>
      <main className="p-10 text-center">
        <h2 className="text-4xl text-gray-700 font-light">
          ダッシュボード
        </h2>
        <p className="mt-4 text-gray-500">{message}</p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}