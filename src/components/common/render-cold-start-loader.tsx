"use client";

import { useEffect, useState } from "react";

export function RenderColdStartLoader() {
  const [isReady, setIsReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Connecting to server...");

  const getHealthUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    return apiUrl.replace(/\/api\/?$/, "") + "/health";
  };

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;
    let delayTimeout: NodeJS.Timeout;
    let isMounted = true;

    const startHealthCheck = async () => {
      const healthUrl = getHealthUrl();
      const startTime = Date.now();

      // Start elapsed timer
      timerInterval = setInterval(() => {
        setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      }, 1000);

      // We wait 600ms before showing the loader UI.
      // If the server responds quickly (already active), the user experiences no flash or delay.
      delayTimeout = setTimeout(() => {
        if (isMounted && !isReady) {
          setShouldRender(true);
        }
      }, 600);

      const checkHealth = async (): Promise<boolean> => {
        try {
          const res = await fetch(healthUrl, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data.ok === true) {
              return true;
            }
          }
        } catch (error) {
          // Server is likely sleeping or unreachable
        }
        return false;
      };

      // Initial check
      const active = await checkHealth();
      if (active) {
        if (isMounted) {
          setIsReady(true);
          setShouldRender(false);
          clearInterval(timerInterval);
        }
        return;
      }

      // Update message when we confirm a cold start is in progress
      setStatusMessage("Waking up server (Render Cold Start)...");

      // Poll every 3 seconds until active
      checkInterval = setInterval(async () => {
        const isUp = await checkHealth();
        if (isUp && isMounted) {
          setIsReady(true);
          setStatusMessage("Connection established! Launching app...");
          clearInterval(checkInterval);
          clearInterval(timerInterval);
          
          // Smoothly hide loader after 1 second of showing success status
          setTimeout(() => {
            if (isMounted) {
              setShouldRender(false);
            }
          }, 1000);
        }
      }, 3000);
    };

    startHealthCheck();

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      clearInterval(timerInterval);
      clearTimeout(delayTimeout);
    };
  }, [isReady]);

  // Adjust status message based on elapsed time to keep the user engaged
  useEffect(() => {
    if (elapsedSeconds > 35) {
      setStatusMessage("Almost there! Setting up environment...");
    } else if (elapsedSeconds > 20) {
      setStatusMessage("Loading modules and initializing database...");
    } else if (elapsedSeconds > 8) {
      setStatusMessage("Waking up server instance (this can take 30-50 seconds)...");
    }
  }, [elapsedSeconds]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none font-body transition-opacity duration-500">
      {/* Background Mesh Gradient (matching globals.css class) */}
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

      {/* Main Card with Glassmorphism */}
      <div className="relative max-w-md w-full glass rounded-3xl p-8 shadow-2xl flex flex-col items-center border border-slate-800/50 backdrop-blur-xl">
        
        {/* Glow indicator */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />

        {/* Animated Loader Sphere */}
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          
          {/* Inner spin gradient ring */}
          <div className={`w-16 h-16 rounded-full border-4 border-slate-800 border-t-indigo-500 border-r-violet-500 animate-spin ${isReady ? "border-t-emerald-500 border-r-emerald-500" : ""}`} />
          
          {/* Center icon */}
          <div className="absolute">
            {isReady ? (
              <i className="fa-solid fa-check text-2xl text-emerald-400 animate-bounce" />
            ) : (
              <i className="fa-solid fa-server text-xl text-indigo-400" />
            )}
          </div>
        </div>

        {/* Header Title with Gradient */}
        <h2 className="text-2xl font-bold font-display tracking-tight text-white mb-2">
          {isReady ? (
            <span className="text-emerald-400">Ready to Go!</span>
          ) : (
            <span className="grad-text font-extrabold">Nexus AI Chat</span>
          )}
        </h2>

        {/* Running Elapsed Counter */}
        {!isReady && (
          <div className="text-xs font-mono px-3 py-1 bg-slate-900/80 text-indigo-300 rounded-full border border-indigo-500/10 mb-6 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Waiting: {elapsedSeconds}s
          </div>
        )}

        {/* Status Message */}
        <p className="text-sm font-medium text-slate-200 mb-4 transition-all duration-300">
          {statusMessage}
        </p>

        {/* Explanatory Description */}
        {!isReady && (
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            Our backend services are hosted on Render free tier. After periods of inactivity, the instance spins down and requires up to 50 seconds to complete a cold start. We appreciate your patience!
          </p>
        )}
      </div>
    </div>
  );
}
