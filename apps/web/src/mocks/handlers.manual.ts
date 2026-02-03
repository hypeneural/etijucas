import { http, HttpResponse } from 'msw';
import { authUser, bairros, events, forumTopics } from './fixtures';

export const manualHandlers = [
  // Auth
  http.post('/api/v1/auth/login', async () => {
    return HttpResponse.json({
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      user: authUser,
    });
  }),
  http.get('/api/v1/auth/me', async () => {
    return HttpResponse.json({
      data: authUser,
      success: true,
    });
  }),

  // Bairros
  http.get('/api/v1/bairros', async () => {
    return HttpResponse.json({
      data: bairros,
      success: true,
    });
  }),

  // Forum
  http.get('/api/v1/forum/topics', async () => {
    return HttpResponse.json({
      data: forumTopics,
      meta: {
        total: forumTopics.length,
        page: 1,
        perPage: 15,
        lastPage: 1,
        from: 1,
        to: forumTopics.length,
      },
      success: true,
    });
  }),

  // Events
  http.get('/api/v1/events', async () => {
    return HttpResponse.json({
      data: events,
      meta: {
        total: events.length,
        page: 1,
        perPage: 15,
        lastPage: 1,
        from: 1,
        to: events.length,
      },
      success: true,
    });
  }),
  http.get('/api/v1/events/featured', async () => {
    return HttpResponse.json({
      data: events,
      meta: {
        total: events.length,
        page: 1,
        perPage: 10,
        lastPage: 1,
        from: 1,
        to: events.length,
      },
      success: true,
    });
  }),
  http.get('/api/v1/events/today', async () => {
    return HttpResponse.json({
      data: events,
      meta: {
        total: events.length,
        page: 1,
        perPage: 15,
        lastPage: 1,
        from: 1,
        to: events.length,
      },
      success: true,
    });
  }),
  http.get('/api/v1/events/weekend', async () => {
    return HttpResponse.json({
      data: events,
      meta: {
        total: events.length,
        page: 1,
        perPage: 15,
        lastPage: 1,
        from: 1,
        to: events.length,
      },
      success: true,
    });
  }),
];
