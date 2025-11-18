import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isTokenExpired } from "../utils/tokenUtils";
import axiosClient from "../api/axiosClient";

export const useAuthStore = create(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			credits: 0,
			sessionTimeoutLength:0,

			setAuth: (token, user,sessionTimeoutLength) => set({ token, user,sessionTimeoutLength }),
			
			setCredits: (credits) => set((state) => (state.credits !== credits ? { credits } : state)), // #revert
			// setCredits: (credits) => set({ credits }),
			
			getCredits: () => get().credits,

			logout: async () => {
				try {
					await axiosClient.post("/auth/logout");
				} catch (error) {
					console.error("Logout failed:", error);
				}
				set({ token: null, user: null, credits: 0 , sessionTimeoutLength:0});
			},

			isAuthenticated: () => {
				const { token } = get();
				return token && !isTokenExpired(token);
			},
		}),
		{
			name: "design-genie-auth-storage",
		}
	)
);
