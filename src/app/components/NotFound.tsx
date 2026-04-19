import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-6">
      <div className="text-6xl">⚠️</div>
      <h2 className="text-sm text-[#ffd700]">404</h2>
      <p className="text-[9px] text-gray-400">Страница не найдена</p>
      <Link to="/" className="bg-[#4a7c1f] border-4 border-[#2d5016] hover:bg-[#ffd700] hover:text-[#1a3010] transition-all text-[8px] px-6 py-3">
        На главную →
      </Link>
    </div>
  );
}
