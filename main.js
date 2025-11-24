let currentAction = 'home';
let lastAction;

function loadPage(page, direct = false) {

  // Saving Anim
  lastAction = currentAction;
  currentAction = page;

  const contentDiv = document.getElementById("page-content");
  // Start fade out
  contentDiv.classList.add("fade-out");

  setTimeout(() => {
    fetch(`pages/${page}.html`)
      .then(response => { return response.text(); })
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
  const currentPage = urlParams.get("redirect") || window.location.pathname.split('/').at(-1) || "home";  // Default to home
  setTimeout(() => {
    loadPage(currentPage, true);
  }, 1000);
});

window.addEventListener("click", (event) => {
  const target = event.target.closest("a");
  if (target && target.getAttribute("href") && !target.getAttribute("href").startsWith("https")) {
    event.preventDefault();

    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobile-menu');
    const menuToggle = document.getElementById('menu-toggle');
    if (mobileMenu && !mobileMenu.classList.contains('pointer-events-none')) {
      mobileMenu.classList.add('opacity-0', 'pointer-events-none');
      mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
      // Reset hamburger icon (simplified)
      const spans = menuToggle.querySelectorAll('span');
      spans[0].classList.remove('rotate-45', 'translate-y-1.5');
      spans[1].classList.remove('opacity-0');
      spans[2].classList.remove('-rotate-45', '-translate-y-1.5');
    }

    loadPage(target.getAttribute("href"), target.getAttribute("id"));
  }
});

// Mobile Menu Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('opacity-100');
      const spans = menuToggle.querySelectorAll('span');

      if (isOpen) {
        // Close
        mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
        mobileMenu.classList.add('opacity-0', 'pointer-events-none');

        // Icon animation reset
        spans[0].classList.remove('rotate-45', 'translate-y-1.5');
        spans[1].classList.remove('opacity-0');
        spans[2].classList.remove('-rotate-45', '-translate-y-1.5');
      } else {
        // Open
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('opacity-100', 'pointer-events-auto');

        // Icon animation
        spans[0].classList.add('rotate-45', 'translate-y-1.5');
        spans[1].classList.add('opacity-0');
        spans[2].classList.add('-rotate-45', '-translate-y-1.5');
      }
    });
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

