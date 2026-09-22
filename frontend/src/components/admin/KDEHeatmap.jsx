import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Loader2, AlertCircle, Maximize2, Zap, Filter, Trophy, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { analyticsAPI, reportAPI } from '../../api';

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Filter points to ensure they stay on land (Talisay/Silay land bounds: Lat 10.68 - 10.82, Lng 122.968 - 123.05)
    const landPoints = points.filter(p => p[0] >= 10.68 && p[0] <= 10.82 && p[1] >= 122.968 && p[1] <= 123.05);
    const validPoints = landPoints.length > 0 ? landPoints : points;

    const heatLayer = L.heatLayer(validPoints, {
      radius: 18,
      blur: 10,
      maxZoom: 17,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const KDEHeatmap = ({ incidentTypes = [] }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('ALL');
  const [rankingData, setRankingData] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchKDEData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = selectedType !== 'ALL' ? { incident_type_id: selectedType } : {};
      const response = await analyticsAPI.getKDE(params);
      const kdePayload = response.data?.data?.data || response.data?.data || response.data;
      if (Array.isArray(kdePayload) && kdePayload.length > 0) {
        setData(kdePayload);
      } else if (kdePayload && Array.isArray(kdePayload.data) && kdePayload.data.length > 0) {
        setData(kdePayload.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error loading KDE heatmap data", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankingData = async () => {
    try {
      const params = selectedType !== 'ALL' ? { incident_type_id: selectedType } : {};
      const res = await analyticsAPI.getByBarangay(params);
      setRankingData(res.data?.data || []);
    } catch (err) {
      console.error("Error loading barangay ranking data", err);
      setRankingData([]);
    }
  };

  useEffect(() => {
    fetchKDEData();
    fetchRankingData();
  }, [selectedType]);

  const handleExport = async (format) => {
    const toastId = toast.loading(`Generating ${format.toUpperCase()} export...`);
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      const params = {
        includeHistorical: 'true',
        ...(selectedType !== 'ALL' ? { type_id: selectedType } : {})
      };
      const response = await reportAPI.export(format, params);

      let blobType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (format === 'csv') blobType = 'text/csv';
      if (format === 'pdf') blobType = 'application/pdf';

      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KDE_Density_Report_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('Export error:', err);
      toast.error(err.response?.data?.message || 'Failed to generate export', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-4 p-6">
      {/* Top Bar with Export & Incident Type Filter Dropdown */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Zap className="text-orange-500 w-5 h-5" />
            KDE Incident Density Analysis
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
            Heatmap Visualization • Kernel Density Estimation
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Incident Type Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Filter size={14} className="text-indigo-600 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Incident Types</option>
              {(incidentTypes && incidentTypes.length > 0 ? incidentTypes : [
                { type_id: 'Fire Incident', name: 'Fire Incident' },
                { type_id: 'Flood/Typhoon', name: 'Flood/Typhoon' },
                { type_id: 'Vehicular Accident', name: 'Vehicular Accident' },
                { type_id: 'Infrastructure Damage', name: 'Infrastructure Damage' },
                { type_id: 'Medical Emergency', name: 'Medical Emergency' },
                { type_id: 'Landslide', name: 'Landslide' },
                { type_id: 'Other Emergency', name: 'Other Emergency' }
              ]).map((type) => (
                <option key={type.type_id || type.name} value={type.type_id || type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors shadow-indigo-600/20 shadow-sm text-xs active:scale-95"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-fade-in">
                <button onClick={() => handleExport('xlsx')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 font-medium">
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Export as Excel
                </button>
                <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 font-medium">
                  <FileText size={14} className="text-sky-600" /> Export as CSV
                </button>
                <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium">
                  <FileText size={14} className="text-rose-600" /> Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="relative bg-slate-50 rounded-xl overflow-hidden h-[420px] border border-slate-100">
        {loading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-600">Calculating density clusters...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              onClick={fetchKDEData}
              className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        ) : (
          <MapContainer
            center={[10.7421, 122.9688]}
            zoom={13}
            className="w-full h-full grayscale-[0.3] contrast-[1.05]"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data && <HeatmapLayer points={data} />}
          </MapContainer>
        )}

        {/* Intensity Scale Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur shadow-md border border-slate-200 rounded-xl p-3 text-[10px] font-bold">
          <p className="text-slate-400 uppercase tracking-tighter mb-1.5">Intensity Scale</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-black italic">LOW</span>
            <div className="w-20 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-lime-500 to-red-500"></div>
            <span className="text-red-600 font-black italic">CRITICAL</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          </div>
        </div>

        {/* Algorithm Badge */}
        <div className="absolute top-4 right-4 z-[400]">
          <div className="bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-xl border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            KDE ALGORITHM ACTIVE
          </div>
        </div>
      </div>

      {/* Incident Rankings by Barangay / District Table (Below Map) */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            Incident Volume Ranking by Barangay / District
          </h4>
          <span className="text-xs text-slate-500 font-medium">Ranked by Highest Incident Frequency</span>
        </div>

        {rankingData.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl">
            No incident ranking records available for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Barangay / Location</th>
                  <th className="px-4 py-3">District / City</th>
                  <th className="px-4 py-3 text-right">Total Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rankingData.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${idx === 0 ? 'bg-amber-100 text-amber-700 font-black' :
                          idx === 1 ? 'bg-slate-200 text-slate-700 font-black' :
                            idx === 2 ? 'bg-amber-700/10 text-amber-900 font-black' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{item.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">Talisay City (3rd District)</td>
                    <td className="px-4 py-2.5 text-right font-black text-indigo-600">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KDEHeatmap;
