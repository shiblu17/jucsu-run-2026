/* ==========================================
   JUCSU RUN 2026 - ADMIN APPLICATION SCRIPT
   ========================================== */

// Supabase SDK client initialization
let supabaseClient = null;
if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
  try {
    const { createClient } = window.supabase;
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('Supabase client initialized in Admin Panel!');
  } catch (e) {
    console.error('Failed to initialize Supabase client in Admin:', e);
  }
}

let runnerDatabase = [];

document.addEventListener('DOMContentLoaded', () => {
  // 1. Password Verification Gate
  initLoginGate();
});

/* ==========================================
   PASSWORD LOCK GATE
   ========================================== */
async function initLoginGate() {
  const loginGate = document.getElementById('loginGate');
  const adminContent = document.getElementById('adminContent');
  const loginForm = document.getElementById('loginForm');
  const adminPassInput = document.getElementById('adminPass');
  const loginError = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');
  const connectionStatus = document.getElementById('connectionStatus');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  // Update status indicators
  if (supabaseClient) {
    if (connectionStatus) connectionStatus.textContent = 'Connected (Supabase)';
  } else {
    if (connectionStatus) connectionStatus.textContent = 'Connected (Local DB)';
  }

  // Setup Logout click
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      sessionStorage.removeItem('jucsu_admin_logged');
      window.location.reload();
    });
  }

  // Check Supabase active auth session
  if (supabaseClient) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        sessionStorage.setItem('jucsu_admin_logged', 'true');
        loginGate.classList.add('hidden');
        adminContent.classList.remove('hidden');
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'block';
        initAdminDashboard();
        return;
      }
    } catch (e) {
      console.error('Error checking active Supabase session:', e);
    }
  }

  // Check Session Storage for existing login
  if (sessionStorage.getItem('jucsu_admin_logged') === 'true') {
    loginGate.classList.add('hidden');
    adminContent.classList.remove('hidden');
    if (adminLogoutBtn) adminLogoutBtn.style.display = 'block';
    initAdminDashboard();
    return;
  }

  // Handle Login submission
  loginForm.addEventListener('submit', async () => {
    const password = adminPassInput.value.trim();
    loginError.classList.add('hidden');
    
    if (supabaseClient) {
      const originalText = loginBtn.textContent;
      loginBtn.textContent = 'Verifying...';
      loginBtn.disabled = true;
      
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: 'admin@jucsu.com',
          password: password
        });
        
        if (error) throw error;
        
        sessionStorage.setItem('jucsu_admin_logged', 'true');
        loginGate.classList.add('hidden');
        adminContent.classList.remove('hidden');
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'block';
        initAdminDashboard();
      } catch (err) {
        console.error('Authentication failed:', err);
        loginError.textContent = 'Verification failed: ' + (err.message || 'Invalid passcode.');
        loginError.classList.remove('hidden');
        adminPassInput.value = '';
        adminPassInput.focus();
      } finally {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
      }
    } else {
      // Offline fallback
      if (password === 'admin' || password === 'jucsu2026') {
        sessionStorage.setItem('jucsu_admin_logged', 'true');
        loginGate.classList.add('hidden');
        adminContent.classList.remove('hidden');
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'block';
        initAdminDashboard();
      } else {
        loginError.textContent = 'Invalid passcode. Please try again.';
        loginError.classList.remove('hidden');
        adminPassInput.value = '';
        adminPassInput.focus();
      }
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
      const type = r.type || 'JU Student (Batch 49 - 54)';
      
      if (type.includes('Student') || type === 'Student') {
        fee = 800;
      } else if (type.includes('Alumni') || type === 'Alumni') {
        fee = 1200;
      } else {
        fee = 1300; // External Participant or Legacy Outsider
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
           (runner.txnid || '').toLowerCase().includes(cleanQuery) || 
           runner.category.toLowerCase().includes(cleanQuery);
  });

  filteredRunners.forEach(runner => {
    const tr = document.createElement('tr');
    
    const statusClass = runner.status.toLowerCase() === 'verified' ? 'verified' : 'pending';
    const typeLabel = runner.type || 'JU Student (Batch 49 - 54)';
    const txnLabel = runner.txnid || 'N/A';
    
    tr.innerHTML = `
      <td><strong>${runner.bib}</strong></td>
      <td>${runner.name}</td>
      <td>${runner.phone}</td>
      <td>${runner.category}</td>
      <td><span class="badge" style="background: rgba(255,255,255,0.05); color: #fff; font-size: 0.75rem;">${typeLabel}</span></td>
      <td>${runner.tshirt}</td>
      <td>${runner.blood || 'N/A'}</td>
      <td><code style="color:var(--color-accent); font-weight:700; font-family:monospace; font-size:0.85rem;">${txnLabel}</code></td>
      <td><span class="badge-status ${statusClass}" data-bib="${runner.bib}" style="cursor:pointer;">${runner.status}</span></td>
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

async function toggleRunnerStatus(bib) {
  const runner = runnerDatabase.find(r => r.bib === bib);
  if (runner) {
    const newStatus = runner.status === 'Verified' ? 'Pending' : 'Verified';
    
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('registrations')
          .update({ status: newStatus })
          .eq('bib', bib);
        if (error) throw error;
      } catch (err) {
        alert('Supabase update failed: ' + err.message);
        return;
      }
    }
    
    runner.status = newStatus;
    saveDatabase();
    refreshDashboard();
  }
}

async function deleteRunner(bib) {
  const runnerIndex = runnerDatabase.findIndex(r => r.bib === bib);
  if (runnerIndex !== -1) {
    const runner = runnerDatabase[runnerIndex];
    if (confirm(`Are you sure you want to delete runner ${runner.name} (Bib: ${runner.bib})?`)) {
      
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('registrations')
            .delete()
            .eq('bib', bib);
          if (error) throw error;
        } catch (err) {
          alert('Supabase delete failed: ' + err.message);
          return;
        }
      }
      
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
  
  form.addEventListener('submit', async () => {
    const bib = document.getElementById('runBib').value.trim();
    const name = document.getElementById('runName').value.trim();
    const phone = document.getElementById('runPhone').value.trim();
    const category = document.getElementById('runCategory').value;
    const tshirt = document.getElementById('runTshirt').value;
    const gender = document.getElementById('runGender').value;
    const blood = document.getElementById('runBlood').value.trim().toUpperCase();
    const status = document.getElementById('runStatus').value;
    const type = document.getElementById('runType').value;
    const txnid = document.getElementById('runTxnId').value.trim().toUpperCase() || 'N/A';

    // Check if bib number already exists
    if (runnerDatabase.some(r => r.bib === bib)) {
      alert(`Error: Runner with Bib ${bib} already exists in the database.`);
      return;
    }

    const newRunner = { bib, name, phone, category, tshirt, gender, blood, status, type, txnid };

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('registrations')
          .insert([newRunner]);
        if (error) throw error;
      } catch (err) {
        alert('Supabase insert failed: ' + err.message);
        return;
      }
    }

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
      const type = parts[8] || 'JU Student (Batch 49 - 54)';
      const txnid = parts[9] || 'N/A';

      parsedRunners.push({ bib, name, phone, category, tshirt, gender, blood, status, type, txnid });
    });

    return parsedRunners;
  }

  mergeBtn.addEventListener('click', async () => {
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
    const runnersToInsert = [];

    newRunners.forEach(newR => {
      // Check if bib already exists, if so skip/warn
      if (runnerDatabase.some(r => r.bib === newR.bib)) {
        duplicateCount++;
      } else {
        runnerDatabase.push(newR);
        runnersToInsert.push(newR);
        addedCount++;
      }
    });

    if (supabaseClient && runnersToInsert.length > 0) {
      try {
        const { error } = await supabaseClient
          .from('registrations')
          .insert(runnersToInsert);
        if (error) throw error;
      } catch (err) {
        alert('Supabase merge insert failed: ' + err.message);
        return;
      }
    }

    saveDatabase();
    refreshDashboard();
    csvArea.value = '';

    alert(`Import Complete!\n- Added: ${addedCount} runners\n- Skipped Duplicates: ${duplicateCount}`);
  });

  replaceBtn.addEventListener('click', async () => {
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

      if (supabaseClient) {
        try {
          // Delete all records from Supabase
          const { error: delErr } = await supabaseClient
            .from('registrations')
            .delete()
            .neq('bib', '');
          if (delErr) throw delErr;

          // Insert new ones
          const { error: insErr } = await supabaseClient
            .from('registrations')
            .insert(newRunners);
          if (insErr) throw insErr;
        } catch (err) {
          alert('Supabase database replace failed: ' + err.message);
          return;
        }
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
  resetBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all current edits and restore the initial default database?')) {
      
      if (supabaseClient) {
        try {
          // Fetch initial mock registrations
          const response = await fetch('registrations.json');
          if (response.ok) {
            const defaultData = await response.json();
            
            // Delete all records from Supabase
            await supabaseClient.from('registrations').delete().neq('bib', '');
            
            // Insert default data
            await supabaseClient.from('registrations').insert(defaultData);
          }
        } catch (err) {
          alert('Failed to reset Supabase database: ' + err.message);
          return;
        }
      }
      
      localStorage.removeItem('jucsu_registrations');
      sessionStorage.removeItem('jucsu_admin_logged');
      window.location.reload();
    }
  });
}
