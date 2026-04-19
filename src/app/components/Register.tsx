import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !password.trim() || !confirm.trim()) {
      setError('Заполните все поля');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(nickname)) {
      setError('Никнейм: 3–16 символов, только буквы, цифры и _');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await register(nickname.trim(), password);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        setError('Этот никнейм уже занят');
      } else {
        setError('Ошибка регистрации. Проверьте пароль от администратора.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2d5016] flex items-center justify-center p-4" style={{ fontFamily: "'Press Start 2P', cursive" }}>
      <div className="w-full max-w-md animate-slide-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-sm text-[#ffd700] mb-2">Британская Империя</h1>
          <p className="text-[9px] text-gray-400">Регистрация гражданина</p>
        </div>

        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 md:p-8">
          <h2 className="text-[11px] text-[#ffd700] mb-6 text-center">НОВЫЙ ГРАЖДАНИН</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[8px] text-gray-400 mb-2">НИК В MINECRAFT</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Steve_Minecraft"
                className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600"
                disabled={loading}
                maxLength={16}
              />
              <p className="text-[7px] text-gray-600 mt-1">3–16 символов, буквы/цифры/_</p>
            </div>

            <div>
              <label className="block text-[8px] text-gray-400 mb-2">ПАРОЛЬ ОТ АДМИНИСТРАТОРА</label>
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

            <div>
              <label className="block text-[8px] text-gray-400 mb-2">ПОДТВЕРДИТЬ ПАРОЛЬ</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Повторите пароль..."
                className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600"
                disabled={loading}
              />
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
                <span className="animate-pixel-pulse">РЕГИСТРАЦИЯ...</span>
              ) : (
                <>
                  <UserPlus size={16} />
                  ЗАРЕГИСТРИРОВАТЬСЯ
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[8px] text-gray-500">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-[#ffd700] hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
