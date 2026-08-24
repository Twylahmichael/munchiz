import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

/**
 * Shared "− qty +" stepper. Matches the pattern originally used in
 * CartDrawer's line-item quantity controls — reused here so quantity
 * controls look and behave the same everywhere in the app.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  ariaLabel,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-current"
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="text-sm font-bold w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-current"
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
