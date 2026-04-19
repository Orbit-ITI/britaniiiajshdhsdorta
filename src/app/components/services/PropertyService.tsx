import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { submitApplication } from './submitApplication';
import { ArrowLeft } from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'house', label: '🏠 Жилой дом' },
  { value: 'commerce', label: '🏪 Коммерческая недвижимость' },
  { value: 'land', label: '🌍 Земельный участок' },
];

export function PropertyService() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [propType, setPropType] = useState('house');
  const [coordinates, setCoordinates] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) return (
    <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 text-center">
      <p className="text-[8px] text-yellow-400 mb-3">⚠ Необходимо войти в систему</p>
      <Link to="/login" className="text-[8px] text-[#ffd700]">Войти →</Link>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!coordinates.trim() || !description.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      await submitApplication(profile, 'property', { type: propType, coordinates: coordinates.trim(), description: description.trim() });
      setSuccess(true);
    } catch { setError('Ошибка отправки. Попробуйте снова.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-8 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-[10px] text-[#ffd700] mb-2">Заявка отправлена!</h2>
      <p className="text-[8px] text-gray-300 mb-4">Ваша заявка на регистрацию собственности передана губернатору.</p>
      <button onClick={() => navigate('/profile')} className="bg-[#4a7c1f] border-2 border-[#2d5016] text-[8px] px-4 py-2 hover:bg-[#ffd700] hover:text-[#1a3010] transition-all">Мой профиль</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Link to="/services" className="flex items-center gap-2 text-[8px] text-gray-400 hover:text-[#ffd700]"><ArrowLeft size={12}/> Назад</Link>
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h2 className="text-[10px] text-[#ffd700] mb-6">🏠 Регистрация собственности</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[8px] text-gray-400 mb-2">ТИП ОБЪЕКТА</label>
            <select value={propType} onChange={e => setPropType(e.target.value)} className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700]">
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[8px] text-gray-400 mb-2">КООРДИНАТЫ (X, Y, Z)</label>
            <input type="text" value={coordinates} onChange={e => setCoordinates(e.target.value)} placeholder="Например: 100, 64, -200" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600" disabled={loading} />
          </div>
          <div>
            <label className="block text-[8px] text-gray-400 mb-2">ОПИСАНИЕ ОБЪЕКТА</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опишите объект подробнее..." rows={4} className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600 resize-none" disabled={loading} />
          </div>
          {error && <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">⚠ {error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[9px] text-white px-6 py-4 disabled:opacity-50">
            {loading ? <span className="animate-pixel-pulse">ОТПРАВКА...</span> : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
          </button>
        </form>
      </div>
    </div>
  );
}
