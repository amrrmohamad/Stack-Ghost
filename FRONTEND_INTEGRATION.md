# Frontend Integration Guide

## ✅ What's Been Done

Your frontend is now connected to the backend API! Here's what was implemented:

### 1. Backend Changes

#### CORS Enabled
- Added `cors` package to allow frontend to make requests
- Configured CORS with credentials support
- Serving frontend static files from Express

#### Updated server.js
```javascript
// CORS enabled for localhost:5500 (Live Server default)
// Static files served from frontend_stack_ghost folder
```

### 2. Frontend Changes

#### Created API Client (`frontend_stack_ghost/js/api.js`)
A centralized API client with:
- **Authentication**: Login, Register, Logout
- **Token Management**: Auto-refresh on expiry
- **Local Storage**: Stores tokens and user data
- **Auto-redirect**: Redirects to login if session expires
- **All endpoints**: Questions, Answers, Votes, Comments, Tags, Notifications, Follow

#### Updated Login/Signup Page (`signin,login/app.js`)
- Real authentication with backend API
- Token storage in localStorage
- Error handling with user-friendly messages
- Success messages
- Auto-redirect after login
- Form validation

#### Updated Data Files (`home/data.js`, `questions/data.js`)
- Fetch real data from backend API
- Authentication check (redirects if not logged in)
- Fallback data if API fails
- Maps backend response to frontend format

---

## 🚀 How to Use

### 1. Start the Backend Server
```bash
# In Stack-Ghost root directory
npm run dev
```

Server runs on: `http://localhost:3000`

### 2. Open Frontend in Browser

**Option A: Use Live Server (Recommended)**
1. Install "Live Server" extension in VS Code
2. Open `frontend_stack_ghost/signin,login/index.html`
3. Right-click → "Open with Live Server"
4. Opens at: `http://localhost:5500` (or similar)

**Option B: Direct File Access**
1. Navigate to: `http://localhost:3000/signin,login/index.html`
2. Backend serves the frontend directly

### 3. Test the Flow

1. **Register a new account**:
   - Click "Sign Up" tab
   - Enter username, email, password (min 10 chars)
   - Click "Create Account"
   - You'll see success message

2. **Login**:
   - Switch to "Login" tab
   - Enter your email and password
   - Click "Login"
   - You'll be redirected to home page

3. **Home Page**:
   - Shows your username and reputation
   - Displays questions from database
   - Shows notifications
   - All data is REAL from backend!

---

## 📋 API Client Usage

### In Any Frontend File:

```javascript
import api from '../js/api.js';

// Check if logged in
if (!api.isAuthenticated()) {
    window.location.href = '../signin,login/index.html';
}

// Get current user
const user = await api.getCurrentUser();
console.log(user.data);

// Create a question
const response = await api.createQuestion(
    'How to use async/await?',
    'I need help understanding async/await in JavaScript...',
    [1, 2, 3] // tag IDs
);

// Vote on a question
await api.vote(questionId, null, 1); // 1 = upvote, -1 = downvote

// Logout
api.logout(); // Clears tokens and redirects
```

---

## 🔐 Authentication Flow

### Login
1. User submits email/password
2. API calls `POST /api/auth/login`
3. Backend returns `accessToken` and `refreshToken`
4. Frontend stores tokens in localStorage
5. Frontend fetches user profile
6. Stores user data in localStorage
7. Redirects to home page

### Auto Token Refresh
1. API request returns 401 (token expired)
2. API client automatically calls `/auth/refresh-token`
3. Gets new tokens
4. Retries original request
5. If refresh fails → redirects to login

### Logout
1. Calls `POST /api/auth/logout`
2. Clears localStorage
3. Redirects to login page

---

## 📁 File Structure

```
frontend_stack_ghost/
├── js/
│   └── api.js              # ✨ NEW: Centralized API client
├── signin,login/
│   ├── index.html          # ✅ Updated: form field names
│   ├── app.js              # ✅ Updated: real auth integration
│   └── ...
├── home/
│   ├── index.html
│   ├── app.js
│   └── data.js             # ✅ Updated: fetch from backend
├── questions/
│   ├── index.html
│   ├── app.js
│   └── data.js             # ✅ Updated: fetch from backend
└── ...
```

