import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../application/AppDataContext";
import { EmptyState } from "../components/Feedback";
import { calculateYear } from "../domain/calculations";
import { formatAxisMoney, formatMoney, formatRate } from "../domain/money";

const chartWidth = 340;
const chartHeight = 190;
const plot = { left: 50, right: 8, top: 10, bottom: 30 };
const plotWidth = chartWidth - plot.left - plot.right;
const plotHeight = chartHeight - plot.top - plot.bottom;

function niceMoneyRange(values: number[]) {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const rawRange = Math.max(max - min, 10000);
  const magnitude = 10 ** Math.floor(Math.log10(rawRange));
  const step = Math.ceil(rawRange / magnitude / 4) * magnitude;
  return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step || step, step };
}

export function TrendsPage() {
  const navigate = useNavigate();
  const { data } = useAppData();
  const thisYear = new Date().getFullYear();
  const earliestYear = Math.min(thisYear, ...data!.incomes.map(item => Number(item.occurredOn.slice(0, 4))), ...data!.savings.map(item => Number(item.occurredOn.slice(0, 4))));
  const [year, setYear] = useState(thisYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const annual = useMemo(() => calculateYear(data!.incomes, data!.savings, year, data!.settings.targetSavingsRate), [data, year]);
  const hasData = annual.months.some(month => month.incomeCents !== 0 || month.savingsCents !== 0);

  return (
    <section className="screen trends-screen">
      <header className="trends-header">
        <div className="trends-title">
          <button className="icon-button" type="button" onClick={() => navigate("/")} aria-label="返回首页"><CaretLeft weight="bold" /></button>
          <h1>趋势</h1>
        </div>
        <div className="year-switcher">
          <button type="button" aria-label="上一年" disabled={year <= earliestYear} onClick={() => setYear(value => value - 1)}><CaretLeft /></button>
          <strong>{year}年</strong>
          <button type="button" aria-label="下一年" disabled={year >= thisYear} onClick={() => setYear(value => value + 1)}><CaretRight /></button>
        </div>
      </header>
      <div className="screen-scroll trends-scroll">
        <section className="annual-summary">
          <div><span>年收入</span><strong className="blue-text">{formatMoney(annual.incomeCents)}</strong></div>
          <div><span>年净储蓄</span><strong className="orange-text">{formatMoney(annual.savingsCents)}</strong></div>
          <div><span>年储蓄率</span><strong className="orange-text">{formatRate(annual.savingsRate)}</strong></div>
        </section>
        {hasData ? (
          <>
            <IncomeSavingsChart months={annual.months} onSelect={setSelectedMonth} />
            <RateChart months={annual.months} targetRate={data!.settings.targetSavingsRate} onSelect={setSelectedMonth} />
            {selectedMonth !== null && (
              <section className="chart-detail" aria-live="polite">
                <strong>{selectedMonth + 1}月</strong>
                <span>收入 {formatMoney(annual.months[selectedMonth].incomeCents)}</span>
                <span>净储蓄 {formatMoney(annual.months[selectedMonth].savingsCents)}</span>
                <span>储蓄率 {formatRate(annual.months[selectedMonth].savingsRate)}</span>
              </section>
            )}
          </>
        ) : <EmptyState title="这一年还没有数据" body="记录收入和储蓄后，这里会自动生成年度趋势。" />}
      </div>
    </section>
  );
}

type MonthStats = ReturnType<typeof calculateYear>["months"];

function selectWithKeyboard(event: KeyboardEvent<SVGGElement>, index: number, onSelect: (index: number) => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onSelect(index);
  }
}

