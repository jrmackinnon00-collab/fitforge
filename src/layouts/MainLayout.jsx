import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import ThemeToggle from '../components/ThemeToggle'

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏋️</span>
            <span className="text-xl font-bold text-orange-500">FitForge</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-14 pb-20 min-h-screen">
        <div className="max-w-md mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}

export default MainLayout
