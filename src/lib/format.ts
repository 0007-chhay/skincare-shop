export function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

const khmerDigits = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
export function toKhmerNumber(n: number) {
  return String(n).replace(/\d/g, (d) => khmerDigits[Number(d)]);
}
