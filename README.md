# Iron Tinder

## Description

Build a full-stack dating application where Ironhack students can find their "iron love". Users sign up, set up their profile and preferences, browse through suggested profiles, and when two users like each other a match is created allowing them to exchange private messages.

This is a **pair-programming** project. You will build the complete **REST API first** (iterations 1-4), then the **React frontend** (iterations 5-7).

## Learning Goals

After completing this lab you will be able to:

- Design and implement a REST API with Express and Mongoose
- Implement session-based authentication with cookies
- Define Mongoose schemas with validations, references, and virtuals
- Build filtered database queries based on user preferences
- Implement a matching system with mutual like detection
- Create a React frontend that consumes your own API
- Manage authentication state with React Context
- Build multi-page applications with React Router
- Handle forms, API calls, and loading/error states in React

## Requirements

- Node.js (v20 or higher)
- MongoDB running locally (`mongod`)
- A code editor (VS Code recommended)
- Postman or similar tool for testing your API
- Two team members ready to pair-program

## Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd iron-tinder

# Install server dependencies
cd server
npm install

# Copy environment variables and configure them
cp .env.example .env
# Edit .env with your values

# Start the server in development mode
npm run dev
```

The client setup is covered in Iteration 5.

## Submission

- Upon completion, create a Pull Request in your repository
- Both team members must have commits in the repository
- The API must be fully functional before starting the frontend
- URL of your deployed application (if applicable)

---

## Data Models

### User

| Field | Type | Details |
|---|---|---|
| `email` | `String` | Required, unique, lowercase, trimmed, valid email format |
| `password` | `String` | Required, hashed before saving (bcrypt) |
| `name` | `String` | Required, trimmed |
| `age` | `Number` | Required, minimum 18 |
| `gender` | `String` | Required, enum: `"male"`, `"female"`, `"other"` |
| `bio` | `String` | Trimmed, max 500 characters |
| `pics` | `[String]` | Array of image URLs, at least 1 required |
| `preferences.gender` | `String` | Enum: `"male"`, `"female"`, `"other"`, `"everyone"` |
| `preferences.ageMin` | `Number` | Minimum age preference, default 18 |
| `preferences.ageMax` | `Number` | Maximum age preference, default 99 |
| `preferences.maxDistance` | `Number` | Maximum distance in km, default 50 |
| `location` | `{ type: "Point", coordinates: [lng, lat] }` | GeoJSON Point for geolocation |
| `likedUsers` | `[ObjectId]` | References to users this user has liked |
| `passedUsers` | `[ObjectId]` | References to users this user has passed on |
| `timestamps` | | Automatic `createdAt` and `updatedAt` |

### Match

| Field | Type | Details |
|---|---|---|
| `users` | `[ObjectId]` | Array of exactly 2 User references |
| `matchedAt` | `Date` | Defaults to `Date.now` |
| `timestamps` | | Automatic `createdAt` and `updatedAt` |

### Message

| Field | Type | Details |
|---|---|---|
| `sender` | `ObjectId` | Reference to User, required |
| `match` | `ObjectId` | Reference to Match, required |
| `content` | `String` | Required, trimmed |
| `timestamps` | | Only `createdAt` (messages cannot be edited) |

---

## API Endpoints

### Authentication

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive session cookie | No |
| `DELETE` | `/api/auth/logout` | Log out (delete session) | Yes |
| `GET` | `/api/auth/verify` | Verify current session is valid | Yes |

**POST /api/auth/signup**

Request body:
```json
{
  "email": "ada@ironhack.com",
  "password": "ironhack123",
  "name": "Ada Lovelace",
  "age": 25,
  "gender": "female"
}
```

Response: The created user object (without password).

**POST /api/auth/login**

Request body:
```json
{
  "email": "ada@ironhack.com",
  "password": "ironhack123"
}
```

Response: The user object. A `sessionId` cookie is set in the response.

**GET /api/auth/verify**

Response: The authenticated user object. Use this to restore the session on page reload.

---

### Profile

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/profile` | Get the authenticated user's full profile | Yes |
| `PATCH` | `/api/profile` | Update profile fields (bio, pics, preferences, location) | Yes |

**PATCH /api/profile**

