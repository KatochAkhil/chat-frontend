import { GlobalFooter } from "@/components/layout/global-footer";
import { StateScreen } from "@/components/layout/state-screen";

export default function EmptyPage() {
  return (
    <>
      <StateScreen
        iconClassName="fa-solid fa-robot text-6xl grad-text"
        title="Start your first conversation"
        description="Bring your team and your AI assistant into one place — messages, files and summaries all in sync."
        actionHref="/chat"
        actionLabel="New Chat"
        actionIconClassName="fa-solid fa-plus"
      />
      <GlobalFooter />
    </>
  );
}
