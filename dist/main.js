let currentAction = 'home';
let lastAction;

function loadPage(page, direct=false) {

    // Saving Anim
    lastAction = currentAction;
    currentAction = page;

    const contentDiv = document.getElementById("page-content");
    // Start fade out
    contentDiv.classList.add("fade-out");

    setTimeout(() => {
        fetch(`pages/${page}.html`)
            .then(response => {return response.text();})
            .then(html => {
                contentDiv.innerHTML = html;
                contentDiv.classList.remove("fade-out");
                contentDiv.classList.add("fade-in");

                // Update URL without reloading
                history.pushState({ page: page }, "", page);
            })
            .catch(error => console.error("Error loading page:", error));
    }, 500);
    transition(page);
}

// Handle browser back/forward navigation
window.addEventListener("popstate", (event) => {
    if (event.state && event.state.page) {
        loadPage(event.state.page, lastAction, true);
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = urlParams.get("redirect") || window.location.pathname.split('/').at(-1) ||"home";  // Default to home
    setTimeout(() => {
        loadPage(currentPage, true);  
    }, 1000);
});

window.addEventListener("click", (event) => {
    const target = event.target.closest("a");
    if(target && target.getAttribute("href") && !target.getAttribute("href").startsWith("https")) {
        event.preventDefault();
        loadPage(target.getAttribute("href"), target.getAttribute("id"));
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll(".team-card");
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.remove("opacity-0", "translate-y-10");
            card.classList.add("opacity-100", "translate-y-0");
          }, i * 150); // stagger by 150ms
        });
      }
    });
  }, { threshold: 0.2 });

  // Observe each section (trainers & EC)
  document.querySelectorAll(".team-section").forEach((section) => observer.observe(section));
});

