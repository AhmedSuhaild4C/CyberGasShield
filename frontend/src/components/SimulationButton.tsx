"use client";

import React, { useState } from "react";
import axios from "axios";

interface Props {
  onResult: (data: any) => void;
}

export default function SimulationButton({ onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const triggerSimulation = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // Hit the Python backend
      const response = await axios.post("http://localhost:5000/api/simulate-attack", { 
        type: ["DDoS", "Malware Injection", "Unauthorized Access", "Pressure Tampering"][Math.floor(Math.random() * 4)] 
      });
      
      const { message, confidence, all_results, threats } = response.data;
      setStatus(`Success: ${message} (Confidence: ${confidence})`);

      // Pass the data up to the parent dashboard instead of using a global event
      onResult({ all_results, threats });

    } catch (error) {
      setStatus("Failed to trigger simulation. Make sure the backend (port 5000) is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-gray-100">Threat Simulation</h3>
      <p className="text-gray-400 mb-4 text-sm flex-grow">
        Generate fake network logs and send them to the backend API for IsolationForest anomaly detection.
      </p>
      <button
        onClick={triggerSimulation}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 border border-red-500"
      >
        {loading ? "Simulating..." : "Generate & Analyze Logs"}
      </button>

      {status && (
        <p className={`mt-3 text-sm font-medium ${status.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
          {status}
        </p>
      )}
    </div>
  );
}
