# 📦 Stack Ghost — Badge & Authentication System

Stack Ghost is a dynamic Q&A and community engagement platform inspired by Stack Overflow. It allows users to ask questions, provide answers, and interact through comments, votes, and badges. The platform also includes a user authentication system, reputation tracking, and a reward system using badges to encourage active participation and knowledge sharing.

Built with **Node.js** and a simple frontend using **HTML / CSS / JavaScript** (no frameworks), Stack Ghost is lightweight, scalable, and suitable for educational projects, developer communities, and any collaborative knowledge-sharing websites.

---

## 🚀 Features

* 🔐 **User Authentication System**
  Register, login, logout with secure password hashing (bcrypt) and JWT authentication.
* 🏅 **Badge System**
  Assign, remove, and display badges for users based on their contributions.
* 🗄️ **Relational Database Design**
  Built with PostgreSQL, including Users, Badges, User_Badges (many-to-many).
* 🌐 **Frontend without Frameworks**
  HTML, CSS, JavaScript (Vanilla) served directly by Node.js.
* ⚙️ **Built with Node.js & Express**
  REST API architecture for backend operations.

---

## 📁 Project Structure

```
Stack-Ghost/
│
├── server.js                    # Main Express server entry point
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables
│
├── prisma/                      # Prisma ORM
│   └── schema.prisma            # Database schema
│
├── controllers/                 # Request handlers
│   ├── AnswerController.js      # Answer CRUD operations
│   ├── AuthController.js        # Login, register, logout
│   ├── CommentController.js     # Comments on Q&A
│   ├── FollowController.js      # User follow/unfollow
│   ├── NotificationController.js # User notifications
│   ├── QuestionController.js    # Question CRUD operations
│   ├── QuestionTagController.js # Question-Tag relations
│   ├── ReportController.js      # Content reporting
│   ├── TagController.js         # Tags management
│   ├── UserController.js        # User profiles
│   └── VoteController.js        # Upvote/downvote
│
├── routes/                      # API route definitions
│   ├── answerRoutes.js
│   ├── authRoutes.js
│   ├── commentRoutes.js
│   ├── followRoutes.js
│   ├── notificationRoutes.js
│   ├── questionRoutes.js
│   ├── questionTagRoutes.js
│   ├── reportRoutes.js
│   ├── tagRoutes.js
│   ├── userRoutes.js
│   └── voteRoutes.js
│
├── utils/                       # Business logic services
│   ├── answerService.js
│   ├── badgeService.js
│   ├── commentService.js
│   ├── followService.js
│   ├── notificationService.js
│   ├── profileService.js
│   ├── questionService.js
│   ├── questionTagService.js
│   ├── reportService.js
│   ├── tagService.js
│   ├── userService.js
│   └── voteService.js
│
├── middlewares/                 # Express middleware
│   ├── auth.middleware.js       # JWT authentication
│   ├── permission.middleware.js # Permission checks
│   ├── rateLimiter.js           # Rate limiting
│   ├── requestLogger.js         # Request logging
│   └── role.middleware.js       # Role-based access
│
├── lib/                         # Shared libraries
│   ├── errors.js                # Error definitions
│   ├── logger.js                # Winston logger
│   ├── pagination.js            # Pagination utils
│   └── prisma.js                # Prisma client
│
└── frontend_stack_ghost/        # Frontend pages
    ├── js/                      # Shared JS (api.js)
    ├── landing_page/            # Landing/marketing page
    ├── signin,login/            # Auth pages
    ├── home/                    # Dashboard/home
    ├── questions/               # Questions list
    ├── question_review/         # Question detail page
    ├── ask/                     # Ask question form
    ├── profile/                 # User profiles
    ├── users/                   # Users directory
    ├── badges/                  # Badges page
    ├── tages/                   # Tags page
    └── dashboard/               # Admin dashboard
```

---

## 🧩 Database Schema

### Tables

1. Users
2. Badges
3. User_Badges (many-to-many relationship)

### Relationships

* **One User → Many User_Badges**
* **One Badge → Many User_Badges**

---

## 📥 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/stack-ghost.git
cd stack-ghost
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Run database schema

Import the schema file:

```
database/schema.sql
```

### 4️⃣ Start the server

```bash
node server.js
```

Server will run at: `http://localhost:3000`

---

## 🧪 API Endpoints

### 🔐 Authentication

| Method | Endpoint  | Description       |
| ------ | --------- | ----------------- |
| POST   | /register | Create a new user |
| POST   | /login    | Login a user      |
| GET    | /logout   | Logout a user     |

### 🏅 Badges

| Method | Endpoint       | Description                |
| ------ | -------------- | -------------------------- |
| GET    | /badges        | List all badges            |
| POST   | /badges/assign | Assign a badge to a user   |
| DELETE | /badges/remove | Remove a badge from a user |

---

## 🎨 Frontend

* Pure HTML
* Custom CSS
* Vanilla JavaScript (ES6)
* No external frontend frameworks

---

## 📌 Roadmap / Future Improvements

* WebSocket live notifications
* Admin dashboard UI
* PostgreSQL full-text search for questions & users
* UI improvements & Dark Mode
* Levels / reputation system for users

---

## 🤝 Contributing

Contributions are welcome!
Please open a **Pull Request** or **Issue** on GitHub before making major changes.

---

## 📜 License

MIT License — Free for personal and commercial use.

---

## 👻 Authors

* Mohamad Ahmed Ibrahim
* Abdelrahman Hatem
* Amr Mohamad Bakr
