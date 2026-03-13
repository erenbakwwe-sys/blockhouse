import { Outlet } from 'react-router-dom';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white font-sans selection:bg-red-500/30">
      <Outlet />
    </div>
  );
}
