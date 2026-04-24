/**
 * API Service — Enhanced
 * HTTP client + Socket.io real-time connection
 */

const API_BASE = '/api';

const request = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  } catch (error) {
    throw error;
  }
};

// ─── Call APIs ──────────────────────────────────
export const initiateCall = (phoneNumber, language, productName, productQty, productPrice) => {
  return request('/call', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, language, productName, productQty, productPrice }),
  });
};

export const retryCall = (orderId) => {
  return request(`/call/retry/${orderId}`, { method: 'POST' });
};

export const batchCall = (contacts) => {
  return request('/call/batch', {
    method: 'POST',
    body: JSON.stringify({ contacts }),
  });
};

export const generateSummary = (orderId) => {
  return request(`/call/summary/${orderId}`, { method: 'POST' });
};

// ─── Order APIs ─────────────────────────────────
export const getOrders = () => request('/orders');

export const getAnalytics = () => request('/orders/analytics');

export const deleteOrder = (orderId) => {
  return request(`/orders/${orderId}`, { method: 'DELETE' });
};

export const searchOrders = (query) => {
  return request('/orders/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
};

export const exportCSV = async () => {
  const response = await fetch(`${API_BASE}/orders/export`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `call-report-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const healthCheck = () => request('/health');
