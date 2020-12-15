// Remember me - load username from localStorage
window.addEventListener("load", () => {
  localStorage.removeItem("password");
  if (localStorage.getItem("remember") === "true") {
    document.getElementById("remember-me").setAttribute('checked', true);
  }
  else {
    document.getElementById("remember-me").setAttribute('checked', false);
    document.getElementById("remember-me").click()
  }

  if (localStorage.getItem("username") === null) {
    localStorage.removeItem("username");
  }
  else {
    document.getElementById("input-username").setAttribute(
      'value', localStorage.getItem("username")
    );
  }
});

// Remember me - store username in localStorage
document.getElementById("login100-form-btn").addEventListener("click", () => {
  const checkBox = document.getElementById("remember-me");
  if (checkBox.checked) {
    const username = document.getElementById("input-username").value;
    localStorage.setItem("username", username);
    localStorage.setItem("remember", "true");
  }
  else {
    localStorage.removeItem("username");
    localStorage.setItem("remember", "false");
  }
});
