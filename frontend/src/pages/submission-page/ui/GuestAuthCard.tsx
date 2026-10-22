import { Link } from "react-router-dom";
import { LogIn, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import { Card } from "@heroui/react";
import { pathKeys } from "~shared/lib";

export function GuestAuthCard() {
  return (
    <div className="max-w-lg mx-auto py-6">
      <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 shadow-md shadow-[#1a4d3e]/5 rounded-3xl space-y-6 text-center">
        <div className="size-14 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center mx-auto shadow-xs">
          <FileText className="size-7 text-[#1a4d3e]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1a4d3e]">
            Вход для подачи заявки
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Подача тезисов, выбор научной секции и прикрепление материалов доклада доступны авторизованным участникам конференции.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <Link
            to={`${pathKeys.login}?redirect=${encodeURIComponent(pathKeys.submission)}`}
            className="w-full py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="size-4 text-[#d4a84b]" />
            <span>Войти в аккаунт</span>
          </Link>

          <Link
            to={`${pathKeys.login}?tab=register&redirect=${encodeURIComponent(pathKeys.submission)}`}
            className="w-full py-3 px-4 rounded-xl border-2 border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/5 text-[#1a4d3e] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="size-4 text-[#1a4d3e]" />
            <span>Зарегистрироваться как участник</span>
          </Link>
        </div>

        <div className="pt-3 border-t border-[#1a4d3e]/10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          <span>Участие в конференции и публикация сборника бесплатны</span>
        </div>
      </Card>
    </div>
  );
}

