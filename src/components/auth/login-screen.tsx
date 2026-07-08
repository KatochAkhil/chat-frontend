"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/app-context";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: () => void;
        };
        oauth2?: {
          initTokenClient: (config: Record<string, unknown>) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

export function LoginScreen() {
  const router = useRouter();
  const { toggleDarkMode, loginWithGoogle } = useAppContext();
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!window.google?.accounts?.oauth2 || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setErrorMessage("Google Sign-In is not available yet. Please verify the client ID configuration.");
      return;
    }

    setErrorMessage("");
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      prompt: "select_account",
      callback: async (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) {
          if (response.error === "popup_closed" || response.error === "access_denied") {
            return;
          }
          setErrorMessage("Google login failed. Please try again.");
          return;
        }

        try {
          await loginWithGoogle({ accessToken: response.access_token });
          router.push("/chat");
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : "Google login failed. Please try again.");
        }
      },
      error_callback: (error: { type?: string }) => {
        if (error.type === "popup_closed" || error.type === "popup_failed_to_open") {
          return;
        }
        setErrorMessage("Google login failed. Please try again.");
      }
    });
    tokenClient.requestAccessToken();
  };

  return (
    <section className="mesh-bg relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6">
      <div className="absolute -left-20 top-1/4 h-72 w-72 animate-float rounded-full bg-brand-indigo/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-96 w-96 animate-float rounded-full bg-brand-purple/30 blur-3xl" style={{ animationDelay: "1.5s" }} />

      <button
        onClick={toggleDarkMode}
        className="glass absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:text-white"
      >
        <i className="fa-solid fa-moon text-sm" />
      </button>

      <div className="glass fade-up relative w-full max-w-md rounded-3xl p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-indigo via-brand-purple to-brand-blue shadow-glow">
              <i className="fa-solid fa-sparkles text-2xl text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome to Ai Chat</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Your real-time workspace for human &amp; AI conversation — synced across every device, in one calm inbox.
          </p>

          <button
            onClick={handleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3.5 font-medium text-slate-800 shadow-lg transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z" />
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.5C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.5 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.5C39.8 37 44 31 44 24c0-1.3-.1-2.7-.4-3.9z" />
            </svg>
            Continue with Google
          </button>

          {errorMessage ? <p className="mt-4 text-xs text-red-300">{errorMessage}</p> : null}

          <p className="mt-6 text-xs leading-relaxed text-slate-400">
            By continuing, you agree to Ai Chat&apos;s <a href="#" className="text-brand-purple hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-brand-purple hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
      <p className="absolute bottom-6 text-xs text-slate-500">v2.4.0 · Ai Chat © 2026</p>
    </section>
  );
}
