"use client";

import { useState } from "react";
import { useAppContext } from "@/context/app-context";

export function PaymentModal() {
  const { closePaymentModal, isPaymentModalOpen, paymentModalVariant, startPremiumCheckout } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsSubmitting(true);
      await startPremiumCheckout();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpsell = paymentModalVariant === "upsell";

  return (
    <div
      className={[
        "fixed inset-0 z-50 items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm",
        isPaymentModalOpen ? "flex" : "hidden"
      ].join(" ")}
    >
      <div className="glass fade-up w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
        <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${isUpsell ? "bg-amber-100 dark:bg-amber-500/10" : "bg-emerald-100 dark:bg-emerald-500/10"}`}>
          <div className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${isUpsell ? "bg-amber-500" : "bg-emerald-500"}`}>
            <i className={`fa-solid ${isUpsell ? "fa-crown" : "fa-check"} text-2xl text-white`} />
          </div>
        </div>
        <h3 className="font-display text-xl font-bold">{isUpsell ? "Unlock Premium AI" : "Payment Successful"}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isUpsell ? "Suggested replies and smart summaries are premium features. Upgrade once and continue with Razorpay test checkout." : "₹299 charged via Razorpay."}
        </p>
        <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isUpsell ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"}`}>
          <i className="fa-solid fa-crown" /> {isUpsell ? "Premium Required" : "Premium Activated"}
        </div>
        {isUpsell ? (
          <>
            <ul className="mt-5 space-y-2 text-left">
              <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-circle-check text-emerald-400" /> AI summaries powered by Gemini
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-circle-check text-emerald-400" /> Suggested replies for faster responses
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <i className="fa-solid fa-circle-check text-emerald-400" /> Instant unlock after successful payment
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={isSubmitting}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple py-3 font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Opening Razorpay..." : "Upgrade with Razorpay"}
            </button>
            <button
              onClick={closePaymentModal}
              className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Maybe later
            </button>
          </>
        ) : (
          <button
            onClick={closePaymentModal}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-indigo to-brand-purple py-3 font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
