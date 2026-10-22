import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUserQuery } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Array<"student" | "jury" | "admin" | "guest">;
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: user, isLoading } = useCurrentUserQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-3 border-[#1a4d3e]/20 border-t-[#1a4d3e] rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Admin can do ABSOLUTELY EVERYTHING
  if (user?.role === "admin") {
    return <>{children}</>;
  }

  // 2. Jury sees ONLY the Jury page ("а на жюри видеть только страница жюри")
  if (user?.role === "jury") {
    if (allowedRoles.includes("jury")) {
      return <>{children}</>;
    }
    return <Navigate to={pathKeys.jury} replace />;
  }

  // 3. Student sees student pages (Program, Submission, Talk). NO Jury, NO Admin!
  if (user?.role === "student") {
    if (allowedRoles.includes("student")) {
      return <>{children}</>;
    }
    return <Navigate to={pathKeys.submission} replace />;
  }

  // 4. Guest (not logged in)
  if (!user) {
    if (allowedRoles.includes("guest")) {
      return <>{children}</>;
    }
    return (
      <Navigate
        to={`${pathKeys.login}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}

export function RootRedirect() {
  const { data: user, isLoading } = useCurrentUserQuery();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="size-8 border-3 border-[#1a4d3e]/20 border-t-[#1a4d3e] rounded-full animate-spin" />
      </div>
    );
  }

  // Jury automatically redirected to Jury page
  if (user?.role === "jury") {
    return <Navigate to={pathKeys.jury} replace />;
  }

  // Admin, Student or Guest directed to Conference Program
  return <Navigate to={pathKeys.conference.build("demo")} replace />;
}
