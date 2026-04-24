# 🏆 Student Sports Competition App — Backend

A robust Express.js + MongoDB backend for managing sports tournaments with single elimination brackets, real-time updates, and role-based access.

---

## 📁 Project Structure

```
src/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── auth.controller.js     # Register, login, logout
│   ├── tournament.controller.js
│   ├── team.controller.js
│   ├── match.controller.js
│   ├── leaderboard.controller.js
│   └── sportConfig.controller.js
├── middleware/
│   ├── auth.middleware.js     # JWT protect + role restrict
│   ├── errorHandler.js        # Global error handler
│   └── upload.middleware.js   # Multer image uploads
├── models/
│   ├── User.model.js
│   ├── Tournament.model.js
│   ├── Team.model.js
│   ├── Match.model.js
│   └── SportConfig.model.js
├── routes/
│   ├── auth.routes.js
│   ├── tournament.routes.js
│   ├── team.routes.js
│   ├── match.routes.js
│   ├── leaderboard.routes.js
│   └── sportConfig.routes.js
├── socket/
│   └── index.js               # Socket.io setup + emit helpers
├── utils/
│   ├── bracketGenerator.js    # Single elimination algorithm
│   ├── leaderboard.js         # Computed standings
│   ├── jwt.js                 # Token generation
│   ├── mailer.js              # Nodemailer email notifications
│   └── seedSportConfig.js     # DB seed script
└── server.js                  # Entry point
```

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
copy .env.example .env
```
Fill in your values in `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLIENT_URL` — your React frontend URL (e.g. http://localhost:5173)
- `MAIL_USER` / `MAIL_PASS` — Gmail app password for email notifications

### 3. Seed sport configurations
```bash
npm run seed
```
This populates Football, Basketball, Volleyball, Tennis, Table Tennis, and Badminton configs.

### 4. Start development server
```bash
npm run dev
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register admin account |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/logout` | Private | Logout |
| GET | `/api/auth/me` | Private | Get current user |

### Tournaments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tournaments` | Public/Admin | List tournaments |
| POST | `/api/tournaments` | Admin | Create tournament |
| GET | `/api/tournaments/:id` | Public | Get tournament |
| GET | `/api/tournaments/invite/:code` | Public | Get by invite code |
| PATCH | `/api/tournaments/:id` | Admin | Update tournament |
| POST | `/api/tournaments/:id/generate-bracket` | Admin | Generate bracket |
| PATCH | `/api/tournaments/:id/cancel` | Admin | Cancel tournament |

### Teams
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/teams/register/:inviteCode` | Public | Register team |
| GET | `/api/teams/tournament/:tournamentId` | Public | Get all teams |
| GET | `/api/teams/:id` | Public | Get single team |
| PATCH | `/api/teams/:id/status` | Admin | Approve/reject team |
| PATCH | `/api/teams/:id/squad` | Viewer | Update squad |
| GET | `/api/teams/my-team/:tournamentId` | Viewer | Get own team |

### Matches
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/matches/tournament/:tournamentId` | Public | Get all matches |
| GET | `/api/matches/:id` | Public | Get single match |
| PATCH | `/api/matches/:id/score` | Admin | Enter scores |
| PATCH | `/api/matches/:id/confirm` | Admin | Confirm result |
| PATCH | `/api/matches/:id/edit` | Admin | Edit result |

### Leaderboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/leaderboard/:tournamentId` | Public | Get standings |

### Sport Config
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/sport-config` | Public | Get all sports |
| GET | `/api/sport-config/:sport` | Public | Get single sport |

---

## 🔴 Real-Time Events (Socket.io)

Connect your frontend to the socket server and join a tournament room:
```js
socket.emit("join:tournament", tournamentId)
```

| Event | Trigger | Payload |
|-------|---------|---------|
| `match:resultConfirmed` | Admin confirms score | `{ matchId, scoreA, scoreB, winnerId, leaderboard }` |
| `team:approved` | Admin approves/rejects team | `{ teamId, status, teamName }` |
| `tournament:started` | Bracket generated | `{ tournamentId }` |
| `tournament:completed` | Final match confirmed | `{ tournamentId, championId }` |

---

## 🧠 Bracket Algorithm

Single Elimination with BYE handling:
- Team count is padded to nearest power of 2
- Extra slots are filled with BYE (null) entries
- BYE teams auto-advance to next round on bracket generation
- `nextMatchId` links each match to where the winner advances
- On result confirmation, winner is pushed into the correct slot of the next match

---

## 🏅 Supported Sports
- ⚽ Football
- 🏀 Basketball
- 🏐 Volleyball
- 🎾 Tennis
- 🏓 Table Tennis
- 🏸 Badminton
