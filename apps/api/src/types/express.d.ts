import type { AuthContext } from '../middleware/authenticate.js'

declare global {
  namespace Express {
    interface Request {
      /** Authenticated principal, set by the `authenticate` middleware. */
      user?: AuthContext
    }
  }
}

export {}
