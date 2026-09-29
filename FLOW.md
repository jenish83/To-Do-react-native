# Application Flow (in simple language)

## The big picture

```
 Phone (React Native app)  <-- HTTP + JSON -->  Node/Express API  <-->  MongoDB
```

- The **app** shows screens and collects input.
- The **API** checks who you are, validates data, and talks to the database.
- **MongoDB** stores two collections: `users` and `tasks`.

The app never talks to MongoDB directly. It only calls the API.

---

## 1. App start

1. `App.tsx` wraps everything in two providers:
   - `AuthProvider` - knows who is logged in.
   - `TaskProvider` - holds the list of tasks.
2. `AuthProvider` looks in **AsyncStorage** (small storage on the phone) for a saved token and user.
   - Found -> user is set, so the app shows the **Home** screen (stay logged in).
   - Not found -> the app shows **Login**.
3. While it checks, a spinner is shown.

`Root()` in `App.tsx` decides the screen: `loading` -> spinner, `user` -> Home, else Login/Register.

---

## 2. Registration

1. User enters email, password, confirm password on **RegisterScreen**.
2. The app validates first (valid email, 6+ characters, passwords match). Errors show under the fields.
3. The app calls `POST /api/auth/register` with `{ email, password }`.
4. The backend (`authController.register`):
   - checks the email format and password length again (never trust only the client),
   - checks whether the email already exists (if yes, returns `409`),
   - **hashes the password with bcrypt** (the real password is never stored),
   - saves the user in MongoDB,
   - creates a **JWT token** containing the user id,
   - returns `{ token, user }`.
5. The app (`AuthContext.saveSession`) saves token + user in AsyncStorage, remembers the token for
   future requests, and sets `user`. Because `user` is now set, `Root()` shows **Home**.

## 3. Login

Same as registration, but:

1. App calls `POST /api/auth/login`.
2. Backend finds the user by email and uses `bcrypt.compare` to check the password against the hash.
3. Wrong email or wrong password gives the same message, `Invalid email or password`
   (so nobody can find out which emails exist).
4. On success the backend returns a token, and the app saves it exactly like registration.

## 4. Authentication for every later request

After login, every request to `/api/tasks` carries the header:

```
Authorization: Bearer <token>
```

- In the app: an **axios request interceptor** in `api/client.ts` adds this header automatically.
- In the backend: `middleware/auth.js` reads the header, verifies the token with `JWT_SECRET`, and
  puts the user id in `req.user.id`. If the token is missing, wrong, or expired, the API replies `401`.
- If the app receives `401` on a task request, it **logs the user out automatically**
  (the token probably expired) and shows the Login screen.

The user id always comes from the **token**, never from the request body, so a user can't pretend
to be someone else.

---

## 5. Loading tasks

1. `HomeScreen` opens and calls `fetchTasks()` from `TaskContext`.
2. App sends `GET /api/tasks`.
3. Backend returns only tasks where `task.user` equals the logged-in user id.
4. `TaskContext` stores them in state (`tasks`), and the screen re-renders.
5. Pull-to-refresh calls the same function again.

## 6. Creating a task

1. User taps **+**, and the `TaskFormModal` opens.
2. User enters title, description, date-time, deadline, priority.
   The date-time fields open the Android date picker, then the time picker.
3. On **Save**, the app checks: title not empty, deadline not before the date-time.
4. `addTask` sends `POST /api/tasks` with the data (dates as ISO strings).
5. Backend validates the fields again, then creates the task with `user = req.user.id`.
6. It returns the created task (status `201`).
7. `TaskContext` puts the new task at the top of the `tasks` list. The list updates instantly and
   the modal closes.

## 7. Completing / un-completing a task

1. User taps the round checkbox on a task.
2. `toggleTask` sends `PUT /api/tasks/:id` with `{ "completed": true }` (or `false`).
3. Backend finds the task **by id and user** (so you can't touch someone else's task), updates only
   allowed fields, saves it, and returns the updated task.
4. `TaskContext` replaces that task in the list. The card shows a green check,
   a struck-through title and the status **Completed**.

The same `PUT` endpoint can update the title, deadline, or priority too.

## 8. Deleting a task

1. User taps the bin icon, and an alert asks for confirmation.
2. On **Delete**, the app sends `DELETE /api/tasks/:id`.
3. Backend deletes the task (again matching id + user) and returns a success message.
4. `TaskContext` removes the task from the list.

## 9. Filtering and sorting (front-end only)

Done in `utils/sortTasks.ts`, no extra API calls:

- **Filter:** All / Pending / Completed.
- **Sort:**
  - *Deadline* - earliest deadline first.
  - *Priority* - high, medium, low.
  - *Newest* - most recently created first.
  - *Smart* (default) - unfinished tasks first, then a score that mixes priority and deadline:
    `score = priorityWeight x 10 + urgency`, where priorityWeight is high=3, medium=2, low=1 and
    urgency is 30 if overdue, 20 if due within 24 hours, 10 if within 3 days, otherwise 0.
    Ties are broken by the earlier deadline.

## 10. Logout

1. User taps **Logout**.
2. `AuthContext.logout` clears the token in memory and in AsyncStorage and sets `user` to `null`.
3. `TaskContext` clears the task list, and `Root()` shows the Login screen.

## 11. Error handling

- **In the app:** form validation shows messages under the fields. API errors go through
  `getErrorMessage()`, which shows the server's message (for example "Email already exists") or
  "Cannot reach the server" if the backend is down. They are displayed with `Alert`.
- **In the backend:** controllers validate input and return clear `400 / 401 / 404 / 409` messages.
  Anything unexpected goes to `middleware/errorHandler.js`, which returns a safe `500` message.

## 12. State management summary

| State                          | Where it lives                    | Why |
|--------------------------------|-----------------------------------|-----|
| Logged-in user, loading flag   | `AuthContext`                     | many screens need it |
| Task list + add/toggle/delete  | `TaskContext`                     | shared by list and form |
| Form fields, filter, sort      | local `useState` in the component | only that component needs them |

React Context was chosen instead of Redux because the app is small. Two contexts are easy to read
and explain.

## Request/response cheat sheet

```
Register:  POST /api/auth/register  {email,password}      -> 201 {token,user}
Login:     POST /api/auth/login     {email,password}      -> 200 {token,user}
List:      GET  /api/tasks                                -> 200 {tasks:[...]}
Create:    POST /api/tasks   {title,description,dateTime,deadline,priority} -> 201 {task}
Update:    PUT  /api/tasks/:id  {completed:true}          -> 200 {task}
Delete:    DELETE /api/tasks/:id                          -> 200 {message}
```
(All /api/tasks calls need the `Authorization: Bearer <token>` header.)
