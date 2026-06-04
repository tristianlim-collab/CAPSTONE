
import React, { useState } from 'react';
import { 
  BookOpen, FileText, Map, PieChart, Shield, 
  ChevronRight, HelpCircle, Download, CheckCircle2,
  Clock, AlertTriangle, Truck, Search, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', name: 'Getting Started', icon: <HelpCircle size={18} /> },
    { id: 'module-1-1', name: 'Incident Reporting (1.1)', icon: <FileText size={18} /> },
    { id: 'module-1-2', name: 'Dispatch & Alerting (1.2)', icon: <Truck size={18} /> },
    { id: 'module-1-3', name: 'Geospatial Maps (1.3)', icon: <Map size={18} /> },
    { id: 'module-1-4', name: 'Analytics & Trends (1.4)', icon: <PieChart size={18} /> },
    { id: 'module-1-5', name: 'Security & Reports (1.5)', icon: <Shield size={18} /> },
  ];

  const content = {
    'getting-started': {
      title: 'Welcome to GAOIRS',
      description: 'The Geospatial Approach to Optimize Incident Response System (GAOIRS) is designed to streamline how emergencies are reported and managed at the local government level.',
      steps: [
        { title: 'Login', text: 'Sign in using your authorized credentials. Roles include Admin, Response Unit, and Reporter.' },
        { title: 'Dashboard', text: 'View the real-time summary of active incidents and response status across your jurisdiction.' },
        { title: 'Connectivity', text: 'Ensure you have a stable internet connection for real-time map updates and push notifications.' }
      ]
    },
    'module-1-1': {
      title: '1.1 Incident Report Recording',
      description: 'This module allows authorized users to submit and manage digital incident reports.',
      features: [
        'Automatic GPS Location capture.',
        'Support for up to 5 high-resolution photo evidences.',
        'Incidents categorized by type (Fire, Medical, Road Accident, etc.).',
        'Verification queue for quality control before dispatch.'
      ]
    },
    'module-1-2': {
      title: '1.2 Incident Response & Alerting',
      description: 'Automated coordination of emergency personnel based on proximity and unit type.',
      features: [
        'Nearest Responder Detection: Automatically identifies units closest to the scene.',
        'Multi-Channel Alerts: Dispatch notifications sent via SMS, Email, and Push Notifications.',
        'Response Dashboard: Real-time tracking of unit arrival and scene status.'
      ]
    },
    'module-1-3': {
      title: '1.3 Geospatial Mapping',
      description: 'Visualization of incidents and jurisdictional boundaries on an interactive map.',
      features: [
        'Color-Coded Markers: Severity (Critical=Red, High=Orange, etc.).',
        'Geofencing: Automatic assignment of incidents to the correct Barangay or LGU zone.',
        'Boundary Layers: Visual representation of jurisdictional lines.'
      ]
    },
    'module-1-4': {
      title: '1.4 Monitoring and Analysis',
      description: 'Real-time monitoring and data-driven pattern analysis.',
      features: [
        'KDE Heatmaps: Visualization of incident density and hotspots.',
        'Trend Analysis: Temporal and spatial pattern recognition.',
        'ML Forecasting: 7-day predictive analytics for resource planning.'
      ]
    },
    'module-1-5': {
      title: '1.5 Security and Reports',
      description: 'Strict access control and automated report generation.',
      features: [
        'Role-Based Access Control (RBAC) powered by JWT.',
        'Full System Audit Logs for every action taken.',
        'Multi-Format Exports: Download reports in PDF, XLSX, and CSV.'
      ]
    }
  };

  const curr = content[activeSection];

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-lg">
        <div>
          <h2 className="text-3xl font-black tracking-tight">System User Guide</h2>
          <p className="text-indigo-100 opacity-90 mt-2 font-medium">Objective 4: Operational Manual & Documentation</p>
        </div>
        <div className="hidden sm:block">
          <BookOpen size={64} className="opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">User Manual Sections</p>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                activeSection === s.id 
                ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span className={activeSection === s.id ? 'text-indigo-500' : 'text-slate-400'}>{s.icon}</span>
              {s.name}
            </button>
          ))}
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
             <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Download size={14} /> Documentation
             </h4>
             <p className="text-[11px] text-indigo-600 leading-relaxed font-medium">
               Need a hard copy? You can export this guide as a PDF for offline reference.
             </p>
             <button className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-bold hover:bg-indigo-700 transition-colors shadow-sm">
               Download PDF
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {sections.find(s => s.id === activeSection).icon}
                  </div>
                  {curr.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{curr.description}</p>
              </div>

              <div className="h-px bg-slate-100" />

              {activeSection === 'getting-started' ? (
                <div className="grid gap-4">
                  {curr.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-xs text-indigo-600 border border-indigo-50 shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Key Functionalities</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {curr.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-800">
                        <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                        <span className="text-xs font-semibold">{feat}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Pro Tip</h4>
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      Toggle the <strong>Dark Mode</strong> in the top header to reduce eye strain during evening monitoring sessions. All charts and maps automatically adjust their contrast for high visibility.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
