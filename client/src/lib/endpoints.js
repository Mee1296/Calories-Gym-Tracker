import api from './api';

/** One place that knows the shape of the API. Hooks call these, never axios. */

export const auth = {
  login: (credentials) => api.post('/auth/login', credentials).then((r) => r.data),
  register: (credentials) => api.post('/auth/register', credentials).then((r) => r.data),
  config: () => api.get('/auth/config').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const meals = {
  day: (date) => api.get('/meals', { params: date ? { date } : {} }).then((r) => r.data),
  log: (meal) => api.post('/meals', meal).then((r) => r.data),
  update: (id, meal) => api.patch(`/meals/${id}`, meal).then((r) => r.data),
  remove: (id) => api.delete(`/meals/${id}`),
  dishes: (params) => api.get('/meals/dishes', { params }).then((r) => r.data),
};

export const goals = {
  update: (values) => api.put('/goals', values).then((r) => r.data),
};

export const nutrition = {
  status: () => api.get('/nutrition/status').then((r) => r.data),
  estimate: (description) => api.post('/nutrition/estimate', { description }).then((r) => r.data),
  suggestGoals: (metrics) => api.post('/nutrition/suggest-goals', metrics).then((r) => r.data),
};

export const weights = {
  history: (days) => api.get('/weights', { params: days ? { days } : {} }).then((r) => r.data),
  log: (kg, date) => api.post('/weights', { kg, date }).then((r) => r.data),
};

export const movements = {
  list: () => api.get('/movements').then((r) => r.data),
  create: (movement) => api.post('/movements', movement).then((r) => r.data),
  update: (id, patch) => api.patch(`/movements/${id}`, patch).then((r) => r.data),
  usage: (id) => api.get(`/movements/${id}/usage`).then((r) => r.data),
  remove: (id) => api.delete(`/movements/${id}`).then((r) => r.data),
};

export const routines = {
  list: () => api.get('/routines').then((r) => r.data),
  create: (routine) => api.post('/routines', routine).then((r) => r.data),
  update: (id, routine) => api.patch(`/routines/${id}`, routine).then((r) => r.data),
  remove: (id) => api.delete(`/routines/${id}`),
};

export const workouts = {
  history: (limit) => api.get('/workouts', { params: limit ? { limit } : {} }).then((r) => r.data),
  finish: (workout) => api.post('/workouts', workout).then((r) => r.data),
  lastSets: (movementIds) => api.post('/workouts/last', { movementIds }).then((r) => r.data),
};

export const stats = {
  overview: (days) => api.get('/stats/overview', { params: days ? { days } : {} }).then((r) => r.data),
};
