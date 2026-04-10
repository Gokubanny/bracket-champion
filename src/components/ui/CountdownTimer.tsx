import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      };
    };

    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.expired) return null;

  const blocks = [
    { label: "D", value: timeLeft.days },
    { label: "H", value: timeLeft.hours },
    { label: "M", value: timeLeft.minutes },
    { label: "S", value: timeLeft.seconds },
  ];

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground mr-1">Starts in</span>
        {blocks.map((b) => (
          <div key={b.label} className="flex items-baseline gap-0.5">
            <span className="text-sm font-bold font-mono text-foreground">{String(b.value).padStart(2, "0")}</span>
            <span className="text-[10px] text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
