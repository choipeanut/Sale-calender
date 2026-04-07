importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { title: "Sale Calendar", body: event.data.text() } };
  }

  const notification = payload.notification || {};

  event.waitUntil(
    self.registration.showNotification(notification.title || "Sale Calendar", {
      body: notification.body || "할인 일정 알림",
      icon: "/icons/icon-192.png",
    }),
  );
});
