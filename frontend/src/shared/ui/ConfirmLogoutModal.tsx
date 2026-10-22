import { useEffect } from "react";
import { LogOut, X, AlertTriangle } from "lucide-react";

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
  userRole?: string;
  user?: {
    fullName?: string;
    login?: string;
    role?: string;
  } | null;
}

export function ConfirmLogoutModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  userRole,
  user,
}: ConfirmLogoutModalProps) {
  const displayName = userName || user?.fullName || user?.login;
  const rawRole = userRole || user?.role;
  const displayRole =
    rawRole === "jury"
      ? "Жюри"
      : rawRole === "admin"
      ? "Администратор"
      : rawRole === "student"
      ? "Студент"
      : rawRole;
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#1a4d3e]/20 p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6 text-amber-600" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-black/5 text-[#1a4d3e]/60 hover:text-[#1a4d3e] flex items-center justify-center transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-[#1a4d3e] tracking-tight">
            Выход из аккаунта
          </h3>
          <p className="text-sm text-[#1a4d3e]/80 leading-relaxed">
            Вы действительно хотите выйти из своего аккаунта?
          </p>

          {displayName && (
            <div className="mt-3 p-3 rounded-2xl bg-[#f5f3ed] border border-[#1a4d3e]/15 flex items-center justify-between text-xs">
              <span className="font-bold text-[#1a4d3e] truncate">{displayName}</span>
              {displayRole && (
                <span className="px-2 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e] font-semibold text-[10px] uppercase tracking-wider">
                  {displayRole}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/5 text-[#1a4d3e] font-bold text-sm transition-colors cursor-pointer text-center"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-danger hover:bg-danger/90 text-white font-bold text-sm shadow-md shadow-danger/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
}
