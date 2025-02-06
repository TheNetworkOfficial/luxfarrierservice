document.addEventListener("dynamicContentLoaded", () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  
    if (!mobileMenuToggle || !mobileMenu || !mobileMenuClose || !mobileMenuOverlay) {
      console.error('One or more mobile menu elements are missing.');
      return;
    }
  
    const openMobileMenu = () => {
      mobileMenu.classList.add('open');
      document.body.classList.add('mobile-menu-open');
    };
  
    const closeMobileMenu = () => {
      mobileMenu.classList.remove('open');
      document.body.classList.remove('mobile-menu-open');
    };
  
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileMenu();
    });
  
    mobileMenuClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMobileMenu();
    });
  
    // Prevent clicks inside the mobile menu from propagating
    mobileMenu.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  
    // Close menu if clicking on the overlay
    mobileMenuOverlay.addEventListener('click', () => {
      closeMobileMenu();
    });
  
    // Prevent clicks on links from bubbling (optional delay if needed)
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.stopPropagation();
        // Optionally delay closing to let the navigation occur:
        setTimeout(closeMobileMenu, 100);
      });
    });
});