# CyberGas Shield

AI-powered platform for detecting cyber threats in gas networks using machine learning on logs.

## Firebase Setup Instructions

To enable persistent log storage across both the frontend and backend, you must configure Firebase.

### 1. Backend Setup
The backend uses `firebase-admin` to securely save processed network logs to Firestore.
- Generate a Private Key from your Firebase Console: **Project Settings > Service Accounts > Generate New Private Key**.
- Rename the downloaded JSON file to `credentials.json`.
- Place `credentials.json` directly inside the `backend` folder (`/backend/credentials.json`).
- When the Flask server starts, it will automatically detect the credentials and initialize the connection. 
- You can now use the `POST /api/save-logs` endpoint.

### 2. Frontend Setup
The frontend fetches the saved logs directly from Firestore to display them dynamically on the dashboard.
- Get your Web App configuration from your Firebase Console: **Project Settings > General > Your Apps**.
- Open (or create) the `frontend/.env.local` file.
- Add your Firebase keys as follows:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

The Next.js dashboard is pre-configured to automatically query the `network_logs` Firestore collection on mount!

## Deployment Instructions

### Vercel (Frontend Deployment)

We have included a `vercel.json` configuration file inside the `frontend` folder for seamless deployment.

1. Ensure you have the Vercel CLI installed: `npm i -g vercel`.
2. Open your terminal and navigate to the frontend directory: `cd frontend`.
3. Run the following command to login to your Vercel account: `vercel login`.
4. Deploy the application to production: `vercel --prod --yes`.
5. *Don't forget to add your Firebase Environment Variables in the Vercel Dashboard Settings!*

**Demo Link:** Once deployed, Vercel will provide your live URL (e.g., `https://cybergas-shield.vercel.app`). Update this README once your live URL is generated!

### Backend Deployment
1. You can deploy the Flask app to Render, Heroku, or an AWS EC2 instance.
2. Remember to update the frontend's Axios API base URL from `http://localhost:5000` to your new live backend URL in `SimulationButton.tsx` and `LogUploader.tsx`.
3. Upload your `credentials.json` via environment variables (like base64 encoding it) or as a secure secret file on your hosting provider.