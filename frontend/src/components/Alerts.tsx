"use client";

import React from "react";

export type Alert = {
  id: string;
  type: string;
  severity: "High" | "Medium" | "Low";
  timestamp: string;
  description: string;
};

interface Props {
  alerts: Alert[];
}

export default function Alerts({ alerts }: Props) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 h-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-100">Recent Threats</h3>
      
      {alerts.length === 0 ? (
        <p className="text-gray-500 text-sm">No threats detected yet. Run a simulation or upload logs.</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-200">{alert.type}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    alert.severity === "High"
                      ? "bg-red-900/50 text-red-400 border border-red-800"
                      : alert.severity === "Medium"
                      ? "bg-yellow-900/50 text-yellow-400 border border-yellow-800"
                      : "bg-blue-900/50 text-blue-400 border border-blue-800"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-gray-400">{alert.description}</p>
              <span className="text-xs text-gray-500">{alert.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
