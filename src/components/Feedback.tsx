import { WarningCircle } from "@phosphor-icons/react";

export function LoadingScreen() {
  return (
    <div className="app-state" aria-label="正在读取本机数据">
      <div className="skeleton title" />
      <div className="skeleton ring" />
      <div className="skeleton card" />
      <p>正在读取本机数据</p>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="app-state error-state">
      <WarningCircle size={42} />
      <h1>暂时无法打开数据</h1>
      <p>{message}</p>
      <button className="button primary" type="button" onClick={onRetry}>重新读取</button>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}
