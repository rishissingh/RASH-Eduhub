/**
 * RASH EduHub — Google OAuth Configuration
 * 
 * HOW TO GET YOUR CLIENT ID (FREE):
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project (or select existing)
 * 3. Go to APIs & Services → Credentials
 * 4. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
 * 5. Application type: "Web application"
 * 6. Add Authorized JavaScript origins: http://localhost:5000
 * 7. Copy the Client ID and paste it below
 */

const GOOGLE_CLIENT_ID = '837078721619-6mqtv7fu6n76u29cc1b8bh4ghg0evdn0.apps.googleusercontent.com';

window.GoogleConfig = {
   clientId: GOOGLE_CLIENT_ID
};
