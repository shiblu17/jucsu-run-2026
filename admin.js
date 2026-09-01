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
  const adminEmailInput = document.getElementById('adminEmail');
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
    const email = adminEmailInput ? adminEmailInput.value.trim() : '';
    const password = adminPassInput.value.trim();
    loginError.classList.add('hidden');
    
    if (supabaseClient) {
      const originalText = loginBtn.textContent;
      loginBtn.textContent = 'Verifying...';
      loginBtn.disabled = true;
      
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
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
        loginError.textContent = 'Verification failed: ' + (err.message || 'Invalid credentials.');
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
  setupCsvExporter();
  initAiCopilot();
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
  updateLogisticsSummary();
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
      const type = r.type || 'JU Student (Batch 48 - 55)';
      
      if (type.includes('Student') || type === 'Student') {
        fee = (r.category && r.category.includes('10K')) ? 1000 : 800;
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
  const tShirtSizes = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 };
  runnerDatabase.forEach(r => {
    let size = r.tshirt ? r.tshirt.toUpperCase().trim() : '';
    if (size === 'XXXL') size = '3XL';
    if (tShirtSizes[size] !== undefined) {
      tShirtSizes[size]++;
    }
  });

  document.getElementById('shirtS').textContent = tShirtSizes.S;
  document.getElementById('shirtM').textContent = tShirtSizes.M;
  document.getElementById('shirtL').textContent = tShirtSizes.L;
  document.getElementById('shirtXL').textContent = tShirtSizes.XL;
  document.getElementById('shirtXXL').textContent = tShirtSizes.XXL;
  const s3XL = document.getElementById('shirt3XL');
  if (s3XL) s3XL.textContent = tShirtSizes['3XL'];
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
    const typeLabel = runner.type || 'JU Student (Batch 48 - 55)';
    const txnLabel = runner.txnid || 'N/A';
    
    tr.innerHTML = `
      <td><strong>${runner.bib}</strong></td>
      <td>${runner.name}</td>
      <td>${runner.phone}</td>
      <td>${runner.category}</td>
      <td><span class="badge" style="background: rgba(255,255,255,0.05); color: #fff; font-size: 0.75rem;">${typeLabel}</span></td>
      <td>${runner.tshirt}</td>
      <td><span style="font-size: 0.8rem; color: var(--color-accent);">${runner.kitpoint || 'Jahangirnagar University'}</span></td>
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
    const kitpoint = document.getElementById('runKitPoint') ? document.getElementById('runKitPoint').value : 'Jahangirnagar University';
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

    const newRunner = { bib, name, phone, category, tshirt, kitpoint, gender, blood, status, type, txnid };

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
      const type = parts[8] || 'JU Student (Batch 48 - 55)';
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

/* ==========================================
   ADMIN CSV EXPORT FUNCTIONALITY
   ========================================== */
function setupCsvExporter() {
  const exportBtn = document.getElementById('exportCsvBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    if (runnerDatabase.length === 0) {
      alert('No records to export!');
      return;
    }

    // Define CSV Headers
    const headers = [
      'Bib',
      'Name',
      'Phone',
      'Category',
      'T-Shirt Size',
      'Kit Collection Point',
      'Gender',
      'Blood Group',
      'Status',
      'Participant Type',
      'Transaction ID'
    ];

    // Map database records to rows
    const rows = runnerDatabase.map(r => {
      // Escape field values to prevent CSV injection / malformed quotes
      const clean = (val) => {
        if (val === undefined || val === null) return '';
        const str = String(val).trim();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        clean(r.bib),
        clean(r.name),
        clean(r.phone),
        clean(r.category),
        clean(r.tshirt),
        clean(r.kitpoint || 'Jahangirnagar University'),
        clean(r.gender || 'Male'),
        clean(r.blood || 'N/A'),
        clean(r.status),
        clean(r.type || 'JU Student (Batch 48 - 55)'),
        clean(r.txnid || 'N/A')
      ].join(',');
    });

    // Combine headers and rows with UTF-8 BOM for proper Excel rendering of Bengali/special chars
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');

    // Download File Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `JUCSU_RUN_2026_Registrations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

/* ==========================================
   LOGISTICS SUMMARY RENDERING
   ========================================== */
function updateLogisticsSummary() {
  // 1. T-Shirt sizes breakdown
  const sizes = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 };
  
  // 2. Bus routes breakdown
  const routes = { Uttara: 0, Gulshan: 0, Bongobazar: 0, 'Self-Arranged': 0 };

  // 3. Category count
  let count10k = 0;
  let count5k = 0;

  // 4. Kit Collection points breakdown
  let countKitDU = 0;
  let countKitJU = 0;

  runnerDatabase.forEach(r => {
    // T-shirt counts
    let t = (r.tshirt || '').toUpperCase().trim();
    if (t === 'XXXL') t = '3XL';
    if (sizes.hasOwnProperty(t)) {
      sizes[t]++;
    }

    // Bus counts
    const p = r.pickup || 'Self-Arranged';
    if (routes.hasOwnProperty(p)) {
      routes[p]++;
    } else {
      // Fallback for variation in names
      if (p.includes('Uttara')) routes['Uttara']++;
      else if (p.includes('Gulshan')) routes['Gulshan']++;
      else if (p.includes('Bongobazar')) routes['Bongobazar']++;
      else routes['Self-Arranged']++;
    }

    // Category counts
    const c = r.category || '';
    if (c.includes('10K')) {
      count10k++;
    } else if (c.includes('5K')) {
      count5k++;
    }

    // Kit Collection Point counts
    const kp = (r.kitpoint || '').toLowerCase();
    if (kp.includes('dhaka')) {
      countKitDU++;
    } else {
      countKitJU++;
    }
  });

  // Populate T-shirt counts in DOM
  const sS = document.getElementById('tshirtCountS');
  const sM = document.getElementById('tshirtCountM');
  const sL = document.getElementById('tshirtCountL');
  const sXL = document.getElementById('tshirtCountXL');
  const sXXL = document.getElementById('tshirtCountXXL');
  const s3XL = document.getElementById('tshirtCount3XL');

  if (sS) sS.textContent = sizes.S;
  if (sM) sM.textContent = sizes.M;
  if (sL) sL.textContent = sizes.L;
  if (sXL) sXL.textContent = sizes.XL;
  if (sXXL) sXXL.textContent = sizes.XXL;
  if (s3XL) s3XL.textContent = sizes['3XL'];

  // Populate Bus counts in DOM
  const bUttara = document.getElementById('busCountUttara');
  const bGulshan = document.getElementById('busCountGulshan');
  const bBongobazar = document.getElementById('busCountBongobazar');
  const bSelf = document.getElementById('busCountSelf');

  if (bUttara) bUttara.textContent = routes.Uttara;
  if (bGulshan) bGulshan.textContent = routes.Gulshan;
  if (bBongobazar) bBongobazar.textContent = routes.Bongobazar;
  if (bSelf) bSelf.textContent = routes['Self-Arranged'];

  // Populate category counts in DOM
  const l10k = document.getElementById('logistics10kCount');
  const l5k = document.getElementById('logistics5kCount');

  if (l10k) l10k.textContent = count10k;
  if (l5k) l5k.textContent = count5k;

  // Populate Kit Point counts in DOM
  const kDU = document.getElementById('kitCountDU');
  const kJU = document.getElementById('kitCountJU');

  if (kDU) kDU.textContent = countKitDU;
  if (kJU) kJU.textContent = countKitJU;
}

