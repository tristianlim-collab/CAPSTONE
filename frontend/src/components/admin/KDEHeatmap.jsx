import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Loader2, AlertCircle, Maximize2, Zap } from 'lucide-react';
import { analyticsAPI } from '../../api';

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
    map.fitBounds(bounds, { padding: [20, 20] });

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const KDEHeatmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKDEData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsAPI.getKDE();
      // result.data.data because of the way success wrapper works
      setData(response.data.data.data); 
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKDEData();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Zap className="text-orange-500 w-5 h-5" />
            KDE Incident Density Analysis
          </h3>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
            Heatmap Visualization • Kernel Density Estimation (Champion)
          </p>
        </div>
        <button 
          onClick={fetchKDEData}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
          title="Recalculate Density"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="flex-1 relative bg-slate-50">
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
            center={[10.8, 122.9]} 
            zoom={13} 
            className="w-full h-full grayscale-[0.5] contrast-[1.1]"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data && <HeatmapLayer points={data} />}
          </MapContainer>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-xl p-3 text-[10px] font-bold">
          <p className="text-slate-400 uppercase tracking-tighter mb-2">Intensity Scale</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-black italic">LOW</span>
            <div className="w-20 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-lime-500 to-red-500"></div>
            <span className="text-red-600 font-black italic">CRITICAL</span>
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
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
    </div>
  );
};

export default KDEHeatmap;
