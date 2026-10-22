import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Scale } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { pathKeys } from "~shared/lib";
import type { User } from "~entities/talk/model/types";

interface JuryAuthGuardProps {
  user: User | null | undefined;
  onOpenLogout: () => void;
}

export function JuryAuthGuard({
  user,
  onOpenLogout,
}: JuryAuthGuardProps) {
  const navigate = useNavigate();

  if (user && user.role === "student") {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="border border-amber-300 bg-amber-50/70 p-7 sm:p-9 shadow-md rounded-3xl space-y-5 text-center">
          <div className="size-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1a4d3e]">
              Доступ ограничен для студентов
            </h2>
            <p className="text-sm text-[#1a4d3e]/80 mt-1">
              Кабинет жюри предназначен исключительно для членов экспертной комиссии. Вы сейчас авторизованы под студенческим аккаунтом{" "}
              <strong className="font-semibold">{user.fullName || user.login}</strong>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => navigate(pathKeys.submission)}
              className="py-3 px-5 bg-[#1a4d3e] text-white font-bold rounded-xl cursor-pointer"
            >
              Перейти к подаче доклада
            </Button>
            <Button
              onClick={onOpenLogout}
              className="py-3 px-5 bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] font-semibold rounded-xl cursor-pointer"
            >
              Сменить аккаунт на Жюри
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-6">
        <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 shadow-md rounded-3xl space-y-6 text-center">
          <div className="size-14 rounded-2xl bg-[#d4a84b]/20 text-[#1a4d3e] flex items-center justify-center mx-auto shadow-xs">
            <Scale className="size-7 text-[#1a4d3e]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1a4d3e]">
              Вход для экспертов жюри
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Для доступа к экспертной оценке докладов авторизуйтесь в системе под учётной записью члена жюри.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to={pathKeys.login}
              className="w-full inline-flex py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold text-sm shadow-md items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Перейти на страницу входа</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
