import { Outlet } from "react-router-dom";
import "~app/index.css";
import { AppNavigation } from "~widgets/demo-nav/ui/DemoNav";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f3ed] text-foreground flex flex-col w-full max-w-full overflow-x-hidden">
      <AppNavigation />

      <main className="flex-grow w-full max-w-full overflow-x-hidden pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
};
