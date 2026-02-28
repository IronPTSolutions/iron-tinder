// TODO: Import createHttpError and the Session model
// TODO: Export an async function checkAuth(req, res, next)
//   - Skip auth for public routes (POST /api/auth/signup and POST /api/auth/login)
//   - Extract sessionId from the cookie header
//   - Find the session in the database and populate the user
//   - Attach the session to req.session
//   - If no valid session, throw a 401 error
