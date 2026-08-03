"use client";

import { coursesByArea } from "@/lib/unifor-courses";

type CourseSelectProps = {
  id?: string;
  value: string;
  onChange: (course: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function CourseSelect({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: CourseSelectProps) {
  const groups = coursesByArea();

  return (
    <select
      id={id}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">Selecione seu curso</option>
      {groups.map((group) => (
        <optgroup key={group.area} label={group.label}>
          {group.courses.map((course) => (
            <option key={course.name} value={course.name}>
              {course.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
