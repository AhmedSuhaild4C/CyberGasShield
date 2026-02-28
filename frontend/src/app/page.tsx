"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/utils/firebase";
import DashboardChart from "@/components/DashboardChart";
import Alerts, { Alert } from "@/components/Alerts";
import SimulationButton from "@/components/SimulationButton";
import LogUploader from "@/components/LogUploader";

const initialAlerts: Alert[] = [
  {
    id: "demo-1",
    type: "Pressure Anomaly",
    severity: "High",
    timestamp: "10 mins ago",
    description: "Unusual pressure spike detected at Valve Station 4.",
  },
  {
    id: "demo-2",
    type: "Unauthorized Access",
    severity: "Medium",
    timestamp: "1 hour ago",
    description: "Repeated failed login attempts on SCADA terminal A.",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<Alert[]>(initialAlerts);

  useEffect(() => {
    // Check local storage for auth
    const auth = localStorage.getItem("isAuthenticated");
    if (auth !== "true") {
      router.push("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, "network_logs"), limit(100));
        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => doc.data());
        
        if (logs.length > 0) {
          setLogsData(logs);
          
          const threats = logs.filter((log: any) => log.is_anomaly);
          if (threats.length > 0) {
            const newAlerts = threats.map((t: any) => ({
              id: t.id || Math.random().toString(),
              type: t.type || "Anomaly Detected",
              severity: t.threat_level || "Medium",
              timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
              description: t.description || `Anomalous traffic of ${t.traffic} MB/s detected from ${t.ip || 'unknown IP'}.`,
            }));
            
            setAlertsData((prev) => {
              const existingIds = new Set(prev.map(a => a.id));
              const uniqueNewAlerts = newAlerts.filter(a => !existingIds.has(a.id));
              return [...uniqueNewAlerts, ...prev];
            });
          }
        }
      } catch (error) {
        console.error("Error fetching logs from Firebase:", error);
      }
    };
    
    if (isAuth) {
      fetchLogs();
    }
  }, [isAuth]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  const handleAnalysisResult = (data: any) => {
    if (data.all_results) {
      setLogsData(data.all_results);
    }
    
    if (data.threats && data.threats.length > 0) {
      const newAlerts = data.threats.map((t: any) => ({
        id: t.id || Math.random().toString(),
        type: t.type || "Anomaly Detected",
        severity: t.threat_level || "Medium",
        timestamp: t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
        description: t.description || `Anomalous traffic of ${t.traffic} MB/s detected from ${t.ip || 'unknown IP'}.`,
      }));
      // Prepend new alerts to the list
      setAlertsData((prev) => [...newAlerts, ...prev]);
    }
  };

  if (!isAuth) return null; // Prevent hydration mismatch / flash of unauthenticated content

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">CyberGas Shield Dashboard</h1>
            <p className="text-gray-400 mt-2">AI-powered threat detection for gas networks</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-700"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Chart Section */}
            <DashboardChart logs={logsData} />
            
            {/* Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SimulationButton onResult={handleAnalysisResult} />
              <LogUploader onResult={handleAnalysisResult} />
            </div>
          </div>

          {/* Alerts Section */}
          <div className="lg:col-span-1">
            <Alerts alerts={alertsData} />
          </div>
        </div>
      </div>
    </div>
  );
}
