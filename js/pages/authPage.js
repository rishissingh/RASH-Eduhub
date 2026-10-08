/**
 * RASH EduHub - Authentication Page Controller (Google OAuth)
 * Initializes Google Identity Services sign-in button and handles
 * the credential callback for both login and registration pages.
 * Shows a role-picker modal for first-time users on the login page.
 */

document.addEventListener('DOMContentLoaded', () => {
   initRoleSelector();
   initGoogleSignIn();
});

/**
 * Handle role radio/card switcher UI (used on Register page & role-picker modal)
 */
function initRoleSelector() {
   const roleCards = document.querySelectorAll('.role-card');
   roleCards.forEach(card => {
      card.addEventListener('click', () => {
         // Only toggle within the same parent group
         const parent = card.closest('.role-select-grid');
         if (parent) {
            parent.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
         }
         card.classList.add('active');
         const radio = card.querySelector('input[type="radio"]');
         if (radio) radio.checked = true;
      });
   });

   // Handle query parameter ?role=teacher or ?role=student
   const urlParams = new URLSearchParams(window.location.search);
   const roleParam = urlParams.get('role');
   if (roleParam) {
      const targetCard = document.querySelector(`.role-card[data-role="${roleParam}"]`);
      if (targetCard) targetCard.click();
   }
}

/**
 * Get selected role from the page (register page or role-picker modal)
 */
function getSelectedRole() {
   // Check role-picker modal first (login page)
   const modalRole = document.querySelector('#role-picker-modal input[name="google-role"]:checked');
   if (modalRole) return modalRole.value;

   // Then check register page role selector
   const regRole = document.querySelector('#reg-role-student, #reg-role-teacher');
   if (regRole) {
      const checked = document.querySelector('input[name="role"]:checked');
      return checked ? checked.value : 'student';
   }

   return 'student';
}

/**
 * Initialize Google Identity Services and render the sign-in button
 */
function initGoogleSignIn() {
   const clientId = window.GoogleConfig ? window.GoogleConfig.clientId : null;

   if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      showGoogleConfigError();
      return;
   }

   // Wait for GIS library to load
   const waitForGIS = setInterval(() => {
      if (window.google && window.google.accounts) {
         clearInterval(waitForGIS);
         setupGoogleButton(clientId);
      }
   }, 100);

   // Timeout after 10 seconds
   setTimeout(() => clearInterval(waitForGIS), 10000);
}

/**
 * Setup Google Sign-In button once GIS library is loaded
 */
function setupGoogleButton(clientId) {
   // Initialize Google Identity Services
   google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
   });

   // Create custom button for login page
   const loginBtnContainer = document.getElementById('google-signin-btn');
   if (loginBtnContainer) {
      createCustomGoogleButton(loginBtnContainer, 'Sign in with Google', clientId);
   }

   // Create custom button for register page
   const signupBtnContainer = document.getElementById('google-signup-btn');
   if (signupBtnContainer) {
      createCustomGoogleButton(signupBtnContainer, 'Sign up with Google', clientId);
   }
}

/**
 * Create a custom styled Google button with large font
 * Renders Google's real button hidden, and overlays a styled one that clicks it
 */
