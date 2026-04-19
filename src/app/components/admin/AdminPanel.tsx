import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { usePolling } from '../../../hooks/usePolling';
import { Application, UserProfile, NewsItem, GOV_ROLES, ROLE_LABELS, UserRole } from '../../../lib/types';
import { APP_TYPE_LABELS, APP_STATUS_LABELS, formatDate } from '../../../lib/utils';
import { Shield, Users, FileText, Newspaper, ChevronDown, ChevronUp, Search, Trash2, RotateCcw } from 'lucide-react';

type Tab = 'applications' | 'players' | 'news' | 'cities';

function statusBadge(status: string) {
  const m: Record<string, string> = {
    pending:  'bg-yellow-900/50 border-yellow-600 text-yellow-300',
    approved: 'bg-green-900/50 border-green-600 text-green-300',
    rejected: 'bg-red-900/50 border-red-600 text-red-300',
    review:   'bg-blue-900/50 border-blue-600 text-blue-300',
  };
  return `border-2 px-2 py-1 text-[7px] ${m[status] || 'bg-gray-800 border-gray-600 text-gray-400'}`;
}

// ── APPLICATION CARD ──────────────────────────────────────────
function ApplicationCard({ app, onDecision, onDelete }: {
  app: Application;
  onDecision: (id: string, status: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setBusy_note] = useState('');
  const [busy, setBusy] = useState(false);

  const decide = async (status: string) => {
    setBusy(true);
    await onDecision(app.id, status, note);
    setBusy(false);
  };

  const del = async () => {
    if (!confirm(`Удалить заявку ${APP_TYPE_LABELS[app.type]} от ${app.userNickname}?`)) return;
    setBusy(true);
    await onDelete(app.id);
    setBusy(false);
  };

  return (
    <div className="bg-[#2d5016] border-2 border-[#1a3010] p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-white">{APP_TYPE_LABELS[app.type]}</span>
            <span className={statusBadge(app.status)}>{APP_STATUS_LABELS[app.status]}</span>
          </div>
          <div className="text-[7px] text-gray-400">
            👤 {app.userNickname} · 🏙 {app.cityName || `Город ${app.cityId}`} · 📅 {formatDate(app.createdAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={del} disabled={busy} title="Удалить заявку"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 transition-colors disabled:opacity-40">
            <Trash2 size={13}/>
          </button>
          <button onClick={() => setOpen(v => !v)} className="text-[#ffd700] hover:text-white transition-colors">
            {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t-2 border-[#1a3010] pt-4">
          <div className="bg-[#1f4012] border border-[#0f1e09] p-3">
            <div className="text-[7px] text-gray-400 mb-2">ДАННЫЕ ЗАЯВКИ:</div>
            {Object.entries(app.data).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[7px]">
                <span className="text-gray-500">{k}:</span><span className="text-white">{v}</span>
              </div>
            ))}
          </div>
          {app.history?.length > 0 && (
            <div>
              <div className="text-[7px] text-gray-400 mb-1">ИСТОРИЯ:</div>
              {app.history.map((h, i) => (
                <div key={i} className="text-[7px] text-gray-500">
                  [{formatDate(h.at)}] {h.action} — {h.byNickname}{h.note ? ` (${h.note})` : ''}
                </div>
              ))}
            </div>
          )}
          {(app.status === 'pending' || app.status === 'review') && (
            <div className="space-y-2">
              <textarea value={note} onChange={e => setBusy_note(e.target.value)}
                placeholder="Заметка..." rows={2}
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] px-3 py-2 outline-none focus:border-[#ffd700] resize-none placeholder-gray-600"/>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => decide('approved')} disabled={busy} className="bg-green-900 border-2 border-green-600 hover:bg-green-700 text-green-300 text-[7px] px-3 py-2 disabled:opacity-50">✓ Одобрить</button>
                <button onClick={() => decide('rejected')} disabled={busy} className="bg-red-900 border-2 border-red-600 hover:bg-red-700 text-red-300 text-[7px] px-3 py-2 disabled:opacity-50">✗ Отклонить</button>
                <button onClick={() => decide('review')}   disabled={busy} className="bg-blue-900 border-2 border-blue-600 hover:bg-blue-700 text-blue-300 text-[7px] px-3 py-2 disabled:opacity-50">↑ На пересмотр</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── PLAYER CARD ───────────────────────────────────────────────
function PlayerCard({ player, currentUserRole, onRoleChange, onClearData, onDeleteUser }: {
  player: UserProfile;
  currentUserRole: UserRole;
  onRoleChange: (uid: string, role: UserRole, cityId?: number) => Promise<void>;
  onClearData: (uid: string, nickname: string) => Promise<void>;
  onDeleteUser: (uid: string, nickname: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(player.role);
  const [newCity, setNewCity] = useState<string>(player.cityId?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onRoleChange(player.uid, newRole, newCity ? parseInt(newCity) : undefined);
    setSaving(false);
  };

  return (
    <div className="bg-[#2d5016] border-2 border-[#1a3010] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-white mb-1 truncate">👤 {player.nickname}</div>
          <div className="text-[7px] text-gray-400">{ROLE_LABELS[player.role]} · рег. {formatDate(player.registrationDate)}</div>
          {player.passport && <div className="text-[7px] text-[#ffd700] mt-1">🪪 {player.passport.primaryId}</div>}
          {(player.properties?.length ?? 0) > 0 && <div className="text-[7px] text-gray-500 mt-0.5">🏠 {player.properties!.length} объектов</div>}
          {(player.businesses?.length ?? 0) > 0 && <div className="text-[7px] text-gray-500">💼 {player.businesses!.length} бизнесов</div>}
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-[#ffd700] hover:text-white transition-colors flex-shrink-0">
          {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t-2 border-[#1a3010] pt-4">

          {/* Change role + city */}
          <div>
            <div className="text-[7px] text-gray-400 mb-2">ИЗМЕНИТЬ РОЛЬ / ГОРОД:</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)}
                className="bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] px-2 py-1 outline-none">
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([r, l]) => (
                  <option key={r} value={r}>{l}</option>
                ))}
              </select>
              <input type="number" value={newCity} onChange={e => setNewCity(e.target.value)}
                placeholder="ID города"
                className="bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] px-2 py-1 outline-none w-20"/>
              <button onClick={save} disabled={saving}
                className="bg-[#4a7c1f] border-2 border-[#2d5016] text-[7px] px-3 py-1 hover:bg-[#ffd700] hover:text-[#1a3010] transition-all disabled:opacity-50">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-red-950/30 border border-red-800 p-3 space-y-2">
            <div className="text-[7px] text-red-400 mb-2">⚠ ОПАСНАЯ ЗОНА:</div>

            {/* Clear data */}
            <button
              onClick={() => onClearData(player.uid, player.nickname)}
              className="w-full flex items-center gap-2 bg-orange-900/50 border border-orange-600 hover:bg-orange-800/60 text-orange-300 text-[7px] px-3 py-2 transition-colors">
              <RotateCcw size={11}/>
              Очистить все данные (паспорт, заявки, имущество, уведомления)
            </button>

            {/* Delete user (Emperor only) */}
            {currentUserRole === 'Emperor' && (
              <button
                onClick={() => onDeleteUser(player.uid, player.nickname)}
                className="w-full flex items-center gap-2 bg-red-900/60 border border-red-600 hover:bg-red-800/70 text-red-300 text-[7px] px-3 py-2 transition-colors">
                <Trash2 size={11}/>
                Удалить игрока полностью (бан)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN ADMIN PANEL ──────────────────────────────────────────
export function AdminPanel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [cityName, setCityName] = useState('');
  const [cityRegion, setCityRegion] = useState('');
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    if (!user || !profile) { navigate('/login'); return; }
    if (!GOV_ROLES.includes(profile.role)) navigate('/');
  }, [user, profile, navigate]);

  const apps    = usePolling<Application[]>('/applications', 5000) ?? [];
  const players = usePolling<UserProfile[]>('/users', 10000) ?? [];
  const news    = usePolling<NewsItem[]>('/news', 15000) ?? [];

  const handleDecision = async (id: string, status: string, note: string) => {
    await api.put(`/applications/${id}`, { status, note });
  };

  const handleDeleteApp = async (id: string) => {
    await api.delete(`/applications/${id}`);
  };

  const handleRoleChange = async (uid: string, role: UserRole, cityId?: number) => {
    await api.put(`/users/${uid}`, { role, ...(cityId !== undefined ? { cityId } : {}) });
  };

  const handleClearData = async (uid: string, nickname: string) => {
    if (!confirm(`Очистить ВСЕ данные игрока "${nickname}"?\nПаспорт, заявки, недвижимость, бизнесы, уведомления будут удалены.\nЭто действие необратимо!`)) return;
    const result = await api.delete<{ deletedApps: number }>(`/users/${uid}/data`);
    alert(`✓ Данные "${nickname}" очищены. Удалено заявок: ${result.deletedApps}`);
  };

  const handleDeleteUser = async (uid: string, nickname: string) => {
    if (!confirm(`УДАЛИТЬ ИГРОКА "${nickname}" ПОЛНОСТЬЮ?\nАккаунт, все заявки и данные будут удалены навсегда!`)) return;
    if (!confirm(`Последнее подтверждение: удалить "${nickname}"?`)) return;
    await api.delete(`/users/${uid}`);
    alert(`Игрок "${nickname}" удалён.`);
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsBody.trim()) return;
    setNewsLoading(true);
    await api.post('/news', { title: newsTitle.trim(), body: newsBody.trim() });
    setNewsTitle(''); setNewsBody('');
    setNewsLoading(false);
  };

  const handleDeleteNews = async (id: string) => {
    await api.delete(`/news/${id}`);
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;
    setCityLoading(true);
    await api.post('/cities', { name: cityName.trim(), region: cityRegion.trim() });
    setCityName(''); setCityRegion('');
    setCityLoading(false);
  };

  if (!profile || !GOV_ROLES.includes(profile.role)) return null;

  const pendingCount = apps.filter(a => a.status === 'pending' || a.status === 'review').length;

  const filteredApps = apps.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search && !a.userNickname.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredPlayers = players.filter(p =>
    !search || p.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'applications', label: `Заявки${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <FileText size={12}/> },
    { id: 'players',      label: 'Игроки',                                                  icon: <Users size={12}/> },
    { id: 'news',         label: 'Новости',                                                 icon: <Newspaper size={12}/> },
    { id: 'cities',       label: 'Города',                                                  icon: <Shield size={12}/> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#ffd700]" />
          <div>
            <h2 className="text-[10px] md:text-xs text-[#ffd700]">Панель управления</h2>
            <p className="text-[7px] text-gray-400 mt-1">{ROLE_LABELS[profile.role]} · {profile.nickname}</p>
          </div>
        </div>
        <div className="flex gap-6 mt-4">
          {[
            { label: 'На рассмотрении', value: pendingCount, hl: true },
            { label: 'Всего заявок',    value: apps.length },
            { label: 'Игроков',         value: players.length },
            { label: 'Новостей',        value: news.length },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-lg ${s.hl ? 'text-yellow-400' : 'text-[#ffd700]'}`}>{s.value}</div>
              <div className="text-[6px] text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 border-2 text-[8px] transition-all ${tab === t.id ? 'bg-[#8b7355] border-[#5a4a3a] text-[#ffd700]' : 'bg-[#4a7c1f] border-[#2d5016] hover:bg-[#5a8c2f] text-white'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── APPLICATIONS ── */}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-32">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по нику..."
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] pl-8 pr-3 py-2 outline-none focus:border-[#ffd700]"/>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] px-3 py-2 outline-none">
              <option value="">Все статусы</option>
              {Object.entries(APP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {filteredApps.length === 0
              ? <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-8 text-center text-[8px] text-gray-500">Заявок не найдено</div>
              : filteredApps.map(app => (
                  <ApplicationCard key={app.id} app={app}
                    onDecision={handleDecision} onDelete={handleDeleteApp}/>
                ))}
          </div>
        </div>
      )}

      {/* ── PLAYERS ── */}
      {tab === 'players' && (
        <div className="space-y-3">
          <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-4">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск игрока..."
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[7px] pl-8 pr-3 py-2 outline-none focus:border-[#ffd700]"/>
            </div>
          </div>
          {filteredPlayers.map(p => (
            <PlayerCard key={p.uid} player={p}
              currentUserRole={profile.role}
              onRoleChange={handleRoleChange}
              onClearData={handleClearData}
              onDeleteUser={handleDeleteUser}/>
          ))}
        </div>
      )}

      {/* ── NEWS ── */}
      {tab === 'news' && (
        <div className="space-y-4">
          <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
            <h3 className="text-[9px] text-[#ffd700] mb-4">📰 Добавить новость</h3>
            <form onSubmit={handleAddNews} className="space-y-3">
              <input type="text" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="Заголовок..."
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[8px] px-3 py-2 outline-none focus:border-[#ffd700] placeholder-gray-600"/>
              <textarea value={newsBody} onChange={e => setNewsBody(e.target.value)} placeholder="Текст..." rows={3}
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[8px] px-3 py-2 outline-none focus:border-[#ffd700] placeholder-gray-600 resize-none"/>
              <button type="submit" disabled={newsLoading}
                className="bg-[#4a7c1f] border-2 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[8px] px-4 py-2 disabled:opacity-50">
                {newsLoading ? '...' : '+ Опубликовать'}
              </button>
            </form>
          </div>
          <div className="space-y-2">
            {news.map(item => (
              <div key={item.id} className="bg-[#2d5016] border-2 border-[#1a3010] p-4 flex justify-between items-start gap-3">
                <div>
                  <div className="text-[9px] text-white mb-1">{item.title}</div>
                  <div className="text-[7px] text-gray-300 mb-2">{item.body}</div>
                  <div className="text-[7px] text-gray-500">{formatDate(item.date)} · {item.authorNickname}</div>
                </div>
                <button onClick={() => handleDeleteNews(item.id)}
                  className="text-red-400 hover:text-red-300 text-[7px] flex-shrink-0 p-1">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CITIES ── */}
      {tab === 'cities' && (
        <div className="space-y-4">
          <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
            <h3 className="text-[9px] text-[#ffd700] mb-4">🏙️ Добавить город</h3>
            <form onSubmit={handleAddCity} className="space-y-3">
              <input type="text" value={cityName} onChange={e => setCityName(e.target.value)} placeholder="Название города..."
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[8px] px-3 py-2 outline-none focus:border-[#ffd700] placeholder-gray-600"/>
              <input type="text" value={cityRegion} onChange={e => setCityRegion(e.target.value)} placeholder="Регион (необязательно)..."
                className="w-full bg-[#0f1e09] border-2 border-[#4a7c1f] text-white text-[8px] px-3 py-2 outline-none focus:border-[#ffd700] placeholder-gray-600"/>
              <button type="submit" disabled={cityLoading}
                className="bg-[#4a7c1f] border-2 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[8px] px-4 py-2 disabled:opacity-50">
                {cityLoading ? '...' : '+ Добавить город'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
