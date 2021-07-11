// Display appropriate error message on failed login
const elem = document.getElementById("error");
switch (new URLSearchParams(window.location.search).get("error")) {
  case "loginfail":
    elem.textContent = "Incorrect username or password.";
    break;
  case "aspendown":
    elem.textContent = "Aspen is currently unreachable.";
    break;
  default:
    elem.style.setProperty("display", "none");
}

// Remove vestiges of client-side "remember me" from localStorage
window.addEventListener("load", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("password");
});
