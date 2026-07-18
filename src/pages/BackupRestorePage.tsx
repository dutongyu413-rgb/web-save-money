import { ArrowRight, File, UploadSimple, Warning } from "@phosphor-icons/react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ZodError } from "zod";
import { trackEvent } from "../analytics/umami";
import { useAppData } from "../application/AppDataContext";
import { decryptBackup } from "../application/backupService";
import { ScreenHeader } from "../components/ScreenHeader";
import { Sheet } from "../components/Sheet";
import type { AppSnapshot } from "../domain/models";

function isBackupFile(file: File) {
  return file.name.toLowerCase().endsWith(".backup");
}

function fileSizeLabel(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function BackupRestorePage() {
  const navigate = useNavigate();
  const { data, restore } = useAppData();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [pending, setPending] = useState<AppSnapshot | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const currentCount = data!.incomes.length + data!.savings.length;
  const pendingCount = pending ? pending.incomes.length + pending.savings.length : 0;

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    if (nextFile && !isBackupFile(nextFile)) {
      event.target.value = "";
      setFile(null);
      setError("请选择后缀为 .backup 的备份文件");
      return;
    }
    if (nextFile && nextFile.size > 10 * 1024 * 1024) {
      event.target.value = "";
      setFile(null);
      setError("备份文件超过 10 MB，无法读取");
      return;
    }
    setFile(nextFile);
    setError("");
  }

  function removeFile() {
    setFile(null);
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!file) return setError("请选择 .backup 备份文件");
    if (!isBackupFile(file)) return setError("请选择后缀为 .backup 的备份文件");
    if (file.size > 10 * 1024 * 1024) return setError("备份文件过大，无法读取");
    if (password.length < 8) return setError("请输入导出备份时设置的密码");
    try {
      setWorking(true);
      setError("");
      let envelope: unknown;
      try { envelope = JSON.parse(await file.text()); }
      catch { throw new Error("FILE_BROKEN"); }
      setPending(await decryptBackup(envelope, password));
    } catch (cause) {
      if (cause instanceof ZodError) setError("备份格式或版本不兼容，当前数据没有改变");
      else if (cause instanceof Error && cause.message === "FILE_BROKEN") setError("备份文件已损坏，当前数据没有改变");
      else setError("密码不正确或备份文件已损坏，当前数据没有改变");
    } finally {
      setWorking(false);
    }
  }

  async function confirmRestore() {
    if (!pending) return;
    try {
      setWorking(true);
      await restore(pending);
      // 埋点含义：用户确认并成功恢复了备份；不上传文件、密码、记录数量或任何财务数据。
      trackEvent("backup_restored");
      navigate("/", { replace: true });
    } catch {
      setPending(null);
      setError("恢复失败，当前数据没有改变，请重试。");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="screen form-screen">
      <ScreenHeader title="从备份恢复" backTo="/settings" />
      <form className="screen-scroll form-content" onSubmit={verify}>
        <div className="backup-file-field">
          <label htmlFor="restore-file"><UploadSimple />选择备份文件</label>
          <input ref={fileInput} id="restore-file" className="backup-file-input" type="file" accept=".backup" onChange={chooseFile} />
        </div>
        {file && <div className="backup-file-summary"><span><File /><span><strong>{file.name}</strong><small>{fileSizeLabel(file.size)} · 已选择加密备份</small></span></span><button type="button" onClick={removeFile}>移除</button></div>}
        <div className="field"><label htmlFor="restore-password">输入备份密码</label><input id="restore-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></div>
        {error && <p className="form-error" role="alert"><Warning />{error}</p>}
        <button className="button primary full" disabled={working || !file}>{working ? "正在验证备份" : "验证并恢复"}</button>
      </form>

      <Sheet open={pending !== null} onClose={() => setPending(null)}>
        <div className="sheet-copy">
          <span className="sheet-symbol danger"><Warning /></span>
          <h2>覆盖现有数据？</h2>
          <p>恢复后，本机当前的 {currentCount} 笔记录将被替换。此操作无法撤销。</p>
          <div className="restore-compare"><span>当前数据<strong>{currentCount} 笔</strong></span><ArrowRight /><span>备份数据<strong>{pendingCount} 笔</strong></span></div>
          <div className="sheet-actions"><button className="button ghost" type="button" onClick={() => setPending(null)}>取消</button><button className="button danger" type="button" disabled={working} onClick={() => void confirmRestore()}>{working ? "正在恢复" : "确认覆盖并恢复"}</button></div>
        </div>
      </Sheet>
    </section>
  );
}
