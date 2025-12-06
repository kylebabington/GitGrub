import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook for navigation that provides type-safe navigation helpers.
 * Use this instead of window.location.href for SPA navigation.
 */
export function useAppNavigate() {
  const navigate = useNavigate();

  const goTo = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goToRecipe = useCallback((recipeId: string) => {
    navigate(`/recipe/${recipeId}`);
  }, [navigate]);

  const goToRepo = useCallback((repoId: string) => {
    navigate(`/repo/${repoId}`);
  }, [navigate]);

  const goToUser = useCallback((username: string) => {
    navigate(`/${username}`);
  }, [navigate]);

  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const goToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    navigate,
    goTo,
    goBack,
    goToRecipe,
    goToRepo,
    goToUser,
    goToLogin,
    goToDashboard,
    goToHome,
  };
}

/**
 * For use outside of React components (e.g., in event handlers that need 
 * to navigate after an async operation completes).
 * 
 * Note: Prefer useAppNavigate() hook when inside a component.
 */
export function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

