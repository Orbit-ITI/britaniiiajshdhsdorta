import { User, Calendar, Hash, Briefcase, Home, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { usePolling } from '../../hooks/usePolling';
import { Application } from '../../lib/types';
import { ROLE_LABELS } from '../../lib/types';
import { formatDate, APP_TYPE_LABELS, APP_STATUS_LABELS } from '../../lib/utils';

export function Profile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  const myApps = usePolling<Application[]>(
    `/applications?userId=${user?.uid}`,
    8000,
    !!user
  ) ?? [];

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[10px] text-gray-400 animate-pixel-pulse">Загрузка профиля...</div>
    </div>
  );

  const statusClass = (s: string) => {
    const map: Record<string, string> = {
      pending:  'bg-yellow-900/50 border-yellow-600 text-yellow-300',
      approved: 'bg-green-900/50 border-green-600 text-green-300',
      rejected: 'bg-red-900/50 border-red-600 text-red-300',
      review:   'bg-blue-900/50 border-blue-600 text-blue-300',
    };
    return `border-2 px-2 py-1 text-[7px] ${map[s] ?? 'bg-gray-800 border-gray-600 text-gray-400'}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-24 h-24 bg-[#4a7c1f] border-4 border-[#2d5016] flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-[#ffd700]" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-sm text-[#ffd700]">{profile.nickname}</h2>
              <p className="text-[8px] text-gray-400 mt-1">{ROLE_LABELS[profile.role]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#4a7c1f] border-2 border-[#2d5016] px-2 py-1 text-[7px]">{ROLE_LABELS[profile.role]}</span>
            </div>
            <div className="text-[8px] text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-[#ffd700]" />
                <span>Регистрация: {formatDate(profile.registrationDate)}</span>
              </div>
              {profile.passport && (
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-[#ffd700]" />
                  <span>Паспорт: {profile.passport.primaryId} / {profile.passport.secondaryId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Passport */}
      {profile.passport ? (
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
          <h3 className="text-[10px] text-[#ffd700] mb-4">🪪 Электронный паспорт</h3>
          <div className="bg-gradient-to-br from-[#1a3010] to-[#2d5016] border-4 border-[#8b7355] p-5 max-w-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[8px] text-[#ffd700]">БРИТАНСКАЯ ИМПЕРИЯ</div>
                <div className="text-[7px] text-gray-400">ПАСПОРТ ГРАЖДАНИНА</div>
              </div>
              <span className="text-2xl">🏰</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[8px]">
              <div><div className="text-gray-500">ФИО</div><div className="text-white">{profile.passport.firstName} {profile.passport.lastName}</div></div>
              <div><div className="text-gray-500">Никнейм</div><div className="text-white">{profile.nickname}</div></div>
              <div><div className="text-gray-500">Основной ID</div><div className="text-[#ffd700]">{profile.passport.primaryId}</div></div>
              <div><div className="text-gray-500">Вторичный ID</div><div className="text-[#ffd700]">{profile.passport.secondaryId}</div></div>
              <div><div className="text-gray-500">Выдан</div><div className="text-white">{formatDate(profile.passport.issuedAt)}</div></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
          <h3 className="text-[10px] text-[#ffd700] mb-3">🪪 Паспорт</h3>
          <p className="text-[8px] text-gray-400 mb-3">У вас нет паспорта. Подайте заявку на его получение.</p>
          <Link to="/services/passport" className="inline-block bg-[#4a7c1f] border-2 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[8px] px-4 py-2">Подать заявку →</Link>
        </div>
      )}

      {/* Properties */}
      {(profile.properties?.length ?? 0) > 0 && (
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
          <h3 className="text-[10px] text-[#ffd700] mb-4">🏠 Недвижимость</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.properties!.map(p => (
              <div key={p.id} className="bg-[#2d5016] border-2 border-[#1a3010] p-3">
                <div className="flex items-start gap-2">
                  <Home size={14} className="text-[#ffd700] mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-white mb-1">{p.type === 'house' ? 'Жилой дом' : p.type === 'commerce' ? 'Коммерция' : 'Земля'}</div>
                    <div className="text-[7px] text-gray-400">{p.coordinates}</div>
                    <div className="text-[7px] text-gray-500">{p.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Businesses */}
      {(profile.businesses?.length ?? 0) > 0 && (
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
          <h3 className="text-[10px] text-[#ffd700] mb-4">💼 Бизнесы</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.businesses!.map(b => (
              <div key={b.id} className="bg-[#2d5016] border-2 border-[#1a3010] p-3">
                <div className="flex items-start gap-2">
                  <Briefcase size={14} className="text-[#ffd700] mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] text-white mb-1">{b.name}</div>
                    <div className="text-[7px] text-gray-400">{b.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications */}
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={14} className="text-[#ffd700]" />
          <h3 className="text-[10px] text-[#ffd700]">Мои заявки</h3>
        </div>
        {myApps.length === 0 ? (
          <p className="text-[8px] text-gray-500">Заявок нет. <Link to="/services" className="text-[#ffd700]">Перейти к услугам →</Link></p>
        ) : (
          <div className="space-y-2">
            {myApps.map(app => (
              <div key={app.id} className="bg-[#2d5016] border-2 border-[#1a3010] p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="text-[9px] text-white">{APP_TYPE_LABELS[app.type]}</div>
                  <div className="text-[7px] text-gray-400 mt-1">{formatDate(app.createdAt)}</div>
                  {app.reviewNote && <div className="text-[7px] text-gray-400 mt-1 italic">Заметка: {app.reviewNote}</div>}
                </div>
                <span className={statusClass(app.status)}>{APP_STATUS_LABELS[app.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
