import { ArrowRight, Check, Info, Trash } from "@phosphor-icons/react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackEvent } from "../analytics/umami";
import { useAppData } from "../application/AppDataContext";
import { ScreenHeader } from "../components/ScreenHeader";
import { Sheet } from "../components/Sheet";
import { calculateStats } from "../domain/calculations";
import { defaultDateForMonth, localDate } from "../domain/date";
import { formatMoney, parseMoneyInput } from "../domain/money";
import { validateRecordDate } from "../domain/validation";

type Errors = Partial<Record<"amount" | "date" | "note" | "submit", string>>;

export function IncomeFormPage() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const { data, selectedMonth, setSelectedMonth, saveIncome, removeIncome } = useAppData();
  const record = data!.incomes.find(item => item.id === recordId);
  const [amount, setAmount] = useState(record ? String(record.amountCents / 100) : "");
  const [date, setDate] = useState(record?.occurredOn ?? defaultDateForMonth(selectedMonth));
  const [note, setNote] = useState(record?.note ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savedCents, setSavedCents] = useState<number | null>(null);

  const suggested = useMemo(() => {
    if (savedCents === null) return null;
    const month = date.slice(0, 7);
    const stats = calculateStats(data!.incomes, data!.savings, month, data!.settings.targetSavingsRate);
    return { ...stats, remaining: Math.max(0, stats.targetGapCents), month };
  }, [data, date, note, savedCents]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amountCents = parseMoneyInput(amount);
    const nextErrors: Errors = {};
    if (!amountCents) nextErrors.amount = "请输入大于 0 且最多两位小数的金额";
    const dateError = validateRecordDate(date);
    if (dateError) nextErrors.date = dateError;
    if (note.length > 200) nextErrors.note = "备注不能超过 200 个字符";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !amountCents) return;

    try {
      setSubmitting(true);
      await saveIncome({ amountCents, occurredOn: date, note }, recordId);
      // 埋点含义：收入记录已经成功写入本机；只区分新增或编辑，不上传金额、日期和备注。
      trackEvent("income_record_saved", { record_action: recordId ? "updated" : "created" });
      setSelectedMonth(date.slice(0, 7));
      if (recordId) navigate("/income", { replace: true });
      else if (data!.settings.targetSavingsRate > 0) setSavedCents(amountCents);
      else navigate("/", { replace: true });
    } catch {
      setErrors({ submit: "收入保存失败，原数据没有改变，请重试。" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!recordId) return;
    try {
      setSubmitting(true);
      await removeIncome(recordId);
      navigate("/income", { replace: true });
    } catch {
      setDeleteOpen(false);
      setErrors({ submit: "删除失败，请稍后重试。" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="screen form-screen">
      <ScreenHeader title={recordId ? "编辑收入" : "记收入"} backTo="/income" />
      <form className="screen-scroll form-content" onSubmit={submit} noValidate>
        <div className="amount-field blue-focus">
          <label htmlFor="income-amount">金额</label>
          <div><span>¥</span><input id="income-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0" autoFocus={!recordId} /></div>
          {errors.amount && <p className="field-error" role="alert">{errors.amount}</p>}
        </div>
        <div className="field">
          <label htmlFor="income-date">日期</label>
          <input id="income-date" type="date" value={date} max={localDate()} onChange={event => setDate(event.target.value)} />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
        </div>
        <div className="field">
          <label htmlFor="income-note">备注（选填）</label>
          <textarea id="income-note" value={note} onChange={event => setNote(event.target.value)} maxLength={200} placeholder="例如：7月工资" />
          <span className="character-count">{note.length}/200</span>
          {errors.note && <p className="field-error" role="alert">{errors.note}</p>}
        </div>
        {errors.submit && <p className="form-error" role="alert"><Info />{errors.submit}</p>}
        <div className="form-footer">
          <button className="button primary full" disabled={submitting}>{submitting ? "正在保存" : "保存收入"}</button>
          {recordId && <button className="delete-text" type="button" onClick={() => setDeleteOpen(true)}><Trash />删除这笔收入</button>}
          <p className="local-caption"><Info />数据仅保存在本机</p>
        </div>
      </form>

      <Sheet open={savedCents !== null} onClose={() => undefined} dismissible={false}>
        <div className="sheet-copy">
          <span className="sheet-symbol success"><Check weight="bold" /></span>
          <h2>收入已记录 {formatMoney(savedCents ?? 0)}</h2>
          {suggested?.remaining ? (
            <>
              <p>按照 {data!.settings.targetSavingsRate}% 的目标，本月还建议存下 {formatMoney(suggested.remaining)}。</p>
              <div className="sheet-stats">
                <div><span>本月目标</span><strong>{formatMoney(suggested.targetCents)}</strong></div>
                <div><span>当前已储蓄</span><strong>{formatMoney(suggested.savingsCents)}</strong></div>
              </div>
              <button className="button savings-primary full" type="button" onClick={() => navigate("/savings/new", { replace: true, state: { prefillCents: suggested.remaining, fromIncome: true } })}>
                记下这笔储蓄<ArrowRight />
              </button>
            </>
          ) : <p>本月储蓄目标已达成。</p>}
          <button className="button ghost full" type="button" onClick={() => navigate("/", { replace: true })}>稍后再说</button>
          <small>记录不会自动转账</small>
        </div>
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="sheet-copy">
          <span className="sheet-symbol danger"><Trash /></span>
          <h2>删除这笔收入？</h2>
          <p>删除后会立即重新计算当月收入、储蓄率和总支出。</p>
          <div className="sheet-actions"><button className="button ghost" type="button" onClick={() => setDeleteOpen(false)}>取消</button><button className="button danger" type="button" onClick={() => void confirmDelete()}>确认删除</button></div>
        </div>
      </Sheet>
    </section>
  );
}
