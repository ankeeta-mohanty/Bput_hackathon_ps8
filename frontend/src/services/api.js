/**
 * Central API Client for ESG Reporting Portal
 * Direct REST communication with Node.js/Express backend
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * GET /api/health
 * Queries real backend and MongoDB status
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      server: 'offline',
      database: 'disconnected',
      error: error.message || 'Unable to connect to backend server',
      timestamp: new Date().toISOString(),
      details: {
        readyState: 'disconnected',
        note: 'Backend server unreachable. Ensure backend is running on port 5000.',
      },
    };
  }
};

/**
 * GET /api/sites
 * Queries ProjectSites directly from MongoDB
 */
export const getSites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/sites`);
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      data: [],
      message: error.message || 'Network error querying sites',
    };
  }
};

export default {
  checkHealth,
  getSites,
};
