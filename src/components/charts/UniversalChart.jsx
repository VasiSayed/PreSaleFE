import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const DEFAULT_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#06B6D4",
  "#22C55E",
  "#E11D48",
];

function isNonEmptyArray(v) {
  return Array.isArray(v) && v.length > 0;
}


export default function UniversalChart({
  type = "bar",
  data = [],
  xKey = "name",
  series = [{ key: "value", name: "Value" }],
  height = 280,
  colors = DEFAULT_COLORS,
  showGrid = true,
  showLegend = true,
  pieInnerRadius = 0,
  pieOuterRadius = 95,
  pieLabel = true,
  onSeriesItemClick,
  margin,

  itemColorKey,
}) {
  if (!isNonEmptyArray(data)) {
    return <div className="muted-text">No data.</div>;
  }

  const chartMargin = margin || { left: 10, right: 10, top: 10, bottom: 10 };

  // PIE (uses first series only)
  if (type === "pie") {
    const s0 = series?.[0] || { key: "value", name: "Value" };

    return (
      <div className="dash-chart">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey={s0.key}
              nameKey={xKey}
              innerRadius={pieInnerRadius}
              outerRadius={pieOuterRadius}
              label={pieLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend ? <Legend /> : null}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // BAR (horizontal)
  if (type === "bar") {
    return (
      <div className="dash-chart">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={chartMargin}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend ? <Legend /> : null}
            {series.map((s, idx) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name || s.key}
                radius={[8, 8, 8, 8]}
                fill={colors[idx % colors.length]} // default fallback
                cursor={onSeriesItemClick ? "pointer" : "default"}
                onClick={(barObj) => {
                  if (!onSeriesItemClick) return;
                  onSeriesItemClick(barObj?.payload, s.key);
                }}
              >
                {/* ✅ per-bar color */}
                {data.map((entry, i) => (
                  <Cell
                    key={`cell-${s.key}-${i}`}
                    fill={
                      itemColorKey && entry?.[itemColorKey]
                        ? entry[itemColorKey]
                        : colors[i % colors.length]
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // BAR (vertical)
  if (type === "bar-vertical") {
    return (
      <div className="dash-chart">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={margin || { left: 40, right: 10, top: 10, bottom: 10 }}
          >
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis type="number" />
            <YAxis type="category" dataKey={xKey} width={170} />
            <Tooltip />
            {showLegend ? <Legend /> : null}

            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name || s.key}
                radius={[8, 8, 8, 8]}
                cursor={onSeriesItemClick ? "pointer" : "default"}
                onClick={(barObj) => {
                  if (!onSeriesItemClick) return;
                  onSeriesItemClick(barObj?.payload, s.key);
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // LINE
  if (type === "line") {
    const s0 = series?.[0] || { key: "value", name: "Value" };
    return (
      <div className="dash-chart">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={chartMargin}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend ? <Legend /> : null}
            <Line type="monotone" dataKey={s0.key} name={s0.name || s0.key} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // AREA
  if (type === "area") {
    const s0 = series?.[0] || { key: "value", name: "Value" };
    return (
      <div className="dash-chart">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={chartMargin}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null}
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {showLegend ? <Legend /> : null}
            <Area type="monotone" dataKey={s0.key} name={s0.name || s0.key} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return <div className="muted-text">Unsupported chart type: {type}</div>;
}
