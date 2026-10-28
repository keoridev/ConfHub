import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { AppLayout } from "~app/layout";
import { loginPageRoute } from "~pages/login-page";
import { ConferencePage } from "~pages/conference-page";
import { ProgramPage } from "~pages/program-page";
import { SubmissionPage } from "~pages/submission-page";
import { TalkPage } from "~pages/talk-page";
import { JuryPage } from "~pages/jury-page";
import { AdminPage } from "~pages/admin-page";
import { pathKeys } from "~shared/lib";
import { RoleGuard } from "./RoleGuard";

const router = createBrowserRouter([
  {
    path: pathKeys.login,
    ...loginPageRoute,
  },
  {
    path: pathKeys.root,
    element: <AppLayout />,
    errorElement: (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f3ed] p-6 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-[#1a4d3e]">Что-то пошло не так</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Произошла ошибка при отображении раздела. Попробуйте обновить страницу или вернуться на главную.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#1a4d3e] text-white font-bold text-sm cursor-pointer shadow-xs hover:bg-[#143d31] transition-colors"
          >
            Обновить страницу
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl border border-[#1a4d3e]/20 text-[#1a4d3e] font-bold text-sm hover:bg-[#1a4d3e]/10 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    ),
    children: [
      {
        index: true,
        element: (
          <RoleGuard allowedRoles={["student", "guest"]}>
            <ConferencePage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.program,
        element: (
          <RoleGuard allowedRoles={["student", "guest"]}>
            <ProgramPage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.conference.route,
        element: (
          <RoleGuard allowedRoles={["student", "guest"]}>
            <ProgramPage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.submission,
        element: (
          <RoleGuard allowedRoles={["student", "guest"]}>
            <SubmissionPage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.talk.route,
        element: (
          <RoleGuard allowedRoles={["student", "guest", "jury", "admin"]}>
            <TalkPage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.jury,
        element: (
          <RoleGuard allowedRoles={["jury", "guest"]}>
            <JuryPage />
          </RoleGuard>
        ),
      },
      {
        path: pathKeys.admin,
        element: (
          <RoleGuard allowedRoles={["admin"]}>
            <AdminPage />
          </RoleGuard>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}