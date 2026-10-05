import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Returns the inbound request id if the client supplied one, otherwise mints a
 * new UUID. Used by pino-http's `genReqId` so logs and responses share one id.
 */
export function resolveRequestId(req: IncomingMessage, res: ServerResponse): string {
  const existing = (res.getHeader(REQUEST_ID_HEADER) as string | undefined) ??
    (req.headers[REQUEST_ID_HEADER] as string | undefined)
  return existing && existing.length <= 128 ? existing : randomUUID()
}
