/** Centros acadêmicos da UNIFOR — áreas dos cursos. */
export type CourseAreaId =
  | 'COMUNICACAO_GESTAO'
  | 'JURIDICAS'
  | 'SAUDE'
  | 'TECNOLOGICAS';

export const COURSE_AREAS: Record<CourseAreaId, string> = {
  COMUNICACAO_GESTAO: 'Comunicação e Gestão',
  JURIDICAS: 'Ciências Jurídicas',
  SAUDE: 'Ciências da Saúde',
  TECNOLOGICAS: 'Ciências Tecnológicas',
};

export type UniforCourse = {
  name: string;
  area: CourseAreaId;
};

/** Graduação presencial UNIFOR (centros CCG, CCJ, CCS, CCT). */
export const UNIFOR_COURSES: UniforCourse[] = [
  { name: 'Administração', area: 'COMUNICACAO_GESTAO' },
  { name: 'Ciências Contábeis', area: 'COMUNICACAO_GESTAO' },
  { name: 'Ciências Econômicas', area: 'COMUNICACAO_GESTAO' },
  { name: 'Cinema e Audiovisual', area: 'COMUNICACAO_GESTAO' },
  { name: 'Comércio Exterior', area: 'COMUNICACAO_GESTAO' },
  { name: 'Design', area: 'COMUNICACAO_GESTAO' },
  { name: 'Design de Moda', area: 'COMUNICACAO_GESTAO' },
  { name: 'Finanças', area: 'COMUNICACAO_GESTAO' },
  { name: 'Jornalismo', area: 'COMUNICACAO_GESTAO' },
  { name: 'Marketing', area: 'COMUNICACAO_GESTAO' },
  { name: 'Moda', area: 'COMUNICACAO_GESTAO' },
  { name: 'Negócios', area: 'COMUNICACAO_GESTAO' },
  { name: 'Publicidade e Propaganda', area: 'COMUNICACAO_GESTAO' },
  { name: 'Direito', area: 'JURIDICAS' },
  { name: 'Biomedicina', area: 'SAUDE' },
  { name: 'Educação Física', area: 'SAUDE' },
  { name: 'Enfermagem', area: 'SAUDE' },
  { name: 'Estética e Cosmética', area: 'SAUDE' },
  { name: 'Farmácia', area: 'SAUDE' },
  { name: 'Fisioterapia', area: 'SAUDE' },
  { name: 'Fonoaudiologia', area: 'SAUDE' },
  { name: 'Medicina', area: 'SAUDE' },
  { name: 'Medicina Veterinária', area: 'SAUDE' },
  { name: 'Nutrição', area: 'SAUDE' },
  { name: 'Odontologia', area: 'SAUDE' },
  { name: 'Psicologia', area: 'SAUDE' },
  { name: 'Terapia Ocupacional', area: 'SAUDE' },
  { name: 'Análise e Desenvolvimento de Sistemas', area: 'TECNOLOGICAS' },
  { name: 'Arquitetura e Urbanismo', area: 'TECNOLOGICAS' },
  { name: 'Ciência da Computação', area: 'TECNOLOGICAS' },
  { name: 'Design de Interiores', area: 'TECNOLOGICAS' },
  { name: 'Energias Renováveis', area: 'TECNOLOGICAS' },
  { name: 'Engenharia Ambiental e Sanitária', area: 'TECNOLOGICAS' },
  { name: 'Engenharia Civil', area: 'TECNOLOGICAS' },
  { name: 'Engenharia de Computação', area: 'TECNOLOGICAS' },
  { name: 'Engenharia de Controle e Automação', area: 'TECNOLOGICAS' },
  { name: 'Engenharia de Produção', area: 'TECNOLOGICAS' },
  { name: 'Engenharia Elétrica', area: 'TECNOLOGICAS' },
  { name: 'Engenharia Mecânica', area: 'TECNOLOGICAS' },
];

export const UNIFOR_COURSE_NAMES = new Set(
  UNIFOR_COURSES.map((c) => c.name),
);

export function isUniforCourse(name: string): boolean {
  return UNIFOR_COURSE_NAMES.has(name.trim());
}

export function getCourseAreaLabel(courseName: string): string | null {
  const found = UNIFOR_COURSES.find((c) => c.name === courseName.trim());
  return found ? COURSE_AREAS[found.area] : null;
}
