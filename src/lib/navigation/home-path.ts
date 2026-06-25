/** Main entry route: dashboard when signed in, login when signed out. */
export function getHomePath(isAuthenticated: boolean): "/dashboard" | "/login" {
  return isAuthenticated ? "/dashboard" : "/login";
}
