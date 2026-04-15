const fs = require('fs');
const path = require('path');

const frontendResponse = {
  // ---------------- RESPONSE UNIT ----------------
  'frontend/src/pages/response/ShiftStart.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function ShiftStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const startShift = async () => {
    setLoading(true);
    // API Call to Update unit status to 'AVAILABLE'
    setTimeout(() => {
      toast.success("Shift Started - You are now active.");
      navigate('/response/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex p-8 justify-center items-center">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-sm w-full">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Start Shift</h2>
        <p className="text-slate-500 mb-8">Go online to receive incident dispatch requests and update your Live Map location.</p>
        <Button size="lg" fullWidth variant="primary" loading={loading} onClick={startShift}>GO ONLINE</Button>
      </div>
    </div>
  );
}
`,

  'frontend/src/pages/response/ResponseDashboard.jsx': `import React from 'react';
import { Link } from 'react-router-dom';

export default function ResponseDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Response Dashboard</h1>
          <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full">AVAILABLE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/response/incidents" className="p-6 bg-white rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-bold text-slate-700">Assigned Incidents</h3>
            <p className="mt-2 text-slate-500">View your active dispatches.</p>
            <div className="mt-4 text-3xl font-black text-orange-500">2</div>
          </Link>
          
          <Link to="/response/map" className="p-6 bg-white rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-bold text-slate-700">Live Map</h3>
            <p className="mt-2 text-slate-500">View real-time incident locations in your coverage area.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
`,

  // ---------------- ADMIN PAGES ----------------
  'frontend/src/pages/admin/AdminDashboard.jsx': `import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">Admin Dashboard</h1>
        <div className="text-sm bg-white px-4 py-2 rounded-lg shadow">Real-time Sync Active</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {['Active Incidents', 'Units Deployed', 'Resolved Today', 'Pending Alerts'].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-slate-500 text-sm uppercase tracking-wider">{stat}</h4>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-800">{Math.floor(Math.random() * 50) + 1}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-96 flex flex-col justify-center items-center text-slate-400">
          [Live Incident Map Component / Heatmap Layer Here]
        </div>
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto h-96">
          <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Recent Dispatches</h3>
          <div className="space-y-4">
            <div className="text-sm p-3 bg-red-50 text-red-900 rounded">FIRE-INC-102 assigned to Engine 04</div>
            <div className="text-sm p-3 bg-blue-50 text-blue-900 rounded">MED-INC-492 resolved by Ambulance 2</div>
            <div className="text-sm p-3 bg-orange-50 text-orange-900 rounded">RESCUE-INC-13 reported in Bgry. Pinyahan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(frontendResponse)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Frontend Response and Admin Dashboard pages generated');
