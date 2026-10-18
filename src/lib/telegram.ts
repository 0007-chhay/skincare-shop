// ផ្ញើសារទៅក្រុម Telegram តាមរយៈ bot (ដំណើរការតែលើ server)

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegram(chatId: string | undefined, html: string, botToken?: string) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) {
    console.warn("Telegram: ខ្វះ TELEGRAM_BOT_TOKEN ឬ chat id — មិនបានផ្ញើសារទេ");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error("Telegram error:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("Telegram error:", err);
    return false;
  }
}
