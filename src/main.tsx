import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { initializeUmami } from "./analytics/umami";
import { App } from "./app/App";
import { AppDataProvider } from "./application/AppDataContext";
import "./styles/tokens.css";
import "./styles/global.css";

// 初始化匿名访问统计；未配置 Umami 网站 ID 时会自动跳过，不影响应用启动。
initializeUmami();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AppDataProvider>
        <App />
      </AppDataProvider>
    </HashRouter>
  </StrictMode>,
);
