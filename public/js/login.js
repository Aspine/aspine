// Remember me - load username/password from localStorage
window.addEventListener("load", () => {
  if (localStorage.getItem("remember") === "true") {
    document.getElementById("remember-me").setAttribute('checked', true);
  }
  else {
    document.getElementById("remember-me").setAttribute('checked', false);
  }

  if (localStorage.getItem("username") === null) {
    localStorage.removeItem("username");
  }
  else {
    document.getElementById("input-username").setAttribute(
      'value', localStorage.getItem("username")
    );
    document.getElementById("input-password").setAttribute(
      'value', localStorage.getItem("password")
    );
  }

  if (localStorage.getItem("password") === null) {
    localStorage.removeItem("password");
  }
});

// Remember me - store username/password in localStorage
document.getElementById("login100-form-btn").addEventListener("click", () => {
  const checkBox = document.getElementById("remember-me");
  if (checkBox.checked) {
    const username = document.getElementById("input-username").value;
    const password = document.getElementById("input-password").value;
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    localStorage.setItem("remember", "true");
  }
  else {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.setItem("remember", "false");
  }
});
