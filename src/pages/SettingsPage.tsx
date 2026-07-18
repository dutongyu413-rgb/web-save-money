import { CaretRight, DownloadSimple, Info, ShieldCheck, Trash, UploadSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../application/AppDataContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { Sheet } from "../components/Sheet";

export function SettingsPage() {
  const navigate = useNavigate();
  const { data, clearAll, setSelectedMonth } = useAppData();
  const [sheet, setSheet] = useState<"clear" | "about" | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  async function confirmClear() {
    if (confirmation !== "清空") return;
    try {
      setClearing(true);
      await clearAll();
      setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
      setSheet(null);
      setConfirmation("");
    } catch {
      setError("清空失败，原数据没有改变，请重试。");
    } finally {
      setClearing(false);
    }
  }

  const recordCount = data!.incomes.length + data!.savings.length;
  return (
    <section className="screen settings-screen">
      <ScreenHeader title="设置" backTo="/" />
      <div className="screen-scroll">
        <h2 className="settings-group-title">数据与隐私</h2>
        <div className="settings-list">
          <SettingsRow icon={<DownloadSimple />} title="导出加密备份" subtitle="生成 .backup 文件" onClick={() => navigate("/settings/export")} />
          <SettingsRow icon={<UploadSimple />} title="从备份恢复" subtitle="将覆盖本机现有数据" onClick={() => navigate("/settings/restore")} />
          <SettingsRow icon={<ShieldCheck />} title="数据存储说明" subtitle="所有数据仅保存在当前浏览器" onClick={() => navigate("/settings/local")} />
          <SettingsRow icon={<Info />} title="关于反向记账" subtitle="版本 0.1.0" onClick={() => setSheet("about")} />
        </div>
        <button className="clear-data-link" type="button" onClick={() => { setConfirmation(""); setError(""); setSheet("clear"); }}>清空全部数据</button>
        <p className="privacy-copy">无需业务服务器。清除浏览器数据、卸载浏览器或更换设备可能导致数据丢失，请定期导出加密备份。</p>
      </div>
      <Sheet open={sheet === "clear"} onClose={() => setSheet(null)}>
        <div className="sheet-copy clear-sheet">
          <span className="sheet-symbol danger"><Trash /></span>
          <h2>确认清空全部数据？</h2>
          <p>收入、储蓄、目标和设置都会从本机删除，且无法恢复。建议先导出备份。</p>
          <label htmlFor="clear-confirm">请输入“清空”以继续</label>
          <input id="clear-confirm" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="清空" />
          <small>将删除 {recordCount} 笔记录</small>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="sheet-actions">
            <button className="button ghost" type="button" onClick={() => setSheet(null)}>取消</button>
            <button className="button danger" type="button" disabled={confirmation !== "清空" || clearing} onClick={() => void confirmClear()}>{clearing ? "正在清空" : "永久清空"}</button>
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === "about"} onClose={() => setSheet(null)}>
        <div className="sheet-copy">
          <span className="sheet-symbol blue"><Info /></span>
          <h2>反向记账</h2>
          <p>只记录收入和存下的钱，用减法了解整体支出，帮助你把注意力放在真正留下了多少。</p>
          <small>版本 0.1.0</small>
          <button className="button primary full" type="button" onClick={() => setSheet(null)}>知道了</button>
        </div>
      </Sheet>
    </section>
  );
}

function SettingsRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" className="settings-row" onClick={onClick}>
      <span className="settings-icon">{icon}</span>
      <span><strong>{title}</strong><small>{subtitle}</small></span>
      <CaretRight />
    </button>
  );
}
