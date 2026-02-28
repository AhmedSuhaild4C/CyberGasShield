"use client";

import React, { useState } from "react";
import axios from "axios";

interface Props {
  onResult: (data: any) => void;
}

export default function LogUploader({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [logInput, setLogInput] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setStatus(null);
    try {
      let parsedLogs;
      try {
        parsedLogs = JSON.parse(logInput);
        if (!Array.isArray(parsedLogs)) {
            parsedLogs = [parsedLogs];
        }
      } catch (err) {
        setStatus("Invalid JSON format. Please ensure it is an array of objects.");
        setLoading(false);
        return;
      }

      const response = await axios.post("http://localhost:5000/api/analyze-logs", { 
        logs: parsedLogs
      });
      
      const { threats_detected, all_results, threats } = response.data;
      setStatus(`Analysis complete. Detected ${threats_detected} threats.`);

      onResult({ all_results, threats });
      setLogInput(""); // clear input after success
    } catch (error) {
      setStatus("Failed to analyze logs. Is backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-gray-100">Upload Custom Logs</h3>
      <p className="text-gray-400 mb-2 text-sm">
        Paste JSON array of logs to analyze via AI.
      </p>
      <textarea
        value={logInput}
        onChange={(e) => setLogInput(e.target.value)}
        placeholder={`[\n  { "timestamp": "12:00", "traffic": 100, "ip": "10.0.0.1" }\n]`}
        className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-lg p-2 text-sm flex-grow mb-4 resize-none h-24 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-600"
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !logInput.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 border border-blue-500"
      >
        {loading ? "Analyzing..." : "Analyze Custom Logs"}
      </button>

      {status && (
        <p className={`mt-3 text-sm font-medium ${status.includes("Failed") || status.includes("Invalid") ? "text-red-400" : "text-green-400"}`}>
          {status}
        </p>
      )}
    </div>
  );
}
