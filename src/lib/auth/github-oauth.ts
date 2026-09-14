export function isGithubOAuthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
}

/** Visible en el cliente cuando el login con GitHub está habilitado */
export function isGithubLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GITHUB_LOGIN_ENABLED === 'true' && isGithubOAuthConfigured()
}

export function getGithubProviderConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) return null

  return {
    clientId,
    clientSecret,
    /** Solo usuarios ya invitados (perfil existente) pueden iniciar sesión */
    disableSignUp: true,
    /** Scopes para integración Git futura (CC-22082026) */
    scope: ['repo'] as string[],
  }
}
