import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <p className="font-display text-2xl text-mist-50">{title}</p>
      {description && <p className="max-w-sm text-sm text-mist-400">{description}</p>}
      {action}
    </div>
  );
}
