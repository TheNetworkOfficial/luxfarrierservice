// loadHeaderFooter.js
document.addEventListener("DOMContentLoaded", function () {
  Promise.all([
    fetch("header.html").then((response) => response.text()),
    fetch("footer.html").then((response) => response.text()),
  ]).then(([headerData, footerData]) => {
    document.getElementById("header-placeholder").innerHTML = headerData;
    document.getElementById("footer-placeholder").innerHTML = footerData;
    // Network switch popup placeholder to be loaded after header and footer are loaded
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="network-switch-popup-placeholder"></div>',
    );
    emitContentLoadedEvent(); // Emit the event after everything is loaded, including the placeholder
  });
});

// Function to emit a custom event after header and footer are loaded
function emitContentLoadedEvent() {
  const event = new CustomEvent("dynamicContentLoaded");
  document.dispatchEvent(event);
}
