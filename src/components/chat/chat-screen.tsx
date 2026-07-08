"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PaymentModal } from "@/components/payment/payment-modal";
import { useAppContext } from "@/context/app-context";
import { formatTime } from "@/lib/utils";
import { ApiError, apiClient } from "@/services/api-client";
import { getSocket } from "@/services/socket-client";
import type { Message, OnlineUser, User } from "@/types";

const QUICK_EMOJIS = ["😀", "😂", "🔥", "👍", "🎉", "🚀", "🤝", "✅"];

export function ChatScreen() {
  const router = useRouter();
  const {
    isAiPanelOpen,
    isDark,
    messages,
    onlineUsers,
    openPaymentModal,
    setMessages,
    setOnlineUsers,
    setSuggestedReplies,
    setSummary,
    setTypingUsers,
    setUser,
    startPremiumCheckout,
    suggestedReplies,
    summary,
    toggleAiPanel,
    toggleDarkMode,
    typingUsers,
    user,
    logout
  } = useAppContext();
  const [draft, setDraft] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isAiSuggestLoading, setIsAiSuggestLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const prevMessagesLength = useRef(messages.length);
  const lastMessageIdRef = useRef<string | undefined>(undefined);
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    if (messages.length > 0 && !nextCursor) {
      if (messages.length >= 20) {
        setNextCursor(messages[0].createdAt);
      }
    }
  }, [messages, nextCursor]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const performScroll = () => {
      const currentLastId = messages[messages.length - 1]?._id;
      const isNewMessageArrival = currentLastId !== lastMessageIdRef.current;

      if (!hasInitialScrolled.current && messages.length > 0) {
        container.scrollTop = container.scrollHeight;
        hasInitialScrolled.current = true;
      } else if (messages.length > prevMessagesLength.current && isNewMessageArrival) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
      prevMessagesLength.current = messages.length;
      lastMessageIdRef.current = currentLastId;
    };

    const timeoutId = setTimeout(performScroll, 50);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const otherTypingUsers = typingUsers.filter((name) => name !== user?.name);

  const uniqueOnlineUsers = Array.from(
    new Map(onlineUsers.map((u) => [u.id, u])).values()
  );

  const getTypingText = () => {
    if (otherTypingUsers.length === 0) return "";
    if (otherTypingUsers.length === 1) return `${otherTypingUsers[0]} is typing…`;
    if (otherTypingUsers.length === 2) return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing…`;
    return `${otherTypingUsers[0]}, ${otherTypingUsers[1]} and ${otherTypingUsers.length - 2} others are typing…`;
  };

  const syncTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    textarea.style.overflowY = textarea.scrollHeight > 128 ? "auto" : "hidden";
  };

  useEffect(() => {
    const socket = getSocket();

    const joinRoom = () => {
      socket.emit("chat:join", "product-design-sync");
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const onMessage = (message: Message) => {
      const normalizedMessage = {
        ...message,
        isCurrentUser: message.senderId === user?._id
      };
      setMessages((current) => (current.some((entry) => entry._id === message._id) ? current : [...current, normalizedMessage]));
    };

    const onPresence = (payload: { users: OnlineUser[] }) => {
      setOnlineUsers(payload.users);
    };

    const onTyping = (payload: { users: string[] }) => {
      setTypingUsers(payload.users);
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:presence", onPresence);
    socket.on("chat:typing", onTyping);
    socket.on("payment:premium-activated", (payload: { user: User }) => {
      setUser(payload.user);
      openPaymentModal("success");
    });

    if (messages.length === 0) {
      void apiClient
        .request<{ messages: Message[]; nextCursor: string | null }>("/messages?roomId=product-design-sync&limit=20")
        .then((response) => {
          if (response.messages.length > 0) {
            setMessages(
              response.messages.map((message) => ({
                ...message,
                isCurrentUser: message.senderId === user?._id
              }))
            );
            setNextCursor(response.nextCursor);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("chat:message", onMessage);
      socket.off("chat:presence", onPresence);
      socket.off("chat:typing", onTyping);
      socket.off("payment:premium-activated");
    };
  }, [messages.length, openPaymentModal, setMessages, setOnlineUsers, setTypingUsers, setUser, user?._id]);

  useEffect(() => {
    syncTextareaHeight();
  }, [draft]);

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    getSocket().emit("chat:typing", {
      roomId: "product-design-sync",
      isTyping: false,
      name: user?.name
    });
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);

    const socket = getSocket();
    socket.emit("chat:typing", {
      roomId: "product-design-sync",
      isTyping: value.trim().length > 0,
      name: user?.name
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1200);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    getSocket().emit("chat:message:send", {
      roomId: "product-design-sync",
      content: draft,
      messageType: "text"
    });
    stopTyping();
    setDraft("");
    setIsEmojiOpen(false);
  };

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container || !nextCursor || isLoadingMore) return;

    if (container.scrollTop < 20) {
      setIsLoadingMore(true);
      const prevScrollHeight = container.scrollHeight;

      try {
        const response = await apiClient.request<{ messages: Message[]; nextCursor: string | null }>(
          `/messages?roomId=product-design-sync&limit=20&before=${encodeURIComponent(nextCursor)}`
        );

        if (response.messages.length > 0) {
          const fetched = response.messages.map((msg) => ({
            ...msg,
            isCurrentUser: msg.senderId === user?._id
          }));

          setMessages((current) => {
            const filtered = fetched.filter((f) => !current.some((c) => c._id === f._id));
            return [...filtered, ...current];
          });
          setNextCursor(response.nextCursor);

          // Restore scroll position
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }, 0);
        } else {
          setNextCursor(null);
        }
      } catch (err) {
        console.error("Failed to load older messages:", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const refreshAiSidebar = async () => {
    const response = await apiClient.request<{ replies: string[]; summary: string }>("/ai/sidebar", {
      method: "POST",
      body: {
        context: messages.map((message) => `${message.senderName}: ${message.content}`).join("\n")
      }
    });

    setSuggestedReplies(response.replies.map((text, index) => ({ id: `${index}`, text: `"${text}"` })));
    setSummary({ text: response.summary });
    return response;
  };

  const handleGenerateSummary = async () => {
    if (!user?.isPremium) {
      openPaymentModal("upsell");
      return;
    }

    setIsSummaryLoading(true);
    try {
      await refreshAiSidebar();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        openPaymentModal("upsell");
      }
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!user?.isPremium) {
      openPaymentModal("upsell");
      return;
    }

    setIsAiSuggestLoading(true);
    try {
      const response = await refreshAiSidebar();
      if (response.replies[0]) {
        setDraft(response.replies[0]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        openPaymentModal("upsell");
      }
    } finally {
      setIsAiSuggestLoading(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    setIsEmojiOpen(false);
    textareaRef.current?.focus();
  };

  const handleUpgrade = async () => {
    try {
      await startPremiumCheckout();
    } catch {
      return;
    }
  };

  return (
    <>
      <section className="min-h-screen w-full bg-surface dark:bg-slate-950">
        <div className="flex h-screen w-full overflow-hidden">
          <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 lg:flex">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo via-brand-purple to-brand-blue shadow-glow">
                <i className="fa-solid fa-sparkles text-sm text-white" />
              </div>
              <span className="font-display text-lg font-bold">
                Nexus <span className="grad-text">AI</span>
              </span>
            </div>

            <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <div className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <div className="relative">
                  <Image src={user?.picture ?? "https://i.pravatar.cc/80?img=32"} alt={user?.name ?? "User"} width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user?.name ?? "User"}</p>
                  {user?.isPremium ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/10">
                      <i className="fa-solid fa-crown" /> PREMIUM
                    </span>
                  ) : null}
                </div>
                <i className="fa-solid fa-chevron-down text-xs text-slate-400" />
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
              <Link href="/chat" className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-indigo/10 to-brand-purple/10 px-3 py-2.5 text-sm font-medium text-brand-indigo dark:text-indigo-300">
                <i className="fa-solid fa-comments w-4" /> Chat
                <span className="ml-auto rounded-full bg-brand-indigo px-1.5 py-0.5 text-[10px] text-white">{messages.length}</span>
              </Link>
              <button onClick={handleUpgrade} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60">
                <i className="fa-solid fa-crown w-4 text-amber-500" /> Premium
              </button>
              <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60">
                <i className="fa-solid fa-gear w-4" /> Settings
              </a>
            </nav>

            <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                onClick={toggleDarkMode}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
              >
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-circle-half-stroke w-4" /> Dark mode
                </span>
                <span className={`relative h-5 w-9 rounded-full transition ${isDark ? "bg-brand-indigo" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${isDark ? "left-4" : "left-0.5"}`} />
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <i className="fa-solid fa-arrow-right-from-bracket w-4" /> Logout
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/70 px-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 lg:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden">
                  <i className="fa-solid fa-bars" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple text-xs font-bold text-white">#</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold"># product-design-sync</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {otherTypingUsers.length > 0 ? getTypingText() : `${uniqueOnlineUsers.length || (user ? 1 : 0)} online`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="mr-2 hidden -space-x-2 md:flex">
                  {uniqueOnlineUsers.slice(0, 4).map((onlineUser) => (
                    <Image key={onlineUser.id} src={onlineUser.picture} alt={onlineUser.name} width={28} height={28} className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  ))}
                  {uniqueOnlineUsers.length > 4 ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold ring-2 ring-white dark:bg-slate-700 dark:ring-slate-900">
                      +{uniqueOnlineUsers.length - 4}
                    </div>
                  ) : null}
                </div>
                <button onClick={toggleAiPanel} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden">
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </button>
                <Image src={user?.picture ?? "https://i.pravatar.cc/80?img=32"} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-900" />
              </div>
            </header>

            <main 
              ref={messagesContainerRef} 
              onScroll={handleScroll}
              className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-6 lg:px-8"
            >
              {isLoadingMore && (
                <div className="flex justify-center py-2 items-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin text-slate-400 text-xs" />
                  <span className="text-xs text-slate-400">Loading older messages...</span>
                </div>
              )}

              <div className="flex justify-center">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-400 dark:bg-slate-800">Today</span>
              </div>

              {messages.map((message) => {
                if (message.isCurrentUser) {
                  return (
                    <div key={message._id} className="fade-up ml-auto flex max-w-2xl flex-row-reverse gap-3">
                      <Image src={message.senderAvatar ?? "https://i.pravatar.cc/80?img=32"} alt={message.senderName} width={36} height={36} className="mt-0.5 h-9 w-9 rounded-full" />
                      <div className="flex items-end flex-col">
                        <div className="flex flex-row-reverse items-baseline gap-2">
                          <span className="text-sm font-semibold">{message.senderName}</span>
                          <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
                        </div>
                        <div className="mt-1 max-w-md rounded-2xl rounded-tr-sm bg-gradient-to-br from-brand-indigo to-brand-purple px-4 py-2.5 text-sm leading-relaxed text-white shadow-glow whitespace-pre-line">
                          {message.content}
                        </div>
                        {message.status ? (
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <i className={`fa-solid ${message.status === "read" ? "fa-check-double text-brand-blue" : "fa-check text-slate-400"}`} />
                            {message.status === "read" ? "Read" : "Sent"} {formatTime(message.createdAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                if (message.isAI) {
                  return (
                    <div key={message._id} className="fade-up flex max-w-2xl gap-3">
                      <div className="relative mt-0.5 h-9 w-9 shrink-0">
                        <div className="ai-ring absolute inset-0" />
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-indigo via-brand-purple to-brand-blue">
                          <i className="fa-solid fa-sparkles text-xs text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">Ai Chat</span>
                          <span className="rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple">ASSISTANT</span>
                          <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
                        </div>
                        <div className="mt-1 rounded-2xl rounded-tl-sm border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-2.5 text-sm leading-relaxed shadow-card dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-purple-500/10">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message._id} className="fade-up flex max-w-2xl gap-3">
                    <Image src={message.senderAvatar ?? "https://i.pravatar.cc/60?img=12"} alt={message.senderName} width={36} height={36} className="mt-0.5 h-9 w-9 rounded-full" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">{message.senderName}</span>
                        <span className="text-[11px] text-slate-400">{formatTime(message.createdAt)}</span>
                      </div>
                      <div className="mt-1 rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm leading-relaxed shadow-card dark:bg-slate-800">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-sm text-center text-slate-400">
                    <p className="font-display text-lg font-semibold text-slate-300">No messages yet</p>
                    <p className="mt-2 text-sm">Start the conversation and AI suggestions and summaries will update from real chat data.</p>
                  </div>
                </div>
              ) : null}
            </main>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/80 p-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 lg:px-8">
              <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-brand-indigo/50 focus-within:ring-2 focus-within:ring-brand-indigo/40 dark:border-slate-700 dark:bg-slate-800">
                <div className="relative">
                  <button type="button" onClick={() => setIsEmojiOpen((current) => !current)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-brand-indigo dark:hover:bg-slate-700">
                    <i className="fa-regular fa-face-smile" />
                  </button>
                  {isEmojiOpen ? (
                    <div className="absolute bottom-12 left-0 z-10 flex w-48 flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  placeholder="Message #product-design-sync…"
                  className="max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-sm placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiSuggestLoading}
                  className="hidden h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand-purple/10 px-3 text-xs font-semibold text-brand-purple transition hover:bg-brand-purple/20 sm:flex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiSuggestLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin" /> Suggesting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles" /> AI Suggest
                    </>
                  )}
                </button>
                <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple text-white shadow-glow transition hover:scale-105 active:scale-95">
                  <i className="fa-solid fa-paper-plane text-sm" />
                </button>
              </form>
              {otherTypingUsers.length > 0 ? (
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="flex gap-1 items-center shrink-0 mr-1">
                    <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  {getTypingText()}
                </p>
              ) : null}
            </div>
          </div>

          <aside
            className={[
              "w-80 shrink-0 flex-col overflow-y-auto border-l border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80",
              isAiPanelOpen ? "fixed inset-y-0 right-0 z-40 flex xl:static" : "hidden xl:flex"
            ].join(" ")}
          >
            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold">
                  <i className="fa-solid fa-wand-magic-sparkles text-brand-purple" /> AI Assistant
                </h3>
                <button onClick={toggleAiPanel} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 xl:hidden">
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Suggested replies</p>
                {suggestedReplies.length > 0 ? (
                  <div className="space-y-2.5">
                    {suggestedReplies.map((reply) => (
                      <div key={reply.id} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{reply.text}</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => navigator.clipboard.writeText(reply.text)} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-indigo">
                            <i className="fa-regular fa-copy" /> Copy
                          </button>
                          <button onClick={() => setDraft(reply.text.replace(/^"|"$/g, ""))} className="flex items-center gap-1 text-[11px] font-medium text-brand-indigo hover:underline">
                            <i className="fa-solid fa-arrow-turn-up rotate-90" /> Use
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Generate AI suggestions from the current conversation.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-purple-500/10">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                  <i className="fa-solid fa-file-lines text-brand-indigo" /> Chat summary
                </p>
                <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {summary.text || "Generate a fresh Gemini summary from the live chat conversation."}
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummaryLoading}
                  className="w-full rounded-lg bg-gradient-to-r from-brand-indigo to-brand-purple py-2 text-xs font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSummaryLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin mr-1" /> Generating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-arrows-rotate mr-1" /> Generate new summary
                    </>
                  )}
                </button>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 dark:bg-black">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl" />
                <span className="mb-3 inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-400">
                  <i className="fa-solid fa-crown" /> PREMIUM
                </span>
                <ul className="mb-4 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-200">
                    <i className="fa-solid fa-circle-check text-emerald-400" /> Unlimited AI messages
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-200">
                    <i className="fa-solid fa-circle-check text-emerald-400" /> Instant chat summaries
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-200">
                    <i className="fa-solid fa-circle-check text-emerald-400" /> Priority support
                  </li>
                </ul>
                {user?.isPremium ? (
                  <div className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 py-2.5 text-xs font-semibold text-emerald-400">
                    <i className="fa-solid fa-circle-check text-emerald-400" /> Premium Active
                  </div>
                ) : (
                  <button onClick={handleUpgrade} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 py-2.5 text-xs font-semibold text-slate-900 transition hover:opacity-90">
                    <i className="fa-solid fa-bolt" /> Upgrade via Razorpay — ₹299/mo
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
      <PaymentModal />
    </>
  );
}
