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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ed]">
        <h1 className="text-3xl font-bold text-[#1a4d3e]">404 — страница не найдена</h1>
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