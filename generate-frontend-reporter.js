const fs = require('fs');
const path = require('path');

const frontendFiles = {
  // ---------------- REPORTER PAGES (Mobile First, Dark Theme) ----------------
  'frontend/src/pages/reporter/ReporterHome.jsx': `import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function ReporterHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 max-w-[430px] mx-auto flex flex-col items-center pt-10">
      <h1 className="text-3xl font-bold mb-8">GAOIRS Emergency</h1>
      
      <div className="w-full flex-1 flex flex-col justify-center items-center gap-6 pb-20">
        <button 
          onClick={() => navigate('/reporter/report/step1')}
          className="w-48 h-48 bg-red-600 rounded-full flex flex-col items-center justify-center border-8 border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.5)] active:scale-95 transition-transform"
        >
          <span className="text-white font-bold text-3xl">REPORT</span>
          <span className="text-white text-lg">INCIDENT</span>
        </button>
        <p className="text-slate-400 text-center px-4">Tap the big red button in case of emergency to alert the nearest response unit.</p>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-auto">
        <Button variant="secondary" onClick={() => navigate('/reporter/reports')}>My Reports</Button>
        <Button variant="secondary" onClick={() => navigate('/reporter/profile')}>Profile</Button>
      </div>
    </div>
  );
}
`,

  'frontend/src/pages/reporter/ReportStep1.jsx': `import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function ReportStep1() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error getting location: ", err)
      );
    }
  }, []);

  const handleNext = () => {
    // Save location to session storage or context
    sessionStorage.setItem('incidentLocation', JSON.stringify(location));
    navigate('/reporter/report/step2');
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 max-w-[430px] mx-auto flex flex-col">
      <h1 className="text-2xl font-bold mb-2">Step 1: Location & Type</h1>
      
      <div className="bg-slate-800 p-4 rounded-xl mt-6">
        <h2 className="font-semibold mb-2">Your Location</h2>
        {location ? 
          <p className="text-green-400">GPS Locked: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p> : 
          <p className="text-slate-400">Acquiring GPS...</p>}
      </div>

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Emergency Type</h2>
        <select className="w-full h-12 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white">
          <option value="FIRE">Fire</option>
          <option value="MEDICAL">Medical Emergency</option>
          <option value="POLICE">Crime / Police</option>
          <option value="RESCUE">Rescue / Disaster</option>
        </select>
      </div>

      <div className="mt-auto pt-6 flex gap-4">
        <Button variant="secondary" onClick={() => navigate('/reporter/home')}>Cancel</Button>
        <Button fullWidth onClick={handleNext} disabled={!location}>Next Step</Button>
      </div>
    </div>
  );
}
`,

  'frontend/src/pages/reporter/ReportStep2.jsx': `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { incidentAPI, uploadAPI } from '../../api';
import toast from 'react-hot-toast';

export default function ReportStep2() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const loc = JSON.parse(sessionStorage.getItem('incidentLocation') || '{}');
      
      // 1. Create incident
      const incRes = await incidentAPI.create({
        incident_type_id: '1', // Hardcoded for demo/stage 1
        description,
        latitude: loc.lat || 0,
        longitude: loc.lng || 0,
        severity: 'HIGH'
      });

      // 2. Upload photo if exists
      if (photo) {
        await uploadAPI.uploadPhoto(photo, incRes.data.incident_id);
      }

      toast.success("Incident Reported!");
      navigate('/reporter/report/success');
    } catch (err) {
      toast.error('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 max-w-[430px] mx-auto flex flex-col">
      <h1 className="text-2xl font-bold mb-2">Step 2: Details</h1>

      <div className="mt-4">
        <label className="text-slate-300 block mb-2 text-sm">Add a Photo (Camera)</label>
        <div className="flex border-2 border-dashed border-slate-700 bg-slate-800 rounded-xl h-32 items-center justify-center relative overflow-hidden">
          {photo ? (
            <img src={URL.createObjectURL(photo)} alt="Evidence" className="object-cover w-full h-full opacity-80" />
          ) : (
            <span className="text-slate-400">+ Tap to Open Camera</span>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => setPhoto(e.target.files[0])}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="text-slate-300 block mb-2 text-sm">Description (Optional)</label>
        <textarea 
          rows="4" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe what happened..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="mt-auto pt-6 flex gap-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
        <Button variant="danger" fullWidth onClick={handleSubmit} loading={loading}>SUBMIT REPORT</Button>
      </div>
    </div>
  );
}
`,

  'frontend/src/pages/reporter/ReportSuccess.jsx': `import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function ReportSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-6 max-w-[430px] mx-auto flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
      </div>
      
      <h1 className="text-3xl font-bold text-green-400 mb-2">Report Sent!</h1>
      <p className="text-slate-400 mb-8">Authorities have been notified and are dispatching units to your location.</p>
      
      <Button fullWidth onClick={() => navigate('/reporter/home')}>Return Home</Button>
    </div>
  );
}
`
};

for (const [filePath, content] of Object.entries(frontendFiles)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Frontend Reporter Mobile pages generated');
