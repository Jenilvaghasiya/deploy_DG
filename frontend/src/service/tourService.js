// src/services/tourService.js
import api from '../api/axios';

export const tourService = {
  // ✅ Check if a specific tour is completed
  checkTourStatus: async (tourKey) => {
    try {
      const response = await api.get(`/tour/status/get`);
      const tours = response.data.data || {}; // backend returns UserTour doc
      return Boolean(tours?.[tourKey]);       // return true/false for the given tour
    } catch (error) {
      console.error('Error checking tour status:', error);
      return false;
    }
  },

  // ✅ Mark a tour as completed
  completeTour: async (tourKey) => {
    try {
      const response = await api.put(`/tour/status/update`, { tourKey });
      return response.data;
    } catch (error) {
      console.error('Error completing tour:', error);
      throw error;
    }
  }
};
