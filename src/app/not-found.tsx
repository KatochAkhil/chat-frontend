import { GlobalFooter } from "@/components/layout/global-footer";
import { StateScreen } from "@/components/layout/state-screen";

export default function NotFound() {
  return (
    <>
      <StateScreen
        iconClassName="fa-solid fa-robot text-6xl text-slate-300 dark:text-slate-600"
        badge="404"
        title="This conversation wandered off"
        description="The page you're looking for doesn't exist or may have been moved."
        actionHref="/chat"
        actionLabel="Go Home"
        actionIconClassName="fa-solid fa-house"
        gradient="from-red-400/20 to-brand-purple/20"
      />
      <GlobalFooter />
    </>
  );
}
