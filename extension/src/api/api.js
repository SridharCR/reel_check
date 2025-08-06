export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}

const API_BASE_URL = 'http://localhost:8000';

const handleAuthResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    throw new AuthenticationError(response.statusText || 'Authentication failed');
  }
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'API request failed');
  }
  return response.json();
};

export const loginUser = async (username, password) => {
  try {
    const details = {
      'username': username,
      'password': password
    };
    let formBody = [];
    for (const property in details) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signupUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Signup failed');
    }
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

const getAuthHeaders = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['token'], (result) => {
      if (result.token) {
        resolve({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.token}`,
        });
      } else {
        resolve({ 'Content-Type': 'application/json' });
      }
    });
  });
};

export const analyzeContent = async (url) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ url }),
    });
    return await handleAuthResponse(response);
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

export const getAnalysisStatus = async (taskId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/status/${taskId}`, {
      method: 'GET',
      headers: headers,
    });
    return await handleAuthResponse(response);
  } catch (error) {
    console.error('Get status error:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (skip = 0, limit = 5) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/history?skip=${skip}&limit=${limit}`, {
      method: 'GET',
      headers: headers,
    });
    return await handleAuthResponse(response);
  } catch (error) {
    console.error('Get history error:', error);
    throw error;
  }
};

export const getAnalysisDetails = async (analysisId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
      method: 'GET',
      headers: headers,
    });
    return await handleAuthResponse(response);
  } catch (error) {
    console.error('Get analysis details error:', error);
    throw error;
  }
};
