import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerProfileAnalytics } from "../../types/analytics";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { fmtMode, fmtPercent } from "../../utils/format";
import { useAccumulatedBattles } from "../../hooks/useAccumulatedBattles";

const COLORS = {
  yellow: "#ffc015",
  magenta: "#ff2d87",
  cyan: "#28d2ff",
  violet: "#8a5cff",
  success: "#2bd672",
  danger: "#ff4d6d",
  warning: "#ffb020",
};

const tooltipStyle = {
  background: "#131836",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color: "#f3f5ff",
  fontSize: 12,
} as const;

export function AnalyticsTab({
  profile,
  tag,
}: {
  profile: PlayerProfileAnalytics;
  tag: string;
}) {
  const { summary } = profile;
  const accumulated = useAccumulatedBattles(tag);
  const battlelog =
    accumulated.analytics &&
    accumulated.analytics.totalBattles >= (profile.battlelog?.totalBattles ?? 0)
      ? accumulated.analytics
      : profile.battlelog;
  const battleCountSuffix =
    accumulated.analytics &&
    accumulated.analytics.totalBattles > (profile.battlelog?.totalBattles ?? 0)
      ? ` (${accumulated.freshCount} récents + ${accumulated.storedCount} archivés)`
      : "";

  const rankData = Object.entries(summary.rankDistribution)
    .sort(([a], [b]) => bucketSortKey(a) - bucketSortKey(b))
    .map(([bucket, count]) => ({ bucket, count }));

  const trophyData = Object.entries(summary.trophyDistribution)
    .sort(([a], [b]) => trophyBucketSort(a) - trophyBucketSort(b))
    .map(([bucket, count]) => ({ bucket, count }));

  const completionRadar = [
    { axis: "Star Powers", value: summary.completion.starPowers * 100 },
    { axis: "Gadgets", value: summary.completion.gadgets * 100 },
    { axis: "Gears", value: summary.completion.gears * 100 },
  ];

  const resultsData = battlelog
    ? [
        { name: "V", value: battlelog.results.victory, color: COLORS.success },
        { name: "D", value: battlelog.results.defeat, color: COLORS.danger },
        { name: "N", value: battlelog.results.draw, color: COLORS.warning },
      ]
    : [];

  const modeData =
    battlelog?.modes.slice(0, 6).map((m) => ({
      mode: fmtMode(m.mode),
      winRate: Math.round(m.winRate * 100),
      battles: m.battles,
    })) ?? [];

  const brawlerData =
    battlelog?.brawlers
      .filter((b) => b.battles >= 1)
      .slice(0, 6)
      .map((b) => ({
        name: b.name,
        winRate: Math.round(b.winRate * 100),
        battles: b.battles,
      })) ?? [];

  return (
    <div className="mt-4 grid grid-cols-12 gap-4">
      {/* Headline analytics row */}
      <Card className="col-span-12 md:col-span-4">
        <h3 className="display text-lg mb-1">Win rate</h3>
        <div className="display text-5xl text-gradient-y">
          {battlelog ? fmtPercent(battlelog.winRate, 1) : "—"}
        </div>
        <div className="text-text-dim text-xs mt-1">
          {battlelog
            ? `sur ${battlelog.countedBattles} matchs${battleCountSuffix}`
            : "—"}
        </div>
      </Card>

      <Card className="col-span-12 md:col-span-4">
        <h3 className="display text-lg mb-1">Plus longue série</h3>
        <div className="display text-5xl text-gradient-m">
          {battlelog?.longestWinStreak ?? 0}V
        </div>
        <div className="text-text-dim text-xs mt-1">
          en cours :{" "}
          <span className="text-text-base font-semibold">
            {battlelog?.currentStreak.type
              ? `${battlelog.currentStreak.length} ${battlelog.currentStreak.type[0]!.toUpperCase()}`
              : "—"}
          </span>
        </div>
      </Card>

      <Card className="col-span-12 md:col-span-4">
        <h3 className="display text-lg mb-1">Star Player</h3>
        <div className="display text-5xl text-brand-cyan">
          {battlelog ? fmtPercent(battlelog.starPlayerRate, 0) : "—"}
        </div>
        <div className="text-text-dim text-xs mt-1">
          {battlelog?.starPlayerAppearances ?? 0} apparitions
        </div>
      </Card>

      {/* Results pie + mode bars */}
      <Card className="col-span-12 md:col-span-5">
        <h3 className="display text-lg mb-3">Résultats récents</h3>
        {resultsData.reduce((s, r) => s + r.value, 0) === 0 ? (
          <p className="text-text-muted text-sm">Aucune donnée.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resultsData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  stroke="none"
                >
                  {resultsData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, n) => [`${Number(v)} match(s)`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex justify-around mt-2 text-sm">
          {resultsData.map((r) => (
            <div key={r.name} className="text-center">
              <div
                className="display text-2xl"
                style={{ color: r.color }}
              >
                {r.value}
              </div>
              <div className="text-text-dim text-xs">{r.name}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="col-span-12 md:col-span-7">
        <h3 className="display text-lg mb-3">Win rate par mode</h3>
        {modeData.length === 0 ? (
          <p className="text-text-muted text-sm">Aucune donnée.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modeData}
                layout="vertical"
                margin={{ left: 0, right: 24 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#8b91c2", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="mode"
                  width={110}
                  tick={{ fill: "#f3f5ff", fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v, _n, p) => [
                    `${Number(v)}% (${(p as { payload: { battles: number } }).payload.battles} matchs)`,
                    "Win rate",
                  ]}
                />
                <Bar dataKey="winRate" radius={[0, 6, 6, 0]}>
                  {modeData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.winRate >= 70
                          ? COLORS.success
                          : d.winRate >= 50
                            ? COLORS.yellow
                            : COLORS.danger
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Distributions */}
      <Card className="col-span-12 lg:col-span-6">
        <h3 className="display text-lg mb-3">Distribution des rangs</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankData} margin={{ top: 8, left: -16 }}>
              <XAxis
                dataKey="bucket"
                tick={{ fill: "#8b91c2", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#8b91c2", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                formatter={(v) => [`${Number(v)} brawlers`, "Quantité"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={COLORS.magenta} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <h3 className="display text-lg mb-3">Distribution des trophées</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trophyData} margin={{ top: 8, left: -16 }}>
              <XAxis
                dataKey="bucket"
                tick={{ fill: "#8b91c2", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#8b91c2", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                formatter={(v) => [`${Number(v)} brawlers`, "Quantité"]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={COLORS.yellow} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Per-brawler battle stats */}
      {brawlerData.length > 0 && (
        <Card className="col-span-12 lg:col-span-7">
          <h3 className="display text-lg mb-3">Brawlers récemment joués</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brawlerData}
                margin={{ left: 0, right: 24 }}
                layout="vertical"
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#8b91c2", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fill: "#f3f5ff", fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v, _n, p) => [
                    `${Number(v)}% (${(p as { payload: { battles: number } }).payload.battles} matchs)`,
                    "Win rate",
                  ]}
                />
                <Bar dataKey="winRate" fill={COLORS.cyan} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Kit radar */}
      <Card className="col-span-12 lg:col-span-5">
        <h3 className="display text-lg mb-3">Complétion du kit</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={completionRadar}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#8b91c2", fontSize: 12 }}
              />
              <Radar
                dataKey="value"
                stroke={COLORS.yellow}
                fill={COLORS.yellow}
                fillOpacity={0.35}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${Number(v).toFixed(0)}%`, "Complétion"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Top maps */}
      {battlelog && battlelog.maps.length > 0 && (
        <Card className="col-span-12">
          <h3 className="display text-lg mb-3">Top maps récentes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {battlelog.maps.slice(0, 6).map((m) => (
              <div
                key={`${m.mode}-${m.map}`}
                className="surface rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{m.map}</div>
                  <div className="text-text-dim text-xs">{fmtMode(m.mode)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="display text-xl text-brand-yellow">
                    {fmtPercent(m.winRate, 0)}
                  </div>
                  <Badge tone="neutral">{m.battles} m.</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Computation timestamp */}
      <div className="col-span-12 text-center text-text-dim text-xs flex items-center justify-center gap-2 pt-2">
        <span className="pulse-dot text-brand-yellow w-1.5 h-1.5 rounded-full bg-brand-yellow inline-block" />
        Calculé à l'instant via le proxy
      </div>
    </div>
  );
}

function bucketSortKey(b: string): number {
  if (b === "1-9") return 0;
  if (b === "10-14") return 1;
  if (b === "15-19") return 2;
  if (b === "20-24") return 3;
  if (b === "25-29") return 4;
  if (b === "30+") return 5;
  return 99;
}
function trophyBucketSort(b: string): number {
  if (b === "0") return 0;
  if (b === "1-299") return 1;
  if (b === "300-499") return 2;
  if (b === "500-699") return 3;
  if (b === "700-999") return 4;
  if (b === "1000+") return 5;
  return 99;
}
