document.querySelectorAll(".toggle-password").forEach(t => {
    t.addEventListener("click", () => {
        const id = t.dataset.target;
        const input = document.getElementById(id);
        if (!input) return;
        const isPwd = input.type === "password";
        input.type = isPwd ? "text" : "password";
        t.classList.toggle("active", isPwd);
    });
});