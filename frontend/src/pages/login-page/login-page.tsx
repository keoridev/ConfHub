import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Input, Button } from "@heroui/react";
import { useLoginMutation } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib"; // <-- Добавлен импорт

export function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await loginMutation.mutateAsync({ login, password });

      if (data.user.mustChangePassword) {
        navigate(pathKeys.changePassword);
      } else if (data.user.role === "admin") {
        navigate(pathKeys.admin);
      } else if (data.user.role === "jury") {
        navigate(pathKeys.jury);
      } else {
        // <-- обычный пользователь теперь попадает на конференцию
        navigate(pathKeys.conference.build("demo"));
      }
    } catch (error: any) {
      console.error("Login failed:", error.response?.data?.error?.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ed] p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl border border-[#1a4d3e]/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1a4d3e] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1a4d3e]/20">
            <span className="text-white text-2xl font-bold">С</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a4d3e] mb-2">
            COMTEHNO 2026
          </h1>
          <p className="text-muted-foreground text-sm">
            Вход в систему конференций
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Логин"
            placeholder="ivanov.i"
            value={login}
            onChange={(e) => setLogin(e.target.value)} // <-- вместо onValueChange
            isRequired
            classNames={{
              inputWrapper:
                "bg-[#f5f3ed] border-2 border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 focus-within:border-[#d4a84b] focus-within:ring-4 focus-within:ring-[#d4a84b]/10 transition-all duration-200 rounded-xl  h-12",
              input:
                "text-[#1a4d3e] placeholder:text-muted-foreground/60 text-base font-medium",
            }}
            className={"w-full"}
          />

          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            classNames={{
              inputWrapper:
                "bg-[#f5f3ed] border-2 border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 focus-within:border-[#d4a84b] focus-within:ring-4 focus-within:ring-[#d4a84b]/10 transition-all duration-200 rounded-xl h-12",
              input:
                "text-[#1a4d3e] placeholder:text-muted-foreground/60 text-base font-medium",
            }}
          />

          {loginMutation.isError && (
            <div className="bg-danger/10 text-danger p-3 rounded-lg text-sm font-medium border border-danger/20">
              Неверный логин или пароль
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-[#1a4d3e] text-white hover:bg-[#1a4d3e]/90 font-semibold h-12 rounded-xl text-base transition-all active:scale-[0.98]"
            isLoading={loginMutation.isPending}
          >
            Войти
          </Button>
        </form>
      </Card>
    </div>
  );
}

// <-- Добавлен экспорт для роутера
export const loginPageRoute = { element: <LoginPage /> };
