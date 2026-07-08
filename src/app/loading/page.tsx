import Link from "next/link";
import { GlobalFooter } from "@/components/layout/global-footer";

export default function LoadingStatePage() {
  return (
    <>
      <section className="min-h-screen w-full bg-surface dark:bg-slate-950">
        <div className="flex h-screen w-full overflow-hidden">
          <aside className="hidden w-72 shrink-0 flex-col space-y-4 border-r border-slate-200/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
            <div className="flex items-center gap-3">
              <div className="skeleton h-9 w-9 rounded-xl" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="skeleton mt-4 h-14 rounded-xl" />
            <div className="mt-4 space-y-2.5">
              <div className="skeleton h-9 rounded-xl" />
              <div className="skeleton h-9 rounded-xl" />
              <div className="skeleton h-9 rounded-xl" />
              <div className="skeleton h-9 rounded-xl" />
            </div>
          </aside>
          <div className="flex flex-1 flex-col">
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 px-6 dark:border-slate-800">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="skeleton h-4 w-40 rounded" />
            </div>
            <div className="flex-1 space-y-6 p-8">
              <div className="flex gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="max-w-md flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-14 rounded-2xl" />
                </div>
              </div>
              <div className="flex flex-row-reverse gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="flex w-full max-w-md flex-col items-end space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-10 w-3/4 rounded-2xl" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="max-w-md flex-1 space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-20 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Link href="/chat" className="fixed bottom-6 right-6 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Skip to dashboard →
        </Link>
      </section>
      <GlobalFooter />
    </>
  );
}
