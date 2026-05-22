import chalk from 'chalk';

interface LoggerContext {
  service?: string;
  method?: string;
  planId?: string;
  txHash?: string;
}

class Logger {
  private getServiceColor(service?: string) {
    switch (service) {
      case 'TreasuryService': return chalk.yellow;
      case 'DCAService': return chalk.cyan;
      case 'System': return chalk.green;
      case 'Frontend': return chalk.magenta;
      case 'Database': return chalk.blue;
      case 'API': return chalk.blueBright;
      case 'BlockchainService': return chalk.hex('#FFA500'); // Orange
      case 'DEXService': return chalk.hex('#FF69B4'); // HotPink
      case 'Queue': return chalk.hex('#9370DB'); // MediumPurple
      case 'Redis': return chalk.redBright;
      default: return chalk.white;
    }
  }

  private formatMessage(level: string, msg: string, context?: LoggerContext) {
    const timestamp = new Date().toLocaleTimeString();
    const service = context?.service || 'System';
    const method = context?.method ? `::${context.method}` : '';
    
    const serviceColor = this.getServiceColor(service);
    const contextStr = `[${service}${method}]`;
    
    return { timestamp, contextStr, serviceColor };
  }

  info(msg: string, context?: LoggerContext) {
    const { timestamp, contextStr, serviceColor } = this.formatMessage('INFO', msg, context);
    console.log(
      chalk.gray(timestamp),
      chalk.blue.bold('[INFO]'),
      serviceColor.bold(contextStr),
      msg
    );
  }

  error(msg: string, context?: LoggerContext) {
    const { timestamp, contextStr, serviceColor } = this.formatMessage('ERROR', msg, context);
    console.error(
      chalk.gray(timestamp),
      chalk.red.bold('[ERROR]'),
      serviceColor.bold(contextStr),
      chalk.red(msg)
    );
  }

  warn(msg: string, context?: LoggerContext) {
    const { timestamp, contextStr, serviceColor } = this.formatMessage('WARN', msg, context);
    console.warn(
      chalk.gray(timestamp),
      chalk.yellow.bold('[WARN]'),
      serviceColor.bold(contextStr),
      chalk.yellow(msg)
    );
  }

  debug(msg: string, context?: LoggerContext) {
    if (process.env.NODE_ENV === 'development') {
      const { timestamp, contextStr, serviceColor } = this.formatMessage('DEBUG', msg, context);
      console.debug(
        chalk.gray(timestamp),
        chalk.magenta.bold('[DEBUG]'),
        serviceColor.bold(contextStr),
        chalk.magenta(msg)
      );
    }
  }
  
  success(msg: string, context?: LoggerContext) {
    const { timestamp, contextStr, serviceColor } = this.formatMessage('SUCCESS', msg, context);
    console.log(
      chalk.gray(timestamp),
      chalk.green.bold('[SUCCESS]'),
      serviceColor.bold(contextStr),
      chalk.green(msg)
    );
  }
}

export default new Logger();
