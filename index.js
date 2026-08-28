/* ==========================================
   JUCSU RUN 2026 - APPLICATION SCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize Database
  initDatabase();

  // Scroll Header Effect
  initHeaderScroll();

  // Mobile Navigation menu
  initMobileMenu();

  // Countdown Timer
  initCountdown();

  // Swag Tab Toggles
  initSwagTabs();

  // FAQ Accordion Toggles
  initFaqAccordion();

  // Status Search & E-Bib Generator
  initRegistrationChecker();
  
  // Add modal registration click listeners (decorative)
  initRegisterTriggers();
});

/* ==========================================
   DATABASE INITIALIZATION
   ========================================== */
let runnerDatabase = [];

async function initDatabase() {
  const localData = localStorage.getItem('jucsu_registrations');
  if (localData) {
    try {
      runnerDatabase = JSON.parse(localData);
      console.log('Database loaded from localStorage. Total records:', runnerDatabase.length);
      return;
    } catch (e) {
      console.error('Error parsing localStorage database, falling back to JSON', e);
    }
  }

  // Fallback to fetch registrations.json
  try {
    const response = await fetch('registrations.json');
    if (response.ok) {
      runnerDatabase = await response.json();
      localStorage.setItem('jucsu_registrations', JSON.stringify(runnerDatabase));
      console.log('Database loaded from registrations.json. Total records:', runnerDatabase.length);
    }
  } catch (error) {
    console.error('Failed to fetch registrations.json database', error);
  }
}

/* ==========================================
   HEADER SCROLL & ACTIVE NAV
   ========================================== */
function initHeaderScroll() {
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Simple active link tracker on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentId = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================
   MOBILE MENU TOGGLE
   ========================================== */
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });
}

/* ==========================================
   COUNTDOWN TIMER
   ========================================== */
function initCountdown() {
  const timer = document.getElementById('countdown');
  if (!timer) return;

  const targetDateStr = timer.getAttribute('data-date');
  const targetDate = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      timer.innerHTML = "<div class='timer-finished'>RACE DAY IS HERE! RUN STRONG!</div>";
      clearInterval(intervalId);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer(); // run once immediately
  const intervalId = setInterval(updateTimer, 1000);
}

/* ==========================================
   SWAG KIT TAB TOGGLES
   ========================================== */
function initSwagTabs() {
  const tabs = document.querySelectorAll('.swag-tab-btn');
  const contents = document.querySelectorAll('.swag-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Deactivate all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Activate clicked
      tab.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}

/* ==========================================
   FAQ ACCORDION TOGGLES
   ========================================== */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains('active');

      // Close all FAQs first
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
      });

      // Toggle clicked one
      if (!isActive) {
        faqItem.classList.add('active');
      }
    });
  });
}

/* ==========================================
   REGISTRATION CHECKER & CANVAS E-BIB
   ========================================== */
function initRegistrationChecker() {
  const searchInput = document.getElementById('searchQuery');
  const searchBtn = document.getElementById('searchBtn');
  const resultsBox = document.getElementById('checkerResults');
  
  const foundSection = document.getElementById('resultFound');
  const pendingSection = document.getElementById('resultPending');
  const notFoundSection = document.getElementById('resultNotFound');

  // E-Bib text placeholders
  const bibNumText = document.getElementById('bibNumText');
  const bibNameText = document.getElementById('bibNameText');
  const bibBloodText = document.getElementById('bibBloodText');
  const bibTypeTag = document.getElementById('bibTypeTag');

  // Detail table placeholders
  const resCategory = document.getElementById('resCategory');
  const resTshirt = document.getElementById('resTshirt');
  const resGender = document.getElementById('resGender');
  const resPhone = document.getElementById('resPhone');
  const resStatus = document.getElementById('resStatus');

  // Pending placeholders
  const pendingName = document.getElementById('pendingName');
  const pendingCategory = document.getElementById('pendingCategory');

  // Download Action
  const downloadBtn = document.getElementById('downloadBibBtn');

  // Variable to store currently found runner details for download
  let currentRunner = null;

  async function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
      alert('Please enter a phone number or name to search.');
      return;
    }

    // Refresh database in case admin updated it in another tab
    await initDatabase();

    // Look up in database
    // Matches exact phone or checks if query is substring of name
    const found = runnerDatabase.find(runner => {
      const runnerName = runner.name.toLowerCase();
      const runnerPhone = runner.phone.replace(/[^0-9]/g, ''); // strip formatting
      const cleanQuery = query.replace(/[^0-9a-zA-Z]/g, ''); // alphanumeric

      // Search matches: exact phone, exact bib, or name match
      return runnerPhone === cleanQuery || 
             runner.bib === cleanQuery || 
             runnerName.includes(query);
    });

    // Reset results display
    resultsBox.classList.remove('hidden');
    foundSection.classList.add('hidden');
    pendingSection.classList.add('hidden');
    notFoundSection.classList.add('hidden');

    if (found) {
      currentRunner = found;
      if (found.status === 'Verified') {
        // Setup E-Bib visual display
        bibNumText.textContent = found.bib;
        bibNameText.textContent = found.name;
        bibBloodText.textContent = found.blood || 'N/A';
        
        let typeBadge = '5K RUN';
        if (found.category.includes('10K')) {
          typeBadge = '10K CHIP';
        }
        bibTypeTag.textContent = typeBadge;

        // Setup detail table
        resCategory.textContent = found.category;
        resTshirt.textContent = found.tshirt;
        resGender.textContent = found.gender;
        resPhone.textContent = found.phone.replace(/.(?=.{4})/g, '*'); // mask phone number except last 4 digits
        resStatus.textContent = 'VERIFIED';
        resStatus.className = 'badge badge-verified';

        foundSection.classList.remove('hidden');
      } else {
        // Pending Status
        pendingName.textContent = found.name;
        pendingCategory.textContent = found.category;
        pendingSection.classList.remove('hidden');
      }
    } else {
      currentRunner = null;
      notFoundSection.classList.remove('hidden');
    }

    // Scroll down to results smoothly
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Trigger search on button click
  searchBtn.addEventListener('click', performSearch);

  // Trigger search on pressing Enter
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Canvas Downloader Handler
  downloadBtn.addEventListener('click', () => {
    if (!currentRunner) return;
    generateCanvasBib(currentRunner);
  });
}

