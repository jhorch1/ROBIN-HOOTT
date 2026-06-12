import { useAuthStore } from '../store/useAuthStore';

export const useAuth = () => {
  return useAuthStore();
};
