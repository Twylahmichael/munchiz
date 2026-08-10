import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  toggleClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", toggleClassName = "", ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          type={visible ? "text" : "password"}
          className={`${className} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
          className={`absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors ${toggleClassName}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
