/**
 * RASH EduHub - Gamification Engine
 * Manages Student XP, Coins, Daily Learning Streaks, Heatmap, and Leaderboard ranking.
 * Connected to Node/Express backend.
 */

const GamificationService = {
   /**
    * Get student gamification state from backend
    */
   async getStats() {
      try {
         const data = await EduHubDB.api('/gamification/stats');
         return data.success ? data.stats : { xp: 0, coins: 0, streak: 1, level: 1, rank: 5 };
      } catch (err) {
         console.error('Failed to get gamification stats:', err);
         return { xp: 0, coins: 0, streak: 1, level: 1, rank: 5 };
      }
   },

   /**
    * Get Global Leaderboard rankings from backend
    */
   async getLeaderboard() {
      try {
         const data = await EduHubDB.api('/gamification/leaderboard');
         return data.success ? data.leaderboard : [];
      } catch (err) {
         console.error('Failed to get leaderboard:', err);
         return [];
      }
   }
};

window.GamificationService = GamificationService;
