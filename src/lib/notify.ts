const NOTIFY_URL = "https://klagon-notify.gideonabochie.workers.dev/api/notify";

export type NotifyType = "pledge" | "contact" | "sponsor" | "mentor";

export async function notifyTeam(
  type: NotifyType,
  fields: Record<string, string>
): Promise<void> {
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fields }),
    });
  } catch {
    // Fire-and-forget: never block the user's success screen on a notification.
  }
}