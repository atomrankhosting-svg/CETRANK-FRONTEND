import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function AppLogo({
  className,
  imageClassName,
  textClassName,
  showText = true,
}: AppLogoProps) {
  return (
    <Link
      to="/list-generator"
      className={cn(
        "flex items-center gap-3 rounded-2xl transition-transform duration-300 hover:scale-[1.01]",
        className,
      )}
      aria-label="CETRANK home"
    >
      <img
        src="/Logo.png"
        alt="CETRANK logo"
        className={cn(
          "h-11 w-11 rounded-2xl object-contain shadow-[0_12px_30px_rgba(38,140,226,0.18)]",
          imageClassName,
        )}
      />
      {showText ? (
        <span className={cn("flex items-baseline text-xl leading-none", textClassName)}>
          <span className="text-inherit font-semibold uppercase text-primary/70">
            CET
          </span>
          <span className="text-inherit font-black tracking-tight text-foreground">
            RANK
          </span>
        </span>
      ) : null}
    </Link>
  );
}
