import { createBrowserRouter, type RouteObject } from "react-router";
import { RootLayout } from "@/components/RootLayout";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { NotFound } from "@/components/NotFound";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import AppPage from "@/pages/AppPage";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      { path: "/", element: <Index /> },
      { path: "/signin", element: <SignIn /> },
      { path: "/signup", element: <SignUp /> },
      {
        element: <RequireAuth />,
        children: [{ path: "/app", element: <AppPage /> }],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
