/* ==========================================
   JUCSU RUN 2026 - ADMIN APPLICATION SCRIPT
   ========================================== */

let runnerDatabase = [];

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Password Verification Gate
  initLoginGate();

  // 2. Database Load and Rendering
  initAdminDashboard();
});

/* ==========================================
   PASSWORD LOCK GATE
   ========================================== */
function initLoginGate() {
  const loginGate = document.getElementById('loginGate');
  const adminContent = document.getElementById('adminContent');
  const loginForm = document.getElementById('loginForm');
  const adminPassInput = document.getElementById('adminPass');
  const loginError = document.getElementById('loginError');

  // Check Session Storage for existing login
  if (sessionStorage.getItem('jucsu_admin_logged') === 'true') {
    loginGate.classList.add('hidden');
    adminContent.classList.remove('hidden');
    return;
  }

  // Handle Login submission
  loginForm.addEventListener('submit', () => {
    const password = adminPassInput.value.trim();
    
    // Check credentials (simple client side passcode 'admin')
    if (password === 'admin' || password === 'jucsu2026') {
      sessionStorage.setItem('jucsu_admin_logged', 'true');
      loginGate.classList.add('hidden');
      adminContent.classList.remove('hidden');
      loginError.classList.add('hidden');
      // Load initial tables and statistics
      initAdminDashboard();
    } else {
      loginError.classList.remove('hidden');
      adminPassInput.value = '';
      adminPassInput.focus();
    }
  });
}

/* ==========================================
   DASHBOARD INITIALIZATION & DATA LOADING
   ========================================== */
async function initAdminDashboard() {
  await loadDatabase();
  refreshDashboard();

  // Setup Event Listeners for actions
  setupTableSearch();
  setupAddRunnerForm();
  setupCsvImporter();
  setupResetDb();
}

async function loadDatabase() {
  const localData = localStorage.getItem('jucsu_registrations');
  if (localData) {
    try {
      runnerDatabase = JSON.parse(localData);
      return;
    } catch (e) {
      console.error('Error parsing localStorage database, falling back', e);
    }
  }

  // Fetch mock registrations.json if localStorage is empty
  try {
    const response = await fetch('registrations.json');
    if (response.ok) {
      runnerDatabase = await response.json();
      saveDatabase();
    }
  } catch (error) {
    console.error('Failed to load registrations.json', error);
  }
}

function saveDatabase() {
  localStorage.setItem('jucsu_registrations', JSON.stringify(runnerDatabase));
}

function refreshDashboard() {
  renderStatistics();
  renderAnalyticsCharts();
  renderTable();
}

/* ==========================================
   STATISTICS & ANALYTICS RENDERING
   ========================================== */
function renderStatistics() {
  const statTotal = document.getElementById('statTotal');
  const statVerified = document.getElementById('statVerified');
  const statPending = document.getElementById('statPending');
  const statRevenue = document.getElementById('statRevenue');

  const total = runnerDatabase.length;
  const verified = runnerDatabase.filter(r => r.status === 'Verified').length;
  const pending = runnerDatabase.filter(r => r.status === 'Pending').length;

  // Calculate fees collected (only verified payments count towards checked revenue)
  const revenue = runnerDatabase
    .filter(r => r.status === 'Verified')
    .reduce((sum, r) => {
      let fee = 0;
      const isStudent = r.type === 'Student' || !r.type; // default to student for legacy data
      
      if (r.category.includes('10K')) {
        fee = isStudent ? 1000 : 1200;
      } else if (r.category.includes('5K')) {
        fee = isStudent ? 900 : 1200;
      }
      return sum + fee;
    }, 0);

  statTotal.textContent = total;
  statVerified.textContent = verified;
  statPending.textContent = pending;
  statRevenue.textContent = `৳${revenue.toLocaleString()} BDT`;
}

