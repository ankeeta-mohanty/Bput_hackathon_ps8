/**
 * Central API Client for ESG Reporting Portal
 * Direct REST communication with Node.js/Express backend
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'esg_auth_token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

const getAuthHeaders = (tokenOverride) => {
  const token = tokenOverride || getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token & user profile
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to connect to authentication server.',
      httpStatus: 0,
    };
  }
};

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile
 */
export const getMe = async (tokenOverride) => {
  const token = tokenOverride || getStoredToken();
  if (!token) {
    return {
      success: false,
      message: 'No active session token.',
      httpStatus: 401,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to verify user session.',
      httpStatus: 0,
    };
  }
};

/**
 * POST /api/auth/logout
 * Notifies backend of logout and clears local token
 */
export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
  } catch {}
  removeStoredToken();
  return { success: true };
};

/**
 * GET /api/health
 * Queries real backend and MongoDB status (diagnostic)
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
 * Queries ProjectSites scoped to user's organizational authority
 */
export const getSites = async (tokenOverride) => {
  const token = tokenOverride || getStoredToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sites`, {
      headers,
    });
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
      httpStatus: 0,
    };
  }
};

/**
 * POST /api/submissions
 * Creates or updates an ESG submission draft with calculation engine execution
 */
export const createOrUpdateSubmission = async (submissionData, tokenOverride) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: getAuthHeaders(tokenOverride),
      body: JSON.stringify(submissionData),
    });
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error saving submission draft',
      httpStatus: 0,
    };
  }
};

/**
 * GET /api/submissions
 * Retrieves submissions filtered by scope and status
 */
export const getSubmissions = async (filters = {}, tokenOverride) => {
  try {
    const query = new URLSearchParams();
    if (filters.siteId) query.set('siteId', filters.siteId);
    if (filters.status) query.set('status', filters.status);
    if (filters.reportingPeriod) query.set('reportingPeriod', filters.reportingPeriod);

    const url = `${API_BASE_URL}/submissions${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(tokenOverride),
    });
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: error.message || 'Network error fetching submissions',
      httpStatus: 0,
    };
  }
};

/**
 * GET /api/submissions/:id
 * Retrieves a single submission by ID
 */
export const getSubmissionById = async (id, tokenOverride) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      headers: getAuthHeaders(tokenOverride),
    });
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error fetching submission details',
      httpStatus: 0,
    };
  }
};

/**
 * POST /api/submissions/:id/submit
 * Submits a draft for subsidiary review
 */
export const submitSubmission = async (id, comments = '', tokenOverride) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(tokenOverride),
      body: JSON.stringify({ comments }),
    });
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error submitting for review',
      httpStatus: 0,
    };
  }
};

/**
 * POST /api/submissions/:id/review
 * Subsidiary manager approves or requests revision
 */
export const reviewSubmission = async (id, { decision, comments }, tokenOverride) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/review`, {
      method: 'POST',
      headers: getAuthHeaders(tokenOverride),
      body: JSON.stringify({ decision, comments }),
    });
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error reviewing submission',
      httpStatus: 0,
    };
  }
};

/**
 * GET /api/analytics/group-rollup
 * Computes consolidated emissions and completeness solely from APPROVED submissions
 */
export const getGroupRollup = async (period = '', tokenOverride) => {
  try {
    const query = new URLSearchParams();
    if (period) {
      query.set('period', period);
      const match = String(period).match(/(?:FY)?(\d{4})[-_\s]?(Q[1-4]|Annual|M\d{2})/i);
      if (match) {
        query.set('year', match[1]);
        query.set('period', match[2].toUpperCase());
      }
    }
    const url = `${API_BASE_URL}/analytics/group-rollup${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(tokenOverride),
    });
    const data = await response.json();
    return {
      ...data,
      data: data.data || data,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Network error retrieving group rollup',
      httpStatus: 0,
    };
  }
};

export default {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  login,
  getMe,
  logout,
  checkHealth,
  getSites,
  createOrUpdateSubmission,
  getSubmissions,
  getSubmissionById,
  submitSubmission,
  reviewSubmission,
  getGroupRollup,
};