Request body (all fields optional):
```json
{
  "bio": "Full-stack developer in love with JavaScript",
  "pics": ["https://example.com/pic1.jpg", "https://example.com/pic2.jpg"],
  "preferences": {
    "gender": "everyone",
    "ageMin": 22,
    "ageMax": 35,
    "maxDistance": 30
  },
  "location": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]
  }
}
```

Response: The updated user object.

---

### Suggestions

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/suggestions` | Get a list of suggested users based on preferences | Yes |

**How the suggestions algorithm works:**

Return users that match ALL of the following criteria:
1. The user is **not** the authenticated user
2. The user has **not** already been liked or passed by the authenticated user
3. The user's **gender** matches the authenticated user's gender preference (if preference is `"everyone"`, show all genders)
4. The user's **age** is within the authenticated user's `ageMin` - `ageMax` range
5. *(Optional)* The user is within `maxDistance` km (requires geolocation — skip this filter if the user has no location set)

Response: Array of user objects (without password).

---

### Likes & Passes

| Method | Route | Description | Auth |
|---|---|---|---|
| `POST` | `/api/likes/:userId` | Like a user. Returns match info if mutual. | Yes |
| `POST` | `/api/pass/:userId` | Pass on a user. | Yes |

**POST /api/likes/:userId**

Response when **no match**:
```json
{
  "liked": true,
  "match": false
}
```

Response when **match detected** (the other user had already liked you):
```json
{
  "liked": true,
  "match": true,
  "matchId": "60f7b2c..."
}
```

**How match detection works:**

When User A likes User B:
1. Add User B's id to User A's `likedUsers` array
2. Check if User B's `likedUsers` array already contains User A's id
3. If yes, create a new Match document with both user ids and return `match: true`

**POST /api/pass/:userId**

Response:
```json
{
  "passed": true
}
```

---

### Matches

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/matches` | Get all matches for the authenticated user | Yes |

Response: Array of Match objects with populated user data. Each match includes the "other" user's profile info (name, pics, bio).

---

### Messages

| Method | Route | Description | Auth |
|---|---|---|---|
| `GET` | `/api/messages/:matchId` | Get all messages for a specific match | Yes |
| `POST` | `/api/messages/:matchId` | Send a message in a match | Yes |

**POST /api/messages/:matchId**

Request body:
```json
{
  "content": "Hey! Nice to match with you!"
}
```

Response: The created message object.

**GET /api/messages/:matchId**

Response: Array of message objects sorted by `createdAt` ascending, with the `sender` field populated (at least name and pics).

**Important:** Before allowing message operations, verify that the authenticated user is a participant of the match.

---

## Frontend Pages & Components

You are free to design the UI however you like. Below is the list of required pages and components.

### Pages

| Page | Route | Description |
|---|---|---|
| **Signup Page** | `/signup` | Registration form (email, password, name, age, gender) |
| **Login Page** | `/login` | Login form (email, password) |
| **Profile Page** | `/profile` | View and edit your profile (bio, pics, preferences, location) |
| **Suggestions Page** | `/` | Main page showing user cards with Like / Pass buttons |
| **Matches Page** | `/matches` | List of all your matches |
| **Conversation Page** | `/matches/:matchId` | Chat view for a specific match |

### Components

- **Navbar** — Navigation bar with links to Suggestions, Matches, Profile, and a Logout button
- **UserCard** — Displays a suggested user's photo, name, age, bio with Like and Pass buttons
- **MatchCard** — Displays a match's photo and name, links to the conversation
- **MessageBubble** — Single message in a conversation, styled differently for sent vs received
- **PrivateRoute** — Route wrapper that redirects to `/login` if not authenticated

### Contexts

- **AuthContext** — Manages user authentication state, provides `user`, `login`, `signup`, `logout`, and `verify` functions

### Services

- **api-service.js** — Axios instance configured with `baseURL` and `withCredentials: true`, with functions for every API endpoint

---

## Iterations

---

### Iteration 1 — Auth API (Backend)

**Goal:** Implement user registration, login, session management, and authentication middleware.

**What to implement:**

