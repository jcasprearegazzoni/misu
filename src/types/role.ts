export const ROLE_VALUES = ["profesor", "alumno", "club", "admin"] as const;

export type Role = (typeof ROLE_VALUES)[number];
