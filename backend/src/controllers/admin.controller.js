export const todos = [
  { id: 1, title: "Move secrets to a secret manager and rotate keys", priority: "high", done: true },
  { id: 2, title: "Create least-privilege DB user and enforce SSL", priority: "high", done: true },
  { id: 3, title: "Encrypt OAuth tokens at rest (KMS)", priority: "high", done: true },
  { id: 7, title: "Add CI smoke tests and monitoring/alerts", priority: "medium", done: true },
  { id: 4, title: "Add per-endpoint request validation (Zod)", priority: "high", done: true },
  { id: 5, title: "Add Helmet, CORS restrictions, and rate limiting", priority: "high", done: true },
  { id: 8, title: "Remove express-validator and old middleware", priority: "low", done: true },
  { id: 6, title: "Run npm audit and fix vulnerabilities", priority: "medium", done: true },

];

export function getTodos(_req, res) {
  res.status(200).json({ todos });
}
