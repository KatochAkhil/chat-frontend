"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { demoMessages, demoSuggestedReplies, demoSummary } from "@/lib/constants";
import { apiClient } from "@/services/api-client";
import type { ChatSummary, Message, OnlineUser, SuggestedReply, User } from "@/types";

type PaymentModalVariant = "success" | "upsell";

interface AppContextValue {
  user: User | null;
  messages: Message[];
  suggestedReplies: SuggestedReply[];
  summary: ChatSummary;
  onlineUsers: OnlineUser[];
  typingUsers: string[];
  isDark: boolean;
  isAiPanelOpen: boolean;
  isPaymentModalOpen: boolean;
  paymentModalVariant: PaymentModalVariant;
  setUser: Dispatch<SetStateAction<User | null>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setSuggestedReplies: Dispatch<SetStateAction<SuggestedReply[]>>;
  setSummary: Dispatch<SetStateAction<ChatSummary>>;
  setOnlineUsers: Dispatch<SetStateAction<OnlineUser[]>>;
  setTypingUsers: Dispatch<SetStateAction<string[]>>;
  toggleDarkMode: () => void;
  toggleAiPanel: () => void;
  openPaymentModal: (variant?: PaymentModalVariant) => void;
  closePaymentModal: () => void;
  startPremiumCheckout: () => Promise<void>;
  loginWithGoogle: (payload: { credential?: string; accessToken?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppContextProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialMessages?: Message[];
  initialSuggestedReplies?: SuggestedReply[];
  initialSummary?: ChatSummary | null;
}

export function AppContextProvider({
  children,
  initialMessages,
  initialSuggestedReplies,
  initialSummary,
  initialUser
}: AppContextProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? demoMessages);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>(initialSuggestedReplies ?? demoSuggestedReplies);
  const [summary, setSummary] = useState<ChatSummary>(initialSummary ?? demoSummary);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isDark, setIsDark] = useState(true);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalVariant, setPaymentModalVariant] = useState<PaymentModalVariant>("success");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(" -theme");
    const shouldEnableDark = storedTheme ? storedTheme === "dark" : true;
    document.documentElement.classList.toggle("dark", shouldEnableDark);
    setIsDark(shouldEnableDark);
  }, []);

  useEffect(() => {
    if (initialUser !== undefined) {
      return;
    }

    void apiClient
      .request<{ user: User }>("/me")
      .then((response) => setUser(response.user))
      .catch(() => setUser(null));
  }, [initialUser]);

  const toggleDarkMode = () => {
    setIsDark((current) => {
      const nextValue = !current;
      document.documentElement.classList.toggle("dark", nextValue);
      window.localStorage.setItem(" -theme", nextValue ? "dark" : "light");
      return nextValue;
    });
  };

  const loginWithGoogle = async (payload: { credential?: string; accessToken?: string }) => {
    const response = await apiClient.request<{ user: User }>("/auth/google", {
      method: "POST",
      body: payload
    });
    setUser(response.user);
  };

  const logout = async () => {
    await apiClient.request("/auth/logout", { method: "POST" });
    setUser(null);
  };

  const startPremiumCheckout = async () => {
    const response = await apiClient.request<{ order: { id: string; amount: number; currency: string } }>("/payments/create-order", {
      method: "POST"
    });

    const RazorpayConstructor = (window as Window & {
      Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
    }).Razorpay;

    if (!RazorpayConstructor) {
      throw new Error("Razorpay checkout is not available right now.");
    }

    const razorpay = new RazorpayConstructor({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: response.order.amount,
      currency: response.order.currency,
      name: "Ai Chat",
      description: "Premium upgrade",
      order_id: response.order.id,
      prefill: {
        name: user?.name,
        email: user?.email
      },
      theme: {
        color: "#6366F1"
      },
      handler: async (paymentResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyResponse = await apiClient.request<{ user: User }>("/payments/verify", {
          method: "POST",
          body: {
            orderId: paymentResponse.razorpay_order_id,
            paymentId: paymentResponse.razorpay_payment_id,
            signature: paymentResponse.razorpay_signature
          }
        });
        setUser(verifyResponse.user);
        setPaymentModalVariant("success");
        setIsPaymentModalOpen(true);
      }
    });

    razorpay.open();
  };

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      messages,
      suggestedReplies,
      summary,
      onlineUsers,
      typingUsers,
      isDark,
      isAiPanelOpen,
      isPaymentModalOpen,
      paymentModalVariant,
      setUser,
      setMessages,
      setSuggestedReplies,
      setSummary,
      setOnlineUsers,
      setTypingUsers,
      toggleDarkMode,
      toggleAiPanel: () => setIsAiPanelOpen((current) => !current),
      openPaymentModal: (variant = "success") => {
        setPaymentModalVariant(variant);
        setIsPaymentModalOpen(true);
      },
      closePaymentModal: () => setIsPaymentModalOpen(false),
      startPremiumCheckout,
      loginWithGoogle,
      logout
    }),
    [isAiPanelOpen, isDark, isPaymentModalOpen, messages, onlineUsers, paymentModalVariant, suggestedReplies, summary, typingUsers, user]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}
