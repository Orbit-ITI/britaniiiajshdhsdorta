import { Users, Building2, Landmark, Trophy, Newspaper } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { NewsItem, PortalStats } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Home() {
  const stats = usePolling<PortalStats>('/stats', 8000) ?? { citizens: 0, cities: 0, regions: 0, applications: 0 };
  const news = usePolling<NewsItem[]>('/news', 15000) ?? [];

  const statCards = [
    { icon: Users, label: 'Граждан', value: stats.citizens },
    { icon: Building2, label: 'Городов', value: stats.cities },
    { icon: Landmark, label: 'Регионов', value: stats.regions },
    { icon: Trophy, label: 'Заявок', value: stats.applications },
  ];

  return (
    <div className="space-y-6">
      <div className="relative h-48 md:h-80 border-4 border-[#1a3010] overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1662531914405-c037eab676b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Британская Империя"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1e09] via-[#1a3010]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-sm md:text-xl text-[#ffd700] mb-1">Добро пожаловать!</h2>
          <p className="text-[9px] md:text-xs text-gray-300">Официальный портал государственных услуг Британской Империи</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#1f4012] border-4 border-[#0f1e09] p-4 text-center">
            <Icon className="w-8 h-8 text-[#ffd700] mx-auto mb-2" />
            <div className="text-xl text-[#ffd700] mb-1">{value.toLocaleString()}</div>
            <div className="text-[8px] text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h3 className="text-[10px] md:text-xs text-[#ffd700] mb-4">О Британской Империи</h3>
        <div className="space-y-3 text-[8px] md:text-[10px] text-gray-300 leading-relaxed">
          <p>Британская Империя — крупнейшее государство на сервере с богатой историей и традициями. Полный спектр государственных услуг и развитая инфраструктура.</p>
          <p>Наше государство основано на принципах справедливости и процветания. Присоединяйтесь к нам!</p>
        </div>
      </div>

      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Newspaper size={16} className="text-[#ffd700]" />
          <h3 className="text-[10px] md:text-xs text-[#ffd700]">Последние новости</h3>
        </div>
        <div className="space-y-4">
          {news.length === 0 ? (
            <p className="text-[8px] text-gray-500">Новостей пока нет</p>
          ) : (
            news.map(item => (
              <div key={item.id} className="border-l-4 border-[#ffd700] pl-4">
                <div className="text-[8px] text-gray-500 mb-1">{formatDate(item.date)} · {item.authorNickname}</div>
                <div className="text-[9px] text-white font-bold mb-1">{item.title}</div>
                <div className="text-[8px] text-gray-300">{item.body}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
