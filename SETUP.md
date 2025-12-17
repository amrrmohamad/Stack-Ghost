# Stack-Ghost Setup Guide

## Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm or yarn

---

## Quick Start

### 1. Clone and Install
```bash
cd /home/amrmohamad/Documents/Stack-Ghost
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/stack_ghost?schema=public"
JWT_SECRET="your-super-secret-jwt-key-CHANGE-THIS"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-CHANGE-THIS"
```

⚠️ **IMPORTANT**: Generate strong secrets for production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Setup Database
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### 4. Start Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server will start on: `http://localhost:3000`

---

## Verify Installation

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T...",
  "database": "connected",
  "uptime": 12.34
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/me` - Get current user profile (auth)
- `PUT /api/users/me` - Update profile (auth)
- `GET /api/users/:id` - Get user profile (auth)
- `GET /api/users/` - Get all users (admin)

### Questions
- `GET /api/questions` - List all questions
- `GET /api/questions/:id` - Get question details
- `POST /api/questions` - Create question (auth, rate limited)
- `PUT /api/questions/:id` - Update question (auth, owner)
- `PATCH /api/questions/:id/close` - Close question (auth, admin/mod)

### Answers
- `GET /api/answers/:questionId` - Get answers for question
- `POST /api/answers` - Create answer (auth, rate limited)
- `POST /api/answers/:id/accept` - Accept answer (auth, question owner)
- `PUT /api/answers/:id` - Update answer (auth, owner)
- `DELETE /api/answers/:id` - Delete answer (auth, owner)

### Votes
- `POST /api/votes` - Vote (auth, rate limited)
- `GET /api/votes/status` - Check vote status (auth)
- `GET /api/votes/history` - Get vote history (auth)

### Comments
- `GET /api/comments` - Get comments
- `POST /api/comments` - Create comment (auth)
- `PUT /api/comments/:id` - Update comment (auth, owner)
- `DELETE /api/comments/:id` - Delete comment (auth, owner)

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag (auth, admin/mod)
- `PUT /api/tags/:id` - Update tag (auth, admin/mod)
- `DELETE /api/tags/:id` - Delete tag (auth, admin)

### Follow
- `POST /api/users/:id/toggle` - Follow/unfollow user (auth)
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following
- `POST /api/users/tags/:id/toggle` - Follow/unfollow tag (auth)

### Notifications
- `GET /api/notifications/user/:userId` - Get notifications (auth)
- `PUT /api/notifications/:notificationId/read` - Mark as read (auth)
- `DELETE /api/notifications/:notificationId` - Delete (auth)

### Reports
- `POST /api/reports` - Create report (auth)
- `GET /api/reports` - Get all reports (auth, admin/mod)
- `PUT /api/reports/:id/status` - Update status (auth, admin/mod)

---

## Rate Limits

- **General API**: 100 requests / 15 minutes
- **Authentication**: 5 attempts / 15 minutes
- **Create (Q/A)**: 20 creates / hour
- **Voting**: 10 votes / minute

---

## Database Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create migration
npm run db:migrate

# Push schema without migration (dev only)
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

---

## Logging

Logs are stored in:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs

In development, logs also appear in console with colors.

---

## Security Notes

### JWT Tokens
- Access token: 15 minutes lifetime
- Refresh token: 7 days lifetime
- Tokens auto-rotate on refresh

### Rate Limiting
All endpoints are rate-limited. Headers:
- `X-RateLimit-Limit` - Max requests
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset timestamp

### Input Validation
- Question title: max 300 chars
- Question/Answer body: max 30,000 chars
- Tags: max 5 per question
- Comments: max 1000 chars

---

## Troubleshooting

### Port Already in Use
Change port in `.env`:
```env
PORT=3001
```

### Database Connection Error
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Test connection:
```bash
psql $DATABASE_URL
```

### Migration Errors
Reset database (⚠️ DELETES ALL DATA):
```bash
npm run db:push -- --force-reset
npm run db:seed
```

### "Cannot find module"
Regenerate Prisma Client:
```bash
npm run db:generate
```

---

## Production Deployment

### Required Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
REFRESH_TOKEN_SECRET="..."
LOG_LEVEL=warn
```

### Recommended
1. Use connection pooling (PgBouncer)
2. Set up Redis for caching
3. Enable HTTPS
4. Set up monitoring (Prometheus, DataDog)
5. Configure log rotation
6. Use PM2 or Docker for process management

### PM2 Example
```bash
npm install -g pm2
pm2 start server.js --name stack-ghost
pm2 save
pm2 startup
```

---

## Development Tips

### Hot Reload
Use nodemon for auto-restart:
```bash
npm run dev
```

### Database GUI
```bash
npm run db:studio
```

### Test Health Check
```bash
curl http://localhost:3000/health | jq
```

### View Logs
```bash
tail -f logs/combined.log
```

---

## Support

For issues, check:
1. `logs/error.log`
2. Console output
3. `GET /health` endpoint
4. `PRODUCTION_FIXES.md` for recent changes

---

**Version**: 1.1.0  
**Last Updated**: 2025-12-17
