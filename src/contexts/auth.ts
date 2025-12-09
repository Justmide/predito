/**
 * Retrieves the authentication token from local storage.
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};