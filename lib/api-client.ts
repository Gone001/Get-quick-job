const API_BASE = '/api';

const headers = {
  'Content-Type': 'application/json',
};

async function handleResponse(res) {
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.message || 'Request failed');
  }
  return json.data;
}

async function get(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, { headers });
  return handleResponse(res);
}

async function post(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

async function patch(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

async function del(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse(res);
}

// Jobs API - match DB columns: title, description, category, pay, latitude, longitude, employer_id, status
export const jobsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/jobs${query ? '?' + query : ''}`);
  },
  get: (id) => get(`/jobs/${id}`),
  create: (data) => post('/jobs', data),
  update: (id, data) => patch(`/jobs/${id}`, data),
  delete: (id) => del(`/jobs/${id}`),
  byEmployer: (employerId) => get(`/jobs/employer/${employerId}`),
};

// Users API - match DB columns: name, email, phone, role, skills, profile_completed_min, profile_image_url
export const usersApi = {
  get: (id) => get(`/users/${id}`),
  update: (id, data) => patch(`/users/${id}`, data),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/users${query ? '?' + query : ''}`);
  },
};

// Applications API - match DB columns: job_id, worker_id, status
export const applicationsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/applications${query ? '?' + query : ''}`);
  },
  create: (data) => post('/applications', data),
  update: (id, data) => patch(`/applications/${id}`, data),
  byJob: (jobId) => get(`/applications/job/${jobId}`),
};

// Notifications API
export const notificationsApi = {
  list: (userId: string) => get(`/notifications?user_id=${userId}`),
  create: (data: { user_id: string; type: string; title: string; message?: string; job_id?: string }) => 
    post('/notifications', data),
  markAsRead: (notificationId: string) => 
    patch('/notifications', { notification_id: notificationId, is_read: true }),
};

// Reviews API
export const reviewsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return get(`/reviews${query ? '?' + query : ''}`);
  },
  create: (data) => post('/reviews', data),
  byWorker: (workerId) => get(`/reviews/worker/${workerId}`),
};