function renderAnalyticsCharts() {
  const count10K = document.getElementById('count10K');
  const count5K = document.getElementById('count5K');

  const bar10K = document.getElementById('bar10K');
  const bar5K = document.getElementById('bar5K');

  const total = runnerDatabase.length || 1; // avoid divide by zero

  const num10K = runnerDatabase.filter(r => r.category.includes('10K')).length;
  const num5K = runnerDatabase.filter(r => r.category.includes('5K')).length;

  // Set counts
  count10K.textContent = num10K;
  count5K.textContent = num5K;

  // Set Bar Width percentages
  bar10K.style.width = `${(num10K / total) * 100}%`;
  bar5K.style.width = `${(num5K / total) * 100}%`;

  // Render T-Shirt sizes breakdown
  const tShirtSizes = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  runnerDatabase.forEach(r => {
    const size = r.tshirt ? r.tshirt.toUpperCase() : '';
    if (tShirtSizes[size] !== undefined) {
      tShirtSizes[size]++;
    }
  });

  document.getElementById('shirtS').textContent = tShirtSizes.S;
  document.getElementById('shirtM').textContent = tShirtSizes.M;
  document.getElementById('shirtL').textContent = tShirtSizes.L;
  document.getElementById('shirtXL').textContent = tShirtSizes.XL;
  document.getElementById('shirtXXL').textContent = tShirtSizes.XXL;
}

/* ==========================================
   REGISTRATION DATABASE TABLE VIEW
   ========================================== */
function renderTable(filterQuery = '') {
  const tableBody = document.getElementById('tableBody');
  const footerSummary = document.getElementById('tableFooterSummary');
  tableBody.innerHTML = '';

  const cleanQuery = filterQuery.trim().toLowerCase();

  const filteredRunners = runnerDatabase.filter(runner => {
    if (!cleanQuery) return true;
    
    return runner.name.toLowerCase().includes(cleanQuery) || 
           runner.bib.toLowerCase().includes(cleanQuery) || 
           runner.phone.toLowerCase().includes(cleanQuery) || 
           runner.category.toLowerCase().includes(cleanQuery);
  });

  filteredRunners.forEach(runner => {
    const tr = document.createElement('tr');
    
    const statusClass = runner.status.toLowerCase() === 'verified' ? 'verified' : 'pending';
    
    const typeLabel = runner.type === 'Student' ? 'Student' : 'Alumni/Outsider';
    
    tr.innerHTML = `
      <td><strong>${runner.bib}</strong></td>
      <td>${runner.name}</td>
      <td>${runner.phone}</td>
      <td>${runner.category}</td>
      <td><span class="badge" style="background: rgba(255,255,255,0.05); color: #fff; font-size: 0.75rem;">${typeLabel}</span></td>
      <td>${runner.tshirt}</td>
      <td>${runner.blood || 'N/A'}</td>
      <td><span class="badge-status ${statusClass}" data-bib="${runner.bib}">${runner.status}</span></td>
      <td><button class="btn-delete" data-bib="${runner.bib}">Delete</button></td>
    `;
    
    tableBody.appendChild(tr);
  });

  // Bind Status Toggle Events
  document.querySelectorAll('.badge-status').forEach(badge => {
    badge.addEventListener('click', (e) => {
      const bib = e.target.getAttribute('data-bib');
      toggleRunnerStatus(bib);
    });
  });

  // Bind Delete Events
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bib = e.target.getAttribute('data-bib');
      deleteRunner(bib);
    });
  });

  footerSummary.textContent = `Showing ${filteredRunners.length} of ${runnerDatabase.length} entries`;
}

function toggleRunnerStatus(bib) {
  const runner = runnerDatabase.find(r => r.bib === bib);
  if (runner) {
    runner.status = runner.status === 'Verified' ? 'Pending' : 'Verified';
    saveDatabase();
    refreshDashboard();
  }
}

function deleteRunner(bib) {
  const runnerIndex = runnerDatabase.findIndex(r => r.bib === bib);
  if (runnerIndex !== -1) {
    const runner = runnerDatabase[runnerIndex];
    if (confirm(`Are you sure you want to delete runner ${runner.name} (Bib: ${runner.bib})?`)) {
      runnerDatabase.splice(runnerIndex, 1);
      saveDatabase();
      refreshDashboard();
    }
  }
}

function setupTableSearch() {
  const tableSearch = document.getElementById('tableSearch');
  tableSearch.addEventListener('input', (e) => {
    renderTable(e.target.value);
  });
}

