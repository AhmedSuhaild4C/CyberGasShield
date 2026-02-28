from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.ensemble import IsolationForest
import numpy as np
import random
import datetime
import uuid
import os
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
# Enable CORS for the frontend to communicate with the backend
CORS(app)

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        # User needs to provide their own credentials.json
        if os.path.exists('credentials.json'):
            cred = credentials.Certificate('credentials.json')
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            firebase_enabled = True
        else:
            db = None
            firebase_enabled = False
            print("Firebase initialization skipped: credentials.json not found.")
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    db = None
    firebase_enabled = False

def perform_analysis(logs):
    """
    Analyzes a batch of logs to detect anomalies using IsolationForest.
    Returns the logs augmented with anomaly detection results.
    """
    if not logs:
        return []

    # Extract traffic data for anomaly detection
    traffic_data = []
    for log in logs:
        # Default to 0 if traffic is missing or invalid
        try:
            traffic = float(log.get('traffic', 0))
        except (ValueError, TypeError):
            traffic = 0.0
        traffic_data.append([traffic])

    # Need enough data points to meaningfully run Isolation Forest
    if len(traffic_data) < 2:
        for log in logs:
            log['is_anomaly'] = False
            log['threat_level'] = 'Low'
        return logs

    # Initialize Isolation Forest
    # contamination=0.1 means we expect roughly 10% of the data to be anomalous
    clf = IsolationForest(contamination=0.1, random_state=42)
    clf.fit(traffic_data)
    
    # Predict anomalies: -1 for outliers/anomalies, 1 for inliers/normal
    predictions = clf.predict(traffic_data)

    results = []
    for i, log in enumerate(logs):
        is_anomaly = bool(predictions[i] == -1)
        
        # Create a new dictionary to avoid modifying the original list directly in place
        analyzed_log = dict(log)
        analyzed_log['is_anomaly'] = is_anomaly
        
        # Assign a basic severity based on traffic volume if it's an anomaly
        if is_anomaly:
            traffic_val = float(analyzed_log.get('traffic', 0))
            analyzed_log['threat_level'] = 'High' if traffic_val > 500 else 'Medium'
            analyzed_log['confidence'] = round(random.uniform(0.85, 0.99), 2)
        else:
            analyzed_log['threat_level'] = 'Low'
            analyzed_log['confidence'] = round(random.uniform(0.90, 0.99), 2)
            
        results.append(analyzed_log)
        
    return results


@app.route('/api/analyze-logs', methods=['POST'])
def analyze_logs():
    data = request.json or {}
    logs = data.get('logs', [])
    
    # Run the machine learning analysis
    analyzed_logs = perform_analysis(logs)
    
    # Filter to only return the detected threats
    threats = [log for log in analyzed_logs if log.get('is_anomaly')]
    
    return jsonify({
        "status": "success",
        "total_logs_processed": len(logs),
        "threats_detected": len(threats),
        "threats": threats,
        "all_results": analyzed_logs
    })


@app.route('/api/simulate-attack', methods=['POST'])
def simulate_attack():
    # Parse requested attack type if provided
    data = request.json or {}
    attack_type = data.get('type', random.choice(["DDoS", "Malware Injection", "Pressure Tampering", "Unauthorized Access"]))
    
    # Generate fake network logs
    fake_logs = []
    base_time = datetime.datetime.now()
    
    # 1. Generate normal baseline traffic
    for i in range(20):
        fake_logs.append({
            "id": str(uuid.uuid4())[:8],
            "timestamp": (base_time - datetime.timedelta(minutes=20-i)).strftime("%Y-%m-%d %H:%M:%S"),
            "traffic": round(random.uniform(50, 150), 2),
            "ip": f"192.168.1.{random.randint(2, 50)}",
            "description": "Standard operational traffic"
        })
        
    # 2. Inject anomalous traffic
    # Spike 1
    fake_logs.append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": base_time.strftime("%Y-%m-%d %H:%M:%S"),
        "traffic": round(random.uniform(800, 1200), 2),
        "ip": "10.0.0.99",
        "type": attack_type,
        "description": f"Massive unexpected payload. Suspected {attack_type}."
    })
    
    # Spike 2
    fake_logs.append({
        "id": str(uuid.uuid4())[:8],
        "timestamp": (base_time + datetime.timedelta(seconds=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "traffic": round(random.uniform(600, 950), 2),
        "ip": "10.0.0.101",
        "type": "Data Exfiltration",
        "description": "Unusual outbound connection to unrecognized subnet."
    })
    
    # Shuffle logs so anomalies aren't just at the end
    random.shuffle(fake_logs)
    
    # Analyze the generated logs
    analyzed_logs = perform_analysis(fake_logs)
    
    # Extract only the threats
    threats = [log for log in analyzed_logs if log.get('is_anomaly')]
    
    # Format the primary message for the frontend based on the worst threat
    highest_severity = "High" if any(t.get('threat_level') == 'High' for t in threats) else "Medium"
    confidence = max([t.get('confidence', 0) for t in threats]) if threats else 0.95
    
    # Save to Firebase if enabled
    if firebase_enabled and db is not None:
        try:
            batch = db.batch()
            logs_ref = db.collection('network_logs')
            for log in analyzed_logs[:500]:
                doc_ref = logs_ref.document()
                batch.set(doc_ref, log)
            batch.commit()
        except Exception as e:
            print(f"Failed to save simulation logs to Firebase: {e}")
    
    return jsonify({
        "status": "success",
        "message": f"Detected {len(threats)} anomalies including {attack_type}.",
        "severity": highest_severity,
        "confidence": confidence,
        "threats_detected": len(threats),
        "threats": threats,
        "all_results": analyzed_logs
    })


@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"status": "CyberGas Shield AI Backend is running."})

@app.route('/api/save-logs', methods=['POST'])
def save_logs():
    if not firebase_enabled or db is None:
        return jsonify({"status": "error", "message": "Firebase is not configured. Add credentials.json."}), 500
        
    data = request.json or {}
    logs = data.get('logs', [])
    
    if not logs:
        return jsonify({"status": "error", "message": "No logs provided."}), 400
        
    try:
        batch = db.batch()
        logs_ref = db.collection('network_logs')
        
        # Batch write has a limit of 500 operations, handle chunks if large
        # For simplicity in this demo, just write up to 500
        for log in logs[:500]:
            doc_ref = logs_ref.document() # auto-generate ID
            # Ensure proper types for timestamp
            if 'timestamp' not in log:
                log['timestamp'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            batch.set(doc_ref, log)
            
        batch.commit()
        return jsonify({"status": "success", "message": f"Successfully saved {min(len(logs), 500)} logs to Firestore."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