function IncomeSavingsChart({ months, onSelect }: { months: MonthStats; onSelect: (index: number) => void }) {
  const values = months.flatMap(month => [month.incomeCents, month.savingsCents]);
  const range = niceMoneyRange(values);
  const y = (value: number) => plot.top + (range.max - value) / (range.max - range.min) * plotHeight;
  const zeroY = y(0);
  const ticks = Array.from({ length: 4 }, (_, index) => range.min + (range.max - range.min) * index / 3).reverse();
  const groupWidth = plotWidth / 12;
  const barWidth = Math.max(4, groupWidth * 0.25);

  return (
    <section className="chart-card">
      <div className="chart-heading"><h2>每月收入与净储蓄</h2><div className="legend"><span><i className="blue-key" />收入</span><span><i className="orange-key" />净储蓄</span></div></div>
      <svg className="chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="每月收入与净储蓄柱状图，纵轴单位为人民币">
        {ticks.map(tick => (
          <g key={tick}>
            <line className="grid-line" x1={plot.left} x2={chartWidth - plot.right} y1={y(tick)} y2={y(tick)} />
            <text className="axis-label" x={plot.left - 6} y={y(tick) + 4} textAnchor="end">{formatAxisMoney(tick)}</text>
          </g>
        ))}
        {months.map((month, index) => {
          const center = plot.left + groupWidth * index + groupWidth / 2;
          const incomeY = y(month.incomeCents);
          const savingsY = y(month.savingsCents);
          return (
            <g key={month.month} className="chart-hit" onClick={() => onSelect(index)} onKeyDown={event => selectWithKeyboard(event, index, onSelect)} tabIndex={0} role="button" aria-label={`${index + 1}月，收入${formatMoney(month.incomeCents)}，净储蓄${formatMoney(month.savingsCents)}`}>
              <rect className="chart-touch" x={plot.left + groupWidth * index} y={plot.top} width={groupWidth} height={plotHeight + 22} />
              <rect className="income-bar" x={center - barWidth - 1} y={Math.min(incomeY, zeroY)} width={barWidth} height={Math.max(1, Math.abs(incomeY - zeroY))} rx="2" />
              <rect className="savings-bar" x={center + 1} y={Math.min(savingsY, zeroY)} width={barWidth} height={Math.max(1, Math.abs(savingsY - zeroY))} rx="2" />
              <text className="axis-label" x={center} y={chartHeight - 8} textAnchor="middle">{index + 1}月</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function RateChart({ months, targetRate, onSelect }: { months: MonthStats; targetRate: number; onSelect: (index: number) => void }) {
  const rates = months.map(month => month.savingsRate);
  const realRates = rates.filter((rate): rate is number => rate !== null);
  const min = Math.min(0, ...realRates, targetRate);
  const max = Math.max(100, ...realRates, targetRate);
  const rangeMin = Math.floor(min / 20) * 20;
  const rangeMax = Math.ceil(max / 20) * 20 || 100;
  const y = (value: number) => plot.top + (rangeMax - value) / (rangeMax - rangeMin) * plotHeight;
  const x = (index: number) => plot.left + plotWidth * index / 11;
  const ticks = Array.from({ length: 4 }, (_, index) => rangeMin + (rangeMax - rangeMin) * index / 3).reverse();
  const segments: Array<Array<{ x: number; y: number; index: number }>> = [];
  rates.forEach((rate, index) => {
    if (rate === null) return;
    const previous = segments.at(-1);
    if (!previous || rates[index - 1] === null) segments.push([{ x: x(index), y: y(rate), index }]);
    else previous.push({ x: x(index), y: y(rate), index });
  });

  return (
    <section className="chart-card">
      <div className="chart-heading"><h2>每月储蓄率</h2><div className="legend"><span><i className="target-key" />目标 {targetRate}%</span></div></div>
      <svg className="chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="每月储蓄率折线图，纵轴单位为百分比">
        {ticks.map(tick => (
          <g key={tick}>
            <line className="grid-line" x1={plot.left} x2={chartWidth - plot.right} y1={y(tick)} y2={y(tick)} />
            <text className="axis-label" x={plot.left - 6} y={y(tick) + 4} textAnchor="end">{Number(tick.toFixed(0))}%</text>
          </g>
        ))}
        <line className="target-line" x1={plot.left} x2={chartWidth - plot.right} y1={y(targetRate)} y2={y(targetRate)} />
        {segments.map((segment, index) => <polyline key={index} className="rate-line" points={segment.map(point => `${point.x},${point.y}`).join(" ")} />)}
        {rates.map((rate, index) => (
          <g key={index} className="chart-hit" onClick={() => onSelect(index)} onKeyDown={event => selectWithKeyboard(event, index, onSelect)} tabIndex={0} role="button" aria-label={`${index + 1}月储蓄率${formatRate(rate)}`}>
            <rect className="chart-touch" x={x(index) - plotWidth / 24} y={plot.top} width={plotWidth / 12} height={plotHeight + 22} />
            {rate !== null && <circle className="rate-point" cx={x(index)} cy={y(rate)} r="4" />}
            <text className="axis-label" x={x(index)} y={chartHeight - 8} textAnchor="middle">{index + 1}月</text>
          </g>
        ))}
      </svg>
    </section>
  );
}
