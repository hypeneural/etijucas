# Mapa de Features - ETijucas

> **GPS do Projeto**: Cada feature com suas telas, endpoints, tabelas e permissões.

---

## 🔐 Auth

| Item | Detalhes |
|------|----------|
| **Telas** | LoginPage, RegisterPage, ForgotPasswordPage |
| **Endpoints** | `POST /auth/login`, `POST /auth/register`, `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/refresh`, `POST /auth/logout` |
| **Tabelas** | `users`, `personal_access_tokens`, `otp_codes` |
| **Permissões** | Público (login/register), Autenticado (refresh/logout) |

---

## 👤 Perfil de Usuário

| Item | Detalhes |
|------|----------|
| **Telas** | ProfilePage |
| **Endpoints** | `GET /users/me`, `PUT /users/me`, `POST /users/me/avatar`, `DELETE /users/me/avatar` |
| **Tabelas** | `users`, `media` |
| **Permissões** | `auth:sanctum` |

---

## 💬 Forum (Boca no Trombone)

| Item | Detalhes |
|------|----------|
| **Telas** | ForumScreen (lista), TopicDetailPage (detalhe), CreateTopicForm |
| **Endpoints** | |
| | `GET /forum/topics` - Lista com filtros |
| | `GET /forum/topics/{id}` - Detalhe |
| | `POST /forum/topics` - Criar (auth) |
| | `PUT /forum/topics/{id}` - Editar (auth + owner) |
| | `DELETE /forum/topics/{id}` - Deletar (auth + owner) |
| | `POST /forum/topics/{id}/like` - Curtir |
| | `POST /forum/topics/{id}/comments` - Comentar |
| | `POST /forum/topics/{id}/report` - Denunciar |
| **Tabelas** | `topics`, `comments`, `topic_likes`, `comment_likes`, `reports`, `saved_topics` |
| **Permissões** | Leitura: público, Escrita: `auth:sanctum`, Moderação: `role:admin|moderator` |

---

## 📅 Eventos (Agenda)

| Item | Detalhes |
|------|----------|
| **Telas** | AgendaScreen (lista/calendário), EventDetailsPage |
| **Endpoints** | |
| | `GET /events` - Lista com filtros |
| | `GET /events/{id}` - Detalhe |
| | `GET /events/featured` - Destaques |
| | `GET /events/today` - Hoje |
| | `GET /events/weekend` - Fim de semana |
| | `GET /events/calendar-summary` - Resumo mensal |
| | `POST /events/{id}/rsvp` - Confirmar presença (auth) |
| | `POST /events/{id}/favorite` - Favoritar (auth) |
| **Tabelas** | `events`, `event_categories`, `event_tags`, `event_rsvps`, `event_favorites` |
| **Permissões** | Leitura: público, RSVP/Favoritos: `auth:sanctum` |

---

## 📢 Denúncias (Reports)

| Item | Detalhes |
|------|----------|
| **Telas** | ReportScreen (wizard), ReportListPage |
| **Endpoints** | `POST /reports`, `GET /users/me/reports` |
| **Tabelas** | `reports`, `report_categories`, `media` |
| **Permissões** | `auth:sanctum` |
| **Offline** | ✅ Fila de sincronização com retry |

---

## ⛪ Missas

| Item | Detalhes |
|------|----------|
| **Telas** | MassesPage |
| **Endpoints** | `GET /masses`, `GET /masses/churches` |
| **Tabelas** | `churches`, `mass_schedules` |
| **Permissões** | Público |

---

## 📞 Telefones Úteis

| Item | Detalhes |
|------|----------|
| **Telas** | UsefulPhonesScreen |
| **Endpoints** | `GET /phones` (ou dados estáticos) |
| **Dados** | `src/data/phoneContacts.ts` |
| **Permissões** | Público |

---

## 🏖️ Turismo

| Item | Detalhes |
|------|----------|
| **Telas** | TourismScreen, TourismDetailPage |
| **Endpoints** | `GET /tourism`, `GET /tourism/{id}` |
| **Tabelas** | `tourist_spots`, `media` |
| **Permissões** | Público |

---

## 🗑️ Coleta de Lixo

| Item | Detalhes |
|------|----------|
| **Telas** | TrashScheduleScreen |
| **Endpoints** | `GET /trash-schedules` |
| **Tabelas** | `trash_schedules`, `bairros` |
| **Permissões** | Público |

---

## 🏘️ Bairros

| Item | Detalhes |
|------|----------|
| **Telas** | (usado em vários forms) |
| **Endpoints** | `GET /bairros` |
| **Tabelas** | `bairros` |
| **Permissões** | Público (cached) |

---

## 👑 Admin

| Item | Detalhes |
|------|----------|
| **Telas** | Filament Admin Panel (`/admin`) |
| **Endpoints** | `GET/PUT/DELETE /admin/users`, `POST /admin/users/{id}/roles` |
| **Tabelas** | `users`, `roles`, `permissions` |
| **Permissões** | `role:admin|moderator` |
