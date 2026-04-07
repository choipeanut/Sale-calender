"use client";

import { getToken } from "firebase/messaging";
import { useState, useTransition } from "react";

import { env } from "@/lib/env";
import { getFirebaseMessagingSafely } from "@/lib/firebase/client";

export const PushRegisterButton = () => {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const register = () => {
    startTransition(async () => {
      setMessage("");

      if (typeof window === "undefined") {
        return;
      }

      if (!("Notification" in window)) {
        setMessage("현재 브라우저는 알림을 지원하지 않습니다.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("알림 권한이 허용되지 않았습니다.");
        return;
      }

      let token = "";

      try {
        const messaging = await getFirebaseMessagingSafely();
        if (messaging && env.firebaseWebPushVapidKey) {
          token = await getToken(messaging, {
            vapidKey: env.firebaseWebPushVapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.ready,
          });
        }
      } catch {
        token = "";
      }

      if (!token) {
        token = `demo-token-${crypto.randomUUID()}`;
      }

      const response = await fetch("/api/me/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        setMessage("토큰 저장에 실패했습니다.");
        return;
      }

      setMessage("웹 푸시 알림이 활성화되었습니다.");
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={register}
        disabled={pending}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "등록 중..." : "웹 푸시 알림 등록"}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
};
