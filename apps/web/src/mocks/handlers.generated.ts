import { http, HttpResponse } from 'msw';

/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 * Run `pnpm mocks:gen` to regenerate.
 */
export const generatedHandlers = [
  // POST /api/v1/auth/login
  http.post('/api/v1/auth/login', () => HttpResponse.json({ success: true })),
  // GET /api/v1/auth/me
  http.get('/api/v1/auth/me', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/events
  http.get('/api/v1/events', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/events/{id}
  http.get('/api/v1/events/:id', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/bairros
  http.get('/api/v1/bairros', () => HttpResponse.json({ data: [], success: true })),
  // POST /api/v1/auth/register
  http.post('/api/v1/auth/register', () => HttpResponse.json({ success: true })),
  // POST /api/v1/auth/send-otp
  http.post('/api/v1/auth/send-otp', () => HttpResponse.json({ success: true })),
  // POST /api/v1/auth/verify-otp
  http.post('/api/v1/auth/verify-otp', () => HttpResponse.json({ success: true })),
  // POST /api/v1/auth/refresh
  http.post('/api/v1/auth/refresh', () => HttpResponse.json({ success: true })),
  // POST /api/v1/auth/logout
  http.post('/api/v1/auth/logout', () => HttpResponse.json({ success: true })),
  // GET /api/v1/forum/topics
  http.get('/api/v1/forum/topics', () => HttpResponse.json({ data: [], success: true })),
  // POST /api/v1/forum/topics
  http.post('/api/v1/forum/topics', () => HttpResponse.json({ success: true })),
  // GET /api/v1/forum/topics/{id}
  http.get('/api/v1/forum/topics/:id', () => HttpResponse.json({ data: [], success: true })),
  // PUT /api/v1/forum/topics/{id}
  http.put('/api/v1/forum/topics/:id', () => HttpResponse.json({ success: true })),
  // DELETE /api/v1/forum/topics/{id}
  http.delete('/api/v1/forum/topics/:id', () => HttpResponse.json({ success: true })),
  // POST /api/v1/forum/topics/{id}/like
  http.post('/api/v1/forum/topics/:id/like', () => HttpResponse.json({ success: true })),
  // POST /api/v1/forum/topics/{id}/save
  http.post('/api/v1/forum/topics/:id/save', () => HttpResponse.json({ success: true })),
  // GET /api/v1/forum/topics/{id}/comments
  http.get('/api/v1/forum/topics/:id/comments', () => HttpResponse.json({ data: [], success: true })),
  // POST /api/v1/forum/topics/{id}/comments
  http.post('/api/v1/forum/topics/:id/comments', () => HttpResponse.json({ success: true })),
  // GET /api/v1/events/featured
  http.get('/api/v1/events/featured', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/events/today
  http.get('/api/v1/events/today', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/events/weekend
  http.get('/api/v1/events/weekend', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/events/calendar-summary
  http.get('/api/v1/events/calendar-summary', () => HttpResponse.json({ data: [], success: true })),
  // POST /api/v1/events/{id}/rsvp
  http.post('/api/v1/events/:id/rsvp', () => HttpResponse.json({ success: true })),
  // POST /api/v1/events/{id}/favorite
  http.post('/api/v1/events/:id/favorite', () => HttpResponse.json({ success: true })),
  // POST /api/v1/reports
  http.post('/api/v1/reports', () => HttpResponse.json({ success: true })),
  // GET /api/v1/users/me/reports
  http.get('/api/v1/users/me/reports', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/tourism
  http.get('/api/v1/tourism', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/tourism/{id}
  http.get('/api/v1/tourism/:id', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/masses
  http.get('/api/v1/masses', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/masses/churches
  http.get('/api/v1/masses/churches', () => HttpResponse.json({ data: [], success: true })),
  // GET /api/v1/trash-schedules
  http.get('/api/v1/trash-schedules', () => HttpResponse.json({ data: [], success: true })),
];
