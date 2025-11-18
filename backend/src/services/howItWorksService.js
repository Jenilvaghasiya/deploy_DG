// services/howItWorksService.js
const API_URL = process.env.STRAPI_URL;

export const howItWorksService = {
  async getAllGuides() {
    const response = await fetch(
      `${API_URL}/api/how-it-works?populate=*&filters[isActive][$eq]=true&sort=order:asc`
    );
    return response.json();
  },

  async getGuideBySlug(slug) {
    const response = await fetch(
      `${API_URL}/api/how-it-works?filters[slug][$eq]=${slug}&populate[steps][populate]=*&populate[thumbnail]=*`
    );
    return response.json();
  },

  async getGuidesByCategory(category) {
    const response = await fetch(
      `${API_URL}/api/how-it-works?filters[category][$eq]=${category}&filters[isActive][$eq]=true&populate=*`
    );
    return response.json();
  }
};