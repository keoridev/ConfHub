import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCurrentUserQuery, useLoginMutation, useRegisterMutation } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import {
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  User as UserIcon,
  Lock,
  UserPlus,
  Mail,
  UserCheck,
  School,
} from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const tabParam = searchParams.get("tab");

  const [authTab, setAuthTab] = useState<"login" | "register">(
    tabParam === "register" ? "register" : "login"
  );
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration state
  const [regFullName, setRegFullName] = useState("");
  const [regUniversity, setRegUniversity] = useState("");
  const [regGroup, setRegGroup] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);

  useEffect(() => {
    if (tabParam === "register" || tabParam === "login") {
      setAuthTab(tabParam);
    }
  }, [tabParam]);

  const { data: currentUser } = useCurrentUserQuery();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  // If already logged in, redirect to the appropriate page
  useEffect(() => {
    if (currentUser) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (currentUser.role === "admin") {
        navigate(pathKeys.admin, { replace: true });
      } else if (currentUser.role === "jury") {
        navigate(pathKeys.jury, { replace: true });
      } else {
        navigate(pathKeys.submission, { replace: true });
      }
    }
  }, [currentUser, navigate, redirectUrl]);


  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const data = await loginMutation.mutateAsync({ login, password });
      toast.success(
        `Добро пожаловать, ${data.user.fullName || data.user.login}!`
      );

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regFullName.trim()) {
      const msg = "Пожалуйста, введите ваше ФИО";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!regLogin.trim()) {
      const msg = "Пожалуйста, укажите желаемый логин";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (regPassword.length < 6) {
      const msg = "Пароль должен содержать не менее 6 символов";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      const msg = "Пароли не совпадают";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      const data = await registerMutation.mutateAsync({
        fullName: regFullName.trim(),
        login: regLogin.trim(),
        password: regPassword,
        university: regUniversity.trim() || undefined,
        groupName: regGroup.trim() || undefined,
        email: regEmail.trim() || undefined,
      });

      toast.success(
        `Регистрация успешна! Добро пожаловать, ${data.user.fullName || data.user.login}!`
      );

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate(pathKeys.submission);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message ||
        "Ошибка при регистрации. Возможно, логин уже занят.";
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
          {/* Auth Mode Tabs Switcher */}
          <div className="flex justify-center w-full px-2">
            <div className="grid grid-cols-2 w-full max-w-md p-1 sm:p-1.5 rounded-2xl bg-white border border-[#1a4d3e]/15 shadow-xs gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                  authTab === "login"
                    ? "bg-[#1a4d3e] text-white shadow-xs"
                    : "text-[#1a4d3e]/70 hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                }`}
              >
                <LogIn className="size-3.5 sm:size-4 shrink-0" />
                <span className="truncate">Вход в систему</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setErrorMessage(null);
                }}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
                  authTab === "register"
                    ? "bg-[#1a4d3e] text-white shadow-xs"
                    : "text-[#1a4d3e]/70 hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                }`}
              >
                <UserPlus className="size-3.5 sm:size-4 shrink-0" />
                <span className="truncate">Регистрация</span>
              </button>
            </div>
          </div>

          {/* Header Title */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3 px-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#1a4d3e]/10 text-[#1a4d3e] border border-[#1a4d3e]/15">
              <Sparkles className="size-3 text-[#d4a84b]" />
              {authTab === "login" ? "Авторизация в системе" : "Новый участник конференции"}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1a4d3e] leading-tight">
              {authTab === "login" ? "Вход в личный кабинет" : "Регистрация докладчика"}
            </h1>
            <p className="text-sm sm:text-base text-[#1a4d3e]/80 leading-relaxed">
              {authTab === "login"
                ? "Введите логин и пароль вашей учётной записи для доступа к системе."
                : "Создайте студенческий аккаунт для подачи тезисов, загрузки докладов и AI-экспресс-проверки."}
            </p>
          </div>

          {errorMessage && (
            <div className="max-w-xl mx-auto p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3">
              <div className="size-2 rounded-full bg-danger mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authTab === "register" ? (
            /* REGISTRATION CARD */
            <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-[#1a4d3e]/15 p-6 sm:p-8 shadow-lg shadow-[#1a4d3e]/5 animate-in fade-in duration-200">
              <form onSubmit={handleRegisterSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      ФИО докладчика (полностью) <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <UserIcon className="size-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Например: Болотбек Атай"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      Учебное заведение / ВУЗ / Школа
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <School className="size-4" />
                      </div>
                      <input
                        type="text"
                        value={regUniversity}
                        onChange={(e) => setRegUniversity(e.target.value)}
                        placeholder="Например: МУИТ или КГТУ"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      Учебная группа / Класс <span className="text-[10px] lowercase text-muted-foreground font-normal">(опционально)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <GraduationCap className="size-4" />
                      </div>
                      <input
                        type="text"
                        value={regGroup}
                        onChange={(e) => setRegGroup(e.target.value)}
                        placeholder="Например: ИС-22 или 2 курс"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      Желаемый логин <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <UserCheck className="size-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regLogin}
                        onChange={(e) => setRegLogin(e.target.value)}
                        placeholder="Например: krutoi-student"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                    Email для уведомлений
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <Mail className="size-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      Пароль <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <Lock className="size-4" />
                      </div>
                      <input
                        type={regShowPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Не менее 6 знаков"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e] cursor-pointer"
                      >
                        {regShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                      Повтор пароля <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                        <Lock className="size-4" />
                      </div>
                      <input
                        type={regShowPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Повторите пароль"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold text-sm shadow-md shadow-[#1a4d3e]/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {registerMutation.isPending ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Создание аккаунта...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4 text-[#d4a84b]" />
                      <span>Зарегистрироваться и войти</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthTab("login")}
                    className="text-xs font-semibold text-[#1a4d3e]/70 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                  >
                    Уже зарегистрированы? <span className="underline font-bold">Войти в систему</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* SECURE PRODUCTION LOGIN CARD */
            <div className="max-w-md mx-auto bg-white rounded-3xl border-2 border-[#1a4d3e]/15 p-6 sm:p-8 shadow-lg shadow-[#1a4d3e]/5 animate-in fade-in duration-200">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="manual-login"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5"
                  >
                    Логин <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <UserIcon className="size-4" />
                    </div>
                    <input
                      id="manual-login"
                      type="text"
                      required
                      autoComplete="username"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Введите ваш логин"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="manual-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5"
                  >
                    Пароль <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <Lock className="size-4" />
                    </div>
                    <input
                      id="manual-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold text-sm shadow-md shadow-[#1a4d3e]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Вход...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4 text-[#d4a84b]" />
                      <span>Войти в систему</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("register");
                      setErrorMessage(null);
                    }}
                    className="text-xs font-semibold text-[#1a4d3e]/70 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                  >
                    Нет аккаунта? <span className="underline font-bold">Зарегистрироваться как докладчик</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-[#1a4d3e]/50">
        © 2026 Conf-Hub / COMTEHNO — Научно-практическая конференция
      </footer>
    </div>
  );
}

export const loginPageRoute = { element: <LoginPage /> };