/* ==========================================
   JUCSU ADMIN AI COPILOT & DATA INTELLIGENCE
   ========================================== */
function initAiCopilot() {
  const triggerBtn = document.getElementById('aiCopilotBtn');
  const chatDrawer = document.getElementById('aiChatDrawer');
  const closeBtn = document.getElementById('closeAiChatBtn');
  const chatForm = document.getElementById('aiChatForm');
  const queryInput = document.getElementById('aiQueryInput');
  const messagesContainer = document.getElementById('aiChatMessages');
  const quickPromptsContainer = document.getElementById('aiQuickPrompts');

  if (!triggerBtn || !chatDrawer) return;

  // Toggle drawer visibility
  triggerBtn.addEventListener('click', () => {
    chatDrawer.classList.toggle('hidden');
    if (!chatDrawer.classList.contains('hidden')) {
      queryInput.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatDrawer.classList.add('hidden');
    });
  }

  // Bind quick prompt buttons
  if (quickPromptsContainer) {
    quickPromptsContainer.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (query) {
          queryInput.value = query;
          handleUserQuery(query);
        }
      });
    });
  }

  // Handle Form submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = queryInput.value.trim();
      if (!query) return;
      handleUserQuery(query);
    });
  }

  function appendMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-bot'}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function handleUserQuery(query) {
    appendMessage(query, true);
    queryInput.value = '';

    // Show quick typing indicator then compute response
    setTimeout(() => {
      const responseHtml = processCopilotQuery(query);
      appendMessage(responseHtml, false);
    }, 200);
  }

  function processCopilotQuery(rawQuery) {
    const q = rawQuery.toLowerCase().trim();
    const totalRunners = runnerDatabase.length;
    const verifiedRunners = runnerDatabase.filter(r => r.status === 'Verified');
    const pendingRunners = runnerDatabase.filter(r => r.status === 'Pending');

    // 1. T-Shirt Size Queries (টি-শার্ট, t-shirt, shirt, সাইজ, size, xxl, 3xl, ইত্যাদি)
    if (q.includes('টি-শার্ট') || q.includes('tshirt') || q.includes('t-shirt') || q.includes('shirt') || q.includes('সাইজ') || q.includes('size')) {
      const sizes = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, '3XL': 0 };
      runnerDatabase.forEach(r => {
        let t = (r.tshirt || '').toUpperCase().trim();
        if (t === 'XXXL') t = '3XL';
        if (sizes.hasOwnProperty(t)) sizes[t]++;
      });

      // Specific size queries
      if (q.includes('3xl') || q.includes('xxxl')) {
        return `👕 মোট <strong>3XL</strong> সাইজের টি-শার্টের চাহিদা: <span class="ai-stat-highlight">${sizes['3XL']} টি</span>।`;
      }
      if (q.includes('xxl')) {
        return `👕 মোট <strong>XXL</strong> সাইজের টি-শার্টের চাহিদা: <span class="ai-stat-highlight">${sizes.XXL} টি</span>।`;
      }
      if (q.includes('xl')) {
        return `👕 মোট <strong>XL</strong> সাইজের টি-শার্টের চাহিদা: <span class="ai-stat-highlight">${sizes.XL} টি</span>।`;
      }
      if (q.includes('m') || q.includes('মিডিয়াম')) {
        return `👕 মোট <strong>M</strong> সাইজের টি-শার্টের চাহিদা: <span class="ai-stat-highlight">${sizes.M} টি</span>।`;
      }
      if (q.includes('s') || q.includes('স্মল')) {
        return `👕 মোট <strong>S</strong> সাইজের টি-শার্টের চাহিদা: <span class="ai-stat-highlight">${sizes.S} টি</span>।`;
      }

      return `
        👕 <strong>টি-শার্ট সাইজ অনুযায়ী মোট চাহিদা সামারি:</strong><br>
        <table class="ai-data-table">
          <tr><th>Size</th><th>Count</th><th>Percentage</th></tr>
          <tr><td>S</td><td><strong>${sizes.S}</strong> টি</td><td>${totalRunners ? Math.round((sizes.S/totalRunners)*100) : 0}%</td></tr>
          <tr><td>M</td><td><strong>${sizes.M}</strong> টি</td><td>${totalRunners ? Math.round((sizes.M/totalRunners)*100) : 0}%</td></tr>
          <tr><td>L</td><td><strong>${sizes.L}</strong> টি</td><td>${totalRunners ? Math.round((sizes.L/totalRunners)*100) : 0}%</td></tr>
          <tr><td>XL</td><td><strong>${sizes.XL}</strong> টি</td><td>${totalRunners ? Math.round((sizes.XL/totalRunners)*100) : 0}%</td></tr>
          <tr><td>XXL</td><td><strong>${sizes.XXL}</strong> টি</td><td>${totalRunners ? Math.round((sizes.XXL/totalRunners)*100) : 0}%</td></tr>
          <tr><td>3XL</td><td><strong>${sizes['3XL']}</strong> টি</td><td>${totalRunners ? Math.round((sizes['3XL']/totalRunners)*100) : 0}%</td></tr>
        </table>
        সর্বমোট অর্ডার করতে হবে: <span class="ai-stat-highlight">${totalRunners} টি</span>
      `;
    }

    // 2. Revenue / Finance Queries (টাকা, রেভিনিউ, revenue, কালেকশন, fund, আয়, ফি)
    if (q.includes('রেভিনিউ') || q.includes('revenue') || q.includes('টাকা') || q.includes('কালেকশন') || q.includes('আয়') || q.includes('fee') || q.includes('ফি') || q.includes('fund') || q.includes('price')) {
      const verifiedRevenue = verifiedRunners.reduce((sum, r) => {
        let fee = 0;
        const type = r.type || 'JU Student (Batch 48 - 55)';
        if (type.includes('Student') || type === 'Student') {
          fee = (r.category && r.category.includes('10K')) ? 1000 : 800;
        } else if (type.includes('Alumni') || type === 'Alumni') {
          fee = 1200;
        } else {
          fee = 1300;
        }
        return sum + fee;
      }, 0);

      const pendingRevenue = pendingRunners.reduce((sum, r) => {
        let fee = 0;
        const type = r.type || 'JU Student (Batch 48 - 55)';
        if (type.includes('Student') || type === 'Student') {
          fee = (r.category && r.category.includes('10K')) ? 1000 : 800;
        } else if (type.includes('Alumni') || type === 'Alumni') {
          fee = 1200;
        } else {
          fee = 1300;
        }
        return sum + fee;
      }, 0);

      return `
        💰 <strong>আর্থিক ও রেভিনিউ বিবরণী:</strong><br><br>
        • ✅ ভেরিফাইড মোট জমা: <span class="ai-stat-highlight">৳${verifiedRevenue.toLocaleString()} BDT</span> (${verifiedRunners.length} জন)<br>
        • ⏳ পেন্ডিং কালেকশন: <strong>৳${pendingRevenue.toLocaleString()} BDT</strong> (${pendingRunners.length} জন)<br>
        • 📈 সম্ভাব্য সর্বমোট রেভিনিউ: <span class="ai-stat-highlight">৳${(verifiedRevenue + pendingRevenue).toLocaleString()} BDT</span>
      `;
    }

    // 3. Kit Collection Point Queries (কিট, kit, ঢাকা, dhaka, du, জাহাঙ্গীরনগর, ju, পয়েন্ট, point)
    if (q.includes('কিট') || q.includes('kit') || q.includes('কালেকশন পয়েন্ট') || q.includes('point') || q.includes('du') || q.includes('ঢাকা বিশ্ববিদ্যালয়') || q.includes('পয়েন্ট')) {
      let countDU = 0;
      let countJU = 0;
      runnerDatabase.forEach(r => {
        const kp = (r.kitpoint || '').toLowerCase();
        if (kp.includes('dhaka')) countDU++;
        else countJU++;
      });

      return `
        📍 <strong>কিট কালেকশন পয়েন্ট অনুযায়ী বিন্যাস:</strong><br><br>
        • 🏛️ <strong>Dhaka University (DU):</strong> <span class="ai-stat-highlight">${countDU} টি কিট</span> (${totalRunners ? Math.round((countDU/totalRunners)*100) : 0}%)<br>
        • 🌳 <strong>Jahangirnagar University (JU):</strong> <span class="ai-stat-highlight">${countJU} টি কিট</span> (${totalRunners ? Math.round((countJU/totalRunners)*100) : 0}%)<br><br>
        <em>পরামর্শ: ঢাকা বিশ্ববিদ্যালয় বুথের জন্য ${countDU} টি কিট আলাদা প্যাকেট প্রস্তুত রাখুন।</em>
      `;
    }

    // 4. Bus Route Queries (বাস, bus, রুট, route, উত্তরা, uttara, গুলশান, gulshan, বঙ্গবাজার, bongobazar, self)
    if (q.includes('বাস') || q.includes('bus') || q.includes('রুট') || q.includes('route') || q.includes('উত্তরা') || q.includes('uttara') || q.includes('গুলশান') || q.includes('gulshan') || q.includes('বঙ্গবাজার') || q.includes('bongobazar') || q.includes('পরিবহন')) {
      const routes = { Uttara: 0, Gulshan: 0, Bongobazar: 0, 'Self-Arranged': 0 };
      runnerDatabase.forEach(r => {
        const p = r.pickup || 'Self-Arranged';
        if (routes.hasOwnProperty(p)) routes[p]++;
        else if (p.includes('Uttara')) routes.Uttara++;
        else if (p.includes('Gulshan')) routes.Gulshan++;
        else if (p.includes('Bongobazar')) routes.Bongobazar++;
        else routes['Self-Arranged']++;
      });

      const totalBusNeed = routes.Uttara + routes.Gulshan + routes.Bongobazar;

      return `
        🚌 <strong>বাস রুট ও পরিবহন সামারি:</strong><br>
        <table class="ai-data-table">
          <tr><th>Route</th><th>Passengers</th><th>Est. Buses (50 cap)</th></tr>
          <tr><td>Uttara Route</td><td><strong>${routes.Uttara}</strong> জন</td><td>${Math.ceil(routes.Uttara / 50)} টি বাস</td></tr>
          <tr><td>Gulshan Route</td><td><strong>${routes.Gulshan}</strong> জন</td><td>${Math.ceil(routes.Gulshan / 50)} টি বাস</td></tr>
          <tr><td>Bongobazar Route</td><td><strong>${routes.Bongobazar}</strong> জন</td><td>${Math.ceil(routes.Bongobazar / 50)} টি বাস</td></tr>
          <tr><td>Self-Arranged</td><td><strong>${routes['Self-Arranged']}</strong> জন</td><td>-</td></tr>
        </table>
        মোট বাস যাত্রী: <span class="ai-stat-highlight">${totalBusNeed} জন</span> (আনুমানিক ${Math.ceil(totalBusNeed / 50)} টি বাসের প্রয়োজন)।
      `;
    }

    // 5. Verification Status Queries (পেন্ডিং, pending, ভেরিফাইড, verified, স্ট্যাটাস, status, বাকি)
    if (q.includes('পেন্ডিং') || q.includes('pending') || q.includes('ভেরিফাইড') || q.includes('verified') || q.includes('স্ট্যাটাস') || q.includes('status')) {
      let pendingSnippet = '';
      if (pendingRunners.length > 0) {
        pendingSnippet = '<br><br><strong>সর্বশেষ ৩টি পেন্ডিং রেজিস্ট্রেশন:</strong><br>' + 
          pendingRunners.slice(0, 3).map(r => `• ${r.name} (${r.phone}) - Trx: <code>${r.txnid || 'N/A'}</code>`).join('<br>');
      }

      return `
        📊 <strong>রেজিস্ট্রেশন স্ট্যাটাস ওভারভিউ:</strong><br><br>
        • ✅ <strong>ভেরিফাইড (Verified):</strong> <span class="ai-stat-highlight">${verifiedRunners.length} জন</span><br>
        • ⏳ <strong>পেন্ডিং (Pending):</strong> <span class="ai-stat-highlight" style="color:#ffaa00; background:rgba(255,170,0,0.15);">${pendingRunners.length} জন</span><br>
        • 👥 <strong>সর্বমোট এন্ট্রি:</strong> <strong>${totalRunners} জন</strong>
        ${pendingSnippet}
      `;
    }

    // 6. Category Queries (১০ কিমি, 10k, ৫ কিমি, 5k, ম্যারাথন, ক্যাটাগরি, category)
    if (q.includes('10k') || q.includes('১০ কিমি') || q.includes('১০k') || q.includes('5k') || q.includes('৫ কিমি') || q.includes('৫k') || q.includes('ক্যাটাগরি') || q.includes('category') || q.includes('ম্যারাথন')) {
      let count10k = 0;
      let count5k = 0;
      runnerDatabase.forEach(r => {
        if ((r.category || '').includes('10K')) count10k++;
        else if ((r.category || '').includes('5K')) count5k++;
      });

      return `
        🏃‍♂️ <strong>রেস ক্যাটাগরি বিশ্লেষণ:</strong><br><br>
        • 🥇 <strong>10K Mini Marathon:</strong> <span class="ai-stat-highlight">${count10k} জন</span> (${totalRunners ? Math.round((count10k/totalRunners)*100) : 0}%)<br>
        • 🥈 <strong>5K Fun Run:</strong> <span class="ai-stat-highlight">${count5k} জন</span> (${totalRunners ? Math.round((count5k/totalRunners)*100) : 0}%)<br><br>
        <em>১০ কিমি রানারদের জন্য চিপ টাইমিং বিব এবং ৫ কিমির জন্য সাধারণ টাইমিং নিশ্চিত করুন।</em>
      `;
    }

    // 7. Participant Type Queries (ছাত্র, student, স্টুডেন্ট, alumni, অ্যালামনাই, external, এক্সটারনাল, ব্যাচ, batch)
    if (q.includes('student') || q.includes('ছাত্র') || q.includes('শিক্ষার্থী') || q.includes('alumni') || q.includes('অ্যালামনাই') || q.includes('external') || q.includes('এক্সটারনাল') || q.includes('বহিরাগত') || q.includes('batch') || q.includes('ব্যাচ')) {
      let students = 0;
      let alumni = 0;
      let external = 0;

      runnerDatabase.forEach(r => {
        const t = r.type || '';
        if (t.includes('Student') || t.includes('JU Student')) students++;
        else if (t.includes('Alumni')) alumni++;
        else external++;
      });

      return `
        🎓 <strong>পার্টিসিপ্যান্ট টাইপ বিশ্লেষণ:</strong><br><br>
        • 🧑‍🎓 <strong>JU Students (Batch 48-55):</strong> <span class="ai-stat-highlight">${students} জন</span><br>
        • 👨‍🎓 <strong>JU Alumni:</strong> <span class="ai-stat-highlight">${alumni} জন</span><br>
        • 🏃 <strong>External Participants:</strong> <span class="ai-stat-highlight">${external} জন</span>
      `;
    }

    // 8. Blood Group Queries (রক্ত, blood, ব্লাড)
    if (q.includes('রক্ত') || q.includes('blood') || q.includes('ব্লাড')) {
      const bloodGroups = {};
      runnerDatabase.forEach(r => {
        const bg = (r.blood || 'N/A').toUpperCase().trim();
        bloodGroups[bg] = (bloodGroups[bg] || 0) + 1;
      });

      const rows = Object.entries(bloodGroups)
        .map(([bg, count]) => `<tr><td>${bg}</td><td><strong>${count}</strong> জন</td></tr>`)
        .join('');

      return `
        🩸 <strong>রক্তের গ্রুপ (Blood Groups) সামারি:</strong><br>
        <table class="ai-data-table">
          <tr><th>Blood Group</th><th>Count</th></tr>
          ${rows}
        </table>
      `;
    }

    // 9. Specific Runner Search (নাম, ফোন বা বিব সার্চ)
    const cleanQ = q.replace(/[^0-9a-zA-Z]/g, '');
    const matchedRunners = runnerDatabase.filter(r => {
      const rName = (r.name || '').toLowerCase();
      const rPhone = (r.phone || '').replace(/[^0-9]/g, '');
      const rBib = (r.bib || '').toLowerCase();
      const rTxn = (r.txnid || '').toLowerCase();

      return (cleanQ && rPhone.includes(cleanQ)) ||
             (cleanQ && rBib === cleanQ) ||
             (cleanQ && rTxn.includes(cleanQ)) ||
             (rName.includes(q));
    });

    if (matchedRunners.length > 0 && matchedRunners.length <= 5) {
      const cards = matchedRunners.map(r => `
        <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:10px; border-radius:8px; margin-top:8px;">
          <strong>${r.name}</strong> (Bib: <span class="text-lime">#${r.bib}</span>)<br>
          <span style="font-size:0.8rem; color:var(--color-text-muted);">
            📞 ${r.phone} • ${r.category} • সাইজ: ${r.tshirt}<br>
            📍 কিট: ${r.kitpoint || 'JU'} • বাস: ${r.pickup || 'Self'}<br>
            💸 TrxID: <code>${r.txnid || 'N/A'}</code> • স্ট্যাটাস: <strong>${r.status}</strong>
          </span>
        </div>
      `).join('');

      return `🔍 আপনার সার্চে <strong>${matchedRunners.length} টি রেকর্ড</strong> পাওয়া গেছে:${cards}`;
    }

    // 10. General / Default Executive Summary Response
    return `
      📋 <strong>JUCSU RUN 2026 সামগ্রিক ওভারভিউ:</strong><br><br>
      • 🏃 মোট রেজিস্ট্রেশন: <span class="ai-stat-highlight">${totalRunners} জন</span><br>
      • ✅ ভেরিফাইড পেমেন্ট: <strong>${verifiedRunners.length} জন</strong><br>
      • ⏳ পেন্ডিং পেমেন্ট: <strong>${pendingRunners.length} জন</strong><br>
      • 💰 মোট ভেরিফাইড রেভিনিউ: <span class="ai-stat-highlight">৳${verifiedRunners.reduce((s, r) => s + ((r.category && r.category.includes('10K')) ? 1000 : 800), 0).toLocaleString()} BDT</span><br><br>
      <em>আপনি যেকোনো বিষয় (যেমন: "টি-শার্ট হিসাব", "বাস রুট", "কিট পয়েন্ট", বা রানারের নাম) লিখে সরাসরি জানতে পারেন!</em>
    `;
  }
}
