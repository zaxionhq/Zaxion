import { ZodError } from "zod";

/**
 * Middleware factory to validate req.body / req.query / req.params using Zod schemas.
 * Usage: validate({ body: schema, query: schema, params: schema })
 */
export function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      const parsed = {};

      if (schemas.params) {
        parsed.params = schemas.params.parse(req.params || {});
      }
      if (schemas.query) {
        parsed.query = schemas.query.parse(req.query || {});
      }
      if (schemas.body) {
        parsed.body = schemas.body.parse(req.body || {});
      }

      // attach parsed values back to request (sanitized)
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;
      if (parsed.body) req.body = parsed.body;

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ errors: err.errors });
      }
      return next(err);
    }
  };
}
