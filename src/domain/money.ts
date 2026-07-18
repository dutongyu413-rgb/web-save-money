export function parseMoneyInput(value: string): number | null {
  const normalized = value.trim().replaceAll(",", "");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [yuan, decimal = ""] = normalized.split(".");
  const cents = Number(yuan) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function formatMoney(cents: number, showPositive = false): string {
  const sign = cents < 0 ? "-" : showPositive && cents > 0 ? "+" : "";
  const value = Math.abs(cents) / 100;
  return `${sign}¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAxisMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const yuan = Math.abs(cents) / 100;
  if (yuan >= 10000) return `${sign}¥${Number((yuan / 10000).toFixed(1))}万`;
  if (yuan >= 1000) return `${sign}¥${Number((yuan / 1000).toFixed(1))}千`;
  return `${sign}¥${Math.round(yuan)}`;
}

export function formatRate(rate: number | null): string {
  if (rate === null) return "-";
  const rounded = Number(rate.toFixed(1));
  return `${rounded}%`;
}
