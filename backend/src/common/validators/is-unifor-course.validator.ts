import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isUniforCourse } from '../unifor-courses';

@ValidatorConstraint({ name: 'isUniforCourse', async: false })
export class IsUniforCourseConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && isUniforCourse(value);
  }

  defaultMessage() {
    return 'Selecione um curso válido da UNIFOR.';
  }
}

export function IsUniforCourse(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniforCourseConstraint,
    });
  };
}
