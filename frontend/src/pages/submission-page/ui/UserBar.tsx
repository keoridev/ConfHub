import { CheckCircle2, GraduationCap, LogOut, RotateCcw } from "lucide-react";
import type { User } from "~entities/talk/model/types";

interface UserBarProps {
  user: User;
  hasRestoredDraft: boolean;
  onClearDraft: () => void;
  onOpenLogout: () => void;
}

export function UserBar({
  user,
  hasRestoredDraft,
  onClearDraft,
  onOpenLogout,
}: UserBarProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#1a4d3e]/20 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center font-bold text-base shadow-xs">
            {user.fullName ? (
              user.fullName[0].toUpperCase()
            ) : (
              <GraduationCap className="size-5 text-[#d4a84b]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-[#1a4d3e]">
                {user.fullName || user.login}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d4a84b]/20 text-[#1a4d3e] border border-[#d4a84b]/40">
                {user.university
                  ? `${user.university}${user.groupName ? ` • ${user.groupName}` : ""}`
                  : user.groupName
                  ? `Группа ${user.groupName}`
                  : "Студент"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Докладчик закреплён за аккаунтом{" "}
              <span className="font-mono text-[#1a4d3e]">@{user.login}</span>. Вы можете уточнить свои ФИО, вуз и группу в форме ниже.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Авторизован</span>
          </div>
          <button
            type="button"
            onClick={onOpenLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 text-xs font-semibold text-[#1a4d3e]/70 hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all cursor-pointer"
            title="Выйти из аккаунта"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>

      {hasRestoredDraft && (
        <div className="p-4 rounded-2xl bg-[#1a4d3e]/5 border border-[#1a4d3e]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#1a4d3e]">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="size-4 text-[#d4a84b] shrink-0" />
            <span>
              <strong>Черновик сохранён:</strong> Все введённые данные сохраняются автоматически и не теряются при обновлении страницы.
            </span>
          </div>
          <button
            type="button"
            onClick={onClearDraft}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 text-xs font-bold text-danger hover:bg-danger/10 hover:border-danger/30 transition-colors cursor-pointer"
          >
            Очистить черновик
          </button>
        </div>
      )}
    </div>
  );
}
