// ================== SMOOTH SCROLLING ==================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e){
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if(target){
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  });
});

// ================== ACTIVE NAV HIGHLIGHT ==================
const sectionsMap = Array.from(document.querySelectorAll('section')).map(section => ({
  id: section.id,
  top: section.offsetTop
}));

function updateActiveNav() {
  const scrollPos = window.scrollY + 120;
  let current = sectionsMap[0]?.id;
  sectionsMap.forEach(section => {
    if (scrollPos >= section.top) current = section.id;
  });
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

// ================== ANIMATED ELEMENTS ON SCROLL ==================
const animatedElements = document.querySelectorAll('.section-title, .card, .tool-card, .story-content');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('animate');
    }
  });
}, { threshold: 0.1 });

animatedElements.forEach(el => {
  el.classList.add('pre-animate'); // initial hidden state
  observer.observe(el);
});

// ================== FEATHER ICONS ==================
if(window.feather){
  feather.replace();
}

// ================== SCROLL TO TOP BUTTON ==================
const scrollBtn = document.createElement('button');
scrollBtn.textContent = '↑';
scrollBtn.id = 'scrollTopBtn';
document.body.appendChild(scrollBtn);

scrollBtn.addEventListener('click', () => {
  window.scrollTo({top: 0, behavior: 'smooth'});
});

window.addEventListener('scroll', () => {
  if(window.scrollY > 300){
    scrollBtn.style.display = 'block';
  } else {
    scrollBtn.style.display = 'none';
  }
});

// ================== SECTION REVEAL ==================
const sections = document.querySelectorAll('section');

function revealSection() {
  const triggerBottom = window.innerHeight * 0.85;
  sections.forEach(section => {
    const top = section.getBoundingClientRect().top;
    if(top < triggerBottom){
      section.classList.add('section-visible');
    }
  });
}

window.addEventListener('scroll', revealSection);
revealSection();

window.addEventListener('scroll', updateActiveNav);
updateActiveNav();

// ================== TESTIMONIAL SLIDER ==================
const testimonials = [
  {
    quote: "“UniLife keeps my week organized without overwhelming me.”",
    name: "Aisha Bello",
    role: "Biochemistry, 300L"
  },
  {
    quote: "“The expense tracker finally made me stop guessing where money goes.”",
    name: "Tomi Ade",
    role: "Computer Science, 200L"
  },
  {
    quote: "“Simple, clean, and it actually fits student life.”",
    name: "Ibrahim Musa",
    role: "Economics, 400L"
  }
];

let currentTestimonial = 0;
const quoteEl = document.getElementById('testimonialQuote');
const nameEl = document.getElementById('testimonialName');
const roleEl = document.getElementById('testimonialRole');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');

function renderTestimonial(index) {
  if (!quoteEl || !nameEl || !roleEl) return;
  const t = testimonials[index];
  quoteEl.textContent = t.quote;
  nameEl.textContent = t.name;
  roleEl.textContent = t.role;
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    renderTestimonial(currentTestimonial);
  });
  nextBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    renderTestimonial(currentTestimonial);
  });

  setInterval(() => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    renderTestimonial(currentTestimonial);
  }, 7000);
}
