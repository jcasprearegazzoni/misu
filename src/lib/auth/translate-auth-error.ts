const AUTH_ERROR_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /invalid login credentials/i,
    message: "Credenciales inválidas. Revisa tu email y contraseña.",
  },
  {
    pattern: /email not confirmed/i,
    message: "Debes confirmar tu email antes de iniciar sesión.",
  },
  {
    pattern: /user already registered/i,
    message: "Ya existe una cuenta con ese email.",
  },
  {
    pattern: /password should be at least/i,
    message: "La contraseña debe tener al menos 6 caracteres.",
  },
  {
    pattern: /for security purposes/i,
    message: "Si el email existe, recibirás instrucciones para recuperar la contraseña.",
  },
];

export function translateAuthError(rawMessage: string): string {
  const normalized = rawMessage.trim();

  for (const item of AUTH_ERROR_MAP) {
    if (item.pattern.test(normalized)) {
      return item.message;
    }
  }

  return "Ocurrió un error de autenticación. Intenta nuevamente.";
}