/* ==========================================
   MANUAL RUNNER ENTRY FORM
   ========================================== */
function setupAddRunnerForm() {
  const form = document.getElementById('addRunnerForm');
  
  form.addEventListener('submit', () => {
    const bib = document.getElementById('runBib').value.trim();
    const name = document.getElementById('runName').value.trim();
    const phone = document.getElementById('runPhone').value.trim();
    const category = document.getElementById('runCategory').value;
    const tshirt = document.getElementById('runTshirt').value;
    const gender = document.getElementById('runGender').value;
    const blood = document.getElementById('runBlood').value.trim().toUpperCase();
    const status = document.getElementById('runStatus').value;
    const type = document.getElementById('runType').value;

    // Check if bib number already exists
    if (runnerDatabase.some(r => r.bib === bib)) {
      alert(`Error: Runner with Bib ${bib} already exists in the database.`);
      return;
    }

    // Add to array
    const newRunner = { bib, name, phone, category, tshirt, gender, blood, status, type };
    runnerDatabase.push(newRunner);
    saveDatabase();
    
    // Clear inputs and reload
    form.reset();
    refreshDashboard();
    alert(`Successfully added manual registration: ${name} (Bib: ${bib})`);
  });
}

/* ==========================================
   CSV BATCH IMPORT LOGIC
   ========================================== */
function setupCsvImporter() {
  const mergeBtn = document.getElementById('importMergeBtn');
  const replaceBtn = document.getElementById('importReplaceBtn');
  const csvArea = document.getElementById('csvTextArea');

  function parseCsvContent(text) {
    const lines = text.split('\n');
    const parsedRunners = [];

    lines.forEach((line, index) => {
      const parts = line.split(',').map(p => p.trim());
      // Skip empty lines or malformed rows that don't have enough fields
      if (parts.length < 5 || parts[0] === '') return;

      const bib = parts[0];
      const name = parts[1];
      const phone = parts[2];
      const category = parts[3];
      const tshirt = parts[4];
      const gender = parts[5] || 'Male';
      const blood = parts[6] || 'O+';
      const status = parts[7] || 'Verified';
      const type = parts[8] || 'Student';

      parsedRunners.push({ bib, name, phone, category, tshirt, gender, blood, status, type });
    });

    return parsedRunners;
  }

  mergeBtn.addEventListener('click', () => {
    const text = csvArea.value.trim();
    if (!text) {
      alert('Please paste CSV raw data first.');
      return;
    }

    const newRunners = parseCsvContent(text);
    if (newRunners.length === 0) {
      alert('Could not parse any valid runner profiles. Please verify the CSV column format.');
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;

    newRunners.forEach(newR => {
      // Check if bib already exists, if so skip/warn
      if (runnerDatabase.some(r => r.bib === newR.bib)) {
        duplicateCount++;
      } else {
        runnerDatabase.push(newR);
        addedCount++;
      }
    });

    saveDatabase();
    refreshDashboard();
    csvArea.value = '';

    alert(`Import Complete!\n- Added: ${addedCount} runners\n- Skipped Duplicates: ${duplicateCount}`);
  });

  replaceBtn.addEventListener('click', () => {
    const text = csvArea.value.trim();
    if (!text) {
      alert('Please paste CSV raw data first.');
      return;
    }

    if (confirm('CRITICAL WARNING: This will erase all current registrations and replace them with the parsed data. Are you sure you want to proceed?')) {
      const newRunners = parseCsvContent(text);
      if (newRunners.length === 0) {
        alert('Could not parse any valid runner profiles. Database replacement cancelled.');
        return;
      }

      runnerDatabase = newRunners;
      saveDatabase();
      refreshDashboard();
      csvArea.value = '';

      alert(`Database Replaced successfully with ${runnerDatabase.length} records!`);
    }
  });
}

/* ==========================================
   RESET DATABASE BACK TO MOCKS
   ========================================== */
function setupResetDb() {
  const resetBtn = document.getElementById('resetDbBtn');
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all current edits and restore the initial default database?')) {
      localStorage.removeItem('jucsu_registrations');
      sessionStorage.removeItem('jucsu_admin_logged');
      window.location.reload();
    }
  });
}
