import { ArrowDownLeft, ChartBar, Gear, PencilSimple, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../analytics/umami";
import { useAppData } from "../application/AppDataContext";
import { MonthSwitcher } from "../components/MonthSwitcher";
import { Sheet } from "../components/Sheet";
import { calculateStats } from "../domain/calculations";
import { formatMoney, formatRate } from "../domain/money";

type SheetName = "target" | null;

export function HomePage() {
  const navigate = useNavigate();
  const { data, selectedMonth, setSelectedMonth, setTargetRate } = useAppData();
  const [sheet, setSheet] = useState<SheetName>(null);
  const [target, setTarget] = useState(String(data!.settings.targetSavingsRate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const stats = useMemo(
    () => calculateStats(data!.incomes, data!.savings, selectedMonth, data!.settings.targetSavingsRate),
    [data, selectedMonth],
  );
  const displayProgress = stats.savingsRate === null ? 0 : Math.max(0, Math.min(100, stats.savingsRate));
  const targetProgress = stats.targetCents > 0
    ? Math.max(0, Math.min(100, stats.savingsCents / stats.targetCents * 100))
    : 0;

  const goalCopy = stats.incomeCents === 0
    ? "先记一笔收入"
    : stats.targetGapCents > 0
      ? `还差 ${formatMoney(stats.targetGapCents)}`
      : "已达标";

  async function saveTarget(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(target);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setError("请输入 0% 到 100% 之间的目标");
      return;
    }
    try {
      setSaving(true);
      await setTargetRate(value);
      // 埋点含义：目标储蓄率已经保存成功；不上传用户设置的具体百分比。
      trackEvent("target_rate_saved");
      setSheet(null);
      setError("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="screen home-screen">
      <header className="home-header">
        <div className="home-topbar">
          <h1>反向记账</h1>
          <nav className="home-quick-links" aria-label="快捷入口">
            <button type="button" onClick={() => navigate("/trends")} aria-label="查看趋势">
              <ChartBar weight="bold" />
            </button>
            <button type="button" onClick={() => navigate("/settings")} aria-label="打开设置">
              <Gear weight="bold" />
            </button>
          </nav>
        </div>
        <MonthSwitcher month={selectedMonth} onChange={setSelectedMonth} />
      </header>
      <div className="screen-scroll home-scroll">
        <section className="home-summary-card">
          <p className="home-question">这个月，你存下了多少？</p>
          <div className="home-rate-hero">
            <div className="rate-ring" style={{ "--progress": `${displayProgress * 3.6}deg` } as React.CSSProperties}>
              <div className="rate-ring-inner">
                <span className="rate-label">储蓄率</span>
                <strong>{formatRate(stats.savingsRate)}</strong>
                <small>{stats.achieved === null ? "等待收入数据" : stats.achieved ? "已达到目标" : "向目标靠近中"}</small>
                <button
                  className="target-edit"
                  type="button"
                  onClick={() => { setTarget(String(data!.settings.targetSavingsRate)); setSheet("target"); }}
                  aria-label={`修改目标储蓄率，当前目标 ${data!.settings.targetSavingsRate}%`}
                >
                  目标 {data!.settings.targetSavingsRate}%
                  <PencilSimple weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className="home-card-divider" />
          <div className="metric-pair">
            <button type="button" onClick={() => navigate("/income")}>
              <span>收入</span><strong className="income-value">{formatMoney(stats.incomeCents)}</strong>
            </button>
            <button type="button" onClick={() => navigate("/savings")}>
              <span>净储蓄</span><strong className="savings-value">{formatMoney(stats.savingsCents)}</strong>
            </button>
          </div>
          <section className="goal-panel">
            <div className="goal-row">
              <div><span>本月目标</span><strong>{formatMoney(stats.targetCents)}</strong></div>
              <strong className={stats.achieved ? "goal-achieved" : "goal-pending"}>{goalCopy}</strong>
            </div>
            <div className="progress-track" aria-label={`本月目标完成 ${Math.round(targetProgress)}%`}>
              <span style={{ transform: `scaleX(${targetProgress / 100})` }} />
            </div>
          </section>
        </section>

        <div className="home-actions">
          <button className="button income-outline" type="button" onClick={() => navigate("/income/new")}>
            <ArrowDownLeft weight="bold" />记收入
          </button>
          <button className="button savings-primary" type="button" onClick={() => navigate("/savings/new")}>
            <Plus weight="bold" />记储蓄
          </button>
        </div>

        {stats.incomeCents > 0 && data!.savings.filter(item => item.occurredOn.startsWith(selectedMonth)).length === 0 && (
          <p className="gentle-note">本月还没有储蓄记录。如果确实没有存下钱，可以忽略。</p>
        )}
      </div>
      <Sheet open={sheet === "target"} onClose={() => setSheet(null)}>
        <form onSubmit={saveTarget} className="sheet-form">
          <h2>目标储蓄率</h2>
          <p>设置一个容易坚持的固定目标，可以随时修改。</p>
          <label htmlFor="target-rate">目标比例</label>
          <div className="percent-input">
            <input id="target-rate" value={target} onChange={event => setTarget(event.target.value)} inputMode="decimal" autoFocus />
            <span>%</span>
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="button primary full" disabled={saving}>{saving ? "正在保存" : "保存目标"}</button>
        </form>
      </Sheet>

    </section>
  );
}
