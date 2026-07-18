import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "./umami";

let lastTrackedPath = "";

function pageName(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname === "/income") return "income_list";
  if (pathname === "/income/new") return "income_create";
  if (pathname.startsWith("/income/")) return "income_edit";
  if (pathname === "/savings") return "savings_list";
  if (pathname === "/savings/new") return "savings_create";
  if (pathname.startsWith("/savings/")) return "savings_edit";
  if (pathname === "/trends") return "trends";
  if (pathname === "/settings") return "settings";
  if (pathname === "/settings/export") return "backup_export";
  if (pathname === "/settings/restore") return "backup_restore";
  return "unknown";
}

export function AnalyticsPageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 埋点含义：用户进入了哪个功能页面；只记录页面分类，不记录记录 ID 或任何财务数据。
    // lastTrackedPath 用于避免 React 开发模式重复执行副作用时产生双份页面事件。
    if (pathname === lastTrackedPath) return;
    lastTrackedPath = pathname;
    trackEvent("page_viewed", { page: pageName(pathname) });
  }, [pathname]);

  return null;
}
