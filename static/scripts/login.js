const viewSelect = document.getElementById("view-select");
const viewLogin = document.getElementById("view-login");
const viewSignup = document.getElementById("view-signup");
const backBtn = document.getElementById("backBtn");
const accountCards = document.querySelectorAll(".account-card");
const loginAccountLabel = document.getElementById("loginAccountLabel");
const signupAccountLabel = document.getElementById("signupAccountLabel");
const goToSignUp = document.getElementById("goToSignUp");
const goToLogin = document.getElementById("goToLogin");

let currentAccountType = "Officials";

function showView(view) {
    [viewSelect, viewLogin, viewSignup].forEach(v => v.classList.remove("active"));
    view.classList.add("active");
}

accountCards.forEach(card => {
    card.addEventListener("click", () => {
    currentAccountType = card.dataset.account;
    loginAccountLabel.textContent = currentAccountType + " Account";
    signupAccountLabel.textContent = currentAccountType + " Account";
    backBtn.classList.remove("hidden");
       showView(viewLogin);
    });
});

backBtn.addEventListener("click", () => {
    showView(viewSelect);
    backBtn.classList.add("hidden");
});

goToSignUp.addEventListener("click", () => {
    showView(viewSignup);
});

goToLogin.addEventListener("click", () => {
    showView(viewLogin);
});

// Password visibility toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (!input) return;

    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    btn.classList.toggle("active", show);
  });
});
