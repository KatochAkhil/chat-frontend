export function GlobalFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t border-slate-200/70 bg-white/70 px-4 py-1.5 text-[11px] text-slate-400 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
      <span>Ai Chat v2.4.0</span>
      <div className="flex items-center gap-4">
        <a href="#" className="transition hover:text-brand-indigo">
          Privacy
        </a>
        <a href="#" className="transition hover:text-brand-indigo">
          Terms
        </a>
        <a href="#" className="transition hover:text-brand-indigo">
          <i className="fa-brands fa-github" /> GitHub
        </a>
      </div>
    </footer>
  );
}
