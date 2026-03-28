import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
};

export function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="wowui-field">
      <span className="wowui-field__label">{label}</span>
      {children}
      {hint ? <small className="wowui-field__hint">{hint}</small> : null}
    </label>
  );
}