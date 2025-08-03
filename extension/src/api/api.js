const API_BASE_URL = 'http://localhost:8000';

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

// The rest of your code is correct and doesn't need changes
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

export const analyzeContent = async (url, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Analysis failed');
    }
    return data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

export const getAnalysisStatus = async (taskId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to get status');
    }
    return data;
  } catch (error) {
    console.error('Get status error:', error);
    throw error;
  }
};

export const getAnalysisHistory = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to get history');
    }
    return data;
  } catch (error) {
    console.error('Get history error:', error);
    throw error;
  }
};

export const getAnalysisDetails = async (analysisId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to get analysis details');
    }
    return data;
  } catch (error) {
    console.error('Get analysis details error:', error);
    throw error;
  }
};