"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { AppContextProvider } from "@/context/app-context";
import type { ChatSummary, Message, SuggestedReply, User } from "@/types";

interface AppProvidersProps {
  children: ReactNode;
  initialUser?: User | null;
  initialMessages?: Message[];
  initialSuggestedReplies?: SuggestedReply[];
  initialSummary?: ChatSummary | null;
}

export function AppProviders({
  children,
  initialMessages,
  initialSuggestedReplies,
  initialSummary,
  initialUser
}: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppContextProvider
        initialUser={initialUser}
        initialMessages={initialMessages}
        initialSuggestedReplies={initialSuggestedReplies}
        initialSummary={initialSummary}
      >
        {children}
      </AppContextProvider>
    </QueryClientProvider>
  );
}
