import type { ReactNode } from "react";

type Props = {
  step: number;
  title: string;
  hint?: string;
  active: boolean;
  done: boolean;
  children: ReactNode;
};

export function StepCard({ step, title, hint, active, done, children }: Props) {
  return (
    <section
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        active || done
          ? "border-primary/40 bg-surface-raised/60"
          : "border-border bg-surface/40 opacity-80"
      }`}
      aria-labelledby={`step-${step}-title`}
    >
      <header className="mb-3 flex items-center gap-3">
        <span
          className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
            done
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground"
          }`}
          aria-hidden="true"
        >
          {step}
        </span>
        <div>
          <h2 id={`step-${step}-title`} className="text-sm font-semibold tracking-wide uppercase">
            {title}
          </h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}