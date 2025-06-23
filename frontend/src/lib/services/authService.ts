import { PUBLIC_URL, PUBLIC_URL_BACKEND } from '$env/static/public';

export const authService = {
  getLoginUrl: () => `${PUBLIC_URL_BACKEND}/auth/login/microsoft?redirect=${PUBLIC_URL}`,
  
  login: () => {
    if (typeof window !== 'undefined') {
      window.location.href = authService.getLoginUrl();
    }
  }
};