/* ==========================================
   CANVAS E-BIB GENERATOR
   ========================================== */
function generateCanvasBib(runner) {
  const canvas = document.getElementById('bibCanvas');
  const ctx = canvas.getContext('2d');

  // Set sizing
  const width = canvas.width;  // 800
  const height = canvas.height; // 500

  // 1. Draw Background (White base sheet)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw double rounded border outline
  ctx.strokeStyle = '#C1D82F'; // Lime Green accent from logo
  ctx.lineWidth = 14;
  ctx.lineJoin = 'round';
  ctx.strokeRect(7, 7, width - 14, height - 14);

  ctx.strokeStyle = '#005432'; // Forest Green inner outline border
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Draw Safety Pin Holes (Corners)
  ctx.fillStyle = '#dcdcdc';
  ctx.beginPath();
  ctx.arc(35, 35, 12, 0, Math.PI * 2); // Top-Left
  ctx.arc(width - 35, 35, 12, 0, Math.PI * 2); // Top-Right
  ctx.arc(35, height - 35, 12, 0, Math.PI * 2); // Bottom-Left
  ctx.arc(width - 35, height - 35, 12, 0, Math.PI * 2); // Bottom-Right
  ctx.fill();

  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(35, 35, 6, 0, Math.PI * 2);
  ctx.arc(width - 35, 35, 6, 0, Math.PI * 2);
  ctx.arc(35, height - 35, 6, 0, Math.PI * 2);
  ctx.arc(width - 35, height - 35, 6, 0, Math.PI * 2);
  ctx.fill();

  // 2. Draw Top Bar (Forest Green header)
  ctx.fillStyle = '#003d24'; // Deep primary green
  ctx.fillRect(21, 21, width - 42, 100);

  // Draw Top Bar Decorative Slanted Highlight (Lime green)
  ctx.fillStyle = '#C1D82F';
  ctx.beginPath();
  ctx.moveTo(width - 250, 21);
  ctx.lineTo(width - 21, 21);
  ctx.lineTo(width - 21, 121);
  ctx.lineTo(width - 275, 121);
  ctx.closePath();
  ctx.fill();

  // Draw Logo SVG Replacements on Canvas Header
  // Logo Background Pill Shape
  ctx.fillStyle = '#005432';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  
  ctx.beginPath();
  // Drawing mini slanted badge for logo
  ctx.moveTo(50, 40);
  ctx.lineTo(260, 40);
  ctx.bezierCurveTo(280, 40, 290, 60, 280, 80);
  ctx.lineTo(260, 100);
  ctx.lineTo(40, 100);
  ctx.bezierCurveTo(30, 100, 25, 80, 30, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Logo Texts
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 900 24px "Outfit", sans-serif';
  ctx.fillText('JUCSU', 55, 78);
  
  ctx.fillStyle = '#C1D82F';
  ctx.font = 'italic 900 16px "Outfit", sans-serif';
  ctx.fillText('RUN 2026', 150, 68);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 900 11px "Outfit", sans-serif';
  ctx.fillText('FAREWELL & MILESTONES', 145, 88);

  // Draw Category Badge on the top right
  let typeBadge = '5K RUN';
  if (runner.category.includes('10K')) {
    typeBadge = '10K CHIP';
  }

  ctx.fillStyle = '#003d24'; // text color inside yellow badge
  ctx.font = '900 24px "Outfit", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(typeBadge, width - 45, 82);
  ctx.textAlign = 'left'; // reset text align

  // 3. Draw Bib Number (Gigantic Centered)
  ctx.fillStyle = '#111111';
  ctx.font = '900 160px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(runner.bib, width / 2, height / 2 + 10);
  ctx.textAlign = 'left'; // reset text align
  ctx.textBaseline = 'alphabetic'; // reset text baseline

  // 4. Draw Footer Details Divider Line
  ctx.strokeStyle = '#dcdcdc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, height - 120);
  ctx.lineTo(width - 40, height - 120);
  ctx.stroke();

  // 5. Draw Runner Details (Bottom Left)
  // Name
  ctx.fillStyle = '#777777';
  ctx.font = '600 15px "Inter", sans-serif';
  ctx.fillText('RUNNER NAME', 50, height - 85);
  
  ctx.fillStyle = '#111111';
  ctx.font = '900 30px "Outfit", sans-serif';
  ctx.fillText(runner.name.toUpperCase(), 50, height - 50);

  // Blood Group
  ctx.fillStyle = '#777777';
  ctx.font = '600 15px "Inter", sans-serif';
  ctx.fillText('BLOOD GROUP', 440, height - 85);
  
  ctx.fillStyle = '#ff3b30'; // red color for blood group
  ctx.font = '900 30px "Outfit", sans-serif';
  ctx.fillText(runner.blood || 'N/A', 440, height - 50);

  // 6. Draw QR Code (Bottom Right)
  const qrX = width - 110;
  const qrY = height - 105;
  const qrSize = 65;

  ctx.fillStyle = '#000000';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);
  
  // Custom mock QR markings
  ctx.fillStyle = '#000000';
  // Outer squares
  ctx.fillRect(qrX + 6, qrY + 6, 18, 18);
  ctx.fillRect(qrX + 41, qrY + 6, 18, 18);
  ctx.fillRect(qrX + 6, qrY + 41, 18, 18);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX + 10, qrY + 10, 10, 10);
  ctx.fillRect(qrX + 45, qrY + 10, 10, 10);
  ctx.fillRect(qrX + 10, qrY + 45, 10, 10);

  ctx.fillStyle = '#000000';
  ctx.fillRect(qrX + 13, qrY + 13, 4, 4);
  ctx.fillRect(qrX + 48, qrY + 13, 4, 4);
  ctx.fillRect(qrX + 13, qrY + 48, 4, 4);

  // Mock pixels inside QR
  ctx.fillRect(qrX + 28, qrY + 10, 8, 4);
  ctx.fillRect(qrX + 28, qrY + 20, 4, 10);
  ctx.fillRect(qrX + 15, qrY + 28, 10, 4);
  ctx.fillRect(qrX + 38, qrY + 28, 4, 4);
  ctx.fillRect(qrX + 28, qrY + 38, 8, 4);
  ctx.fillRect(qrX + 38, qrY + 38, 10, 10);
  ctx.fillRect(qrX + 48, qrY + 28, 4, 10);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `JUCSU_RUN_2026_BIB_${runner.bib}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ==========================================
   DECORATIVE MODAL REGISTRATION TRIGGER
   ========================================== */
function initRegisterTriggers() {
  const triggers = document.querySelectorAll('.register-trigger');
  
  // Create Modal elements dynamically to keep HTML clean
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  document.body.appendChild(backdrop);

  const modal = document.createElement('div');
  modal.className = 'modal-alert';
  modal.innerHTML = `
    <h3 style="font-size: 1.6rem; margin-bottom: 15px; color:#fff;">Registration Information</h3>
    <p style="color:var(--color-text-muted); margin-bottom: 20px; font-size:0.95rem;">
      Thank you for your interest in joining <strong class="text-lime">JUCSU RUN 2026: The Farewell</strong>!
    </p>
    <div style="background: rgba(255,255,255,0.03); border:1px dashed var(--color-glass-border); padding: 15px; border-radius:10px; margin-bottom: 20px; font-size:0.9rem;">
      <p style="margin-bottom:8px;"><strong>Selected Category:</strong> <span id="modalCategory" class="text-lime" style="font-weight:700;">-</span></p>
      <p>Official registration is processed through our university portal. Click the button below to fill out the form and submit your registration.</p>
    </div>
    <div style="display:flex; gap:12px; justify-content: flex-end;">
      <button class="btn btn-outline btn-sm" id="closeModalBtn" style="border-radius:6px;">Cancel</button>
      <button class="btn btn-primary btn-sm" id="proceedRegisterBtn" style="border-radius:6px;">Go to Portal</button>
    </div>
  `;
  document.body.appendChild(modal);

  const modalCategoryText = document.getElementById('modalCategory');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const proceedRegisterBtn = document.getElementById('proceedRegisterBtn');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const category = trigger.getAttribute('data-category');
      modalCategoryText.textContent = category;
      backdrop.classList.add('open');
      modal.classList.add('open');
    });
  });

  function closeModal() {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
  }

  closeModalBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  
  proceedRegisterBtn.addEventListener('click', () => {
    closeModal();
    alert('Redirecting to Jahangirnagar University Student Portal for registration payment verification...');
  });
}
