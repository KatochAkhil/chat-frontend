import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName: string;
}

export function IconButton({ className, iconClassName, ...props }: IconButtonProps) {
  return (
    <button {...props} className={cn(className)}>
      <i className={iconClassName} />
    </button>
  );
}
