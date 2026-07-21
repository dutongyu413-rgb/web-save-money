import { ArrowsClockwise, Info, Trash } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trackEvent } from "../analytics/umami";
import { useAppData } from "../application/AppDataContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { Sheet } from "../components/Sheet";
import { defaultDateForMonth, localDate } from "../domain/date";
import { parseMoneyInput } from "../domain/money";
import { validateRecordDate } from "../domain/validation";

type Errors = Partial<Record<"amount" | "date" | "note" | "submit", string>>;
type SavingsMode = "add" | "take";

export function SavingsFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { recordId } = useParams();
  const { data, selectedMonth, setSelectedMonth, saveSavings, removeSavings } = useAppData();
  const record = data!.savings.find(item => item.id === recordId);
  const state = location.state as { prefillCents?: number; fromIncome?: boolean } | null;
  const originalMode: SavingsMode = record?.amountCents && record.amountCents < 0 ? "take" : "add";
  const requestedMode: SavingsMode = searchParams.get("mode") === "take" ? "take" : "add";
  const [mode, setMode] = useState<SavingsMode>(record ? originalMode : requestedMode);
  const [amount, setAmount] = useState(record ? String(Math.abs(record.amountCents) / 100) : state?.prefillCents ? String(state.prefillCents / 100) : "");
  const [date, setDate] = useState(record?.occurredOn ?? defaultDateForMonth(selectedMonth));
  const [note, setNote] = useState(record?.note ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typeChangeOpen, setTypeChangeOpen] = useState(false);

  const oppositeMode: SavingsMode = mode === "add" ? "take" : "add";
  const modeLabel = mode === "add" ? "增加储蓄" : "取用储蓄";
  const oppositeModeLabel = oppositeMode === "add" ? "增加储蓄" : "取用储蓄";

  async function submit(event: FormEvent) {
    event.preventDefault();
    const rawCents = parseMoneyInput(amount);
    const nextErrors: Errors = {};
    if (!rawCents) nextErrors.amount = "请输入大于 0 且最多两位小数的金额";
    const dateError = validateRecordDate(date);
    if (dateError) nextErrors.date = dateError;
    if (note.length > 200) nextErrors.note = "备注不能超过 200 个字符";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !rawCents) return;

    try {
      setSubmitting(true);
      await saveSavings({ amountCents: mode === "take" ? -rawCents : rawCents, occurredOn: date, note }, recordId);
      // 埋点含义：储蓄记录已经成功写入本机；仅区分新增/编辑和增加/取用，不上传具体金额。
      trackEvent("savings_record_saved", {
        record_action: recordId ? "updated" : "created",
        savings_operation: mode === "take" ? "take" : "add",
      });
      setSelectedMonth(date.slice(0, 7));
      navigate(recordId ? "/savings" : "/", { replace: true });
    } catch {
      setErrors({ submit: "储蓄记录保存失败，原数据没有改变，请重试。" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!recordId) return;
    try {
      setSubmitting(true);
      await removeSavings(recordId);
      navigate("/savings", { replace: true });
    } catch {
      setDeleteOpen(false);
      setErrors({ submit: "删除失败，请稍后重试。" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="screen form-screen">
      <ScreenHeader title={recordId ? "编辑储蓄" : modeLabel} backTo="/savings" />
      <form className="screen-scroll form-content" onSubmit={submit} noValidate>
        <div className={`amount-field ${mode === "add" ? "orange-focus" : "neutral-focus"}`}>
          <label htmlFor="savings-amount">金额</label>
          <div><span>¥</span><input id="savings-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0" autoFocus={!recordId && !state?.prefillCents} /></div>
          {errors.amount && <p className="field-error" role="alert">{errors.amount}</p>}
        </div>
        <div className="field">
          <label htmlFor="savings-date">日期</label>
          <input id="savings-date" type="date" value={date} max={localDate()} onChange={event => setDate(event.target.value)} />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
        </div>
        <div className="field">
          <label htmlFor="savings-note">备注（选填）</label>
          <textarea id="savings-note" value={note} onChange={event => setNote(event.target.value)} maxLength={200} placeholder={mode === "add" ? "例如：转入定期存款" : "例如：临时周转"} />
          <span className="character-count">{note.length}/200</span>
          {errors.note && <p className="field-error" role="alert">{errors.note}</p>}
        </div>
        {mode === "take" && <p className="helper-note"><Info />这笔金额会减少本月净储蓄，储蓄率可能为负数。</p>}
        {state?.fromIncome && mode === "add" && <p className="helper-note orange"><Info />这是根据本月目标预填的建议金额，请确认真实存钱后再保存。</p>}
        {errors.submit && <p className="form-error" role="alert"><Info />{errors.submit}</p>}
        <div className="form-footer">
          <button className={`button full ${mode === "add" ? "savings-primary" : "primary"}`} disabled={submitting}>{submitting ? "正在保存" : recordId ? "保存修改" : "保存储蓄记录"}</button>
          {recordId && <button className="change-savings-type" type="button" onClick={() => setTypeChangeOpen(true)}>将这笔记录改为{oppositeModeLabel}</button>}
          {recordId && <button className="delete-text" type="button" onClick={() => setDeleteOpen(true)}><Trash />删除这笔记录</button>}
        </div>
      </form>

      <Sheet open={typeChangeOpen} onClose={() => setTypeChangeOpen(false)}>
        <div className="sheet-copy">
          <span className="sheet-symbol blue"><ArrowsClockwise /></span>
          <h2>确定修改记录类型吗？</h2>
          <p>这会把原来的“{modeLabel}”改为“{oppositeModeLabel}”，不会新增一笔记录。</p>
          <div className="sheet-actions">
            <button className="button ghost" type="button" onClick={() => setTypeChangeOpen(false)}>取消</button>
            <button className="button primary" type="button" onClick={() => { setMode(oppositeMode); setTypeChangeOpen(false); }}>确认修改</button>
          </div>
        </div>
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="sheet-copy">
          <span className="sheet-symbol danger"><Trash /></span>
          <h2>删除这笔储蓄记录？</h2>
          <p>删除后会立即重新计算当月净储蓄、储蓄率和总支出。</p>
          <div className="sheet-actions"><button className="button ghost" type="button" onClick={() => setDeleteOpen(false)}>取消</button><button className="button danger" type="button" onClick={() => void confirmDelete()}>确认删除</button></div>
        </div>
      </Sheet>
    </section>
  );
}
