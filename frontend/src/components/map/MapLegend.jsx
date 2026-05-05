import React from 'react';

export default function MapLegend() {
  const legendItems = [
    { color: 'bg-red-600', label: 'Critical' },
    { color: 'bg-orange-500', label: 'High' },
    { color: 'bg-green-500', label: 'Low' },
    { color: 'bg-gray-400', label: 'Resolved/Closed' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-xl shadow-lg border border-slate-200">
      <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Incident Severity</h4>
      <div className="space-y-2">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></span>
            <span className="text-sm font-medium text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
