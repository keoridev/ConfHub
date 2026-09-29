import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "~app/layout";
import { conferencePageRoute } from "~pages/conference-page";
import { submissionPageRoute } from "~pages/submission-page";
import { pathKeys } from "~shared/lib";
import { talkPageRoute } from "~pages/talk-page";
import { juryPageRoute } from "~pages/jury-page";

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
      { path: "talk/:talkId", ...talkPageRoute },
      { path: "jury", ...juryPageRoute },
    ],
  },
]);

export function BrowserRouter() {
  return <RouterProvider router={router} />;
}
