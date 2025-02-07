//mobileServices.js
document.addEventListener("DOMContentLoaded", function () {
    const mobileButtons = document.querySelectorAll(".mobile-service-btn");
    const overlay = document.getElementById("mobile-overlay");
    const overlayBody = document.getElementById("overlay-body");
    const closeBtn = document.getElementById("overlay-close");
  
    mobileButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const category = btn.getAttribute("data-category");
        // Find the corresponding grid-item using the data-category attribute
        const gridItem = document.querySelector(
          `.services-grid .grid-item[data-category="${category}"]`
        );
        if (gridItem) {
          // Clone the content of the grid item into the overlay
          overlayBody.innerHTML = gridItem.innerHTML;
        }
        overlay.style.display = "flex";
      });
    });
  
    closeBtn.addEventListener("click", function () {
      overlay.style.display = "none";
    });
  
    // Hide the overlay if the user clicks outside the content area
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        overlay.style.display = "none";
      }
    });
  
    // NEW: Delegate click events within the overlay to the plus/minus icons
    overlayBody.addEventListener("click", function (e) {
      // Check for a plus icon
      const plus = e.target.closest(".add-to-calculator");
      if (plus) {
        const name = plus.getAttribute("data-name");
        const price = parseFloat(plus.getAttribute("data-price"));
        if (window.addItem) {
          window.addItem(name, price);
        }
      }
      // Check for a minus icon
      const minus = e.target.closest(".remove-from-calculator");
      if (minus) {
        const name = minus.getAttribute("data-name");
        const price = parseFloat(minus.getAttribute("data-price"));
        if (window.removeItem) {
          window.removeItem(name, price);
        }
      }
    });
  });