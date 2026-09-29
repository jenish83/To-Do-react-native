# Setup Instructions

This project has two parts:

| Folder     | What it is                                                        |
|------------|-------------------------------------------------------------------|
| `backend/` | Node.js + Express + MongoDB REST API (JWT authentication)         |
| `TodoApp/` | React Native CLI + TypeScript Android app (`App.tsx`, `src/`, `android/`) |

---

## 1. Requirements

Install these first:

- **Node.js** (LTS, version 20 or newer) - https://nodejs.org
- **MongoDB** - either
  - MongoDB Community Server installed locally, **or**
  - a free MongoDB Atlas cluster (cloud)
- **JDK 17** and **Android Studio** (with an Android SDK and an emulator)
- Environment variables `ANDROID_HOME` and `platform-tools` on PATH

Follow the official guide for the last item, choosing *React Native CLI Quickstart* and *Android*:
https://reactnative.dev/docs/set-up-your-development-environment

---

## 2. Backend setup

```bash
cd backend
npm install
```

### 2.1 Environment variables

The folder already contains a `.env` file (copied from `.env.example`). Open it and check:

| Variable         | Meaning                                       | Example                                   |
|------------------|-----------------------------------------------|-------------------------------------------|
| `PORT`           | Port the API runs on                          | `5000`                                    |
| `MONGO_URI`      | MongoDB connection string                     | `mongodb://127.0.0.1:27017/todo_app`      |
| `JWT_SECRET`     | Secret used to sign login tokens (make it long and random) | `my_super_long_random_secret_123` |
| `JWT_EXPIRES_IN` | How long a login lasts                        | `7d`                                      |

If `.env` is missing: `cp .env.example .env` (Windows: `copy .env.example .env`).

### 2.2 MongoDB configuration

**Option A - Local MongoDB**

1. Install MongoDB Community Server and make sure the service is running
   (Windows: it runs as a service; macOS: `brew services start mongodb-community`;
   Linux: `sudo systemctl start mongod`).
2. Keep `MONGO_URI=mongodb://127.0.0.1:27017/todo_app`.
3. You do **not** need to create the database or collections. MongoDB creates `todo_app`,
   `users` and `tasks` automatically on first save.

**Option B - MongoDB Atlas (cloud)**

1. Create a free cluster at https://www.mongodb.com/atlas.
2. *Database Access* -> add a database user (username + password).
3. *Network Access* -> add your IP address (or `0.0.0.0/0` for testing only).
4. *Connect* -> *Drivers* -> copy the connection string and put it in `.env`:
   `MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/todo_app?retryWrites=true&w=majority`
   (if the password has special characters, URL-encode them).

### 2.3 Start the backend

```bash
npm run dev      # auto-restarts on file changes (uses nodemon)
# or
npm start        # plain start
```

You should see:

```
MongoDB connected
API running on port 5000
```

Quick check: open http://localhost:5000/api/health in a browser. It should show `{"status":"ok"}`.

### 2.4 Test the API without the app (optional)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Copy the "token" from the response, then:
curl http://localhost:5000/api/tasks -H "Authorization: Bearer YOUR_TOKEN"

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test","deadline":"2030-01-01T10:00:00.000Z","priority":"high"}'
```

### API summary

| Method | URL                   | Auth | Purpose                                  |
|--------|-----------------------|------|------------------------------------------|
| POST   | `/api/auth/register`  | No   | Create account, returns token            |
| POST   | `/api/auth/login`     | No   | Log in, returns token                    |
| GET    | `/api/auth/me`        | Yes  | Current user                             |
| GET    | `/api/tasks`          | Yes  | List my tasks                            |
| POST   | `/api/tasks`          | Yes  | Create a task                            |
| PUT    | `/api/tasks/:id`      | Yes  | Update a task (e.g. `{"completed":true}`)|
| DELETE | `/api/tasks/:id`      | Yes  | Delete a task                            |

---

## 3. Install the app dependencies

The React Native project is already in `TodoApp/`. From that folder:

```bash
cd TodoApp
npm install
```

| Library                                  | Used for                                   |
|------------------------------------------|--------------------------------------------|
| `axios`                                  | API calls                                  |
| `@react-native-async-storage/async-storage` | Saving the login token on the phone     |
| `@react-native-community/datetimepicker` | Android date and time picker               |
| `react-native-safe-area-context`         | Padding for the status bar and gesture area |

## 4. Set the API URL

Open `TodoApp/src/config.ts`:

```ts
export const API_URL = 'http://10.0.2.2:5000/api';
```

| Where the app runs                | Use this URL                                  |
|-----------------------------------|-----------------------------------------------|
| Android **emulator** (default)    | `http://10.0.2.2:5000/api`                    |
| Real phone with USB cable         | run `adb reverse tcp:5000 tcp:5000`, then `http://localhost:5000/api` |
| Real phone on the same Wi-Fi      | `http://<your-computer-LAN-IP>:5000/api` (and allow port 5000 in your firewall) |

