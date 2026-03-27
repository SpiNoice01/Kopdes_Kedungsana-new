"use client";

import { ReactNode, useState } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export function SectionCard({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        {title ? (
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
        ) : null}
        {collapsible ? (
          <button
            type="button"
            onClick={() => setIsCollapsed((previous) => !previous)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600"
          >
            {isCollapsed ? "Show more" : "Show less"}
          </button>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
      {!isCollapsed ? (
        <div className={title || description ? "mt-4" : ""}>{children}</div>
      ) : null}
    </section>
  );
}
