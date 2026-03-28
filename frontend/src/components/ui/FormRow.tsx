import type { ReactNode } from "react";

type FormRowProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

export function FormRow({ children, columns = 2 }: FormRowProps) {
  return (
    <div
      className={`wowui-form-row wowui-form-row--${columns}`}
    >
      {children}
    </div>
  );
}