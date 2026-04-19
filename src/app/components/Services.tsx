import { FileText, Home, Briefcase, Building, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const services = [
  { icon: FileText, title: 'Получение паспорта', description: 'Оформление гражданства и получение паспорта гражданина империи', path: '/services/passport', emoji: '🪪', available: true },
  { icon: Home, title: 'Регистрация собственности', description: 'Регистрация жилой, коммерческой недвижимости и земельных участков', path: '/services/property', emoji: '🏠', available: true },
  { icon: Briefcase, title: 'Лицензия на бизнес', description: 'Получение разрешения на ведение коммерческой деятельности', path: '/services/business-license', emoji: '💼', available: true },
  { icon: Building, title: 'Строительное разрешение', description: 'Разрешение на строительство зданий и сооружений', path: '/services/building-permit', emoji: '🏗️', available: true },
  { icon: Star, title: 'Регистрация организации', description: 'Создание и официальная регистрация организации (требуется лицензия)', path: '/services/organization', emoji: '🏢', available: true },
];

export function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = (path: string) => {
    if (!user) { navigate('/login'); return; }
    navigate(path);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h2 className="text-[10px] md:text-xs text-[#ffd700] mb-2">Государственные услуги</h2>
        <p className="text-[8px] text-gray-300">Полный каталог услуг для граждан Британской Империи</p>
        {!user && <p className="text-[8px] text-yellow-400 mt-2">⚠ Для подачи заявки необходимо войти в систему</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => {
          const Icon = service.icon;
          return (
            <button
              key={service.path}
              onClick={() => handleClick(service.path)}
              className="bg-[#1f4012] border-4 border-[#0f1e09] p-5 hover:bg-[#2d5016] hover:border-[#ffd700] transition-all cursor-pointer group text-left w-full"
            >
              <div className="flex items-start gap-4">
                <div className="bg-[#4a7c1f] border-2 border-[#2d5016] p-3 group-hover:bg-[#ffd700] transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#ffd700] group-hover:text-[#1a3010] transition-colors" />
                </div>
                <div>
                  <div className="text-[8px] md:text-[9px] text-white mb-2 group-hover:text-[#ffd700] transition-colors">{service.emoji} {service.title}</div>
                  <p className="text-[7px] text-gray-400 leading-relaxed">{service.description}</p>
                  <div className="mt-3 text-[7px] bg-green-900/50 border border-green-600 text-green-300 inline-block px-2 py-1">✓ Доступно</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Steps */}
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h3 className="text-[10px] text-[#ffd700] mb-4">Как подать заявку?</h3>
        <div className="space-y-3">
          {['Войдите в личный кабинет', 'Выберите нужную услугу', 'Заполните форму и отправьте', 'Отслеживайте статус в профиле'].map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-[#ffd700] text-[#1a3010] w-7 h-7 flex items-center justify-center border-2 border-[#8b7355] flex-shrink-0 text-[8px]">{i+1}</div>
              <div className="text-[8px] text-gray-300">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
