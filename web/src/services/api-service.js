// TODO: Import axios
// TODO: Create an axios instance with:
//   - baseURL: import.meta.env.VITE_API_URL or "http://localhost:3000/api"
//   - withCredentials: true (needed to send cookies)
// TODO: Add a response interceptor to unwrap response.data
// TODO: Export functions for each API endpoint:
//
//   Auth:
//     signup(userData)        → POST /auth/signup
//     login(email, password)  → POST /auth/login
//     logout()                → DELETE /auth/logout
//     verify()                → GET /auth/verify
//
//   Profile:
//     getProfile()            → GET /profile
//     updateProfile(data)     → PATCH /profile
//
//   Suggestions:
//     getSuggestions()         → GET /suggestions
//
//   Likes:
//     likeUser(userId)        → POST /likes/:userId
//     passUser(userId)        → POST /pass/:userId
//
//   Matches:
//     getMatches()            → GET /matches
//
//   Messages:
//     getMessages(matchId)    → GET /messages/:matchId
//     sendMessage(matchId, content) → POST /messages/:matchId
