import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  useChangePasswordMutation,
  useCurrentUserQuery,
  useLogout,
} from "~entities/talk/api/queries";
import type { User } from "~entities/talk/model/types";
import { pathKeys } from "~shared/lib";
import { Eye, EyeOff, KeyRound, Lock, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

function homePath(role: User["role"]) {
  if (role === "admin") return pathKeys.admin;
  if (role === "jury") return pathKeys.jury;
  return pathKeys.submission;
}

const inputClass =
  "w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUserQuery();
  const changePasswordMutation = useChangePasswordMutation();
  const logout = useLogout();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!currentUser) {
    return <Navigate to={pathKeys.login} replace />;
  }

  const needsConsent = currentUser.role === "student" && !!currentUser.consentRequired;

  const fail = (msg: string) => {
    setErrorMessage(msg);
    toast.error(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) return fail("Новый пароль должен содержать не менее 8 символов");
    if (newPassword === currentUser.login) return fail("Пароль не должен совпадать с логином");
    if (newPassword === oldPassword) return fail("Новый пароль не должен совпадать со старым");
    if (newPassword !== confirmPassword) return fail("Пароли не совпадают");
    if (needsConsent && !consent) return fail("Необходимо дать согласие на обработку данных");

    try {
      const data = await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        consent,
      });
      toast.success("Пароль успешно изменён");
      navigate(homePath(data.user.role), { replace: true });
    } catch (error: any) {
      fail(error.response?.data?.error?.message || "Не удалось сменить пароль. Попробуйте ещё раз.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate(pathKeys.login, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#1a4d3e] flex flex-col justify-between selection:bg-[#d4a84b]/30">
      <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[#1a4d3e]/80 hover:text-[#1a4d3e] transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>Выйти</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="size-6 sm:size-7 rounded-lg object-cover border border-[#1a4d3e]/15"
          />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-[#1a4d3e]">
            Conf-Hub 2026
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl space-y-6 sm:space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3 px-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#1a4d3e]/10 text-[#1a4d3e] border border-[#1a4d3e]/15">
              <Sparkles className="size-3 text-[#d4a84b]" />
              Безопасность аккаунта
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1a4d3e] leading-tight">
              Смена пароля
            </h1>
            <p className="text-sm sm:text-base text-[#1a4d3e]/80 leading-relaxed">
              {currentUser.mustChangePassword
                ? "Вы вошли с временным паролем. Придумайте новый пароль, чтобы продолжить работу."
                : "Введите текущий пароль и придумайте новый."}
            </p>
          </div>

          {errorMessage && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
              <div className="size-2 rounded-full bg-danger mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#1a4d3e]/15 p-6 sm:p-8 shadow-lg shadow-[#1a4d3e]/5 animate-in fade-in duration-200">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-xs text-[#1a4d3e]/70">
                Логин: <span className="font-bold text-[#1a4d3e]">{currentUser.login}</span>
              </div>

              <div>
                <label
                  htmlFor="old-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5"
                >
                  {currentUser.mustChangePassword ? "Временный пароль" : "Текущий пароль"}{" "}
                  <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                    <KeyRound className="size-4" />
                  </div>
                  <input
                    id="old-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5"
                >
                  Новый пароль <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                    <Lock className="size-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Не менее 8 знаков"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5"
                >
                  Повтор нового пароля <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                    <Lock className="size-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    className={inputClass}
                  />
                </div>
              </div>

              {needsConsent && (
                <label className="flex items-start gap-2.5 text-xs text-[#1a4d3e]/80 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 size-4 accent-[#1a4d3e] cursor-pointer"
                  />
                  <span>Я даю согласие на обработку моих персональных данных для участия в конференции.</span>
                </label>
              )}

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold text-sm shadow-md shadow-[#1a4d3e]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 text-[#d4a84b]" />
                    <span>Сохранить новый пароль</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-[#1a4d3e]/50">
        © 2026 Conf-Hub / COMTEHNO — Научно-практическая конференция
      </footer>
    </div>
  );
}

export const changePasswordPageRoute = { element: <ChangePasswordPage /> };
