import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      await login(nickname.trim(), password);
      navigate('/');
    } catch {
      setError('Неверный никнейм или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d5016] flex items-center justify-center p-4" style={{ fontFamily: "'Press Start 2P', cursive" }}>
      <div className="w-full max-w-md animate-slide-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-sm text-[#ffd700] mb-2">Британская Империя</h1>
          <p className="text-[9px] text-gray-400">Государственный портал</p>
        </div>

        {/* Card */}
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 md:p-8">
          <h2 className="text-[11px] text-[#ffd700] mb-6 text-center">ВХОД В СИСТЕМУ</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[8px] text-gray-400 mb-2">НИКНЕЙМ В MINECRAFT</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ваш никнейм..."
                className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-[8px] text-gray-400 mb-2">ПАРОЛЬ (ВЫДАЁТСЯ АДМИНИСТРАТОРОМ)</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600 pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ffd700] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] hover:border-[#8b7355] transition-all text-[9px] text-white px-6 py-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="animate-pixel-pulse">ЗАГРУЗКА...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  ВОЙТИ В ПОРТАЛ
                </>
              )}
            </button>
          </form>


        </div>

        <p className="text-center text-[7px] text-gray-600 mt-6">
          Для регистрации требуется пароль от администратора
        </p>
      </div>
    </div>
  );
}
