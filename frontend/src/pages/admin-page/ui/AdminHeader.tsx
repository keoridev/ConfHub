import { Shield, LogOut } from "lucide-react";
import type { User } from "~entities/talk/model/types";

interface AdminHeaderProps {
  user: User;
  onLogout: () => void;
}

export function AdminHeader({ user, onLogout }: AdminHeaderProps) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-inner">
        <div className="admin-topbar-brand">
          <img src="/logo.jpg" alt="Logo" className="size-6 rounded object-cover" />
          <span className="admin-brand-name">Conf-Hub 2026</span>
          <span className="admin-brand-sep hidden sm:inline">·</span>
          <span className="admin-brand-role hidden sm:inline">Панель администратора</span>
        </div>
        <div className="admin-topbar-actions">
          <div className="admin-user-chip">
            <Shield className="size-3.5" />
            <span className="max-w-[70px] sm:max-w-none truncate">{user.fullName || user.login}</span>
          </div>
          <button className="admin-logout-btn" onClick={onLogout} title="Выйти">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
}
