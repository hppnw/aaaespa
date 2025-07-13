// Reload the page whenever it is shown from the browser cache (e.g., when navigating back or forward).
// This ensures the latest data and UI are displayed.
(function () {
  function cameFromBackForward() {
    // Standard Navigation Timing API
    if (performance && typeof performance.getEntriesByType === 'function') {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        return navEntries[0].type === 'back_forward';
      }
    }
    // Fallback for older browsers
    if (performance && performance.navigation) {
      return performance.navigation.type === 2; // 2 === TYPE_BACK_FORWARD
    }
    return false;
  }

  window.addEventListener('pageshow', function (event) {
    // event.persisted is true when the page was restored from the BFCache
    if (event.persisted || cameFromBackForward()) {
      // Force a hard reload so that scripts run fresh
      window.location.reload();
    }
  });
});