1. **User Model** (`server/models/user.model.js`)
   - Define the schema with fields: `email`, `password`, `name`, `age`, `gender`
   - Add a `pre("save")` hook that hashes the password with bcrypt when it is modified
   - Add a `checkPassword` instance method that compares a plain-text password with the stored hash
   - Configure `toJSON` to remove `_id` and `password` from responses, and include virtuals

2. **Session Model** (`server/models/session.model.js`)
   - A simple model with a `user` field (ObjectId ref to User)
   - Enable `timestamps`

3. **Auth Middleware** (`server/middlewares/auth.middleware.js`)
   - Extract the `sessionId` from the request cookie header
   - Find the session in the database and populate the user
   - Attach the session to `req.session`
   - If no valid session is found, respond with 401
   - Skip authentication for public routes: `POST /api/auth/signup` and `POST /api/auth/login`

4. **Auth Routes & Controller**
   - `POST /api/auth/signup` — Validate input, create user, respond with user object
   - `POST /api/auth/login` — Find user by email, verify password, create session, set `sessionId` cookie (`httpOnly: true`), respond with user
   - `DELETE /api/auth/logout` — Delete the session from the database, respond with 204
   - `GET /api/auth/verify` — Return `req.session.user` (the authenticated user)

5. **App setup** (`server/app.js`)
   - Configure Express with morgan, CORS, JSON parsing, clearBody middleware, auth middleware
   - Mount routes under `/api`
   - Add error handler middleware

**How to verify:**

Use Postman to:
- Sign up a new user and confirm the response does not include the password
- Log in and check that a `sessionId` cookie is set
- Call `GET /api/auth/verify` with the cookie and confirm it returns the user
- Call any protected route without a cookie and confirm you get a 401

<details>
<summary>Hints</summary>

- Use `req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1]` to extract the session id from the cookie header
- Remember to use `httpOnly: true` when setting the cookie so JavaScript cannot access it (XSS protection)
- The `clearBody` middleware should delete `_id`, `createdAt`, and `updatedAt` from `req.body` to prevent clients from setting these fields
- Use `http-errors` to create HTTP errors: `throw createHttpError(401, "unauthorized")`
- Express 5 handles async errors automatically, no need for try/catch in route handlers

</details>

---

### Iteration 2 — Profile & Preferences API (Backend)

**Goal:** Allow authenticated users to view and update their profile, including preferences and location.

**What to implement:**

1. **Extend the User Model**
   - Add the remaining fields: `bio`, `pics`, `preferences` (nested object with `gender`, `ageMin`, `ageMax`, `maxDistance`), `location` (GeoJSON Point), `likedUsers`, `passedUsers`
   - Add a `2dsphere` index on the `location` field if you plan to support distance-based filtering

2. **Profile Routes & Controller**
   - `GET /api/profile` — Return the authenticated user's full profile
   - `PATCH /api/profile` — Update profile fields from `req.body`, save, and return the updated user

**How to verify:**

Use Postman to:
- Update your profile with bio, pics, preferences, and location
- Retrieve your profile and confirm all fields are saved correctly
- Try sending invalid data (e.g., age below 18, invalid gender enum) and confirm validation errors are returned

<details>
<summary>Hints</summary>

- Use `Object.assign(req.session.user, req.body)` to merge the update fields, then `await req.session.user.save()` to persist and run validations
- For the GeoJSON location, the schema should look like: `location: { type: { type: String, enum: ["Point"] }, coordinates: [Number] }`
- Create a `2dsphere` index: `userSchema.index({ location: "2dsphere" })`
- Remember to delete protected fields in `clearBody` middleware — or handle it in the controller

</details>

---

### Iteration 3 — Suggestions & Matching API (Backend)

**Goal:** Implement the discovery system where users see suggested profiles, and the like/pass/match logic.

**What to implement:**

1. **Suggestions Route & Controller**
   - `GET /api/suggestions` — Build a MongoDB query that filters users based on the authenticated user's preferences
   - Exclude: the authenticated user themselves, users already in `likedUsers`, users already in `passedUsers`
   - Filter by: gender preference, age range
   - Return the filtered list of users

2. **Like Route & Controller**
   - `POST /api/likes/:userId` — Add the target user to `likedUsers`. Then check if the target user has already liked the authenticated user (check their `likedUsers` array). If mutual, create a Match document and return match info.

