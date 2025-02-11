// mobileFormAdjuster.js
document.addEventListener('DOMContentLoaded', function() {
    // Only apply these mobile-only handlers if we are in mobile view.
    const isMobile = window.innerWidth <= 575.98;
    
    if (isMobile) {
      const personalContainer = document.querySelector('.client-personal');
      const addressContainer = document.querySelector('.client-address');
      const clientNextBtn = document.getElementById('client-next');
      const clientBackBtn = document.getElementById('client-back');
      
      // Initially, only personal info is visible, and the back button is hidden.
      personalContainer.style.display = 'block';
      addressContainer.style.display = 'none';
      clientBackBtn.style.display = 'none';
      
      // Update the mobile Next button’s disabled state based on current sub-step.
      function updateMobileNextState() {
        // Get the field values
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const clientEmail = document.getElementById('clientEmail').value.trim();
        const streetAddress = document.getElementById('streetAddress').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value.trim();
        
        // Basic patterns
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const zipPattern = /^\d{5}$/;
        const phoneDigits = clientPhone.replace(/\D/g, '');
        
        if (personalContainer.style.display !== 'none') {
          // Personal info sub-step is active
          clientNextBtn.disabled = !(firstName && lastName && phoneDigits.length === 10 && emailPattern.test(clientEmail));
        } else {
          // Address info sub-step is active
          clientNextBtn.disabled = !(streetAddress && city && state && zipPattern.test(zip));
        }
      }
      
      // Attach listeners to all relevant inputs (you might already have similar listeners)
      const clientFields = document.querySelectorAll('#firstName, #lastName, #clientPhone, #clientEmail, #streetAddress, #city, #state, #zip');
      clientFields.forEach(input => {
        input.addEventListener('input', updateMobileNextState);
        input.addEventListener('change', updateMobileNextState);
      });
      
      // When user clicks "Next" on mobile:
      clientNextBtn.addEventListener('click', function() {
        if (personalContainer.style.display !== 'none') {
          // Transition from personal info to address info
          personalContainer.style.display = 'none';
          addressContainer.style.display = 'block';
          clientBackBtn.style.display = 'inline-block';
          // Re-check validation for address sub-step:
          updateMobileNextState();
        } else {
          // Address info is visible – proceed to Step 2
          const step1 = document.getElementById('step-1');
          const step2 = document.getElementById('step-2');
          step1.style.display = 'none';
          step2.style.display = 'block';
          window.scrollTo(0, 0);
        }
      });
      
      // When user clicks "Back" on mobile:
      clientBackBtn.addEventListener('click', function() {
        // Return to personal info sub-step
        addressContainer.style.display = 'none';
        personalContainer.style.display = 'block';
        clientBackBtn.style.display = 'none';
        updateMobileNextState();
      });
      
      // Call updateMobileNextState once on load.
      updateMobileNextState();
    }
  });