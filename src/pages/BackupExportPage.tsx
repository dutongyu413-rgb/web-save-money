import { Check, DownloadSimple } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../analytics/umami";
import { useAppData } from "../application/AppDataContext";
import { backupFilename, downloadBackup, encryptSnapshot } from "../application/backupService";
import { ScreenHeader } from "../components/ScreenHeader";
import { Sheet } from "../components/Sheet";

export function BackupExportPage() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<{ envelope: unknown; filename: string } | null>(null);
  const filename = backupFilename();

  function saveBackupToLocal() {
    if (!result) return;
    downloadBackup(result.envelope, result.filename);
    // 埋点含义：用户已触发加密备份文件下载；不上传文件名、记录数量、密码或备份内容。
    trackEvent("backup_downloaded");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("密码至少需要 8 个字符");
    if (password !== confirm) return setError("两次输入的密码不一致");
    try {
      setWorking(true);
      setError("");
      const envelope = await encryptSnapshot(data!, password);
      setResult({ envelope, filename });
    } catch {
      setError("备份生成失败，请重新尝试。你的本机数据没有改变。");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="screen form-screen">
      <ScreenHeader title="导出备份" backTo="/settings" />
      <form className="screen-scroll form-content" onSubmit={submit}>
        <div className="field"><label htmlFor="backup-password">设置备份密码</label><input id="backup-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" placeholder="至少 8 位" /></div>
        <div className="field"><label htmlFor="backup-confirm">确认密码</label><input id="backup-confirm" type="password" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password" placeholder="再次输入密码" /></div>
        <p className="field-hint">至少 8 位，请妥善保存；忘记后无法恢复。</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary full" disabled={working}>{working ? "正在生成备份" : "生成加密备份"}</button>
      </form>

      <Sheet open={result !== null} onClose={() => undefined} dismissible={false}>
        <div className="sheet-copy">
          <span className="sheet-symbol success"><Check weight="bold" /></span>
          <h2>备份已生成</h2>
          <p>{result?.filename}</p>
          <button className="button primary full" type="button" onClick={saveBackupToLocal}><DownloadSimple />保存到本地</button>
          <button className="button ghost full" type="button" onClick={() => navigate("/settings", { replace: true })}>完成</button>
        </div>
      </Sheet>
    </section>
  );
}
