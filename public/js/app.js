if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, err => {
      // registration failed :(
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}

// Remember me and autofill functions

function rememberMe() {
  if (localStorage.getItem("remember") === "yes") {
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
}

function autofill() {
  const checkBox = document.getElementById("remember-me");
  if (checkBox.checked === true) {
    const username = document.getElementById("input-username").value;
    const password =  document.getElementById("input-password").value;
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    localStorage.setItem("remember", "yes");
  }
  if (checkBox.checked === false) {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.setItem("remember", "no");
  }
}
