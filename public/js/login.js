// Display appropriate error message on failed login
let err;
if ((err = (new URLSearchParams(window.location.search)).get("error"))) {
  let message;
  switch (err) {
    case "loginfail":
      message = "Incorrect username or password.";
      break;
    case "aspendown":
      message = "Aspen is currently unreachable.";
      break;
  }
  if (message) {
    const elem = document.querySelector("#error");
    elem.style.setProperty("display", "unset");
    elem.textContent = message;
  }
}

// Remove vestiges of client-side "remember me" from localStorage
window.addEventListener("load", () => {
  localStorage.removeItem("username");
  localStorage.removeItem("password");
});