3. **Pass Route & Controller**
   - `POST /api/pass/:userId` — Add the target user to `passedUsers`

4. **Match Model** (`server/models/match.model.js`)
   - Define the schema with `users` (array of 2 ObjectId refs) and `matchedAt`

5. **Matches Route & Controller**
   - `GET /api/matches` — Find all matches where the authenticated user is in the `users` array. Populate the user data.

**How to verify:**

You will need at least 2-3 test users to verify this properly.

- Create multiple users with different genders and ages
- Set preferences on one user and call `GET /api/suggestions` — verify the results respect the filters
- Like a user from User A, then log in as User B and like User A back — verify a match is created
- Call `GET /api/matches` and confirm the match appears for both users

<details>
<summary>Hints</summary>

- Build the suggestions query criteria step by step:
  ```javascript
  const criteria = {
    _id: { $ne: user.id, $nin: [...user.likedUsers, ...user.passedUsers] },
    age: { $gte: user.preferences.ageMin, $lte: user.preferences.ageMax },
  };
  if (user.preferences.gender !== "everyone") {
    criteria.gender = user.preferences.gender;
  }
  ```
- To check for a mutual like, find the target user and check: `targetUser.likedUsers.includes(currentUser.id)`
- Use `$addToSet` instead of `$push` to avoid duplicates when adding to `likedUsers` or `passedUsers`
- For matches query: `Match.find({ users: userId }).populate("users")`

</details>

---

### Iteration 4 — Messaging API (Backend)

**Goal:** Implement private messaging between matched users.

**What to implement:**

1. **Message Model** (`server/models/message.model.js`)
   - Define the schema with `sender` (User ref), `match` (Match ref), `content` (String)
   - Only enable `createdAt` timestamp (messages are immutable)

2. **Message Routes & Controller**
   - `POST /api/messages/:matchId` — Create a new message. Verify the authenticated user is a participant of the match before allowing the operation.
   - `GET /api/messages/:matchId` — Return all messages for the match, sorted by `createdAt` ascending, with the `sender` populated.

3. **Security check** — Before any message operation, verify that `req.session.user` is one of the users in the match. If not, respond with 403.

**How to verify:**

- Create a match between two users (from Iteration 3)
- Send a message from User A in the match
- Send a message from User B in the match
- Retrieve the conversation and verify messages appear in order
- Try to send a message in a match you are not part of — confirm you get 403

<details>
<summary>Hints</summary>

- To verify match participation:
  ```javascript
  const match = await Match.findById(req.params.matchId);
  const isParticipant = match.users.some(
    (userId) => userId.toString() === req.session.user.id
  );
  if (!isParticipant) throw createHttpError(403, "Not your match");
  ```
- Sort messages chronologically: `Message.find({ match: matchId }).sort({ createdAt: 1 }).populate("sender")`
- Consider adding a virtual on the Match model to easily access its messages

</details>

---

### Iteration 5 — Auth & Profile Pages (Frontend)

**Goal:** Set up the React application and build the authentication and profile pages.

**What to implement:**

1. **Project setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. **API Service** (`src/services/api-service.js`)
   - Create an Axios instance with `baseURL` pointing to your API and `withCredentials: true`
   - Add a response interceptor that unwraps `response.data`
   - Create functions for every API endpoint (signup, login, logout, verify, getProfile, updateProfile, etc.)

3. **Auth Context** (`src/contexts/auth-context.jsx`)
   - On mount, call `verify()` to check for an existing session
   - If no session, redirect to `/login`
   - Provide `user`, `login`, `signup`, `logout` through context
   - While verifying, render nothing to avoid content flash

4. **Pages**
   - **Signup Page** — Form with email, password, name, age, gender fields. On submit, call signup and redirect to `/login`
   - **Login Page** — Form with email and password. On submit, call login and redirect to `/`
   - **Profile Page** — Display current profile data in a form. Allow editing bio, pics (URLs), preferences, and location. On submit, call updateProfile

5. **Routing** (`src/App.jsx`)
   - Set up React Router with routes for `/signup`, `/login`, `/profile`, and `/` (suggestions, built in next iteration)
   - Public routes: `/signup`, `/login`
   - Protected routes: everything else (use AuthContext to redirect)