`10.0.2.2` is the special address the emulator uses to reach your computer's `localhost`.
Plain `http` works in debug builds, which is what we use here.

## 5. Run the app on Android

1. Start an emulator in Android Studio (*Device Manager*), or plug in a phone with USB debugging on.
2. Make sure the backend from Step 2.3 is running.
3. In the `TodoApp` folder:

```bash
cd TodoApp
npx react-native start          # Terminal 1: Metro bundler
npx react-native run-android    # Terminal 2: builds and installs the app
```

The first build takes several minutes because Gradle downloads dependencies.

---

## 6. How to test the app (manual checklist)

1. Register with an email and a password of 6+ characters -> you land on **My Tasks**.
2. Tap **+**, fill title, description, pick date/time and deadline, choose a priority, **Save Task**.
3. Tap the circle to mark the task completed. Tap again to undo.
4. Try **All / Pending / Completed** and the sort chips (Smart / Deadline / Priority / Newest).
5. Tap the bin icon -> confirm -> the task is deleted.
6. Pull down to refresh the list.
7. Logout, then log in again -> your tasks are still there.
8. Close and reopen the app while logged in -> you stay logged in.
9. Error cases: wrong password, registering the same email twice, empty title, stopping the backend
   (you should see readable error messages, not crashes).

To look at the data directly, use MongoDB Compass and open `todo_app` -> `users` / `tasks`.
Passwords appear as long hashes, never as plain text.

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot reach the server` alert in the app | Backend not running, or wrong `API_URL` (see Step 4). Test http://localhost:5000/api/health on your computer first. |
| `MongoDB connection failed` | MongoDB service is not running, or `MONGO_URI` is wrong / Atlas IP not allowed. |
| `Missing JWT_SECRET or MONGO_URI` | `.env` is missing in `backend/`. |
| `SDK location not found` | Set `ANDROID_HOME` or create `TodoApp/android/local.properties` with `sdk.dir=/path/to/Android/Sdk`. |
| Red screen "Unable to resolve module ..." | Run `npm install` in `TodoApp`, then `npx react-native start --reset-cache`. |
| Date picker crash / not found | Rebuild the app after installing the picker: `npx react-native run-android`. |
| Port 5000 already in use | Change `PORT` in `.env` and in `src/config.ts`. |

## 8. Project structure

```
backend/
  src/
    server.js                  # app entry: middleware, routes, start server
    config/db.js               # MongoDB connection
    models/                    # User.js, Task.js (Mongoose schemas)
    middleware/                # auth.js (JWT check), errorHandler.js
    controllers/               # authController.js, taskController.js (logic)
    routes/                    # authRoutes.js, taskRoutes.js (URLs)
  .env.example

TodoApp/
  App.tsx                      # providers + decides which screen to show
  android/                     # native Android project
  src/
    config.ts                  # API URL
    theme.ts                   # colors
    types/                     # TypeScript types
    api/                       # axios client + auth and task requests
    context/                   # AuthContext, TaskContext (state management)
    screens/                   # Login, Register, Home
    components/                # AppButton, InputField, TaskItem, TaskFormModal, ...
    utils/                     # validation, date formatting, sort/filter, error messages
```
