import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { AppLayout } from "~app/layout";
import { loginPageRoute } from "~pages/login-page";
import { conferencePageRoute } from "~pages/conference-page";
import { submissionPageRoute } from "~pages/submission-page";
import { talkPageRoute } from "~pages/talk-page";
import { juryPageRoute } from "~pages/jury-page";
import { adminPageRoute } from "~pages/admin-page";
import { pathKeys } from "~shared/lib";

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
        element: <Navigate to={pathKeys.conference.build("demo")} replace />,
      },
      {
        path: pathKeys.conference.route,
        ...conferencePageRoute,
      },
      {
        path: pathKeys.submission,
        ...submissionPageRoute,
      },
      {
        path: pathKeys.talk.route,
        ...talkPageRoute,
      },
      {
        path: pathKeys.jury,
        ...juryPageRoute,
      },
      {
        path: pathKeys.admin,
        ...adminPageRoute,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}