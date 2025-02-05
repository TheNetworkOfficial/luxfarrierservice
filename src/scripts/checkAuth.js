// checkAuth.js
import { API_BASE_URL } from '../config.js';

// Check if user is logged in
fetch(`${API_BASE_URL}/api/profile`, {
  method: "GET",
  credentials: "include",
})
  .then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      // User is not logged in
      window.location.href = "login.html";
    }
  })
  .then((data) => {
    // User is logged in
    const welcomeMessage = document.getElementById("welcome-message");
    if (welcomeMessage) {
      welcomeMessage.innerText = `Welcome, ${data.username}!`;
    }
  })
  .catch((error) => console.error("Error:", error));
