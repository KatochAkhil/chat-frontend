import { AppProviders } from "@/components/providers/app-providers";
import { ChatScreen } from "@/components/chat/chat-screen";
import { GlobalFooter } from "@/components/layout/global-footer";
import { getRoomMessages, requireCurrentUser } from "@/lib/server-api";

export default async function ChatPage() {
  const user = await requireCurrentUser();
  const messages = await getRoomMessages("product-design-sync");
  const hydratedMessages = messages.map((message) => ({
    ...message,
    isCurrentUser: message.senderId === user?._id
  }));

  return (
    <AppProviders
      initialUser={user}
      initialMessages={hydratedMessages}
      initialSuggestedReplies={[]}
      initialSummary={{ text: "" }}
    >
      <ChatScreen />
      <GlobalFooter />
    </AppProviders>
  );
}
