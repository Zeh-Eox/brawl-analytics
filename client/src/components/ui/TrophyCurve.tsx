import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtNum } from "../../utils/format";
import { IconTrophy } from "./icons";

export interface CurvePoint {
  t: string; // ISO
  trophies: number;
}

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function CurveTooltip({
  active,
  payload,
  color,
}: {
  active?: boolean;
  payload?: Array<{ payload: CurvePoint }>;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-line-strong bg-app px-3 py-2 text-xs shadow-lg">
      <div className="display" style={{ color }}>
<span className="inline-flex items-center gap-1"><IconTrophy size={14} /> {fmtNum(p.trophies)}</span>
      </div>
      <div className="text-dim">{fmtFull(p.t)}</div>
    </div>
  );
}

export function TrophyCurve({
  data,
  color = "#FFC61A",
  height = 160,
}: {
  data: CurvePoint[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.trophies);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(10, Math.round((max - min) * 0.15));
  const gid = `curve-${color.replace("#", "")}`;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={fmtDay}
            tick={{ fill: "#5a6193", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={26}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fill: "#5a6193", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v: number) => fmtNum(Math.round(v))}
            allowDecimals={false}
          />
          <Tooltip
            content={<CurveTooltip color={color} />}
            cursor={{ stroke: "rgba(255,255,255,0.12)" }}
          />
          <Area
            type="monotone"
            dataKey="trophies"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gid})`}
            dot={{ r: 2.5, fill: "#0A0D1B", stroke: color, strokeWidth: 2 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