function createCustomGoogleButton(container, text, clientId) {
   // Hidden container for the real Google button (needed for OAuth flow)
   const hiddenDiv = document.createElement('div');
   hiddenDiv.style.cssText = 'position:absolute;opacity:0;pointer-events:none;height:0;overflow:hidden;';
   container.appendChild(hiddenDiv);

   google.accounts.id.renderButton(hiddenDiv, {
      theme: 'outline',
      size: 'large',
      width: 300,
      text: 'signin_with'
   });

   // Custom visible button
   const btn = document.createElement('button');
   btn.type = 'button';
   btn.className = 'google-custom-btn';
   btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 48 48">
         <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
         <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
         <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
         <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span>${text}</span>
   `;

   btn.addEventListener('click', () => {
      // Try to click the hidden Google button
      const hiddenBtn = hiddenDiv.querySelector('[role="button"]') || hiddenDiv.querySelector('div[tabindex]');
      if (hiddenBtn) {
         hiddenBtn.click();
      } else {
         // Fallback: use prompt
         google.accounts.id.prompt();
      }
   });

   container.appendChild(btn);
}

/**
 * Handle the Google credential response
 * Called after user successfully authenticates with Google
 */
async function handleGoogleCredential(response) {
   const idToken = response.credential;

   if (!idToken) {
      if (window.Toast) window.Toast.error('Google authentication failed. No credential received.', 'Error');
      return;
   }

   // Determine if this is a login or register page
   const isRegisterPage = !!document.getElementById('google-signup-btn');

   if (isRegisterPage) {
      // Register page: use the role selected on the page
      const role = getSelectedRole();
      await processGoogleAuth(idToken, role);
   } else {
      // Login page: first try to login (existing user)
      // The backend will tell us if this is a new user
      await processGoogleAuth(idToken, 'student');
   }
}

/**
 * Process Google authentication with the backend
 */
async function processGoogleAuth(idToken, role) {
   // Show loading state
   const loadingOverlay = createLoadingOverlay();
   document.body.appendChild(loadingOverlay);

   try {
      const res = await AuthService.googleLogin(idToken, role);

      if (res.success) {
         // If this is a NEW user and we're on the LOGIN page, show role picker
         if (res.isNew && !document.getElementById('google-signup-btn')) {
            loadingOverlay.remove();
            showRolePicker(idToken, res.user);
            return;
         }

         const displayName = res.user.name || 'User';
         const msg = res.isNew 
            ? `Welcome to RASH EduHub, ${displayName}! Account created as ${res.user.role.toUpperCase()}.` 
            : `Welcome back, ${displayName}!`;

         if (window.Toast) window.Toast.success(msg, 'Google Sign-In');

         setTimeout(() => {
            const target = res.user.role === 'teacher' 
               ? 'teacher/dashboard.html' 
               : (res.user.role === 'admin' ? 'admin/dashboard.html' : 'student/dashboard.html');
            window.location.href = AuthService.getRelativePath(target);
         }, 800);
      } else {
         loadingOverlay.remove();
         if (window.Toast) window.Toast.error(res.message || 'Google login failed.', 'Error');
      }
   } catch (err) {
      loadingOverlay.remove();
      if (window.Toast) window.Toast.error('An error occurred during authentication.', 'Error');
      console.error('Google auth error:', err);
   }
}

/**
 * Show role-picker modal for first-time Google sign-in on login page
 */
function showRolePicker(idToken, tempUser) {
   const modal = document.getElementById('role-picker-modal');
   if (!modal) return;

   modal.style.display = 'flex';

   // Re-init role cards inside modal
   const modalRoleCards = modal.querySelectorAll('.role-card');
   modalRoleCards.forEach(card => {
      card.addEventListener('click', () => {
         modalRoleCards.forEach(c => c.classList.remove('active'));
         card.classList.add('active');
         const radio = card.querySelector('input[type="radio"]');
         if (radio) radio.checked = true;
      });
   });

   // Handle confirm button
   const confirmBtn = document.getElementById('role-confirm-btn');
   if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
         const selectedRole = document.querySelector('#role-picker-modal input[name="google-role"]:checked');
         const role = selectedRole ? selectedRole.value : 'student';

         confirmBtn.disabled = true;
         confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up your account...';

         // Re-authenticate with the selected role to update the user
         const res = await AuthService.googleLogin(idToken, role);

         if (res.success) {
            modal.style.display = 'none';
            if (window.Toast) window.Toast.success(`Account set up as ${role.toUpperCase()}! Welcome!`, 'Success');
            setTimeout(() => {
               const target = role === 'teacher' ? 'teacher/dashboard.html' : 'student/dashboard.html';
               window.location.href = AuthService.getRelativePath(target);
            }, 800);
         } else {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="fas fa-rocket"></i> Get Started';
            if (window.Toast) window.Toast.error(res.message || 'Failed to set role.', 'Error');
         }
      });
   }

   // Close modal on backdrop click
   modal.addEventListener('click', (e) => {
      if (e.target === modal) {
         modal.style.display = 'none';
      }
   });
}

/**
 * Create a loading overlay element
 */
function createLoadingOverlay() {
   const overlay = document.createElement('div');
   overlay.className = 'google-loading-overlay';
   overlay.innerHTML = `
      <div class="google-loading-content glass-card">
         <div class="google-loading-spinner"></div>
         <p style="font-size: 1.6rem; color: var(--black); margin-top: 1.5rem; font-weight: 600;">
            Authenticating with Google...
         </p>
         <p style="font-size: 1.3rem; color: var(--light-color); margin-top: 0.5rem;">
            Please wait while we verify your account
         </p>
      </div>
   `;
   return overlay;
}

/**
 * Show configuration error when Google Client ID is not set
 */
function showGoogleConfigError() {
   const containers = ['google-signin-btn', 'google-signup-btn'];
   containers.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
         el.innerHTML = `
            <div style="padding: 2rem; background: rgba(234, 67, 53, 0.08); border: 2px dashed #ea4335; border-radius: 1.2rem; text-align: center;">
               <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #ea4335; margin-bottom: 1rem;"></i>
               <p style="font-size: 1.4rem; color: #ea4335; font-weight: 600; margin-bottom: 0.8rem;">
                  Google Client ID Not Configured
               </p>
               <p style="font-size: 1.2rem; color: var(--light-color); line-height: 1.8;">
                  Open <code style="background: var(--light-bg); padding: 0.2rem 0.6rem; border-radius: 0.4rem;">js/services/googleConfig.js</code> 
                  and replace <code style="background: var(--light-bg); padding: 0.2rem 0.6rem; border-radius: 0.4rem;">YOUR_GOOGLE_CLIENT_ID_HERE</code> 
                  with your actual Google Client ID.
               </p>
            </div>
         `;
      }
   });
}
