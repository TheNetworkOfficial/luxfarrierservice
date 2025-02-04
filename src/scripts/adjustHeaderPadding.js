// adjustHeaderPadding.js using MutationObserver
const observer = new MutationObserver((mutations, obs) => {
  const header = document.querySelector(".site-header");
  if (header) {
    const headerHeight = header.offsetHeight;
    document.body.style.paddingTop = headerHeight + "px";
    console.log(`Header loaded with height: ${headerHeight}px`);
    obs.disconnect(); // Stop observing once done
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});