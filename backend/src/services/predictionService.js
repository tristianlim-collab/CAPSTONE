/**
 * Prediction Service
 * Calls the ML microservice for incident forecasting
 */

import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

const predictionService = {
  /**
   * Get forecast for next N days
   * @param {number} days - Number of days to forecast
   * @param {string} model - Model to use: 'sarima', 'prophet', or 'all'
   * @returns {Promise} Forecast data
   */
  async forecast(days = 7, model = 'prophet') {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/api/predict/${days}`, {
        params: { model, include_ci: 'true' }
      });
      return response.data;
    } catch (error) {
      console.error('Prediction service error:', error.message);
      throw new Error(`Failed to get forecast: ${error.message}`);
    }
  },

  /**
   * Get model comparison metrics
   * @returns {Promise} Comparison data
   */
  async getComparison() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/api/models/comparison`);
      return response.data;
    } catch (error) {
      console.error('Model comparison error:', error.message);
      throw new Error(`Failed to get model comparison: ${error.message}`);
    }
  },

  /**
   * Health check for ML service
   * @returns {Promise} Health status
   */
  async health() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/api/health`);
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },

  /**
   * Train models with custom data
   * @param {Array} dates - Array of date strings
   * @param {Array} counts - Array of incident counts
   * @returns {Promise} Training result
   */
  async train(dates, counts) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/api/train`, {
        dates,
        counts
      });
      return response.data;
    } catch (error) {
      console.error('Training error:', error.message);
      throw new Error(`Failed to train models: ${error.message}`);
    }
  },

  /**
   * Get KDE visualization data
   * @returns {Promise} KDE data
   */
  async kde() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/api/visualize/kde`);
      return response.data;
    } catch (error) {
      console.error('KDE service error:', error.message);
      throw new Error(`Failed to get KDE data: ${error.message}`);
    }
  }
};

export default predictionService;