---

## 🔧 Configuration

### Backend URL
Edit `frontend_stack_ghost/js/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

Change this if:
- Backend runs on different port
- Deploying to production
- Using different domain

### CORS Configuration
Edit `server.js`:

```javascript
const corsOptions = {
    origin: 'http://localhost:5500', // Your frontend URL
    credentials: true
};
```

---

## 🎯 What Works Now

✅ User registration
✅ User login
✅ Token auto-refresh
✅ Fetch questions from database
✅ Display user profile data
✅ Show real reputation/stats
✅ Notifications from backend
✅ Tags from backend
✅ Authentication required for protected pages
✅ Auto-redirect to login if not authenticated
✅ Error handling with user feedback

---

## 📝 What Still Needs Integration

These pages have the UI but need API integration:

### Questions Page
- ✅ List questions (DONE)
- ⚠️ Create new question (needs form)
- ⚠️ View question details (needs implementation)
- ⚠️ Post answers (needs implementation)
- ⚠️ Vote system (needs implementation)

### Profile Page
- ⚠️ View user profile
- ⚠️ Edit profile
- ⚠️ User stats

### Tags Page
- ⚠️ List all tags
- ⚠️ Filter by tag
- ⚠️ Follow/unfollow tags

### Users Page
- ⚠️ List all users
- ⚠️ Follow/unfollow users

---

## 🐛 Troubleshooting

### "Cannot find module 'api.js'"
- Make sure you're using `type="module"` in script tag
- Check file path is correct: `../js/api.js`

### CORS Errors
- Make sure backend is running on port 3000
- Check CORS origin in `server.js` matches your frontend URL
- Clear browser cache and reload

### "Session expired" immediately
- Check JWT secrets are set in `.env`
- Try registering a new user
- Check browser console for errors

### No data showing
- Open browser DevTools → Network tab
- Check if API requests are successful (200 status)
- Check Console for error messages
- Verify backend is running

### Database Migration Error
Run:
```bash
npm run db:migrate
```

---

## 🚀 Next Steps

To fully connect the frontend:

1. **Question Details Page**
   - Show full question with answers
   - Add vote buttons
   - Add comment section
   - Show accepted answer

2. **Create Question Form**
   - Add form to create questions
   - Tag selection
   - Markdown editor

3. **Profile Page**
   - Show user questions/answers
   - Edit profile
   - Show badges

4. **Search Functionality**
   - Connect search bar to `/questions/search` endpoint

5. **Notifications**
   - Mark as read
   - Delete notifications
   - Real-time updates (optional: WebSocket)

---

## 📊 Testing Checklist

Test these flows:

- [ ] Register new user
- [ ] Login with registered user
- [ ] View home page with real data
- [ ] View questions page
- [ ] Logout
- [ ] Try to access protected page without login (should redirect)
- [ ] Token auto-refresh (wait 15 minutes, make request)

---

## 💡 Tips

1. **Always import api.js**:
   ```javascript
   import api from '../js/api.js';
   ```

2. **Check authentication first**:
   ```javascript
   if (!api.isAuthenticated()) {
       window.location.href = '../signin,login/index.html';
   }
   ```

3. **Handle errors**:
   ```javascript
   try {
       const data = await api.getQuestions();
   } catch (error) {
       console.error('Failed to load:', error);
       // Show error message to user
   }
   ```

4. **Use browser DevTools**:
   - Console: See errors
   - Network: See API requests
   - Application → Local Storage: See stored tokens

---

## 📞 Need Help?

Check:
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs in terminal
4. `logs/error.log` on backend

Common issues are usually:
- CORS configuration
- Token expiry
- Wrong API endpoint URL
- Backend not running

---

**Status**: ✅ Basic Integration Complete  
**Last Updated**: 2025-12-17
