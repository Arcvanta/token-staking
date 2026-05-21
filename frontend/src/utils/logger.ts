/**
 * Frontend Logger
 * Standardized logging system for the frontend
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

class FrontendLogger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: '📘',
      success: '✅',
      warn: '⚠️',
      error: '❌',
    }[level];

    const styles = {
      info: 'color: #60a5fa; font-weight: bold',
      success: 'color: #10b981; font-weight: bold',
      warn: 'color: #f59e0b; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
    }[level];

    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    
    console.log(
      `%c[${timestamp}] ${emoji} ${message}${contextStr}`,
      styles
    );
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  success(message: string, context?: LogContext) {
    this.log('success', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new FrontendLogger();
