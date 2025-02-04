// scrollToTop.js
document.addEventListener("dynamicContentLoaded", function () {
    // Check if the current page is the Scheduling page
    // Adjust the condition based on your URL structure
    if (window.location.pathname.includes("scheduling.html")) {
      // Scroll to the top of the page
      window.scrollTo({
        top: 0,
        behavior: 'instant' // Use 'smooth' for a smooth scrolling effect
      });
  
      // Optional: Log to console for debugging purposes
      console.log("Scrolled to top on Scheduling page reload.");
    }
});
  