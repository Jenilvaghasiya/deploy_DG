import { useAuthStore } from "../store/authStore";
import api from "../api/axios";

export function useCredits() {
  const setCredits = useAuthStore((state) => state.setCredits);

  const fetchCredits = async () => {
    try {
      const res = await api.get("auth/credits");
      if (res.status === 200) {
        const creditsData = res?.data?.data?.credits;
        setCredits(creditsData);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  return { fetchCredits };
}
