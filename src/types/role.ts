export const ROLE_VALUES = ["profesor", "alumno"] as const;

export type Role = (typeof ROLE_VALUES)[number];
