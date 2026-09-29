import { Outlet } from "react-router-dom";
import "~app/index.css";
import { DemoNav } from "~widgets/demo-nav/ui/DemoNav";

export const AppLayout = () => {
  return (
    <div className="bg-[#F0F0F0] min-h-screen">
      <div className="flex flex-col max-w-[1168px] min-h-screen mx-auto">
        <header className="py-4">
          <DemoNav />
        </header>

        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
