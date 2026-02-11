export default async function initNotifications() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}
