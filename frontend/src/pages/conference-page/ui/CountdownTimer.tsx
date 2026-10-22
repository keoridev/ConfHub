import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate?: string; // default to 2026-11-10T09:00:00+06:00
}

export function CountdownTimer({
  targetDate = "2026-11-10T09:00:00+06:00",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isStarted: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: false,
  });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isStarted: true,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isStarted: false });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.isStarted) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-xs">
        <span className="size-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span>Конференция началась! Идут заседания секций</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 select-none shrink-0">
      <div className="bg-white/10 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl border border-white/15 text-center min-w-[36px] sm:min-w-[42px]">
        <span className="font-mono font-black text-xs sm:text-base text-white block leading-tight">
          {timeLeft.days}
        </span>
        <span className="text-[9px] text-white/60 font-semibold uppercase block">
          дн
        </span>
      </div>
      <span className="text-white/40 font-bold text-xs sm:text-sm">:</span>
      <div className="bg-white/10 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl border border-white/15 text-center min-w-[36px] sm:min-w-[42px]">
        <span className="font-mono font-black text-xs sm:text-base text-white block leading-tight">
          {String(timeLeft.hours).padStart(2, "0")}
        </span>
        <span className="text-[9px] text-white/60 font-semibold uppercase block">
          час
        </span>
      </div>
      <span className="text-white/40 font-bold text-xs sm:text-sm">:</span>
      <div className="bg-white/10 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl border border-white/15 text-center min-w-[36px] sm:min-w-[42px]">
        <span className="font-mono font-black text-xs sm:text-base text-white block leading-tight">
          {String(timeLeft.minutes).padStart(2, "0")}
        </span>
        <span className="text-[9px] text-white/60 font-semibold uppercase block">
          мин
        </span>
      </div>
      <span className="text-white/40 font-bold text-xs sm:text-sm">:</span>
      <div className="bg-white/10 backdrop-blur-md px-2 sm:px-2.5 py-1 rounded-xl border border-[#d4a84b]/40 text-center min-w-[36px] sm:min-w-[42px]">
        <span className="font-mono font-black text-xs sm:text-base text-[#e6c16c] block leading-tight">
          {String(timeLeft.seconds).padStart(2, "0")}
        </span>
        <span className="text-[9px] text-[#e6c16c] font-semibold uppercase block">
          сек
        </span>
      </div>
    </div>
  );
}
