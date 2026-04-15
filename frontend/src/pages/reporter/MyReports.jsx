import React from 'react';
import { ChevronLeft, FileText, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyReports = () => {
  const navigate = useNavigate();

  // Mock data for display
  const reports = [
    { id: 'INC-2026-001', type: 'Medical Emergency', status: 'Pending', date: 'Oct 12, 10:30 AM', location: '123 Main St' },
    { id: 'INC-2026-002', type: 'Fire incident', status: 'Resolved', date: 'Oct 10, 2:15 PM', location: 'Plaza Area' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Resolved': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-[430px] mx-auto shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="pt-12 pb-4 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10 flex items-center justify-between">
        <button 
          onClick={() => navigate('/reporter/home')}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-slate-800 text-lg">My Reports</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{report.type}</h3>
                  <span className="text-xs text-slate-500">{report.id}</span>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs text-left">
                <Clock className="w-3.5 h-3.5" />
                <span>{report.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs text-right justify-end truncate">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{report.location}</span>
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">You haven't submitted any reports yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
