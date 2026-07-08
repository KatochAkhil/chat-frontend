import Link from "next/link";

interface StateScreenProps {
  iconClassName: string;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  actionIconClassName: string;
  badge?: string;
  gradient?: string;
}

export function StateScreen({
  actionHref,
  actionIconClassName,
  actionLabel,
  badge,
  description,
  gradient = "from-brand-indigo/20 to-brand-purple/20",
  iconClassName,
  title
}: StateScreenProps) {
  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-surface p-6 dark:bg-slate-950">
      <div className="max-w-sm text-center">
        <div className="relative mx-auto mb-6 h-40 w-40">
          <div className={`absolute inset-0 rounded-full blur-2xl bg-gradient-to-br ${gradient}`} />
          <div className="relative flex h-40 w-40 animate-float items-center justify-center rounded-3xl bg-white shadow-card dark:bg-slate-900">
            <i className={iconClassName} />
            {badge ? <span className="absolute -bottom-2 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white">{badge}</span> : null}
          </div>
        </div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        <Link href={actionHref} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple px-6 py-3 font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]">
          <i className={actionIconClassName} /> {actionLabel}
        </Link>
      </div>
    </section>
  );
}
