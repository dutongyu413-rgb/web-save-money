import { ArrowDownLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../application/AppDataContext";
import { EmptyState } from "../components/Feedback";
import { RecordRow } from "../components/RecordRow";
import { ScreenHeader } from "../components/ScreenHeader";
import { monthLabel } from "../domain/date";
import { formatMoney } from "../domain/money";

export function IncomeListPage() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const records = [...data!.incomes]
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
  const total = records.reduce((sum, record) => sum + record.amountCents, 0);
  const groups = Array.from(records.reduce((map, record) => {
    const month = record.occurredOn.slice(0, 7);
    const group = map.get(month) ?? [];
    group.push(record);
    map.set(month, group);
    return map;
  }, new Map<string, typeof records>()));

  return (
    <section className="screen list-screen">
      <ScreenHeader title="收入记录" backTo="/" />
      <div className="screen-scroll with-standalone-action">
        <section className="summary-panel">
          <span>累计收入</span>
          <strong className="blue-text">{formatMoney(total)}</strong>
          <small>共 {records.length} 笔</small>
        </section>
        <h2 className="section-title">全部记录</h2>
        {groups.length ? (
          <div className="record-groups">
            {groups.map(([month, monthRecords]) => (
              <section className="record-month-group" key={month}>
                <h3>{monthLabel(month)}</h3>
                <div className="record-list">
                  {monthRecords.map(record => (
                    <RecordRow
                      key={record.id}
                      type="income"
                      amountCents={record.amountCents}
                      occurredOn={record.occurredOn}
                      note={record.note}
                      onClick={() => navigate(`/income/${record.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="record-list"><EmptyState title="还没有收入记录" body="记下第一笔收入，开始计算储蓄率。" /></div>
        )}
      </div>
      <div className="sticky-action">
        <button className="button primary full" type="button" onClick={() => navigate("/income/new")}>
          <ArrowDownLeft weight="bold" />记录一笔收入
        </button>
      </div>
    </section>
  );
}
