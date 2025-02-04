// headerBehavior.js
let lastScrollTop = 0;

window.addEventListener(
  "scroll",
  function () {
    var currentScroll = window.scrollY || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop) {
      // Scrolling down
      document.querySelector(".site-header").style.top = "-100px";
    } else {
      // Scrolling up
      document.querySelector(".site-header").style.top = "0px";
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  },
  false,
);
