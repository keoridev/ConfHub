import { Outlet } from "react-router-dom";
import "~app/index.css";

interface AppLayoutProps {
  withHeader?: boolean;
}

export const AppLayout = ({ withHeader = false }: AppLayoutProps) => {
  return (
    <div className="bg-[#F0F0F0] min-h-screen">
      <div className="flex flex-col max-w-[1168px] min-h-screen mx-auto">
        {withHeader && <header className="py-4">{/* <HomeHeader /> */}</header>}
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
