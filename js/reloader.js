//reloader.js
(function () {
    function cameFromBackForward() {
      if (performance && typeof performance.getEntriesByType === 'function') {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          return navEntries[0].type === 'back_forward';
        }
      }
      if (performance && performance.navigation) {
        return performance.navigation.type === 2;
      }
      return false;
    }
  
    window.addEventListener('pageshow', function (event) {
      if (event.persisted || cameFromBackForward()) {
        window.location.reload();
      }
    });
  })();