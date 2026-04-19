import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { submitApplication } from './submitApplication';
import { ArrowLeft, FileText } from 'lucide-react';

export function PassportService() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) {
    return (
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 text-center">
        <p className="text-[8px] text-yellow-400 mb-3">⚠ Необходимо войти в систему</p>
        <Link to="/login" className="text-[8px] text-[#ffd700]">Войти →</Link>
      </div>
    );
  }

  if (profile.passport) {
    return (
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <Link to="/services" className="flex items-center gap-2 text-[8px] text-gray-400 hover:text-[#ffd700] mb-4"><ArrowLeft size={12}/> Назад</Link>
        <p className="text-[9px] text-green-400">✓ У вас уже есть паспорт: <strong>{profile.passport.primaryId}</strong></p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      await submitApplication(profile, 'passport', { firstName: firstName.trim(), lastName: lastName.trim() });
      setSuccess(true);
    } catch {
      setError('Ошибка при отправке заявки. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-[10px] text-[#ffd700] mb-2">Заявка отправлена!</h2>
        <p className="text-[8px] text-gray-300 mb-4">Ваша заявка на паспорт передана губернатору города на рассмотрение.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/profile')} className="bg-[#4a7c1f] border-2 border-[#2d5016] text-[8px] px-4 py-2 hover:bg-[#ffd700] hover:text-[#1a3010] transition-all">Мой профиль</button>
          <button onClick={() => navigate('/services')} className="bg-[#2d5016] border-2 border-[#4a7c1f] text-[8px] px-4 py-2 hover:bg-[#3d6020] transition-all">К услугам</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/services" className="flex items-center gap-2 text-[8px] text-gray-400 hover:text-[#ffd700] transition-colors"><ArrowLeft size={12}/> Назад к услугам</Link>
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#4a7c1f] border-2 border-[#2d5016] p-3"><FileText className="w-5 h-5 text-[#ffd700]"/></div>
          <div>
            <h2 className="text-[10px] text-[#ffd700]">🪪 Получение паспорта</h2>
            <p className="text-[7px] text-gray-400 mt-1">Заявка передаётся губернатору вашего города</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[8px] text-gray-400 mb-2">ИМЯ</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Например: Стивен" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600" disabled={loading} />
          </div>
          <div>
            <label className="block text-[8px] text-gray-400 mb-2">ФАМИЛИЯ</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Например: Крафтов" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] transition-colors placeholder-gray-600" disabled={loading} />
          </div>
          {error && <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">⚠ {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] hover:border-[#8b7355] transition-all text-[9px] text-white px-6 py-4 disabled:opacity-50">
            {loading ? <span className="animate-pixel-pulse">ОТПРАВКА...</span> : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
          </button>
        </form>
      </div>
    </div>
  );
}
