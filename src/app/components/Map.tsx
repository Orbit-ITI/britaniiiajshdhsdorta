import { usePolling } from '../../hooks/usePolling';
import { City } from '../../lib/types';
import { MapPin } from 'lucide-react';

export function Map() {
  const cities = usePolling<City[]>('/cities', 20000) ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h2 className="text-[10px] md:text-xs text-[#ffd700] mb-2">🗺️ Карта Британской Империи</h2>
        <p className="text-[8px] text-gray-300">Интерактивная карта территорий и городов</p>
      </div>

      <div className="bg-[#1f4012] border-4 border-[#0f1e09] overflow-hidden">
        <div className="relative h-64 md:h-96 bg-[#0f1e09] flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-[8px] text-gray-400 mb-2">Карта сервера</p>
            <p className="text-[7px] text-gray-600">Замените на iframe вашего dynmap</p>
            <code className="block mt-3 text-[6px] text-green-400 bg-[#1a3010] px-3 py-2 border border-[#4a7c1f]">
              {'<iframe src="http://YOUR-SERVER:8123" ... />'}
            </code>
          </div>
          {cities.map(city => city.coordinates && (
            <div
              key={city.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${((city.coordinates.x + 5000) / 10000) * 100}%`,
                top: `${((city.coordinates.z + 5000) / 10000) * 100}%`,
              }}
            >
              <MapPin size={16} className="text-[#ffd700]" />
              <span className="text-[6px] text-white bg-[#1a3010] px-1 border border-[#4a7c1f] mt-0.5 whitespace-nowrap">{city.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#1f4012] border-4 border-[#0f1e09] p-6">
        <h3 className="text-[10px] text-[#ffd700] mb-4">Города империи</h3>
        {cities.length === 0 ? (
          <p className="text-[8px] text-gray-500">Городов пока нет</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cities.map(city => (
              <div key={city.id} className="bg-[#2d5016] border-2 border-[#1a3010] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={12} className="text-[#ffd700]" />
                  <span className="text-[9px] text-white">{city.name}</span>
                </div>
                {city.region && <div className="text-[7px] text-gray-400">Регион: {city.region}</div>}
                {city.coordinates && (
                  <div className="text-[7px] text-gray-500">X: {city.coordinates.x}, Z: {city.coordinates.z}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
