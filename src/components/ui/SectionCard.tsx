import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
}: SectionCardProps) {
  return (
    <section
      className={`rounded-xl border border-[#DFE6DD] bg-white ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EDF2EB] px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-[#202923]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#78847D]">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </section>
  );
}
