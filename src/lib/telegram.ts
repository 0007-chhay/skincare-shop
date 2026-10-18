// ផ្ញើសារទៅក្រុម Telegram តាមរយៈ bot (ដំណើរការតែលើ server)
// ត្រឡប់ message_id ពេលផ្ញើបាន ឬ null ពេលបរាជ័យ

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function replyParams(replyTo?: number | null) {
  return replyTo ? JSON.stringify({ message_id: replyTo, allow_sending_without_reply: true }) : undefined;
}

export async function sendTelegram(
  chatId: string | undefined,
  html: string,
  botToken?: string,
  replyTo?: number | null,
): Promise<number | null> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    console.warn("Telegram: ខ្វះ TELEGRAM_BOT_TOKEN ឬ chat id — មិនបានផ្ញើសារទេ");
    return null;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_parameters: replyTo ? { message_id: replyTo, allow_sending_without_reply: true } : undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.error("Telegram error:", res.status, JSON.stringify(data));
      return null;
    }
    return data.result?.message_id ?? null;
  } catch (err) {
    console.error("Telegram error:", err);
    return null;
  }
}

export async function sendTelegramPhoto(
  chatId: string | undefined,
  photo: Blob,
  captionHtml: string,
  botToken?: string,
  replyTo?: number | null,
): Promise<number | null> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    console.warn("Telegram: ខ្វះ TELEGRAM_BOT_TOKEN ឬ chat id — មិនបានផ្ញើរូបទេ");
    return null;
  }
  try {
    const body = new FormData();
    body.set("chat_id", chatId);
    body.set("caption", captionHtml);
    body.set("parse_mode", "HTML");
    body.set("photo", photo, "receipt.jpg");
    const reply = replyParams(replyTo);
    if (reply) body.set("reply_parameters", reply);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      console.error("Telegram error:", res.status, JSON.stringify(data));
      return null;
    }
    return data.result?.message_id ?? null;
  } catch (err) {
    console.error("Telegram error:", err);
    return null;
  }
}
