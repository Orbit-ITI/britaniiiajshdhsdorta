import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { usePolling } from '../../hooks/usePolling';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  app_id?: string;
  read: boolean;
  at: string;
}

export function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  const notifications = usePolling<Notification[]>(
    `/notifications/${user?.uid}`,
    6000,
    !!user
  ) ?? [];

  const markAllRead = async () => {
    if (!user) return;
    await api.put(`/notifications/${user.uid}/read-all`);
  };

  const markRead = async (id: string) => {
    if (!user) return;
    await api.put(`/notifications/${user.uid}/${id}/read`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#ffd700]" />
          <div>
            <h2 className="text-[10px] text-[#ffd700]">Уведомления</h2>
            {unreadCount > 0 && <p className="text-[7px] text-yellow-400 mt-1">{unreadCount} непрочитанных</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 bg-[#4a7c1f] border-2 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[7px] px-3 py-2">
            <CheckCheck size={12} /> Прочитать все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-10 text-center">
          <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-[8px] text-gray-500">Уведомлений нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className={`border-2 p-4 cursor-pointer transition-all ${n.read ? 'bg-[#1f4012] border-[#0f1e09] opacity-60' : 'bg-[#2d5016] border-[#ffd700] hover:bg-[#3d6020]'}`}>
              <div className="flex items-start gap-2">
                {!n.read && <div className="w-2 h-2 bg-[#ffd700] mt-1 flex-shrink-0" />}
                <div>
                  <p className="text-[8px] text-white">{n.message}</p>
                  <p className="text-[7px] text-gray-500 mt-1">{formatDate(n.at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