6. **Navbar** — Links to home (`/`), matches (`/matches`), profile (`/profile`), and a logout button

**How to verify:**

- Sign up a new user through the frontend form
- Log in and verify you are redirected to the home page
- Refresh the page and verify your session is restored (no redirect to login)
- Go to Profile, update your bio and preferences, and verify the changes persist

<details>
<summary>Hints</summary>

- The API service pattern from the reference project:
  ```javascript
  const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    withCredentials: true,
  });
  http.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error),
  );
  ```
- Use `react-hook-form` for form handling — it simplifies validation and submit state
- In the AuthContext, use `useNavigate` and `useLocation` from React Router
- Remember to wrap `<App />` with `<BrowserRouter>` and `<AuthContextProvider>` in `main.jsx`

</details>

---

### Iteration 6 — Discovery & Matching Pages (Frontend)

**Goal:** Build the main suggestions page and the matches list.

**What to implement:**

1. **Suggestions Page** (home `/`)
   - Fetch suggestions from `GET /api/suggestions`
   - Display one user at a time as a card (or display all — your choice)
   - Each card shows: main photo, name, age, bio
   - Two buttons: **Like** and **Pass**
   - On Like, call `POST /api/likes/:userId` — if a match is returned, show a notification or modal
   - On Pass, call `POST /api/pass/:userId`
   - After like/pass, show the next suggestion
   - Handle the case when there are no more suggestions

2. **Matches Page** (`/matches`)
   - Fetch matches from `GET /api/matches`
   - Display each match as a card with the other user's photo and name
   - Each card links to the conversation: `/matches/:matchId`

**How to verify:**

- Log in and see suggestions on the home page
- Like and pass users, verify they don't reappear
- Like a user who has liked you back — verify the match notification
- Go to Matches page and verify the match appears
- Click on a match to navigate to the conversation page (built in next iteration)

<details>
<summary>Hints</summary>

- Keep the suggestions in React state. When a user is liked or passed, remove them from the state array
- To show one card at a time, keep a `currentIndex` in state and increment it after each action
- The match response from the Like endpoint tells you if a match was created — use this to show a celebration or notification
- On the matches page, you need to figure out which user in `match.users` is the "other" user (not you). Compare with the authenticated user's id from AuthContext

</details>

---

### Iteration 7 — Messaging & Polish (Frontend)

**Goal:** Build the conversation view, connect everything, and do final testing.

**What to implement:**

1. **Conversation Page** (`/matches/:matchId`)
   - Fetch messages from `GET /api/messages/:matchId`
   - Display messages in chronological order
   - Style messages differently based on whether the sender is the authenticated user
   - Add a message input form at the bottom
   - On submit, call `POST /api/messages/:matchId` and add the new message to the list
   - Consider polling for new messages every few seconds (simple `setInterval` with a fetch)

2. **Polish & Testing**
   - Test the complete flow: signup, login, set profile, browse suggestions, like/pass, match, message
   - Handle loading states (show a spinner while data is loading)
   - Handle error states (show error messages when API calls fail)
   - Handle empty states (no suggestions left, no matches yet, no messages yet)
   - Verify that the app works with two different browser sessions (or one regular + one incognito window)

**How to verify:**

- Open two browser windows logged in as different users
- Like each other to create a match
- Send messages back and forth
- Verify messages appear in correct order
- Test the full flow from signup to messaging

<details>
<summary>Hints</summary>

- For polling new messages, you can use a `useEffect` with `setInterval`:
  ```javascript
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [matchId]);
  ```
- Style sent messages on the right and received messages on the left (like any chat app)
- Scroll to the bottom of the messages list when new messages arrive
- Use a ref on the messages container: `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })`

</details>

---

## Pair Programming Tips

- **Switch the driver every 30-45 minutes.** The driver writes code, the navigator reviews and thinks ahead.
- **Communicate constantly.** Talk through your decisions out loud before writing code.
- **Plan before coding.** At the start of each iteration, discuss the approach before touching the keyboard.
- **Commit often.** Make small, meaningful commits at the end of each sub-task within an iteration.
- **Both partners must understand every line.** If one person does not understand something, stop and explain.
- **Use branches.** Work on a feature branch for each iteration and merge to `main` when the iteration is complete.

---

Happy coding!
