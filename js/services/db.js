/**
 * RASH EduHub - API Config & Central Fetch Helper
 * Replaces direct LocalStorage queries with network requests to the Node/Express backend.
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Central authenticated API request helper
 */
async function api(endpoint, options = {}) {
   const token = localStorage.getItem('eduhub_jwt_token');
   
   const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
   };

   if (token) {
      headers['Authorization'] = `Bearer ${token}`;
   }

   const config = {
      ...options,
      headers
   };

   // Handle standard JSON bodies
   if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
   }

   // If body is FormData, delete Content-Type to let the browser set it with boundary
   if (config.body instanceof FormData) {
      delete headers['Content-Type'];
   }

   try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
         throw new Error(data.message || 'API request failed');
      }
      
      return data;
   } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
   }
}

// Keep a minimal STORAGE_KEYS mapping for compatibility / local preferences
const STORAGE_KEYS = {
   USERS: 'eduhub_users',
   CURRENT_USER: 'eduhub_current_user',
   COURSES: 'eduhub_courses',
   ENROLLMENTS: 'eduhub_enrollments',
   PROGRESS: 'eduhub_progress',
   COMMENTS: 'eduhub_comments',
   NOTIFICATIONS: 'eduhub_notifications',
   SETTINGS: 'eduhub_settings'
};

function initDatabase() {
   // The backend DB is initialized by the seed script.
   // We can log a status check.
   console.log('🔗 Client-side API layer initialized connecting to: ' + API_BASE_URL);
}

initDatabase();

window.EduHubDB = {
   STORAGE_KEYS,
   API_BASE_URL,
   api,
   initDatabase
};
