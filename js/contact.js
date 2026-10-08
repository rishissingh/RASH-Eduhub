document.addEventListener('DOMContentLoaded', () => {
   const contactForm = document.getElementById('contact-form');
   if (!contactForm) return;

   contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = contactForm.querySelector('input[name="name"]');
      const emailInput = contactForm.querySelector('input[name="email"]');
      const msgInput = contactForm.querySelector('textarea[name="msg"]');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = msgInput.value.trim();

      if (!name || !email || !message) {
         showToast("Please fill in all fields!", "error");
         return;
      }

      // Send to Express API
      fetch('http://localhost:5000/api/contact', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({ name, email, message })
      })
      .then(response => response.json())
      .then(data => {
         if (data.success) {
            showToast(data.message || `Thank you, ${name}! Your message has been sent successfully.`, "success");
            contactForm.reset();
         } else {
            showToast(data.message || "Failed to send message. Please try again.", "error");
         }
      })
      .catch(err => {
         console.error('Contact Form error:', err);
         showToast("Network error. Please try again later.", "error");
      });
   });

   function showToast(message, type = "success") {
      // Create toast element
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '3rem';
      toast.style.right = '3rem';
      toast.style.padding = '1.5rem 3rem';
      toast.style.borderRadius = '1rem';
      toast.style.color = '#fff';
      toast.style.fontSize = '1.6rem';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '9999';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '1rem';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(2rem)';
      toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

      if (type === "success") {
         toast.style.background = 'linear-gradient(135deg, hsl(145, 65%, 45%) 0%, hsl(150, 70%, 40%) 100%)';
         toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
      } else {
         toast.style.background = 'linear-gradient(135deg, hsl(351, 80%, 55%) 0%, hsl(340, 80%, 45%) 100%)';
         toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
      }

      document.body.appendChild(toast);

      // Trigger animation
      setTimeout(() => {
         toast.style.opacity = '1';
         toast.style.transform = 'translateY(0)';
      }, 50);

      // Remove after 4 seconds
      setTimeout(() => {
         toast.style.opacity = '0';
         toast.style.transform = 'translateY(2rem)';
         setTimeout(() => {
            toast.remove();
         }, 300);
      }, 4000);
   }
});
