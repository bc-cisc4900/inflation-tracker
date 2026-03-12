/**
 * app.js
 * This file supports small frontend behavior for the Grocery Inflation Tracker website.
 * Current purpose: display the current year in the footer.
 * Future versions may add dynamic data loading, filters, or API-backed updates.
 */

document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
