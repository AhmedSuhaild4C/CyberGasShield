"use client";

import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  logs?: any[];
}

export default function DashboardChart({ logs = [] }: Props) {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#9ca3af", // text-gray-400
        }
      },
      title: {
        display: true,
        text: "Network Traffic & Anomalies Over Time",
        color: "#f3f4f6", // text-gray-100
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" } // border-gray-700
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af" },
        grid: { color: "#374151" }
      },
    },
  };

  const data = useMemo(() => {
    // Show placeholder data if no logs have been analyzed yet
    if (!logs || logs.length === 0) {
      return {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
        datasets: [
          {
            label: "Normal Traffic (MB/s)",
            data: [120, 115, 200, 310, 290, 180, 110],
            borderColor: "rgb(59, 130, 246)", // blue-500
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            tension: 0.3,
          },
          {
            label: "Threats/Anomalies Detected",
            data: [0, 0, 1, 4, 2, 0, 0],
            borderColor: "rgb(239, 68, 68)", // red-500
            backgroundColor: "rgba(239, 68, 68, 0.5)",
            tension: 0.3,
          },
        ],
      };
    }

    // Sort logs by timestamp chronologically
    const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const labels = sortedLogs.map(l => {
      try {
        const d = new Date(l.timestamp);
        // Format to a readable short time
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch (e) {
        return l.timestamp || "";
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Network Traffic (Anomalies in Red)",
          data: sortedLogs.map(l => l.traffic),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          tension: 0.3,
          // Color points red if they are anomalies, blue if normal
          pointBackgroundColor: sortedLogs.map(l => l.is_anomaly ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)"),
          pointBorderColor: sortedLogs.map(l => l.is_anomaly ? "rgb(239, 68, 68)" : "rgb(59, 130, 246)"),
          // Make anomaly points larger to stand out
          pointRadius: sortedLogs.map(l => l.is_anomaly ? 6 : 3),
        }
      ],
    };
  }, [logs]);

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
      <Line options={options} data={data} />
    </div>
  );
}
