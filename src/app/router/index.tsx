import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "~app/layout";
import { conferencePageRoute } from "~pages/conference-page";
import { submissionPageRoute } from "~pages/submission-page";
import { pathKeys } from "~shared/lib";

const router = createBrowserRouter([
  {
    path: pathKeys.root,
    element: <AppLayout />,
    errorElement: <h1>404 — страница не найдена</h1>,
    children: [
      {
        index: true,
        element: <Navigate to={pathKeys.conference.byId("demo")} replace />,
      },
      {
        path: pathKeys.conference.root(),
        ...conferencePageRoute,
      },
      {
        path: pathKeys.submission(),
        ...submissionPageRoute,
      },
    ],
  },
  // Сюда позже: отдельная ветка под auth (login) со своим layout
]);

export function BrowserRouter() {
  return <RouterProvider router={router} />;
}
