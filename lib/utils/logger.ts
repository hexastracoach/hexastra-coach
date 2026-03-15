// Lightweight server-side logger helper to keep output consistent on Vercel.
// Use console.* under the hood to avoid external deps.
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta && Object.keys(meta).length > 0 ? { message, ...meta } : { message };
  const line = `[${level.toUpperCase()}] ${message}`;
  switch (level) {
    case 'debug':
      console.debug(line, meta ?? '');
      break;
    case 'info':
      console.info(line, meta ?? '');
      break;
    case 'warn':
      console.warn(line, meta ?? '');
      break;
    case 'error':
      console.error(line, meta ?? '');
      break;
    default:
      console.log(line, meta ?? '');
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
