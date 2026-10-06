import { Outlet } from "react-router-dom";
import "~app/index.css";
import { AppNavigation } from "~widgets/demo-nav/ui/DemoNav";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Глобальная навигация (Сайдбар на десктопе, Bottom Bar на мобильном) */}
      <AppNavigation />

      {/* Основной контент */}
      <main className="flex-grow w-full">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
