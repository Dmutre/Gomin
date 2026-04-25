import { Logger } from '@nestjs/common';

function wrapAsync(
  logger: Logger,
  methodName: string,
  original: (...args: unknown[]) => unknown,
): (...args: unknown[]) => unknown {
  return async function (this: unknown, ...args: unknown[]) {
    const start = Date.now();
    logger.debug(`${methodName}: start`);
    try {
      const result = await original.apply(this, args);
      logger.log(`${methodName}: done total=${Date.now() - start}ms`);
      return result;
    } catch (err) {
      logger.log(`${methodName}: error total=${Date.now() - start}ms`);
      throw err;
    }
  };
}

function wrapSync(
  logger: Logger,
  methodName: string,
  original: (...args: unknown[]) => unknown,
): (...args: unknown[]) => unknown {
  return function (this: unknown, ...args: unknown[]) {
    const start = Date.now();
    logger.debug(`${methodName}: start`);
    try {
      const result = original.apply(this, args);
      logger.log(`${methodName}: done total=${Date.now() - start}ms`);
      return result;
    } catch (err) {
      logger.log(`${methodName}: error total=${Date.now() - start}ms`);
      throw err;
    }
  };
}

export function LogTiming(): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const logger = new Logger(target.constructor.name);
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const wrap =
      original.constructor.name === 'AsyncFunction' ? wrapAsync : wrapSync;
    descriptor.value = wrap(logger, String(propertyKey), original);
    return descriptor;
  };
}

export function LogAllMethods(): ClassDecorator {
  return (target) => {
    const logger = new Logger(target.name);
    const proto = target.prototype as Record<string, unknown>;

    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (!descriptor || typeof descriptor.value !== 'function') continue;

      const original = descriptor.value as (...args: unknown[]) => unknown;
      const wrap =
        original.constructor.name === 'AsyncFunction' ? wrapAsync : wrapSync;
      descriptor.value = wrap(logger, key, original);
      Object.defineProperty(proto, key, descriptor);
    }
  };
}
