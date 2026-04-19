import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { submitApplication } from './submitApplication';
import { ArrowLeft } from 'lucide-react';

// ============================================================
// SHARED SUCCESS / AUTH GUARDS
// ============================================================
function SuccessScreen({ message, onProfile }: { message: string; onProfile: () => void }) {
  return (
    <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-8 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-[10px] text-[#ffd700] mb-2">Заявка отправлена!</h2>
      <p className="text-[8px] text-gray-300 mb-4">{message}</p>
      <button onClick={onProfile} className="bg-[#4a7c1f] border-2 border-[#2d5016] text-[8px] px-4 py-2 hover:bg-[#ffd700] hover:text-[#1a3010] transition-all">Мой профиль</button>
    </div>
  );
}

function RequireAuth() {
  return (
    <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 text-center">
      <p className="text-[8px] text-yellow-400 mb-3">⚠ Необходимо войти в систему</p>
      <Link to="/login" className="text-[8px] text-[#ffd700]">Войти →</Link>
    </div>
  );
}

function FormWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <Link to="/services" className="flex items-center gap-2 text-[8px] text-gray-400 hover:text-[#ffd700]"><ArrowLeft size={12}/> Назад</Link>
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h2 className="text-[10px] text-[#ffd700] mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// BUSINESS LICENSE
// ============================================================
export function BusinessLicenseService() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) return <RequireAuth />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) { setError('Укажите причину'); return; }
    setLoading(true);
    try {
      await submitApplication(profile, 'business_license', { reason: reason.trim() });
      setSuccess(true);
    } catch { setError('Ошибка отправки.'); }
    finally { setLoading(false); }
  };

  if (success) return <SuccessScreen message="Заявка на лицензию передана губернатору города." onProfile={() => navigate('/profile')} />;

  return (
    <FormWrapper title="💼 Лицензия на бизнес">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">ПРИЧИНА / ОПИСАНИЕ БИЗНЕСА</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Опишите, чем планируете заниматься..." rows={5} className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600 resize-none" disabled={loading} />
        </div>
        {error && <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">⚠ {error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[9px] text-white px-6 py-4 disabled:opacity-50">
          {loading ? <span className="animate-pixel-pulse">ОТПРАВКА...</span> : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
        </button>
      </form>
    </FormWrapper>
  );
}

// ============================================================
// BUILDING PERMIT
// ============================================================
export function BuildingPermitService() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) return <RequireAuth />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!coordinates.trim() || !size.trim() || !description.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      await submitApplication(profile, 'building_permit', { coordinates: coordinates.trim(), size: size.trim(), description: description.trim() });
      setSuccess(true);
    } catch { setError('Ошибка отправки.'); }
    finally { setLoading(false); }
  };

  if (success) return <SuccessScreen message="Строительное разрешение передано на рассмотрение губернатору." onProfile={() => navigate('/profile')} />;

  return (
    <FormWrapper title="🏗️ Строительное разрешение">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">КООРДИНАТЫ УЧАСТКА (X, Y, Z)</label>
          <input type="text" value={coordinates} onChange={e => setCoordinates(e.target.value)} placeholder="100, 64, -200" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600" disabled={loading} />
        </div>
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">РАЗМЕР ПОСТРОЙКИ</label>
          <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="Например: 16x16 или 32x32x20" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600" disabled={loading} />
        </div>
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">ОПИСАНИЕ ПОСТРОЙКИ</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Что планируете строить?" rows={4} className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600 resize-none" disabled={loading} />
        </div>
        {error && <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">⚠ {error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[9px] text-white px-6 py-4 disabled:opacity-50">
          {loading ? <span className="animate-pixel-pulse">ОТПРАВКА...</span> : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
        </button>
      </form>
    </FormWrapper>
  );
}

// ============================================================
// ORGANIZATION REGISTRATION
// ============================================================
export function OrganizationService() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user || !profile) return <RequireAuth />;

  // Check for business license
  const hasLicense = (profile.businesses?.length ?? 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !officeAddress.trim() || !description.trim()) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      await submitApplication(profile, 'organization', { name: name.trim(), officeAddress: officeAddress.trim(), description: description.trim() });
      setSuccess(true);
    } catch { setError('Ошибка отправки.'); }
    finally { setLoading(false); }
  };

  if (success) return <SuccessScreen message="Заявка на регистрацию организации передана на рассмотрение." onProfile={() => navigate('/profile')} />;

  return (
    <FormWrapper title="🏢 Регистрация организации">
      {!hasLicense && (
        <div className="bg-yellow-900/30 border-2 border-yellow-600 px-4 py-3 text-[8px] text-yellow-300 mb-4">
          ⚠ Для регистрации организации необходима лицензия на бизнес. <Link to="/services/business-license" className="underline">Получить →</Link>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">НАЗВАНИЕ ОРГАНИЗАЦИИ</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Торговая компания 'Империал'" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600" disabled={loading} />
        </div>
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">АДРЕС ГЛАВНОГО ОФИСА</label>
          <input type="text" value={officeAddress} onChange={e => setOfficeAddress(e.target.value)} placeholder="Координаты или адрес из недвижимости" className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600" disabled={loading} />
        </div>
        <div>
          <label className="block text-[8px] text-gray-400 mb-2">ОПИСАНИЕ ДЕЯТЕЛЬНОСТИ</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Опишите деятельность организации..." rows={4} className="w-full bg-[#0f1e09] border-4 border-[#4a7c1f] text-white text-[9px] px-4 py-3 outline-none focus:border-[#ffd700] placeholder-gray-600 resize-none" disabled={loading} />
        </div>
        {error && <div className="bg-red-900/50 border-2 border-red-600 px-4 py-3 text-[8px] text-red-300">⚠ {error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[9px] text-white px-6 py-4 disabled:opacity-50">
          {loading ? <span className="animate-pixel-pulse">ОТПРАВКА...</span> : '📨 ОТПРАВИТЬ ЗАЯВКУ'}
        </button>
      </form>
    </FormWrapper>
  );
}
