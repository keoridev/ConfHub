import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useLoginMutation } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import {
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Scale,
  Shield,
  User as UserIcon,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const loginMutation = useLoginMutation();

  const handleQuickFill = (quickLogin: string, quickPass: string) => {
    setLogin(quickLogin);
    setPassword(quickPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const data = await loginMutation.mutateAsync({ login, password });
      toast.success(`Добро пожаловать, ${data.user.fullName || data.user.login}!`);

      if (data.user.mustChangePassword) {
        navigate(pathKeys.changePassword);
      } else if (redirectUrl) {
        navigate(redirectUrl);
      } else if (data.user.role === "admin") {
        navigate(pathKeys.admin);
      } else if (data.user.role === "jury") {
        navigate(pathKeys.jury);
      } else {
        navigate(pathKeys.submission);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        "Неверный логин или пароль. Пожалуйста, проверьте данные.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#1a4d3e] flex flex-col justify-between selection:bg-[#d4a84b]/30">
      <header className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between gap-3">
        <Link
          to={pathKeys.conference.build("demo")}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-[#1a4d3e]/80 hover:text-[#1a4d3e] transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">К расписанию конференции</span>
          <span className="sm:hidden">Назад</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <img src="/logo.jpg" alt="Logo" className="size-6 sm:size-7 rounded-lg object-cover border border-[#1a4d3e]/15" />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-[#1a4d3e]">Conf-Hub 2026</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl grid md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-5 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#1a4d3e]/10 text-[#1a4d3e] border border-[#1a4d3e]/15 mb-4">
                <Sparkles className="size-3 text-[#d4a84b]" />
                Конференция COMTEHNO
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1a4d3e] leading-tight">
                Вход в систему управления докладами
              </h1>
              <p className="mt-3 text-sm text-[#1a4d3e]/80 leading-relaxed">
                Авторизуйтесь, чтобы подать заявку на выступление, отправить работу в формате Word (DOCX) или PDF и получить автоматические рекомендации AI.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 border border-[#1a4d3e]/15 shadow-xs space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/70">
                Тестовые аккаунты для проверки:
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("student1", "student123")}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#1a4d3e]/15 bg-[#f5f3ed]/60 hover:bg-[#1a4d3e] hover:text-white group transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="size-4 text-[#1a4d3e] group-hover:text-[#d4a84b] transition-colors" />
                    <div>
                      <div className="text-xs font-bold">Студент (student1)</div>
                      <div className="text-[10px] text-muted-foreground group-hover:text-white/80">Подача докладов и AI</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#1a4d3e]/60 group-hover:text-white/80">student123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("jury1", "jury123")}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#1a4d3e]/15 bg-[#f5f3ed]/60 hover:bg-[#1a4d3e] hover:text-white group transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Scale className="size-4 text-[#1a4d3e] group-hover:text-[#d4a84b] transition-colors" />
                    <div>
                      <div className="text-xs font-bold">Жюри (jury1)</div>
                      <div className="text-[10px] text-muted-foreground group-hover:text-white/80">Оценивание докладов</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#1a4d3e]/60 group-hover:text-white/80">jury123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("admin", "Admin123!")}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#1a4d3e]/15 bg-[#f5f3ed]/60 hover:bg-[#1a4d3e] hover:text-white group transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="size-4 text-[#1a4d3e] group-hover:text-[#d4a84b] transition-colors" />
                    <div>
                      <div className="text-xs font-bold">Администратор (admin)</div>
                      <div className="text-[10px] text-muted-foreground group-hover:text-white/80">Панель управления</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#1a4d3e]/60 group-hover:text-white/80">Admin123!</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="bg-white rounded-3xl border border-[#1a4d3e]/15 shadow-lg shadow-[#1a4d3e]/5 p-7 sm:p-10">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1a4d3e] tracking-tight">
                  Авторизация
                </h2>
                <p className="text-sm text-[#1a4d3e]/70 mt-1">
                  Введите ваши логин и пароль для входа в кабинет
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
                  <div className="size-2 rounded-full bg-danger mt-1.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="login"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]"
                    >
                      Логин
                    </label>
                    {login && (
                      <button
                        type="button"
                        onClick={() => setLogin("")}
                        className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                      <UserIcon className="size-4" />
                    </div>
                    <input
                      id="login"
                      type="text"
                      required
                      autoComplete="username"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Например, student1"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/35 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                    />
                    {login && (
                      <button
                        type="button"
                        onClick={() => setLogin("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors"
                        title="Очистить поле"
                      >
                        <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]"
                    >
                      Пароль
                    </label>
                    {password && (
                      <button
                        type="button"
                        onClick={() => setPassword("")}
                        className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                      <Lock className="size-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/35 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                      title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#1a4d3e]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Проверка данных...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4 text-[#d4a84b]" />
                      <span>Войти в систему</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#1a4d3e]/10 text-center">
                <p className="text-xs text-[#1a4d3e]/60">
                  Учётные записи создаются оргкомитетом. Если у вас нет доступа, обратитесь к организаторам конференции.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-[#1a4d3e]/50">
        © 2026 Conf-Hub / COMTEHNO — Научно-практическая конференция
      </footer>
    </div>
  );
}

export const loginPageRoute = { element: <LoginPage /> };
