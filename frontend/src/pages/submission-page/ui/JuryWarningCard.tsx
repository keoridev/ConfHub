import { AlertCircle } from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { pathKeys } from "~shared/lib";
import type { User } from "~entities/talk/model/types";

interface JuryWarningCardProps {
  user: User;
  onOpenLogout: () => void;
}

export function JuryWarningCard({ user, onOpenLogout }: JuryWarningCardProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card className="border border-amber-300 bg-amber-50/70 p-7 sm:p-9 shadow-md rounded-3xl space-y-5 text-center">
        <div className="size-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="size-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#1a4d3e]">
            Подача заявок открыта для студентов
          </h2>
          <p className="text-sm text-[#1a4d3e]/80 mt-1">
            Вы сейчас авторизованы под экспертным аккаунтом жюри{" "}
            <strong className="font-semibold">{user.fullName || user.login}</strong>. Для оценки докладов перейдите в кабинет жюри.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => navigate(pathKeys.jury)}
            className="py-3 px-5 bg-[#1a4d3e] text-white font-bold rounded-xl cursor-pointer"
          >
            Перейти в Кабинет Жюри
          </Button>
          <Button
            onClick={onOpenLogout}
            className="py-3 px-5 bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] font-semibold rounded-xl cursor-pointer"
          >
            Сменить аккаунт на Студента
          </Button>
        </div>
      </Card>
    </div>
  );
}
