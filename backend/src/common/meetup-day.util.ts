import { BadRequestException } from '@nestjs/common';

/**
 * Aceita "DD/MM" (preferido) ou ISO "YYYY-MM-DD".
 * Rejeita datas no passado (ano corrente; se já passou, considera inválido).
 */
export function normalizeMeetupDay(raw: string): string {
  const value = raw.trim();
  if (!value) {
    throw new BadRequestException('Informe o dia do encontro.');
  }

  let day: number;
  let month: number;

  const br = /^(\d{1,2})\/(\d{1,2})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (br) {
    day = Number(br[1]);
    month = Number(br[2]);
  } else if (iso) {
    day = Number(iso[3]);
    month = Number(iso[2]);
  } else {
    throw new BadRequestException(
      'Informe o dia e o mês do encontro (ex.: 15/03).',
    );
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new BadRequestException('Data do encontro inválida.');
  }

  const year = new Date().getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    throw new BadRequestException('Data do encontro inválida.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  if (candidate.getTime() < today.getTime()) {
    throw new BadRequestException(
      'O encontro não pode ser em uma data que já passou.',
    );
  }

  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}
