document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  function hideAllTabContents() {
    tabContents.forEach((content) => (content.style.display = "none"));
  }

  function removeAllActiveClasses() {
    tabs.forEach((tab) => tab.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));
  }

  function activateTab(tabId) {
    removeAllActiveClasses();
    hideAllTabContents();

    const tab = document.querySelector(`.tab-button[data-target="${tabId}"]`);
    const targetContent = document.getElementById(tabId);

    if (tab && targetContent) {
      tab.classList.add("active");
      targetContent.style.display = "block";
      targetContent.classList.add("active");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default anchor behavior
      const targetId = this.getAttribute("data-target");

      // Use history.pushState() to change the URL without causing a scroll jump
      history.pushState(null, "", `#${targetId}`);

      activateTab(targetId);
    });
  });

  function handleHashChange() {
    const activeTabHash = window.location.hash.substring(1); // Remove the '#' at the start
    if (activeTabHash) {
      activateTab(activeTabHash);
    } else {
      // Fallback to showing the first tab content and setting the first tab as active
      if (tabs.length > 0 && tabContents.length > 0) {
        activateTab(tabs[0].getAttribute("data-target"));
      }
    }
  }

  // Listen for hashchange events in addition to DOMContentLoaded
  window.addEventListener("hashchange", handleHashChange);

  // Call handleHashChange on initial page load to handle any hash present in the URL
  handleHashChange();
});
