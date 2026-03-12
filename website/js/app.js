/**
 * app.js
 * Purpose:
 * This file contains simple frontend behavior for the Grocery Inflation Tracker website.
 *
 * Why it exists:
 * It keeps JavaScript separate from the HTML file so the project is easier to maintain.
 * Right now it updates the footer year automatically. In future versions it may also
 * support filtering, fetching grocery data, and dynamic page updates.
 *
 * Inputs:
 * - No direct user input at the moment.
 * - Reads the HTML element with id="year".
 *
 * Outputs:
 * - Updates the footer year displayed on the page.
 */

document.addEventListener("DOMContentLoaded", function () {
  /**
   * Finds the footer year span and fills it with the current year.
   *
   * Input:
   * - Existing DOM element with id="year"
   *
   * Output:
   * - The page footer displays the current year.
   */
  const yearSpan = document.getElementById("year");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
