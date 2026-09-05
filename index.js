/* ==========================================
   JUCSU RUN 2026 - APPLICATION SCRIPT
   ========================================== */

// Supabase SDK client initialization
let supabaseClient = null;
if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
  try {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('Supabase client initialized successfully!');
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

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

  // Initialize Runner Badge Generator
  initBadgeGenerator();

  // Dynamic Event Settings & Deadlines (Admin Controlled)
  initDynamicEventSettings();

  // Logistics & Bus Route Tabs
  initLogisticsTabs();
});

/* ==========================================
   DATABASE INITIALIZATION
   ========================================== */
let runnerDatabase = [];

async function initDatabase() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('registrations')
        .select('*');
      if (error) throw error;
      runnerDatabase = data;
      console.log('Database loaded from Supabase. Total records:', runnerDatabase.length);
      return;
    } catch (err) {
      console.error('Error fetching from Supabase, falling back to local storage', err);
    }
  }

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
  const searchBtnText = document.getElementById('searchBtnText');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resultsBox = document.getElementById('checkerResults');
  
  const multipleSection = document.getElementById('resultMultiple');
  const multipleMatchesList = document.getElementById('multipleMatchesList');
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
  const resType = document.getElementById('resType');
  const resTshirt = document.getElementById('resTshirt');
  const resPickup = document.getElementById('resPickup');
  const resKitPoint = document.getElementById('resKitPoint');
  const resPhone = document.getElementById('resPhone');
  const resStatus = document.getElementById('resStatus');

  // Pending placeholders
  const pendingName = document.getElementById('pendingName');
  const pendingCategory = document.getElementById('pendingCategory');
  const pendingType = document.getElementById('pendingType');
  const pendingTshirt = document.getElementById('pendingTshirt');
  const pendingKitPoint = document.getElementById('pendingKitPoint');
  const pendingTxnid = document.getElementById('pendingTxnid');

  // Action Buttons
  const downloadBtn = document.getElementById('downloadBibBtn');
  const quickBadgeBtn = document.getElementById('quickGenerateBadgeBtn');

  // Variable to store currently found runner details for download
  let currentRunner = null;

  // Clear button toggle
  if (searchInput && clearSearchBtn) {
    searchInput.addEventListener('input', () => {
      clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    });
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
    });
  }

  function displayRunnerDetails(runner) {
    currentRunner = runner;
    if (multipleSection) multipleSection.classList.add('hidden');
    foundSection.classList.add('hidden');
    pendingSection.classList.add('hidden');
    notFoundSection.classList.add('hidden');

    if (runner.status === 'Verified') {
      // Setup E-Bib visual display
      bibNumText.textContent = runner.bib;
      bibNameText.textContent = runner.name;
      bibBloodText.textContent = runner.blood || 'N/A';
      
      let typeBadge = '5K RUN';
      if ((runner.category || '').includes('10K')) {
        typeBadge = '10K CHIP';
      }
      bibTypeTag.textContent = typeBadge;

      // Setup detail table
      if (resCategory) resCategory.textContent = runner.category;
      if (resType) resType.textContent = runner.type || 'JU Student';
      if (resTshirt) resTshirt.textContent = runner.tshirt;
      if (resPickup) resPickup.textContent = runner.pickup || 'Self-Arranged';
      if (resKitPoint) resKitPoint.textContent = runner.kitpoint || 'Jahangirnagar University';
      if (resPhone) resPhone.textContent = (runner.phone || '').replace(/.(?=.{4})/g, '*');
      if (resStatus) {
        resStatus.textContent = 'VERIFIED';
        resStatus.className = 'badge badge-verified';
      }

      foundSection.classList.remove('hidden');
    } else {
      // Pending Status
      if (pendingName) pendingName.textContent = runner.name;
      if (pendingCategory) pendingCategory.textContent = runner.category;
      if (pendingType) pendingType.textContent = runner.type || 'JU Student (Batch 48 - 55)';
      if (pendingTshirt) pendingTshirt.textContent = runner.tshirt || 'M';
      if (pendingKitPoint) pendingKitPoint.textContent = runner.kitpoint || 'Jahangirnagar University';
      if (pendingTxnid) pendingTxnid.textContent = runner.txnid || 'bKash Transaction Pending';
      
      pendingSection.classList.remove('hidden');
    }

    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function performSearch() {
    const rawQuery = searchInput.value.trim();
    const query = rawQuery.toLowerCase();
    
    if (!query) {
      alert('Please enter a phone number, bib number, name, or bKash TrxID to search.');
      return;
    }

    if (searchBtnText) searchBtnText.textContent = 'Searching...';
    searchBtn.disabled = true;

    try {
      // Refresh database in case admin updated it in another tab
      await initDatabase();

      const cleanQuery = query.replace(/[^0-9a-zA-Z]/g, ''); // alphanumeric

      // Filter all matches in database
      const matches = runnerDatabase.filter(runner => {
        const runnerName = (runner.name || '').toLowerCase();
        const runnerPhone = (runner.phone || '').replace(/[^0-9]/g, '');
        const runnerBib = (runner.bib || '').toLowerCase();
        const runnerTxnid = (runner.txnid || '').toLowerCase();

        return (cleanQuery && runnerPhone === cleanQuery) ||
               (cleanQuery && runnerBib === cleanQuery) ||
               (cleanQuery && runnerTxnid.includes(cleanQuery)) ||
               (runnerName.includes(query));
      });

      // Reset results display
      resultsBox.classList.remove('hidden');
      if (multipleSection) multipleSection.classList.add('hidden');
      foundSection.classList.add('hidden');
      pendingSection.classList.add('hidden');
      notFoundSection.classList.add('hidden');

      if (matches.length === 1) {
        displayRunnerDetails(matches[0]);
      } else if (matches.length > 1) {
        // Render Multiple Matches Selector
        multipleMatchesList.innerHTML = '';
        matches.forEach(runner => {
          const item = document.createElement('div');
          item.className = 'match-card-item glass-panel';
          const isVerified = runner.status === 'Verified';
          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-weight: 700; font-family: var(--font-headings); font-size: 1.1rem; color: ${isVerified ? 'var(--color-accent)' : '#ffaa00'};">
                ${isVerified ? '#' + runner.bib : 'PENDING'}
              </span>
              <div>
                <strong style="color: #fff; font-size: 0.95rem;">${runner.name}</strong>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">${runner.category} • ${runner.tshirt}</div>
              </div>
            </div>
            <button class="btn ${isVerified ? 'btn-lime' : 'btn-outline'} btn-sm">Select</button>
          `;
          item.addEventListener('click', () => displayRunnerDetails(runner));
          multipleMatchesList.appendChild(item);
        });

        multipleSection.classList.remove('hidden');
        resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        currentRunner = null;
        notFoundSection.classList.remove('hidden');
        resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } finally {
      if (searchBtnText) searchBtnText.textContent = 'Search Status';
      searchBtn.disabled = false;
    }
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
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!currentRunner) return;
      generateCanvasBib(currentRunner);
    });
  }

  // Quick link from verified E-Bib to Runner Badge Generator
  if (quickBadgeBtn) {
    quickBadgeBtn.addEventListener('click', () => {
      if (!currentRunner) return;
      
      const badgeNameInput = document.getElementById('badgeName');
      const badgeBatchInput = document.getElementById('badgeBatch');
      const badgeCategoryInput = document.getElementById('badgeCategory');

      if (badgeNameInput) badgeNameInput.value = currentRunner.name;
      if (badgeBatchInput) badgeBatchInput.value = currentRunner.type || 'JU Student (Batch 48 - 55)';
      if (badgeCategoryInput) {
        if ((currentRunner.category || '').includes('10K')) {
          badgeCategoryInput.value = '10K Mini Marathon';
        } else {
          badgeCategoryInput.value = '5K Run';
        }
      }

      // Trigger input event to refresh preview if photo is uploaded
      if (badgeNameInput) badgeNameInput.dispatchEvent(new Event('input'));

      // Smooth scroll to badges section
      const badgesSection = document.getElementById('badges');
      if (badgesSection) {
        badgesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
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
  modal.style.maxWidth = '550px';
  modal.style.maxHeight = '85vh';
  modal.style.overflowY = 'auto';
  modal.innerHTML = `
    <div id="registrationFormContainer" style="padding: 5px 0;">
      <h3 style="font-size: 1.6rem; margin-bottom: 5px; color:#fff; font-family:var(--font-headings); font-weight:800;">Register for JUCSU RUN 2026</h3>
      <p style="color:var(--color-text-muted); margin-bottom: 20px; font-size:0.85rem;">
        Fill out the form below to register. Payments must be sent manually via bKash/Nagad.
      </p>
      
      <form id="publicRegisterForm" onsubmit="return false;" style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Section 1: Personal Info -->
        <div>
          <h4 style="color:var(--color-accent); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:12px; font-weight:700;">1. Personal Details</h4>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Full Name <span style="color:#ff3b30;">*</span></label>
              <input type="text" id="pubName" class="form-input" style="padding:12px; font-size:0.95rem;" required placeholder="e.g. Rafiq Ali">
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Contact Number <span style="color:#ff3b30;">*</span></label>
              <input type="tel" id="pubPhone" class="form-input" style="padding:12px; font-size:0.95rem;" required placeholder="e.g. 017XXXXXXXX">
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Email Address <span style="color:#ff3b30;">*</span></label>
              <input type="email" id="pubEmail" class="form-input" style="padding:12px; font-size:0.95rem;" required placeholder="e.g. rafiq@gmail.com">
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Gender <span style="color:#ff3b30;">*</span></label>
              <div class="radio-tile-group">
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubGender" value="Male" checked required>
                  <div class="radio-tile-content">Male</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubGender" value="Female" required>
                  <div class="radio-tile-content">Female</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Race Details -->
        <div>
          <h4 style="color:var(--color-accent); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:12px; font-weight:700;">2. Race & Kit Details</h4>
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Select Category <span style="color:#ff3b30;">*</span></label>
              <div class="radio-tile-group">
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubCategory" id="cat10k" value="10K Mini Marathon" required>
                  <div class="radio-tile-content">10K Mini Marathon</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubCategory" id="cat5k" value="5K Run" required>
                  <div class="radio-tile-content">5K Run</div>
                </div>
              </div>
            </div>
            
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Participant Type <span style="color:#ff3b30;">*</span></label>
              <div class="radio-tile-group vertical">
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubType" value="JU Student (Batch 48 - 55)" checked required>
                  <div class="radio-tile-content">🎓 JU Student (Batch 48 - 55) - 800 BDT</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubType" value="JU Alumni" required>
                  <div class="radio-tile-content">🎓 JU Alumni - 1200 BDT</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubType" value="External Participant" required>
                  <div class="radio-tile-content">🏃 External Participant - 1300 BDT</div>
                </div>
              </div>
            </div>

            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">T-Shirt Size <span style="color:#ff3b30;">*</span></label>
              <div class="radio-tile-group">
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="S" required>
                  <div class="radio-tile-content">S</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="M" checked required>
                  <div class="radio-tile-content">M</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="L" required>
                  <div class="radio-tile-content">L</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="XL" required>
                  <div class="radio-tile-content">XL</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="XXL" required>
                  <div class="radio-tile-content">XXL</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubTshirt" value="3XL" required>
                  <div class="radio-tile-content">3XL</div>
                </div>
              </div>
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Blood Group</label>
              <input type="text" id="pubBlood" class="form-input" style="padding:12px; font-size:0.95rem;" placeholder="e.g. B+">
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Kit Collection Point <span style="color:#ff3b30;">*</span></label>
              <div class="radio-tile-group">
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubKitPoint" value="Dhaka University" checked required>
                  <div class="radio-tile-content">📍 Dhaka University</div>
                </div>
                <div class="radio-tile-wrapper">
                  <input type="radio" name="pubKitPoint" value="Jahangirnagar University" required>
                  <div class="radio-tile-content">📍 Jahangirnagar University</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Transportation -->
        <div>
          <h4 style="color:var(--color-accent); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:12px; font-weight:700;">3. Transportation</h4>
          <div class="form-group" style="gap:6px;">
            <label class="form-label" style="font-size:0.8rem; font-weight:600;">Select Pickup Bus Route <span style="color:#ff3b30;">*</span></label>
            <div class="radio-tile-group vertical">
              <div class="radio-tile-wrapper">
                <input type="radio" name="pubPickup" value="Uttara" checked required>
                <div class="radio-tile-content">🚌 Uttara Route</div>
              </div>
              <div class="radio-tile-wrapper">
                <input type="radio" name="pubPickup" value="Gulshan" required>
                <div class="radio-tile-content">🚌 Gulshan Route</div>
              </div>
              <div class="radio-tile-wrapper">
                <input type="radio" name="pubPickup" value="Bongobazar" required>
                <div class="radio-tile-content">🚌 Bongobazar Route</div>
              </div>
              <div class="radio-tile-wrapper">
                <input type="radio" name="pubPickup" value="Self-Arranged" required>
                <div class="radio-tile-content">🚶 Self-Arranged (No Bus Needed)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Payment Details -->
        <div>
          <h4 style="color:var(--color-accent); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-bottom:12px; font-weight:700;">4. bKash Payment Details</h4>
          <div style="background: rgba(193, 216, 47, 0.04); border: 1px solid rgba(193, 216, 47, 0.15); padding: 16px; border-radius: 12px; margin-bottom: 15px; font-size: 0.85rem; color: #e0e0e0; line-height: 1.6; text-align: left;">
            <p style="margin-bottom: 8px; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 6px;">
              <span>💸</span> Payment Instructions:
            </p>
            <p style="margin-bottom: 8px;">Please send the registration fee using <strong>Send Money</strong> to this bKash Personal Number:</p>
            <p style="margin-bottom: 10px; background: rgba(0, 0, 0, 0.25); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.05); display: flex; justify-content: space-between; align-items: center;">
              <span class="text-lime" style="font-size: 1.1rem; font-weight: 700; letter-spacing: 0.05em;">01317982413</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">bKash Personal</span>
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(193, 216, 47, 0.12); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(193, 216, 47, 0.2); font-weight: 700; color: #fff;">
              <span>Total Fee:</span>
              <span class="text-lime" id="paymentFeeDisplay" style="font-size: 1rem;">৳800 BDT</span>
            </div>
          </div>
          <div class="form-group" style="gap:6px;">
            <label class="form-label" style="font-size:0.8rem; font-weight:600;">bKash Transaction ID <span style="color:#ff3b30;">*</span></label>
            <input type="text" id="pubTxnId" class="form-input" style="padding:12px; font-size:0.95rem; text-transform:uppercase;" required placeholder="e.g. A1B2C3D4E5">
          </div>
        </div>

        <div style="display:flex; gap:12px; justify-content: flex-end; border-top:1px solid rgba(255,255,255,0.08); padding-top:16px; margin-top:10px;">
          <button type="button" class="btn btn-outline btn-sm" id="closeModalBtn" style="border-radius:6px; height:auto; padding:12px 24px;">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" style="border-radius:6px; height:auto; padding:12px 24px; font-weight:700;">Submit Application</button>
        </div>
      </form>
    </div>
    
    <div id="registrationSuccessContainer" class="hidden" style="text-align:center; padding:10px 0;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(0, 255, 128, 0.1); border: 2px solid #00ff80; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto;">
        <span style="font-size: 2rem; color: #00ff80; line-height: 1; font-weight: bold;">✓</span>
      </div>
      <h3 style="font-size: 1.6rem; margin: 10px 0; color:#00ff80;">Registration Submitted!</h3>
      <p style="color:#fff; font-size:0.95rem; margin-bottom:15px; line-height:1.6;">
        Runner Name: <strong id="successName">Name</strong>
      </p>
      <div style="background: rgba(255,255,255,0.03); border:1px dashed var(--color-glass-border); padding: 15px; border-radius:10px; margin-bottom: 20px; font-size:0.9rem; text-align:left; color:var(--color-text-muted); line-height: 1.5;">
        <p style="margin-bottom:8px; color:#fff;"><strong>Verification Pending</strong></p>
        <p>We received your transaction ID: <strong id="successTxnRef" class="text-lime">TXNID</strong></p>
        <p style="margin-top:8px;">The JUCSU RUN 2026 committee will verify your payment against this Transaction ID within 24-48 hours. Once verified, your status will change from **Pending** to **Verified**, and you will be able to search and download your Digital E-Bib card!</p>
      </div>
      <button class="btn btn-primary btn-sm" id="successCloseBtn" style="border-radius:6px; padding:10px 20px; height:auto;">Done</button>
    </div>
  `;
  document.body.appendChild(modal);

  const closeModalBtn = document.getElementById('closeModalBtn');
  const successCloseBtn = document.getElementById('successCloseBtn');
  const publicRegisterForm = document.getElementById('publicRegisterForm');

  const formContainer = document.getElementById('registrationFormContainer');
  const successContainer = document.getElementById('registrationSuccessContainer');
  const successName = document.getElementById('successName');
  const successFeeAmount = document.getElementById('successFeeAmount');

  // Open modal and pre-select category with event delegation
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.register-trigger');
    if (!trigger || trigger.disabled || trigger.classList.contains('disabled')) return;

    const category = trigger.getAttribute('data-category') || '10K Mini Marathon';
    backdrop.classList.add('open');
    modal.classList.add('open');
    
    // Reset views
    formContainer.classList.remove('hidden');
    successContainer.classList.add('hidden');
    publicRegisterForm.reset();
    
    const settings = window.currentEventSettings || {};
    const is10kClosed = settings.status_10k === 'closed';
    const is5kClosed = settings.status_5k === 'closed';

    const cat10kRadio = document.getElementById('cat10k');
    const cat5kRadio = document.getElementById('cat5k');
    const cat10kWrapper = cat10kRadio ? cat10kRadio.closest('.radio-tile-wrapper') : null;
    const cat5kWrapper = cat5kRadio ? cat5kRadio.closest('.radio-tile-wrapper') : null;

    if (cat10kRadio) {
      cat10kRadio.disabled = is10kClosed;
      if (cat10kWrapper) {
        cat10kWrapper.style.opacity = is10kClosed ? '0.4' : '1';
        cat10kWrapper.style.cursor = is10kClosed ? 'not-allowed' : 'pointer';
        const labelEl = cat10kWrapper.querySelector('.radio-tile-content');
        if (labelEl) labelEl.textContent = is10kClosed ? '10K (Closed)' : '10K Mini Marathon';
      }
    }

    if (cat5kRadio) {
      cat5kRadio.disabled = is5kClosed;
      if (cat5kWrapper) {
        cat5kWrapper.style.opacity = is5kClosed ? '0.4' : '1';
        cat5kWrapper.style.cursor = is5kClosed ? 'not-allowed' : 'pointer';
        const labelEl = cat5kWrapper.querySelector('.radio-tile-content');
        if (labelEl) labelEl.textContent = is5kClosed ? '5K (Closed)' : '5K Run';
      }
    }

    // Determine which category to select
    let select10K = category.includes('10K');
    if (select10K && is10kClosed && !is5kClosed) select10K = false;
    if (!select10K && is5kClosed && !is10kClosed) select10K = true;

    if (cat10kRadio) cat10kRadio.checked = select10K && !is10kClosed;
    if (cat5kRadio) cat5kRadio.checked = !select10K && !is5kClosed;

    // Check if all closed
    const submitBtn = document.getElementById('publicRegisterSubmit');
    if (submitBtn) {
      if (is10kClosed && is5kClosed) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registration Closed for All Categories';
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Generate E-Slip →';
      }
    }

    // Update fee display
    updateFeeDisplay();
  });

  // Bind dynamic fee display to participant type options
  const pubTypeRadios = document.querySelectorAll('input[name="pubType"]');
  const paymentFeeDisplay = document.getElementById('paymentFeeDisplay');

  function updateFeeDisplay() {
    const selectedTypeEl = document.querySelector('input[name="pubType"]:checked');
    if (!selectedTypeEl) return;
    const selectedType = selectedTypeEl.value;
    
    // Check if 10K is selected
    const is10K = document.getElementById('cat10k') && document.getElementById('cat10k').checked;
    
    // Dynamically update the student option label to match selected category fee
    const studentLabel = document.querySelector('input[value="JU Student (Batch 48 - 55)"] ~ .radio-tile-content');
    if (studentLabel) {
      studentLabel.textContent = `🎓 JU Student (Batch 48 - 55) - ${is10K ? '1000' : '800'} BDT`;
    }
    
    let feeText = '৳1200 BDT';
    if (selectedType.includes('Student')) {
      feeText = is10K ? '৳1000 BDT' : '৳800 BDT';
    } else if (selectedType.includes('Alumni')) {
      feeText = '৳1200 BDT';
    } else if (selectedType.includes('External')) {
      feeText = '৳1300 BDT';
    }
    if (paymentFeeDisplay) {
      paymentFeeDisplay.textContent = feeText;
    }
  }

  pubTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateFeeDisplay);
  });

  const catRadios = document.querySelectorAll('input[name="pubCategory"]');
  catRadios.forEach(radio => {
    radio.addEventListener('change', updateFeeDisplay);
  });

  function closeModal() {
    backdrop.classList.remove('open');
    modal.classList.remove('open');
  }

  closeModalBtn.addEventListener('click', closeModal);
  successCloseBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  // Helper to generate next unique Bib
  function generateNextBib(category) {
    const is10K = category.includes('10K');
    const startBib = is10K ? 10001 : 5001;
    
    // Filter existing bibs that are numbers
    const bibs = runnerDatabase
      .map(r => parseInt(r.bib))
      .filter(b => !isNaN(b));
    
    // Filter for current category range
    const categoryBibs = bibs.filter(b => {
      if (is10K) {
        return b >= 10001 && b < 50000;
      } else {
        return b >= 5001 && b < 10000;
      }
    });
    
    if (categoryBibs.length === 0) {
      return startBib.toString();
    }
    const maxBib = Math.max(...categoryBibs);
    return (maxBib + 1).toString();
  }

  // Handle Submit Form
  publicRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('pubName').value.trim();
    const phone = document.getElementById('pubPhone').value.trim();
    const email = document.getElementById('pubEmail').value.trim();
    const category = document.querySelector('input[name="pubCategory"]:checked').value;
    const type = document.querySelector('input[name="pubType"]:checked').value;
    const tshirt = document.querySelector('input[name="pubTshirt"]:checked').value;
    const gender = document.querySelector('input[name="pubGender"]:checked').value;
    const pickup = document.querySelector('input[name="pubPickup"]:checked').value;
    const kitpoint = document.querySelector('input[name="pubKitPoint"]:checked') ? document.querySelector('input[name="pubKitPoint"]:checked').value : 'Jahangirnagar University';
    const blood = document.getElementById('pubBlood').value.trim().toUpperCase() || 'N/A';
    const txnid = document.getElementById('pubTxnId').value.trim().toUpperCase();

    // Ensure database loaded
    await initDatabase();

    const bib = generateNextBib(category);
    const newRunner = {
      bib,
      name,
      phone,
      email,
      category,
      tshirt,
      gender,
      blood,
      status: 'Pending',
      type,
      pickup,
      kitpoint,
      txnid
    };

    // If Supabase connected, insert
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('registrations')
          .insert([newRunner]);
        if (error) {
          // If kitpoint column is missing in Supabase table schema, retry insert without kitpoint column
          if (error.message && error.message.includes('kitpoint')) {
            const runnerWithoutKit = { ...newRunner };
            delete runnerWithoutKit.kitpoint;
            const { error: retryErr } = await supabaseClient
              .from('registrations')
              .insert([runnerWithoutKit]);
            if (retryErr) throw retryErr;
          } else {
            throw error;
          }
        }
      } catch (err) {
        console.error('Supabase registration insert error:', err);
      }
    }

    // Save offline
    runnerDatabase.push(newRunner);
    localStorage.setItem('jucsu_registrations', JSON.stringify(runnerDatabase));

    // Show success view
    successName.textContent = name;
    document.getElementById('successTxnRef').textContent = txnid;

    formContainer.classList.add('hidden');
    successContainer.classList.remove('hidden');
  });
}

/* ==========================================
   SHAREABLE RUNNER BADGE GENERATOR
   ========================================== */
function initBadgeGenerator() {
  const badgeNameInput = document.getElementById('badgeName');
  const badgeBatchInput = document.getElementById('badgeBatch');
  const badgeCategoryInput = document.getElementById('badgeCategory');
  const badgePhotoInput = document.getElementById('badgePhoto');
  const photoUploadArea = document.getElementById('photoUploadArea');
  const badgeCanvas = document.getElementById('badgeCanvas');
  const badgePreview = document.getElementById('badgePreview');
  const badgePlaceholder = document.getElementById('badgePlaceholder');
  const downloadBadgeBtn = document.getElementById('downloadBadgeBtn');

  let uploadedImage = null;

  if (!badgeNameInput || !badgeCanvas) return;

  // Handle Drag and Drop / Click for photo upload
  if (photoUploadArea) {
    photoUploadArea.addEventListener('click', () => badgePhotoInput.click());

    photoUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUploadArea.classList.add('dragover');
    });

    photoUploadArea.addEventListener('dragleave', () => {
      photoUploadArea.classList.remove('dragover');
    });

    photoUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      photoUploadArea.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });
  }

  if (badgePhotoInput) {
    badgePhotoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });
  }

  // Bind inputs to draw
  [badgeNameInput, badgeBatchInput, badgeCategoryInput].forEach(input => {
    if (input) {
      input.addEventListener('input', drawBadge);
      input.addEventListener('change', drawBadge);
    }
  });

  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        drawBadge();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function drawBadge() {
    if (!uploadedImage) return;

    const ctx = badgeCanvas.getContext('2d');
    const size = 800; // High resolution square

    // Clear Canvas
    ctx.clearRect(0, 0, size, size);

    // 1. Draw Background (Rich Forest Green Gradient)
    const bgGrad = ctx.createRadialGradient(size/2, size/2, 50, size/2, size/2, size*0.7);
    bgGrad.addColorStop(0, '#04170d');
    bgGrad.addColorStop(1, '#020d07');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Draw Decorative Neon Glowing Line Frame
    ctx.strokeStyle = '#c1d82f';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, size - 40, size - 40);

    // Inner thin border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, size - 70, size - 70);

    // 3. Draw Branding Header
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText('JAHANGIRNAGAR UNIVERSITY', size / 2, 85);

    ctx.fillStyle = '#c1d82f';
    ctx.font = '900 46px "Outfit", sans-serif';
    ctx.fillText('JUCSU RUN 2026', size / 2, 140);

    // Subtle horizontal divider line
    ctx.strokeStyle = 'rgba(193, 216, 47, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 165);
    ctx.lineTo(size - 150, 165);
    ctx.stroke();

    // Large decorative watermark text in background
    ctx.fillStyle = 'rgba(193, 216, 47, 0.02)';
    ctx.font = '900 130px "Outfit", sans-serif';
    ctx.fillText('RUNNER', size / 2, 420);

    // 4. Draw Circular Mask Profile Picture
    const pX = size / 2;
    const pY = 385;
    const pRadius = 160;

    // Draw profile outer neon circle
    ctx.strokeStyle = '#c1d82f';
    ctx.lineWidth = 8;
    ctx.shadowColor = 'rgba(193, 216, 47, 0.4)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(pX, pY, pRadius + 4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Mask image in circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(pX, pY, pRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw photo with crop cover math
    const imgAspect = uploadedImage.width / uploadedImage.height;
    let dWidth = pRadius * 2;
    let dHeight = pRadius * 2;
    let dx = pX - pRadius;
    let dy = pY - pRadius;

    if (imgAspect > 1) {
      dWidth = dHeight * imgAspect;
      dx = pX - dWidth / 2;
    } else {
      dHeight = dWidth / imgAspect;
      dy = pY - dHeight / 2;
    }

    ctx.drawImage(uploadedImage, dx, dy, dWidth, dHeight);
    ctx.restore();

    // 5. Draw Badge Type Indicator Ribbon
    ctx.fillStyle = '#c1d82f';
    ctx.fillRect(size/2 - 120, pY + pRadius - 20, 240, 40);
    ctx.fillStyle = '#000000';
    ctx.font = '800 20px "Outfit", sans-serif';
    ctx.fillText('OFFICIAL RUNNER', size / 2, pY + pRadius + 6);

    // 6. Draw Runner Details at Bottom
    const name = (badgeNameInput.value.trim() || 'YOUR NAME').toUpperCase();
    const batch = (badgeBatchInput.value.trim() || 'AFFILIATION').toUpperCase();
    const category = (badgeCategoryInput.value || '10K Mini Marathon').toUpperCase();

    // Runner Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px "Outfit", sans-serif';
    ctx.fillText(name, size / 2, 620);

    // Details Grid (Batch & Category)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.fillText(batch, size / 2, 660);

    ctx.fillStyle = '#c1d82f';
    ctx.font = '800 26px "Outfit", sans-serif';
    ctx.fillText(category, size / 2, 710);

    // Footer decoration details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillText('OCTOBER 2, 2026 • JAHANGIRNAGAR UNIVERSITY CAMPUS', size / 2, 755);

    // Render Canvas to Preview Image tag so mobile users can easily save it
    if (badgePreview) {
      badgePreview.src = badgeCanvas.toDataURL('image/png');
      badgePreview.style.display = 'block';
    }
    if (badgePlaceholder) {
      badgePlaceholder.style.display = 'none';
    }

    // Enable Download button
    if (downloadBadgeBtn) {
      downloadBadgeBtn.classList.remove('disabled');
      downloadBadgeBtn.removeAttribute('disabled');
    }
  }

  if (downloadBadgeBtn) {
    downloadBadgeBtn.addEventListener('click', () => {
      if (!uploadedImage) return;
      const link = document.createElement('a');
      const nameClean = (badgeNameInput.value.trim() || 'Runner').replace(/\s+/g, '_');
      link.download = `JUCSU_RUN_2026_${nameClean}_Badge.png`;
      link.href = badgeCanvas.toDataURL('image/png');
      link.click();
    });
  }
}

/* ==========================================
   DYNAMIC EVENT SETTINGS & DEADLINE LOADER
   ========================================== */
async function initDynamicEventSettings() {
  let settings = null;

  // 1. Try fetching from Supabase 'event_settings' table
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('event_settings')
        .select('*')
        .eq('id', 'main_event')
        .maybeSingle();

      if (data && !error) {
        settings = data;
        try {
          localStorage.setItem('jucsu_event_settings', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Supabase settings fetch fallback:', err);
    }
  }

  // 2. Fallback to localStorage
  if (!settings) {
    try {
      const local = localStorage.getItem('jucsu_event_settings');
      if (local) settings = JSON.parse(local);
    } catch (e) {}
  }

  if (!settings) return;

  // Update Hero Badge & Deadline text
  const regCloseEl = document.getElementById('regCloseDateText');
  const heroBadge = document.getElementById('heroRegBadge');

  if (regCloseEl && settings.reg_close_date) {
    regCloseEl.textContent = settings.reg_close_date;
  }

  if (heroBadge && settings.reg_status) {
    if (settings.reg_status === 'closed') {
      heroBadge.innerHTML = `🔴 Registration Closed!`;
      heroBadge.style.background = 'rgba(235, 50, 65, 0.15)';
      heroBadge.style.borderColor = 'rgba(235, 50, 65, 0.4)';
      heroBadge.style.color = '#ffccd0';
    } else if (settings.reg_status === 'extended') {
      heroBadge.innerHTML = `🔥 Extended till: ${settings.reg_close_date || '8 September 2026'}`;
      heroBadge.style.background = 'rgba(255, 150, 0, 0.15)';
      heroBadge.style.borderColor = 'rgba(255, 150, 0, 0.4)';
      heroBadge.style.color = '#ffdd99';
    } else {
      heroBadge.innerHTML = `⌛ Registration Closes: <span id="regCloseDateText">${settings.reg_close_date || '8 September 2026'}</span>`;
      heroBadge.style.background = 'rgba(193, 216, 47, 0.1)';
      heroBadge.style.borderColor = 'rgba(193, 216, 47, 0.2)';
      heroBadge.style.color = '#fff';
    }
  }

  // Update Countdown timer target
  const countdownEl = document.getElementById('countdown');
  if (countdownEl && settings.race_date) {
    countdownEl.setAttribute('data-date', settings.race_date);
    initCountdown(); // Recalculate with updated target date
  }

  // Save settings globally for modal use
  window.currentEventSettings = settings;

  // Update 10K Category Card
  const catAction10K = document.getElementById('catAction10K');
  if (catAction10K) {
    if (settings.status_10k === 'closed') {
      catAction10K.innerHTML = `<button class="btn btn-full disabled" disabled style="background: rgba(235,50,65,0.15); border: 1px solid rgba(235,50,65,0.4); color: #ffccd0; cursor: not-allowed; font-weight: 700; width: 100%;">🔴 Registration Closed (10K)</button>`;
    } else {
      catAction10K.innerHTML = `<button class="btn btn-lime btn-full register-trigger" id="regBtn10K" data-category="10K Mini Marathon">Register Now</button>`;
    }
  }

  // Update 5K Category Card
  const catAction5K = document.getElementById('catAction5K');
  if (catAction5K) {
    if (settings.status_5k === 'closed') {
      catAction5K.innerHTML = `<button class="btn btn-full disabled" disabled style="background: rgba(235,50,65,0.15); border: 1px solid rgba(235,50,65,0.4); color: #ffccd0; cursor: not-allowed; font-weight: 700; width: 100%;">🔴 Registration Closed (5K)</button>`;
    } else {
      catAction5K.innerHTML = `<button class="btn btn-primary btn-full register-trigger" id="regBtn5K" data-category="5K Run">Register Now</button>`;
    }
  }
}

/* ==========================================
   LOGISTICS & BUS ROUTE DYNAMIC RENDERER & TABS
   ========================================== */
async function initLogisticsTabs() {
  const tabs = document.querySelectorAll('.logistics-tab-btn');
  const contents = document.querySelectorAll('.logistics-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(content => {
        if (content.id === target) {
          content.style.display = 'block';
          content.classList.add('active');
        } else {
          content.style.display = 'none';
          content.classList.remove('active');
        }
      });
    });
  });

  // Load and render dynamic content based on admin settings
  await loadAndRenderLogistics();
}

async function loadAndRenderLogistics() {
  let settings = null;

  // 1. Try fetching from Supabase if client is ready
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('event_settings')
        .select('*')
        .eq('id', 'logistics_settings')
        .single();
      if (!error && data && data.data) {
        settings = data.data;
      }
    } catch (e) {}
  }

  // 2. Try localStorage
  if (!settings) {
    const local = localStorage.getItem('jucsu_logistics_settings');
    if (local) {
      try {
        settings = JSON.parse(local);
      } catch (e) {}
    }
  }

  // 3. Fallback to standard defaults
  if (!settings) {
    settings = {
      kit_status: 'active',
      bus_status: 'active',
      kit_points: [
        {
          id: 'du',
          title: '🏛️ Dhaka University (DU) Point',
          location: 'Physical Education Centre / TSC, Dhaka University Campus',
          dates: '28 – 30 September 2026',
          time: '10:00 AM – 06:00 PM',
          requirements: 'E-Bib Screenshot / PDF & Valid Photo ID (Student/NID)',
          contact: '01317982413',
          map_url: 'https://maps.google.com/?q=TSC+Dhaka+University'
        },
        {
          id: 'ju',
          title: '🌳 Jahangirnagar University (JU) Point',
          location: 'JUCSU Office / Central Gymnasium, JU Campus, Savar',
          dates: '28 September – 01 October 2026',
          time: '10:00 AM – 07:00 PM',
          requirements: 'E-Bib Screenshot / PDF & Valid Photo ID (Student/NID)',
          contact: '01317982413',
          map_url: 'https://maps.google.com/?q=Jahangirnagar+University+Gymnasium'
        }
      ],
      bus_alert: {
        title: 'Race Day Bus Departure: 04:30 AM Sharp (October 2, 2026)',
        desc: 'Official dedicated buses will depart from all pickup points simultaneously at 04:30 AM to ensure arrival before Flag-off (06:10 AM). Return buses from JU campus back to Dhaka will depart at 11:30 AM.'
      },
      bus_routes: [
        {
          id: 'r1',
          num: 'Route 01',
          title: 'Uttara Route',
          time: '04:30 AM',
          contact: '01317982413',
          stops_text: 'House Building (Uttara) | Main Starting Point (04:30 AM)\nRajlakshmi & Azampur | 04:35 AM\nAirport / Kawla | 04:45 AM\nJU Campus (Shaheed Minar) | Expected Arrival: 05:30 AM'
        },
        {
          id: 'r2',
          num: 'Route 02',
          title: 'Gulshan & Mohakhali',
          time: '04:30 AM',
          contact: '01317982413',
          stops_text: 'Gulshan 1 Circle | Main Starting Point (04:30 AM)\nMohakhali Bus Stand & Farmgate | 04:40 AM\nShyamoli & Gabtoli | 04:55 AM\nJU Campus (Shaheed Minar) | Expected Arrival: 05:35 AM'
        },
        {
          id: 'r3',
          num: 'Route 03',
          title: 'Bongobazar & DU Route',
          time: '04:30 AM',
          contact: '01317982413',
          stops_text: 'TSC / Bongobazar Area | Main Starting Point (04:30 AM)\nNilkhet & Science Lab | 04:40 AM\nAsad Gate & Kalyanpur | 04:55 AM\nJU Campus (Shaheed Minar) | Expected Arrival: 05:35 AM'
        }
      ]
    };
  }

  // Render Kit Points Section
  renderKitPointsSection(settings);

  // Render Bus Routes Section
  renderBusRoutesSection(settings);
}

function renderKitPointsSection(settings) {
  const container = document.getElementById('kitPointsContainer');
  if (!container) return;

  const isKitActive = settings.kit_status === 'active';

  if (!isKitActive) {
    container.innerHTML = `
      <div class="coming-soon-card glass-panel text-center">
        <span class="coming-soon-badge">ANNOUNCEMENT</span>
        <div class="coming-soon-icon">⏳</div>
        <h3 class="coming-soon-title">Kit Collection Details Coming Soon!</h3>
        <p class="coming-soon-desc">The official kit pickup points, dates, and instructions will be announced soon. Please keep an eye on this website or join our WhatsApp community for instant updates.</p>
        <div class="coming-soon-actions">
          <a href="https://chat.whatsapp.com/Hauj6W8EzPp17mGwKkMBTD" target="_blank" class="btn btn-lime btn-sm">💬 Join WhatsApp Community</a>
          <a href="https://wa.me/8801317982413" target="_blank" class="btn btn-outline btn-sm">📞 Helpline: 01317982413</a>
        </div>
      </div>
    `;
    return;
  }

  const points = settings.kit_points || [];
  let pointsHtml = '<div class="grid grid-2-col logistics-grid">';

  points.forEach((pt, idx) => {
    const isCity = idx === 0;
    pointsHtml += `
      <div class="logistics-card glass-panel">
        <div class="logistics-card-header">
          <span class="logistics-badge ${isCity ? 'badge-lime' : ''}">${isCity ? 'Dhaka City Point' : 'Campus Point'}</span>
          <h3 class="logistics-point-title">${escapeHtml(pt.title || '')}</h3>
          <p class="logistics-location-text">${escapeHtml(pt.location || '')}</p>
        </div>
        <div class="logistics-info-list">
          <div class="logistics-info-row">
            <span class="log-info-label">📅 Dates:</span>
            <span class="log-info-val">${escapeHtml(pt.dates || '')}</span>
          </div>
          <div class="logistics-info-row">
            <span class="log-info-label">⏰ Timing:</span>
            <span class="log-info-val">${escapeHtml(pt.time || '')}</span>
          </div>
          <div class="logistics-info-row">
            <span class="log-info-label">📋 Required for Pickup:</span>
            <span class="log-info-val">${escapeHtml(pt.requirements || '')}</span>
          </div>
          <div class="logistics-info-row">
            <span class="log-info-label">📞 Point In-Charge:</span>
            <span class="log-info-val"><a href="tel:${escapeHtml(pt.contact || '01317982413')}" class="text-lime">${escapeHtml(pt.contact || '01317982413')}</a></span>
          </div>
        </div>
        <div class="logistics-action">
          <a href="${escapeHtml(pt.map_url || '#')}" target="_blank" rel="noopener" class="btn btn-outline btn-full btn-map-dir">
            <span>📍 View on Google Maps</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    `;
  });

  pointsHtml += '</div>';
  container.innerHTML = pointsHtml;
}

function renderBusRoutesSection(settings) {
  const container = document.getElementById('busRoutesContainer');
  if (!container) return;

  const isBusActive = settings.bus_status === 'active';

  if (!isBusActive) {
    container.innerHTML = `
      <div class="coming-soon-card glass-panel text-center">
        <span class="coming-soon-badge">TRANSPORTATION SCHEDULE</span>
        <div class="coming-soon-icon">🚌</div>
        <h3 class="coming-soon-title">Race Day Bus Routes Coming Soon!</h3>
        <p class="coming-soon-desc">Official race-day bus pickup points, arrival timelines, and route coordinator details will be published shortly before the race day.</p>
        <div class="coming-soon-actions">
          <a href="https://chat.whatsapp.com/Hauj6W8EzPp17mGwKkMBTD" target="_blank" class="btn btn-lime btn-sm">💬 Join WhatsApp Community</a>
          <a href="https://wa.me/8801317982413" target="_blank" class="btn btn-outline btn-sm">📞 Helpline: 01317982413</a>
        </div>
      </div>
    `;
    return;
  }

  const alertInfo = settings.bus_alert || {};
  const routes = settings.bus_routes || [];

  let html = `
    <div class="bus-schedule-alert glass-panel">
      <div class="bus-alert-icon">⏰</div>
      <div class="bus-alert-text">
        <h4>${escapeHtml(alertInfo.title || 'Race Day Bus Departure: 04:30 AM Sharp')}</h4>
        <p>${escapeHtml(alertInfo.desc || '')}</p>
      </div>
    </div>

    <div class="grid grid-3-col bus-routes-grid">
  `;

  routes.forEach((route, idx) => {
    const stopsLines = (route.stops_text || '').split('\n').filter(l => l.trim().length > 0);
    let stopsHtml = '';

    stopsLines.forEach((line, sIdx) => {
      const isFirst = sIdx === 0;
      const isLast = sIdx === stopsLines.length - 1;
      const stopClass = isFirst ? 'start-stop' : (isLast ? 'end-stop' : '');
      const parts = line.split('|');
      const stopName = (parts[0] || '').trim();
      const stopTime = (parts[1] || '').trim();

      stopsHtml += `
        <div class="stop-item ${stopClass}">
          <span class="stop-dot"></span>
          <div class="stop-info">
            <strong>${escapeHtml(stopName)}</strong>
            <span>${escapeHtml(stopTime)}</span>
          </div>
        </div>
      `;
    });

    html += `
      <div class="bus-route-card glass-panel">
        <div class="bus-route-header">
          <span class="badge-lime bus-route-num">${escapeHtml(route.num || `Route 0${idx+1}`)}</span>
          <h4>${escapeHtml(route.title || '')}</h4>
          <span class="bus-time-badge">${escapeHtml(route.time || '04:30 AM')}</span>
        </div>
        <div class="route-stops-timeline">
          ${stopsHtml}
        </div>
        <div class="bus-contact-box">
          <span>📞 Coordinator: <strong class="text-lime">${escapeHtml(route.contact || '01317982413')}</strong></span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

