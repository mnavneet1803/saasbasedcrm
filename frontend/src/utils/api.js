// Centralized API utility for GET and POST requests

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper to get auth token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Generic GET request
export async function getApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
    ...options.headers,
  };
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      ...options,
      headers,
    });
    const data = await response.json();
    if (!data) throw data;
    return data;
  } catch (err) {
    throw err;
  }
}

// Generic POST request
export async function postApi(endpoint, body = {}, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(getToken() && { 'Authorization': `Bearer ${getToken()}` }),
    ...options.headers,
  };
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  } catch (err) {
    throw err;
  }
} 