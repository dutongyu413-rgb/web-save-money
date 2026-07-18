type UmamiEventData = Record<string, string | number | boolean>;

type PendingEvent = {
  name: string;
  data?: UmamiEventData;
};

declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: UmamiEventData) => void;
    };
  }
}

// 所有反向记账事件统一使用此前缀，避免与同一 Umami 账号中的其他项目混淆。
const EVENT_PREFIX = "save_money_";
// 这是 web-save-money 在 Umami 中的网站 ID。该 ID 会随网页脚本公开，不属于密码或私钥。
// 本地开发默认不统计，避免调试访问污染正式数据；如需联调，可在 .env.local 中显式配置。
const productionWebsiteId = "ebe13ff1-7a56-4a1d-ab6d-3a4c2e8df138";
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() || (import.meta.env.PROD ? productionWebsiteId : undefined);
const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() || "https://cloud.umami.is/script.js";
const pendingEvents: PendingEvent[] = [];

function sendEvent(event: PendingEvent) {
  if (typeof window.umami?.track !== "function") return false;
  try {
    window.umami.track(event.name, event.data);
    return true;
  } catch {
    // 统计服务异常不能影响记账、备份等任何业务操作。
    return false;
  }
}

function flushPendingEvents() {
  while (pendingEvents.length > 0) {
    const event = pendingEvents[0];
    if (!sendEvent(event)) return;
    pendingEvents.shift();
  }
}

/**
 * 初始化 Umami 页面访问统计。
 * 没有配置网站 ID、脚本被广告拦截或加载失败时会静默停用，不影响记账功能。
 */
export function initializeUmami() {
  if (!websiteId || document.querySelector("script[data-save-money-umami]")) return;

  const script = document.createElement("script");
  script.src = scriptUrl;
  script.async = true;
  script.defer = true;
  script.dataset.websiteId = websiteId;
  script.dataset.saveMoneyUmami = "true";
  // Hash 路由可能包含记录 ID，基础页面访问统计统一排除 # 后面的内容；具体页面只通过安全分类事件上报。
  script.dataset.excludeHash = "true";
  // 尊重浏览器的“请勿追踪”设置。
  script.dataset.doNotTrack = "true";
  script.addEventListener("load", flushPendingEvents, { once: true });
  document.head.appendChild(script);
}

/**
 * 安全上报一个反向记账行为事件。
 * data 只允许传递页面名称、创建/编辑、增加/取用等非敏感分类，禁止传入金额、日期、备注和密码。
 */
export function trackEvent(name: string, data?: UmamiEventData) {
  if (!websiteId) return;

  const event = { name: `${EVENT_PREFIX}${name}`, data };
  if (sendEvent(event)) return;

  // Umami 尚未加载完成时暂存少量事件；脚本加载成功后自动补发。
  if (pendingEvents.length < 20) pendingEvents.push(event);
}
