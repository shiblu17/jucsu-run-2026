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
      const runnerPhone = (runner.phone || '').replace(/[^0-9]/g, ''); // strip formatting
      const cleanQuery = query.replace(/[^0-9a-zA-Z]/g, ''); // alphanumeric

      // Search matches: exact phone, exact bib, or name match
      return runnerPhone === cleanQuery || 
             (runner.bib || '') === cleanQuery || 
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
                  <input type="radio" name="pubType" value="JU Student (Batch 49 - 54)" checked required>
                  <div class="radio-tile-content">🎓 JU Student (Batch 49 - 54) - 800 BDT</div>
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
              </div>
            </div>
            <div class="form-group" style="gap:6px;">
              <label class="form-label" style="font-size:0.8rem; font-weight:600;">Blood Group</label>
              <input type="text" id="pubBlood" class="form-input" style="padding:12px; font-size:0.95rem;" placeholder="e.g. B+">
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

  // Open modal and pre-select category
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const category = trigger.getAttribute('data-category');
      backdrop.classList.add('open');
      modal.classList.add('open');
      
      // Reset views
      formContainer.classList.remove('hidden');
      successContainer.classList.add('hidden');
      publicRegisterForm.reset();
      
      // Pre-select category based on the clicked card
      const is10K = category.includes('10K');
      document.getElementById('cat10k').checked = is10K;
      document.getElementById('cat5k').checked = !is10K;

      // Update fee display
      updateFeeDisplay();
    });
  });

  // Bind dynamic fee display to participant type options
  const pubTypeRadios = document.querySelectorAll('input[name="pubType"]');
  const paymentFeeDisplay = document.getElementById('paymentFeeDisplay');

  function updateFeeDisplay() {
    const selectedTypeEl = document.querySelector('input[name="pubType"]:checked');
    if (!selectedTypeEl) return;
    const selectedType = selectedTypeEl.value;
    let feeText = '৳1200 BDT';
    if (selectedType.includes('Student')) {
      feeText = '৳800 BDT';
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
      txnid
    };

    // If Supabase connected, insert
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('registrations')
          .insert([newRunner]);
        if (error) throw error;
      } catch (err) {
        alert('Supabase registration failed: ' + err.message);
        return;
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
