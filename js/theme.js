// Theme toggle. Initial theme is set by the inline script in <head>
// (before first paint) to avoid a flash of the wrong theme.
(function () {
  var toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;

  function current() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
    toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  toggle.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });

  // Follow system changes only if the user hasn't chosen manually.
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", function (e) {
    var stored = null;
    try { stored = localStorage.getItem("theme"); } catch (err) {}
    if (!stored) apply(e.matches ? "dark" : "light");
  });
})();
