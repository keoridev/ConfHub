import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { AppLayout } from "~app/layout";
import { loginPageRoute } from "~pages/login-page"; // <-- Добавлен импорт
import { conferencePageRoute } from "~pages/conference-page";
import { submissionPageRoute } from "~pages/submission-page";
import { talkPageRoute } from "~pages/talk-page";
import { juryPageRoute } from "~pages/jury-page";
import { pathKeys } from "~shared/lib";

const router = createBrowserRouter([
  // 1. Публичные маршруты (без AppLayout)
  {
    path: pathKeys.login,
    ...loginPageRoute,
  },
  
  // 2. Защищенные/Основные маршруты (внутри AppLayout)
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
        // Если пользователь не авторизован, здесь в будущем стоит сделать редирект на pathKeys.login
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
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}