import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidBrazilianPhone } from '../phone.util';

@ValidatorConstraint({ name: 'isBrazilianPhone', async: false })
export class IsBrazilianPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidBrazilianPhone(value);
  }

  defaultMessage(): string {
    return 'Informe um WhatsApp válido, com DDD (ex: (85) 91234-5678).';
  }
}

export function IsBrazilianPhone(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsBrazilianPhoneConstraint,
    });
  };
}
