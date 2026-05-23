import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const TrendForecast = ({ days = 7, onError = null }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('prophet');
  const [models, setModels] = useState([]);
  const [champion, setChampion] = useState('Prophet');

  // Format chart data
  const formatChartData = (predictions, dates) => {
    if (!predictions || !dates) return [];

    return dates.slice(0, days).map((date, index) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      predicted: Math.round(predictions[index] || 0),
      index
    }));
  };

  // Fetch forecast data
  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Get forecast
      const forecastRes = await fetch(
        `/api/analytics/forecast/${days}?model=prophet`,
        { headers }
      );

      if (!forecastRes.ok) {
        throw new Error('Failed to fetch forecast');
      }

      const forecastData = await forecastRes.json();

      // Get model comparison
      const comparisonRes = await fetch('/api/analytics/models/comparison', { headers });
      const comparisonData = await comparisonRes.json();

      if (comparisonData?.data?.models) {
        setModels(comparisonData.data.models);
        setChampion(comparisonData.data.champion || 'Prophet');
      }

      setForecast(forecastData);
    } catch (err) {
      const errorMsg = err.message || 'Failed to load forecast data';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [days]);

  // Extract data from forecast
  const getChartData = () => {
    if (!forecast?.data?.predictions) return [];

    const modelData = forecast.data.predictions['prophet'];
    if (!modelData) return [];

    return formatChartData(modelData.predictions, modelData.dates);
  };

  const chartData = getChartData();

  // Calculate statistics
  const getStats = () => {
    if (!chartData || chartData.length === 0) {
      return { avg: 0, trend: 0, max: 0 };
    }

    const values = chartData.map(d => d.predicted);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;

    return {
      avg,
      trend: trend > 0 ? '+' + trend : trend,
      max,
      min,
      trendPercent: values.length > 1 ? Math.round((trend / values[0]) * 100) : 0
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading forecast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <div className="flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Forecast Unavailable</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchForecast}
              className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              {days}-Day Incident Forecast
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Predictive analytics using {selectedModel.toUpperCase()} algorithm
              {champion && selectedModel === champion.toLowerCase() && (
                <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ⭐ Champion Model
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchForecast}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors shadow-sm text-sm active:scale-95"
            >
              <RefreshCw size={16} />
              Refresh Forecast
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Avg. Predicted</p>
            <p className="text-2xl font-black text-indigo-900 mt-2">{stats.avg}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Trend</p>
            <p className={`text-2xl font-black mt-2 ${stats.trendPercent >= 0 ? 'text-orange-900' : 'text-red-900'}`}>
              {stats.trendPercent >= 0 ? '↑' : '↓'} {Math.abs(stats.trendPercent)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Peak Day</p>
            <p className="text-2xl font-black text-emerald-900 mt-2">{stats.max}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Low Day</p>
            <p className="text-2xl font-black text-purple-900 mt-2">{stats.min}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-bold text-slate-800 mb-6">Forecast Timeline</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value) => [Math.round(value), 'Incidents']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPredicted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Model Details */}
      {models.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h4 className="font-bold text-slate-800 mb-4">Model Comparison</h4>
          <div className="space-y-3">
            {models.map((model, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  champion === model.name
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{model.name}</p>
                    {model.aic && (
                      <p className="text-xs text-slate-600 mt-1">
                        AIC: {model.aic.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold rounded-lg px-3 py-1 ${
                      champion === model.name
                        ? 'bg-green-200 text-green-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {champion === model.name ? '🏆 Champion' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendForecast;
