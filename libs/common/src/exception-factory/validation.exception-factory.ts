import { HttpStatus, ValidationError } from '@nestjs/common';
import { MicroserviceException } from '../errors';

export function MicroserviceValidationExceptionFactory(errors: ValidationError[]) {
  const messages = errors.map((error: ValidationError) => {
    const constraints = error.constraints ? Object.values(error.constraints) : [];
    return `${error.property} - ${constraints.join(', ')}`;
  });

  return new MicroserviceException(messages, HttpStatus.BAD_REQUEST);
}
