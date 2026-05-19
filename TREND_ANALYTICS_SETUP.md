# Trend Analytics Integration Guide

## Overview
Complete trend forecasting system integrated into GAOIRS Admin Dashboard. Uses SARIMA and Prophet algorithms for 7+ day incident predictions.

## Setup Instructions

### 1. Python ML Service Setup

#### Prerequisites
- Python 3.8+
- pip

#### Installation

```bash
cd ml-service
pip install -r requirements.txt
```

#### Run the Service

```bash
python prediction_service.py
```

The service will start on `http://localhost:5000`

**Output:**
```
✓ ML Service running on http://0.0.0.0:5000
✓ Models pre-trained with synthetic data
✓ Ready to accept requests
```

### 2. Backend Configuration

The backend now includes forecasting endpoints. No additional setup required, but ensure the ML service is running.

**New Routes:**
- `GET /api/analytics/forecast/:days` - Get forecast for N days
- `GET /api/analytics/models/comparison` - Get model metrics
- `GET /api/analytics/prediction/health` - Check ML service health

**Environment Variables** (optional):
Add to `.env`:
```
ML_SERVICE_URL=http://localhost:5000
```

### 3. Frontend Integration

The Analytics page (`/admin/analytics`) now includes the TrendForecast component.

**Features:**
- 📊 Interactive forecast chart
- 🔄 Model selection (SARIMA, Prophet)
- 📈 Statistics cards (Average, Trend, Peak)
- 🏆 Champion model highlighting
- 🔄 Refresh functionality
- ⚠️ Error handling

### 4. Testing the Integration

#### Test ML Service Health
```bash
curl http://localhost:5000/api/health
# Expected response:
# {"status":"healthy","models_trained":true,"last_update":"2024-..."}
```

#### Test Forecast Endpoint
```bash
curl "http://localhost:5001/api/analytics/forecast/7?model=sarima"
# Expected response:
# {"success":true,"data":{...},"message":"Forecast for next 7 days fetched"}
```

#### Access in App
1. Login as ADMIN
2. Navigate to `/admin/analytics`
3. See the TrendForecast component with 7-day forecast
4. Change model using dropdown
5. Click "Refresh" to reload predictions

---

## API Endpoints Reference

### PythonML Service (Port 5000)

#### Get Forecast
```
GET /api/predict/<days>?model=sarima&include_ci=true

Query Parameters:
- model: sarima | prophet | all (default: sarima)
- include_ci: true | false (default: true)

Response:
{
  "success": true,
  "days_ahead": 7,
  "predictions": {
    "sarima": {
      "predictions": [12, 14, 13, 16, 15, 18, 17],
      "dates": ["2024-01-15", ...],
      "model_type": "SARIMA",
      "accuracy_metrics": {"aic": 234.56, "bic": 245.67}
    }
  },
  "timestamp": "2024-01-14T10:30:00"
}
```

#### Model Comparison
```
GET /api/models/comparison

Response:
{
  "models": [
    {
      "name": "SARIMA",
      "aic": 234.56,
      "status": "available"
    },
    {
      "name": "Prophet",
      "status": "available"
    },
    {
      "name": "Moving Average",
      "status": "available"
    }
  ],
  "champion": "SARIMA"
}
```

### Node.js Backend (Port 3001+)

#### Get Forecast via Backend
```
GET /api/analytics/forecast/7?model=sarima

Response:
{
  "success": true,
  "message": "Forecast for next 7 days fetched",
  "data": {
    "success": true,
    "days_ahead": 7,
    "predictions": {...}
  }
}
```

#### Get Model Comparison via Backend
```
GET /api/analytics/models/comparison

Response:
{
  "success": true,
  "message": "Model comparison fetched",
  "data": {
    "models": [...],
    "champion": "SARIMA"
  }
}
```

---

## Component Usage

### TrendForecast Component

```jsx
import TrendForecast from '@/components/admin/TrendForecast';

// Basic usage
<TrendForecast days={7} />

// With error callback
<TrendForecast
  days={7}
  onError={(error) => console.log(error)}
/>
```

**Props:**
- `days` (number): Days to forecast (default: 7)
- `onError` (function): Callback for errors (optional)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         React Admin Dashboard               │
│      (/admin/analytics)                     │
│    [TrendForecast Component]                │
└────────────────┬────────────────────────────┘
                 │
                 │ API Call
                 ▼
┌─────────────────────────────────────────────┐
│      Node.js Express Backend                │
│   (/api/analytics/forecast/:days)           │
│  [analyticsController.js]                   │
└────────────────┬────────────────────────────┘
                 │
                 │ HTTP (axios)
                 ▼
┌─────────────────────────────────────────────┐
│    Python Flask ML Service                  │
│      (Port 5000)                            │
│  - SARIMA Model                             │
│  - Prophet Model                            │
│  - Seasonal Decomposition                   │
└─────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Forecast Unavailable"
**Solution:**
1. Check ML service is running: `curl http://localhost:5000/api/health`
2. Check environment variable `ML_SERVICE_URL` if not localhost
3. Verify port 5000 is not in use

### Issue: Connection Refused
**Solution:**
1. Ensure Python ML service is running
2. Check firewall settings
3. Verify both services on same network

### Issue: Slow forecast response
**Solution:**
1. First request trains models (slow initially)
2. Subsequent requests are faster
3. Check CPU usage on ML service

### Issue: Models not trained
**Solution:**
1. Service auto-trains on first request with synthetic data
2. To train with real data, POST to `/api/train` endpoint

---

## Future Enhancements

- [ ] Real-time incident data integration
- [ ] Custom date range selection
- [ ] Export forecast as PDF/CSV
- [ ] Confidence interval visualization
- [ ] Geospatial forecast by barangay
- [ ] Historical accuracy tracking
- [ ] Auto-retraining scheduler
- [ ] Multiple incident type forecasts

---

## Files Created/Modified

### New Files:
- `ml-service/prediction_service.py` - Flask ML microservice
- `ml-service/requirements.txt` - Python dependencies
- `backend/src/services/predictionService.js` - Service wrapper
- `frontend/src/components/admin/TrendForecast.jsx` - React component

### Modified Files:
- `backend/src/controllers/analyticsController.js` - Added forecast functions
- `backend/src/routes/analyticsRoutes.js` - Added forecast routes
- `frontend/src/pages/admin/Analytics.jsx` - Integrated TrendForecast
- `frontend/src/api/index.js` - Added forecast API methods

---

## Support

For issues or questions about the trend analytics integration, refer to the main CAPSTONE project documentation or contact the development team.
