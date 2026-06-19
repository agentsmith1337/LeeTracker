(function () {
  try {
    var theme = localStorage.getItem("leetrack-theme");
    var isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch (e) {}
})();