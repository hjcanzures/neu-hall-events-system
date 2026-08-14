// Local development entry point only.
// On Vercel, api/index.js exports the app directly and Vercel handles
// the listening/routing itself — this file is never used in production.
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});