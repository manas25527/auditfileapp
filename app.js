/* ==========================================================================
   ClariFi - Interactive Application Engine
   ========================================================================== */

// --- Backend API Configuration ---
// Uses the current page origin so it works with localhost, HTTPS, and Cloudflare tunnel
const API_BASE_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileMenu();
  initStageTabs();
  initLedgerInteractions();
  initRoiCalculator();
  initModals();
  initSandboxSimulator();
  initDemoForm();
});

/* ==========================================================================
   Navigation Bar & Mobile Menu
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function initMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  const dropdowns = document.querySelectorAll('.nav-item.dropdown');

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Close on navigation link click unless it's a dropdown trigger
    navMenu.querySelectorAll('.nav-link:not(.dropdown > .nav-link)').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }

  // Handle dropdown toggle on click (for touch devices & mobile)
  dropdowns.forEach(drop => {
    const trigger = drop.querySelector('.nav-link');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 || 'ontouchstart' in window) {
          e.preventDefault();
          drop.classList.toggle('active');
        }
      });
    }
  });

  // Close dropdown if clicked outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.dropdown')) {
      dropdowns.forEach(d => d.classList.remove('active'));
    }
  });
}

/* ==========================================================================
   Product Stage Tab Switching
   ========================================================================== */
function initStageTabs() {
  const tabs = document.querySelectorAll('.stage-tab');
  const tabContents = document.querySelectorAll('.stage-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      // Update active tab button
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update tab contents
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetId) {
          content.classList.add('active');
        }
      });
    });
  });

  // Hero launch simulator button triggers focus on stage
  const heroDemoBtn = document.getElementById('heroInteractiveDemoBtn');
  if (heroDemoBtn) {
    heroDemoBtn.addEventListener('click', () => {
      const demoSec = document.getElementById('demo-section');
      if (demoSec) {
        demoSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('🚀 Interactive Production Workspace Activated', 'success');
      }
    });
  }
}

/* ==========================================================================
   Autonomous Ledger Interactions
   ========================================================================== */
function initLedgerInteractions() {
  const triggerReconBtn = document.getElementById('triggerReconciliationBtn');
  const pendingRow = document.getElementById('pendingRow1');
  const searchInput = document.getElementById('ledgerSearchInput');
  const tableBody = document.getElementById('ledgerTableBody');

  if (triggerReconBtn && pendingRow) {
    triggerReconBtn.addEventListener('click', () => {
      triggerReconBtn.disabled = true;
      triggerReconBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Reconciling 4 Transactions...';

      setTimeout(() => {
        // Transition pending row to reconciled state
        pendingRow.innerHTML = `
          <td><span class="tag-status success"><i class="fa-solid fa-check"></i> Reconciled</span></td>
          <td>
            <div class="tx-id">TX-89207</div>
            <div class="tx-hash">0x12ab...9902</div>
          </td>
          <td>
            <div class="tx-vendor"><i class="fa-solid fa-money-bill-transfer"></i> Salesforce Rev Rec</div>
            <div class="tx-meta">Opportunity #9412 &bull; 2-Year Contract</div>
          </td>
          <td>
            <span class="gl-code">2100-00</span> Deferred Revenue (ASC 606)
          </td>
          <td class="amount positive">+$180,000.00</td>
          <td>
            <div class="match-score">
              <div class="score-bar"><div class="fill" style="width: 100%;"></div></div>
              <span>100%</span>
            </div>
          </td>
          <td>
            <button class="btn-audit-inspect" onclick="inspectAuditTrail('TX-89207', 'Salesforce Contract #9412', '+$180,000.00')">
              <i class="fa-solid fa-file-shield"></i> Verify
            </button>
          </td>
        `;
        pendingRow.classList.remove('unmatched-row');
        pendingRow.classList.add('matched-row');

        triggerReconBtn.innerHTML = '<i class="fa-solid fa-check-double"></i> 100% Ingested Reconciled';
        triggerReconBtn.classList.remove('btn-primary-gradient');
        triggerReconBtn.classList.add('btn-outline');

        showToast('✨ AI successfully reconciled 4 transactions with 100% match score', 'success');

        // Add Copilot note
        appendCopilotMessage('Reconciled Salesforce Deal #9412 ($180,000). Automated 24-month ASC 606 revenue waterfall amortizing $7,500/month.');
      }, 1100);
    });
  }

  // Filter & Search Table
  if (searchInput && tableBody) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }
}

/* ==========================================================================
   AI Copilot Simulated Interaction
   ========================================================================== */
function runCopilotQuery(promptText) {
  const chatHistory = document.getElementById('copilotChat');
  if (!chatHistory) return;

  // Append user question
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-bubble user';
  userMsg.style.background = 'rgba(0, 240, 255, 0.1)';
  userMsg.style.borderColor = 'rgba(0, 240, 255, 0.3)';
  userMsg.style.color = '#fff';
  userMsg.style.alignSelf = 'flex-end';
  userMsg.style.borderRadius = '8px';
  userMsg.style.padding = '8px 12px';
  userMsg.innerHTML = `<strong>You:</strong> ${promptText}`;
  chatHistory.appendChild(userMsg);

  // Response typing effect simulation
  const aiMsg = document.createElement('div');
  aiMsg.className = 'chat-bubble ai';
  aiMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ClariFi AI analyzing general ledger & contract subledger...';
  chatHistory.appendChild(aiMsg);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  setTimeout(() => {
    if (promptText.includes('ASC 606')) {
      aiMsg.innerHTML = `
        <p><strong>ClariFi AI:</strong> Salesforce Deal #9412 is a 24-month contract totaling <strong>$180,000</strong>. ClariFi scheduled:</p>
        <div class="mini-insight-card">
          <div class="insight-title"><i class="fa-solid fa-chart-waterfall"></i> ASC 606 Waterfall</div>
          <div class="insight-body">
            &bull; Initial: Dr. Accounts Receivable $180k / Cr. Deferred Rev $180k<br>
            &bull; Monthly Rec: $7,500/mo recognized starting Aug 1, 2026.
          </div>
        </div>
      `;
    } else if (promptText.includes('Big 4 Audit')) {
      aiMsg.innerHTML = `
        <p><strong>ClariFi AI:</strong> Generated 1-Click Q3 Audit Readiness Pack. 100% of journal entries verified with SHA-256 hashes. 0 unlinked bank items found.</p>
        <div class="mini-insight-card">
          <div class="insight-title"><i class="fa-solid fa-file-zipper"></i> Audit Pack Ready</div>
          <div class="insight-body">Package contains: ASC 606 Memo, Bank Confirmations, Intercompany Eliminations & Trial Balance.</div>
        </div>
      `;
    } else {
      aiMsg.innerHTML = `
        <p><strong>ClariFi AI:</strong> Forensic scan complete: 14,892 transactions checked. Zero unclassified wire transfers >$10k. All 4 wires in August were matched to verified MSA contracts.</p>
      `;
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }, 1000);
}

function appendCopilotMessage(text) {
  const chatHistory = document.getElementById('copilotChat');
  if (!chatHistory) return;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ai';
  bubble.innerHTML = `<p><strong>ClariFi AI:</strong> ${text}</p>`;
  chatHistory.appendChild(bubble);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

/* ==========================================================================
   Anomaly Actions
   ========================================================================== */
function dismissAnomaly(cardId, actionMsg) {
  const card = document.getElementById(cardId);
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
      card.remove();
      showToast(`🛡️ ${actionMsg}. Audit trail updated.`, 'success');
    }, 300);
  }
}

function resolveAllAnomalies() {
  const card1 = document.getElementById('anomalyCard1');
  const card2 = document.getElementById('anomalyCard2');
  if (card1) card1.remove();
  if (card2) card2.remove();
  showToast('✨ All anomalies resolved with autonomous true-up entries.', 'success');
}

/* ==========================================================================
   Audit Package Export Simulation
   ========================================================================== */
function generateAuditPackage() {
  showToast('📦 Generating Big 4 Cryptographic Audit Pack (.ZIP)...', 'info');
  setTimeout(() => {
    showToast('✅ Audit Pack Ready! SHA-256 verification verified by ClariFi Engine.', 'success');
  }, 1200);
}

/* ==========================================================================
   Interactive ROI Calculator
   ========================================================================== */
function initRoiCalculator() {
  const arrRange = document.getElementById('calcArrRange');
  const txRange = document.getElementById('calcTxRange');
  const teamRange = document.getElementById('calcTeamRange');

  const arrDisplay = document.getElementById('arrDisplay');
  const txDisplay = document.getElementById('txDisplay');
  const teamDisplay = document.getElementById('teamDisplay');

  const annualSavings = document.getElementById('annualSavings');
  const closeDaysSaved = document.getElementById('closeDaysSaved');
  const hoursSavedYear = document.getElementById('hoursSavedYear');
  const roiMultiplier = document.getElementById('roiMultiplier');

  function calculate() {
    const arr = parseInt(arrRange.value, 10);
    const tx = parseInt(txRange.value, 10);
    const team = parseInt(teamRange.value, 10);

    // Format displays
    arrDisplay.textContent = `$${(arr / 1000000).toLocaleString()}M`;
    if (arr >= 100000000) arrDisplay.textContent = '$100M+';
    txDisplay.textContent = `${(tx).toLocaleString()} / mo`;
    teamDisplay.textContent = `${team} ${team === 1 ? 'person' : 'people'}`;

    // Calculation formulas
    const avgSalaryPerHour = 75; // avg CPA / finance specialist cost
    const hoursPerPersonSavedPerMonth = 40; // 40 hrs/month saved on manual closing & audit prep
    const totalHoursSavedYear = team * hoursPerPersonSavedPerMonth * 12;

    // External audit prep consultant reduction
    const externalAuditSavings = Math.min(arr * 0.003, 120000);
    const laborSavings = totalHoursSavedYear * avgSalaryPerHour;
    const totalAnnualValue = laborSavings + externalAuditSavings;

    // Days to close reduction
    const daysReduced = Math.min(14, 8 + (team * 0.5));

    // Estimated ROI
    const softwareCost = 1950 * 12; // Scale tier cost
    const multiplier = (totalAnnualValue / softwareCost).toFixed(1);

    // Smooth UI updates
    annualSavings.textContent = `$${Math.round(totalAnnualValue).toLocaleString()}`;
    hoursSavedYear.textContent = `${totalHoursSavedYear.toLocaleString()} hrs`;
    closeDaysSaved.textContent = `${daysReduced.toFixed(1)} Days`;
    roiMultiplier.textContent = `${multiplier}x`;
  }

  if (arrRange && txRange && teamRange) {
    arrRange.addEventListener('input', calculate);
    txRange.addEventListener('input', calculate);
    teamRange.addEventListener('input', calculate);
    calculate();
  }

  const calcReportBtn = document.getElementById('calcGetReportBtn');
  if (calcReportBtn) {
    calcReportBtn.addEventListener('click', () => {
      openDemoModalWithPlan('Custom ROI Assessment');
    });
  }
}

/* ==========================================================================
   Modals & Interaction
   ========================================================================== */
function initModals() {
  const sandboxModal = document.getElementById('sandboxModal');
  const openSandboxBtn = document.getElementById('openSandboxBtn');
  const ctaOpenSandboxBtn = document.getElementById('ctaOpenSandboxBtn');
  const closeSandboxModal = document.getElementById('closeSandboxModal');
  const closeSandboxModalFooter = document.getElementById('closeSandboxModalFooter');

  const demoModal = document.getElementById('demoModal');
  const openDemoModalBtn = document.getElementById('openDemoModalBtn');
  const ctaOpenDemoBtn = document.getElementById('ctaOpenDemoBtn');
  const closeDemoModal = document.getElementById('closeDemoModal');

  const auditInspectModal = document.getElementById('auditInspectModal');
  const closeInspectModal = document.getElementById('closeInspectModal');
  const closeInspectModalBtn = document.getElementById('closeInspectModalBtn');

  // Sandbox openers
  [openSandboxBtn, ctaOpenSandboxBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        sandboxModal.classList.add('active');
      });
    }
  });

  // Sandbox closers
  [closeSandboxModal, closeSandboxModalFooter].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        sandboxModal.classList.remove('active');
      });
    }
  });

  // Demo Modal openers
  [openDemoModalBtn, ctaOpenDemoBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        demoModal.classList.add('active');
      });
    }
  });

  // Demo Modal closer
  if (closeDemoModal) {
    closeDemoModal.addEventListener('click', () => {
      demoModal.classList.remove('active');
    });
  }

  // Audit Inspect Modal closer
  [closeInspectModal, closeInspectModalBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        auditInspectModal.classList.remove('active');
      });
    }
  });

  // Close modals on overlay backdrop click
  [sandboxModal, demoModal, auditInspectModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
}

function openDemoModalWithPlan(planName) {
  const demoModal = document.getElementById('demoModal');
  const planInput = document.getElementById('demoPlanInterest');
  if (planInput) {
    planInput.value = `${planName} (Autonomous GL + Audit Vault)`;
  }
  if (demoModal) {
    demoModal.classList.add('active');
  }
}

/* ==========================================================================
   Inspect Audit Trail Modal Trigger
   ========================================================================== */
function inspectAuditTrail(txId, sourceDoc, amount) {
  const modal = document.getElementById('auditInspectModal');
  const title = document.getElementById('inspectModalTitle');
  const sub = document.getElementById('inspectModalSub');
  const sourceDocElem = document.getElementById('inspectSourceDoc');
  const hashElem = document.getElementById('inspectHashDisplay');

  if (title) title.textContent = `Audit Trail Verification: ${txId}`;
  if (sub) sub.textContent = `Amount: ${amount} • Continuous Ledger Proof`;
  if (sourceDocElem) sourceDocElem.textContent = sourceDoc;

  // Generate deterministic mock hash
  const pseudoHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  if (hashElem) hashElem.textContent = `SHA256: 0x${pseudoHash}9f8b`;

  if (modal) {
    modal.classList.add('active');
  }
}

/* ==========================================================================
   Sandbox Simulator Terminal Logic
   ========================================================================== */
function initSandboxSimulator() {
  const runBtn = document.getElementById('runSandboxSimulationBtn');
  const scenarioSelect = document.getElementById('mockScenarioSelect');
  const terminal = document.getElementById('sandboxTerminal');

  if (!runBtn || !scenarioSelect || !terminal) return;

  runBtn.addEventListener('click', () => {
    const scenario = scenarioSelect.value;
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    // Step 1: Ingestion
    terminal.innerHTML = `
      <div class="term-line info">[0.00s] Ingesting transaction payload...</div>
    `;

    setTimeout(() => {
      if (scenario === 'saas_contract') {
        terminal.innerHTML += `
          <div class="term-line highlight">[0.12s] Parsing Stripe charge $120,000 (Customer: CloudFlow Inc).</div>
          <div class="term-line highlight">[0.24s] ASC 606 engine identified 12-month software subscription terms.</div>
          <div class="term-line info">[0.35s] Posting Auto-Journal Entry:</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; DR 1010-00 Cash & Cash Equivalents: $120,000.00</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; CR 2100-00 Deferred Revenue: $120,000.00</div>
          <div class="term-line success">[0.48s] Cryptographic Hash generated: SHA256(0x9d4a8e...11c2)</div>
          <div class="term-line success">&gt; Transaction 100% matched & Big 4 Audit ready!</div>
        `;
      } else if (scenario === 'cloud_spend') {
        terminal.innerHTML += `
          <div class="term-line highlight">[0.10s] Ingesting AWS Invoice #INV-8910 ($38,400.00).</div>
          <div class="term-line highlight">[0.22s] Comparing against cloud usage telemetry: 100% matched.</div>
          <div class="term-line info">[0.31s] Posting Auto-Journal Entry:</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; DR 6100-20 Cloud Infrastructure: $38,400.00</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; CR 2010-00 Accounts Payable (Silicon Valley Bank): $38,400.00</div>
          <div class="term-line success">[0.45s] Cryptographic Hash generated: SHA256(0x22be1a...ff90)</div>
          <div class="term-line success">&gt; Expense recorded and matched to August operating cycle!</div>
        `;
      } else {
        terminal.innerHTML += `
          <div class="term-line highlight">[0.11s] Detected Intercompany Wire: US Parent &rarr; UK Entity (£50,000 / $64,200).</div>
          <div class="term-line highlight">[0.25s] Spot FX Rate fetched from ECB feed: 1.2840 USD/GBP.</div>
          <div class="term-line info">[0.36s] Posting Elimination Entry:</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; DR 1400-00 Due from UK Subsidiary: $64,200.00</div>
          <div class="term-line info">&nbsp;&nbsp;&bull; CR 1010-00 Chase Operating: $64,200.00</div>
          <div class="term-line success">[0.50s] Automated Elimination paired with zero intercompany variance.</div>
          <div class="term-line success">&gt; Consolidated Balance Sheet in balance!</div>
        `;
      }

      terminal.scrollTop = terminal.scrollHeight;
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fa-solid fa-play"></i> Process Transaction';
      showToast('⚡ Sandbox simulation completed with zero ledger drift', 'success');
    }, 700);
  });
}

/* ==========================================================================
   Demo Request Form Handler
   ========================================================================== */
function initDemoForm() {
  const form = document.getElementById('demoRequestForm');
  const demoModal = document.getElementById('demoModal');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('demoEmail').value;
      const submitBtn = document.getElementById('submitDemoFormBtn');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Securing Assessment Slot...';

      setTimeout(() => {
        demoModal.classList.remove('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Confirm VIP Demo Booking</span> <i class="fa-solid fa-arrow-right"></i>';
        form.reset();

        showToast(`🎉 VIP Assessment Booked! We sent an invite to ${email}.`, 'success');
      }, 1000);
    });
  }
}

/* ==========================================================================
   Admin Panel Interactivity
   ========================================================================== */
function initAdminPanel() {
  const sidebarLinks = document.querySelectorAll('.admin-sidebar .sidebar-link[data-admin-tab]');
  const adminViews = document.querySelectorAll('.admin-view-panel');
  const sectionTitle = document.getElementById('currentSectionTitle');
  const clientSelect = document.getElementById('clientSelect');

  // Sidebar Tab Switching
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetViewId = link.getAttribute('data-admin-tab');

      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      adminViews.forEach(view => {
        view.classList.remove('active');
        if (view.id === targetViewId) {
          view.classList.add('active');
        }
      });

      // Update Topbar Section Title
      if (sectionTitle) {
        if (targetViewId === 'admin-dashboard') sectionTitle.textContent = 'Command Center Overview';
        else if (targetViewId === 'admin-risk') sectionTitle.textContent = 'AI Risk Scoring & XAI Matrix';
        else if (targetViewId === 'admin-controls') sectionTitle.textContent = 'Continuous Controls Monitor (365-Day)';
        else if (targetViewId === 'admin-evidence') sectionTitle.textContent = 'Automated Client Evidence Hub';
        else if (targetViewId === 'admin-vault') sectionTitle.textContent = 'Cryptographic SOX Audit Lineage Vault';
      }
    });
  });

  // Client Switcher
  if (clientSelect) {
    clientSelect.addEventListener('change', (e) => {
      const clientName = e.target.options[e.target.selectedIndex].text;
      showToast(`🔄 Loaded workspace for ${clientName}`, 'info');
    });
  }

  // Evidence Dispatch Modal
  const dispatchModal = document.getElementById('dispatchEvidenceModal');
  const openDispatchBtn = document.getElementById('openDispatchEvidenceModalBtn');
  const btnNewEvidence = document.getElementById('btnNewEvidence');
  const closeDispatchBtn = document.getElementById('closeDispatchEvidenceModal');
  const dispatchForm = document.getElementById('dispatchEvidenceForm');

  [openDispatchBtn, btnNewEvidence].forEach(btn => {
    if (btn && dispatchModal) {
      btn.addEventListener('click', () => {
        dispatchModal.classList.add('active');
      });
    }
  });

  if (closeDispatchBtn && dispatchModal) {
    closeDispatchBtn.addEventListener('click', () => {
      dispatchModal.classList.remove('active');
    });
  }

  if (dispatchForm && dispatchModal) {
    dispatchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('reqEvidenceTitle').value;
      const assignee = document.getElementById('reqAssignee').value;

      dispatchModal.classList.remove('active');
      dispatchForm.reset();

      // Add to table
      const table = document.getElementById('adminEvidenceTable');
      if (table) {
        const tbody = table.querySelector('tbody');
        const newRow = document.createElement('tr');
        const reqId = 'EV-' + Math.floor(1000 + Math.random() * 9000);
        newRow.innerHTML = `
          <td><span class="font-mono">${reqId}</span></td>
          <td>
            <strong>${title}</strong>
            <div class="tx-meta">Dispatched via Automated Multi-Channel Bot</div>
          </td>
          <td>
            <div>${assignee}</div>
            <div class="tx-meta"><i class="fa-solid fa-mobile-screen"></i> Mobile App User</div>
          </td>
          <td><span class="tag-status warning"><i class="fa-solid fa-clock"></i> Sent to Phone</span></td>
          <td>Push Sent Just Now</td>
          <td>
            <button class="btn btn-xs btn-outline" onclick="sendEvidencePing('${reqId}')"><i class="fa-solid fa-bell"></i> Send Mobile Push</button>
          </td>
        `;
        tbody.prepend(newRow);
      }

      showToast(`📲 Evidence request dispatched to ${assignee}'s mobile app!`, 'success');
    });
  }

  // XAI Inspector Modal closer
  const xaiModal = document.getElementById('xaiInspectorModal');
  const closeXaiBtn = document.getElementById('closeXaiModal');
  if (closeXaiBtn && xaiModal) {
    closeXaiBtn.addEventListener('click', () => {
      xaiModal.classList.remove('active');
    });
  }
}

function switchAdminTab(tabId) {
  const targetLink = document.querySelector(`.admin-sidebar .sidebar-link[data-admin-tab="${tabId}"]`);
  if (targetLink) {
    targetLink.click();
  }
}

function runFullPopulationScan() {
  showToast('🔍 Scanning 100% population (14,892 transactions)...', 'info');
  setTimeout(() => {
    showToast('✅ Full Population Re-Scan Complete: 0 unaccounted ledger drift.', 'success');
  }, 1200);
}

function runAllControlsTest() {
  showToast('⚡ Running automated harness across all 18 SOX key controls...', 'info');
  setTimeout(() => {
    showToast('🛡️ 18/18 Controls Passed! Real-time compliance score: 100%.', 'success');
  }, 1100);
}

function sendEvidencePing(reqId) {
  showToast(`🔔 Automated mobile push reminder sent for ${reqId}!`, 'info');
}

function openXaiModal(counterparty, amount, score, reason) {
  const modal = document.getElementById('xaiInspectorModal');
  const scoreNum = document.getElementById('xaiScoreNum');
  const nameElem = document.getElementById('xaiCounterpartyName');
  const amountElem = document.getElementById('xaiAmountDisplay');

  if (scoreNum) scoreNum.textContent = score;
  if (nameElem) nameElem.textContent = counterparty;
  if (amountElem) amountElem.textContent = `Amount: ${amount} • Explainable AI Rule Evaluation`;

  if (modal) {
    modal.classList.add('active');
  }
}

function signOffXai(msg) {
  const modal = document.getElementById('xaiInspectorModal');
  if (modal) modal.classList.remove('active');
  showToast(`✍️ Auditor Sign-off recorded: ${msg}. SHA-256 hash locked.`, 'success');
}

/* ==========================================================================
   Mobile User Portal Interactivity
   ========================================================================== */
function initMobilePortal() {
  const deviceToggleBtn = document.getElementById('toggleDeviceFrameBtn');
  const appWrapper = document.getElementById('mobileAppWrapper');

  if (deviceToggleBtn && appWrapper) {
    deviceToggleBtn.addEventListener('click', () => {
      appWrapper.classList.toggle('fullscreen-mode');
      const isFullscreen = appWrapper.classList.contains('fullscreen-mode');
      deviceToggleBtn.innerHTML = isFullscreen 
        ? '<i class="fa-solid fa-mobile-screen"></i> Switch to Phone Mockup' 
        : '<i class="fa-solid fa-expand"></i> Switch to Fullscreen Mobile';
    });
  }
}

function switchMobileTab(tabId) {
  const tabs = document.querySelectorAll('.mobile-tab-view');
  const navTabs = document.querySelectorAll('.mobile-bottom-nav .nav-tab');

  tabs.forEach(t => {
    t.classList.remove('active');
    if (t.id === tabId) t.classList.add('active');
  });

  navTabs.forEach(nt => {
    nt.classList.remove('active');
    if (nt.getAttribute('data-mob-tab') === tabId) {
      nt.classList.add('active');
    }
  });
}

function simulateMobileReceiptScan() {
  const laser = document.getElementById('scanLaser');
  const shutterBtn = document.getElementById('triggerScanBtn');
  const resultCard = document.getElementById('extractedOcrCard');

  if (laser && shutterBtn) {
    laser.classList.add('scanning');
    shutterBtn.disabled = true;
    showToast('📸 Capturing receipt & running AI OCR extraction...', 'info');

    setTimeout(() => {
      laser.classList.remove('scanning');
      shutterBtn.disabled = false;
      if (resultCard) {
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth' });
      }
      showToast('✨ AI successfully extracted 5 structured fields (99.7% confidence)', 'success');
    }, 1400);
  }
}

function confirmAndPostReceipt() {
  const resultCard = document.getElementById('extractedOcrCard');
  if (resultCard) {
    resultCard.style.display = 'none';
  }
  showToast('✅ Uber receipt posted to GL Account 6300-10 with green check!', 'success');
  switchMobileTab('mobTabHome');
}

function simulateMobileEvidenceUpload(cardId, fileName) {
  const card = document.getElementById(cardId);
  const badge = document.getElementById('mobPendingBadge');

  if (card) {
    card.innerHTML = `
      <div class="ev-card-top">
        <span class="ev-cat"><i class="fa-solid fa-check-double text-emerald"></i> Uploaded & Verified</span>
        <span class="ev-due text-emerald">Just Now</span>
      </div>
      <h5>${fileName}</h5>
      <p class="ev-sub">Received by Auditor Alex Thorne. Automatically verified with SHA-256 signature.</p>
    `;
    card.classList.add('completed');

    if (badge) badge.textContent = '1 Pending';
    showToast(`📤 1-Tap Upload Complete! ${fileName} synced with Auditor Command Center.`, 'success');
  }
}

function sendMobileChatMessage(text) {
  const input = document.getElementById('mobChatInput');
  if (input) {
    input.value = text;
    handleMobileChatSubmit();
  }
}

function handleMobileChatSubmit() {
  const input = document.getElementById('mobChatInput');
  const chatArea = document.getElementById('mobChatMessages');
  if (!input || !chatArea) return;

  const query = input.value.trim();
  if (!query) return;

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.style.background = 'rgba(0, 240, 255, 0.1)';
  userBubble.style.color = '#fff';
  userBubble.style.alignSelf = 'flex-end';
  userBubble.style.padding = '8px 12px';
  userBubble.style.borderRadius = '12px 12px 2px 12px';
  userBubble.style.fontSize = '0.78rem';
  userBubble.innerHTML = query;
  chatArea.appendChild(userBubble);
  input.value = '';
  chatArea.scrollTop = chatArea.scrollHeight;

  // Typing response
  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble ai';
  aiBubble.style.fontSize = '0.78rem';
  aiBubble.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ClariFi AI searching company policies & contracts...';
  chatArea.appendChild(aiBubble);
  chatArea.scrollTop = chatArea.scrollHeight;

  setTimeout(() => {
    if (query.toLowerCase().includes('meal') || query.toLowerCase().includes('travel')) {
      aiBubble.innerHTML = `
        <p><strong>ClariFi Assistant:</strong> Under Acme Technologies' 2026 Travel & Expense Policy:</p>
        <ul style="margin: 6px 0 6px 14px;">
          <li>Daily meal limit is <strong>$75.00/day</strong>.</li>
          <li>Receipts required for any single expense above $25.00.</li>
        </ul>
        <a href="#" class="citation-tag" onclick="showToast('📄 Opened Section 3.4 of Acme Employee Handbook', 'info')"><i class="fa-solid fa-link"></i> Acme Handbook &sect;3.4, Page 16</a>
      `;
    } else if (query.toLowerCase().includes('datadog')) {
      aiBubble.innerHTML = `
        <p><strong>ClariFi Assistant:</strong> Datadog Enterprise Agreement terms:</p>
        <ul style="margin: 6px 0 6px 14px;">
          <li>Payment Terms: <strong>Net 30 via ACH/Wire</strong>.</li>
          <li>Current Monthly Amortization: <strong>$10,000.00/mo</strong>.</li>
        </ul>
        <a href="#" class="citation-tag" onclick="showToast('📄 Opened Datadog MSA Section 4', 'info')"><i class="fa-solid fa-link"></i> Datadog MSA &sect;4.1</a>
      `;
    } else {
      aiBubble.innerHTML = `
        <p><strong>ClariFi Assistant:</strong> Reconciled against general ledger policies: All records are in compliance with 0 audit exceptions.</p>
      `;
    }
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 900);
}

// Ensure Admin & Mobile portals are initialized if elements exist on current page
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSettingsModal();
  initAdminPanel();
  initMobilePortal();
});

/* ==========================================================================
   Universal Theme Management (Dark & Light Mode)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('clarifi_theme') || 'dark';
  setTheme(savedTheme, false);

  // Setup all theme toggle buttons across pages
  const themeToggleBtns = document.querySelectorAll('.btn-theme-toggle');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme, true);
    });
  });
}

function setTheme(themeName, showNotification = true) {
  const themeToggleBtns = document.querySelectorAll('.btn-theme-toggle');
  const themeCards = document.querySelectorAll('.theme-card-option');

  if (themeName === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    localStorage.setItem('clarifi_theme', 'light');

    themeToggleBtns.forEach(btn => {
      btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      btn.setAttribute('title', 'Switch to Dark Mode');
    });

    themeCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-theme-val') === 'light');
    });

    if (showNotification) {
      showToast('☀️ Light Mode activated', 'info');
    }
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('clarifi_theme', 'dark');

    themeToggleBtns.forEach(btn => {
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('title', 'Switch to Light Mode');
    });

    themeCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-theme-val') === 'dark');
    });

    if (showNotification) {
      showToast('🌙 Obsidian Dark Mode activated', 'info');
    }
  }
}

/* ==========================================================================
   Settings Modal Controller
   ========================================================================== */
function initSettingsModal() {
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtns = document.querySelectorAll('.openSettingsBtn, .btn-settings-nav');
  const closeSettingsBtn = document.getElementById('closeSettingsModal');
  const closeSettingsBtnFooter = document.getElementById('closeSettingsModalFooter');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');

  // Open triggers
  openSettingsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (settingsModal) settingsModal.classList.add('active');
    });
  });

  // Close triggers
  [closeSettingsBtn, closeSettingsBtnFooter].forEach(btn => {
    if (btn && settingsModal) {
      btn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
      });
    }
  });

  // Settings Tabs Switcher
  const settingsTabs = document.querySelectorAll('.settings-tab-btn');
  const settingsPanes = document.querySelectorAll('.settings-tab-pane');

  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPane = tab.getAttribute('data-settings-tab');
      settingsTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      settingsPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetPane) pane.classList.add('active');
      });
    });
  });

  // Theme selection cards inside settings
  const themeOptions = document.querySelectorAll('.theme-card-option');
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const selected = opt.getAttribute('data-theme-val');
      if (selected === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light', true);
      } else {
        setTheme(selected, true);
      }
    });
  });

  // Accent Color Customizer
  const swatchBtns = document.querySelectorAll('.color-swatch-btn');
  swatchBtns.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatchBtns.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const color = swatch.getAttribute('data-color-hex');
      const colorName = swatch.getAttribute('data-color-name');

      document.documentElement.style.setProperty('--cyan', color);
      showToast(`🎨 Accent color updated to ${colorName}`, 'info');
    });
  });

  // Save Settings
  if (saveSettingsBtn && settingsModal) {
    saveSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('active');
      showToast('⚙️ Workspace settings & preferences saved successfully!', 'success');
    });
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald' : type === 'warning' ? 'fa-triangle-exclamation text-amber' : 'fa-circle-info text-cyan'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================================================
   Hybrid-Edge AI Auditor — iQOO 15 Snapdragon NPU Interactive Engine
   ========================================================================== */

// Invoice preset data store
const PRESET_INVOICES = {
  acme: {
    vendor: 'Acme Software Corp',
    invNum: 'INV-2026-4421',
    date: 'Aug 22, 2026',
    dateRaw: '2026-08-22',
    lineItem: '$45,000.00',
    tax: '$5,000.00',
    total: '$50,000.00',
    totalNum: 50000,
    subtotalNum: 45000,
    taxNum: 5000,
    docType: 'Tax Invoice',
    riskScore: 85,
    riskLevel: 'HIGH',
    riskTag: '',
    xaiReason: 'Invoice date falls on a <strong>Sunday (Aug 22, 2026)</strong>. Vendor amount of $50,000 is exactly <strong>200% higher</strong> than the historical average for Acme Corp ($25,000 avg over 12 months). Pattern consistent with <strong>potential duplicate or inflated billing</strong>.',
    jetFlags: ['WEEKEND_POSTING', 'AMOUNT_DRIFT_200%', 'NO_PO_MATCH', 'FIRST_TIME_AMOUNT'],
    dateAnomaly: true,
    runwayImpact: 'This $50,000 invoice drops cash runway from <strong>4.2 to 2.8 months</strong>.',
    newRunway: 2.8,
    cfoSteps: [
      'Renegotiate payment terms with Acme Corp to <strong>Net-60</strong> instead of Net-30, preserving $50k liquidity for 30 additional days.',
      'Freeze Q3 discretionary marketing spend to preserve <strong>$15,000 liquidity</strong> buffer.',
      'Accelerate AR collections by offering a <strong>2% early-payment discount</strong> on top 5 pending client invoices ($180k outstanding).'
    ]
  },
  datadog: {
    vendor: 'Datadog Inc',
    invNum: 'INV-2026-9910',
    date: 'Aug 20, 2026',
    dateRaw: '2026-08-20',
    lineItem: '$10,000.00',
    tax: '$0.00',
    total: '$10,000.00',
    totalNum: 10000,
    subtotalNum: 10000,
    taxNum: 0,
    docType: 'SaaS Invoice',
    riskScore: 12,
    riskLevel: 'LOW',
    riskTag: 'low',
    xaiReason: 'Amount matches PO #9910. Vendor is pre-approved with signed MSA. Posting date is a weekday. No anomalies detected.',
    jetFlags: [],
    dateAnomaly: false,
    runwayImpact: 'This $10,000 invoice has <strong>minimal impact</strong> on runway (4.2 → 4.1 months).',
    newRunway: 4.1,
    cfoSteps: [
      'Invoice amount matches existing PO #9910. <strong>Auto-approve</strong> for payment under Net-30 terms.',
      'Continue monitoring Datadog usage metrics vs. contracted capacity.',
      'No corrective cash flow action required.'
    ]
  },
  uber: {
    vendor: 'Uber Technologies Inc',
    invNum: 'REC-2026-8824',
    date: 'Aug 24, 2026',
    dateRaw: '2026-08-24',
    lineItem: '$64.50',
    tax: '$12.90',
    total: '$77.40',
    totalNum: 77.40,
    subtotalNum: 64.50,
    taxNum: 12.90,
    docType: 'Expense Receipt',
    riskScore: 8,
    riskLevel: 'LOW',
    riskTag: 'low',
    xaiReason: 'Standard travel expense. Amount is within daily expense policy limit of $75.00. Categorized under GL 6300-10 Travel & Meals.',
    jetFlags: [],
    dateAnomaly: false,
    runwayImpact: 'This $77.40 receipt has <strong>negligible impact</strong> on runway.',
    newRunway: 4.2,
    cfoSteps: [
      'Auto-post to GL Account <strong>6300-10 Travel & Meals</strong>.',
      'Expense falls within daily meal policy limit ($75/day).',
      'No management action required.'
    ]
  },
  cloudflare: {
    vendor: 'CloudFlare Inc',
    invNum: 'INV-2026-4399',
    date: 'Aug 21, 2026',
    dateRaw: '2026-08-21',
    lineItem: '$15,000.00',
    tax: '$0.00',
    total: '$15,000.00',
    totalNum: 15000,
    subtotalNum: 15000,
    taxNum: 0,
    docType: 'Enterprise Invoice',
    riskScore: 72,
    riskLevel: 'MEDIUM',
    riskTag: 'med',
    xaiReason: 'Potential <strong>duplicate</strong> of INV-4398 ($15,000, paid Aug 5, 2026). Same vendor, same amount, same billing period. Requires manual verification before payment release.',
    jetFlags: ['POTENTIAL_DUPLICATE', 'SAME_AMOUNT_30D', 'SAME_VENDOR_PERIOD'],
    dateAnomaly: false,
    runwayImpact: 'This $15,000 invoice drops runway from <strong>4.2 to 3.9 months</strong>.',
    newRunway: 3.9,
    cfoSteps: [
      'Hold payment pending <strong>duplicate verification</strong> with CloudFlare billing team.',
      'Cross-reference with INV-4398 paid on Aug 5 — same amount and vendor.',
      'If confirmed duplicate, reject invoice and log as attempted double-billing.'
    ]
  }
};

let currentInvoice = PRESET_INVOICES.acme;

/**
 * Load a preset invoice into the camera viewfinder
 */
function loadPresetInvoice(presetKey) {
  const preset = PRESET_INVOICES[presetKey];
  if (!preset) return;
  currentInvoice = preset;

  // Update camera viewfinder receipt
  const vendorEl = document.getElementById('receiptVendorName');
  const invNumEl = document.getElementById('receiptInvNum');
  const dateEl = document.getElementById('receiptDate');
  const lineItemEl = document.getElementById('receiptLineItem');
  const taxEl = document.getElementById('receiptTax');
  const totalEl = document.getElementById('receiptTotal');

  if (vendorEl) vendorEl.textContent = preset.vendor.toUpperCase();
  if (invNumEl) invNumEl.textContent = preset.invNum;
  if (dateEl) dateEl.textContent = preset.date;
  if (lineItemEl) lineItemEl.textContent = preset.lineItem;
  if (taxEl) taxEl.textContent = preset.tax;
  if (totalEl) totalEl.textContent = preset.total;

  showToast(`📄 Loaded ${preset.vendor} (${preset.total}) into scanner`, 'info');

  // Scroll to camera
  const camBox = document.getElementById('cameraHudBox');
  if (camBox) camBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Handle real file upload from camera capture or gallery/PDF picker.
 * Sends the file to the backend, receives extracted data, and starts the flow.
 */
function handleFileUpload(inputElem) {
  const file = inputElem.files && inputElem.files[0];
  if (!file) return;

  showToast(`📤 Uploading ${file.name}... Running AI analysis`, 'info');

  // --- Update the upload zone to show file info ---
  const uploadPrompt = document.getElementById('uploadPrompt');
  const uploadFileInfo = document.getElementById('uploadFileInfo');
  const uploadFileName = document.getElementById('uploadedFileName');
  const uploadFileStatus = document.getElementById('uploadedFileStatus');
  if (uploadPrompt) uploadPrompt.style.display = 'none';
  if (uploadFileInfo) uploadFileInfo.style.display = 'flex';
  if (uploadFileName) uploadFileName.textContent = file.name;
  if (uploadFileStatus) uploadFileStatus.textContent = '⏳ Scanning document...';

  // Switch to processing screen immediately
  const procVendor = document.getElementById('processingVendor');
  const procTotal = document.getElementById('processingTotal');
  if (procVendor) procVendor.textContent = 'ANALYZING DOCUMENT...';
  if (procTotal) procTotal.textContent = file.name;
  switchMobileTab('mobTabProcessing');
  runNpuTelemetrySimulation();

  // Upload file to backend
  const formData = new FormData();
  formData.append('file', file);

  fetch(`${API_BASE_URL}/api/v1/upload-document`, {
    method: 'POST',
    body: formData
  })
  .then(res => {
    if (!res.ok) throw new Error(`Server responded ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (data.status === 'error') {
      throw new Error(data.detail || 'Server returned an error');
    }

    const ext = data.extracted_data || {};
    const fmt = (v) => typeof v === 'number' ? `$${v.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '$0.00';

    // Build a dynamic currentInvoice from the backend response
    currentInvoice = {
      vendor: ext.vendor_name || 'Unknown Vendor',
      invNum: 'UPLOADED-DOC',
      date: ext.invoice_date || new Date().toISOString().slice(0,10),
      dateRaw: ext.invoice_date || new Date().toISOString().slice(0,10),
      lineItem: fmt(ext.line_items_total),
      tax: fmt(ext.tax_amount),
      total: fmt(ext.gross_total),
      totalNum: ext.gross_total || 0,
      subtotalNum: ext.line_items_total || 0,
      taxNum: ext.tax_amount || 0,
      docType: ext.document_type || 'Tax Invoice',
      riskScore: data.audit_results ? data.audit_results.risk_score : 15,
      riskLevel: data.audit_results ? data.audit_results.risk_level : 'LOW',
      riskTag: '',
      xaiReason: data.audit_results ? data.audit_results.explainable_ai_reason : 'No anomalies detected.',
      jetFlags: [],
      dateAnomaly: false,
      runwayImpact: '',
      newRunway: 4.2,
      cfoSteps: [],
      // Smart analysis data
      contentSummary: data.content_summary || '',
      rawTextPreview: data.raw_text_preview || '',
      pendingRefunds: data.pending_refunds || [],
      unpaidSalaries: data.unpaid_salaries || [],
      allEntries: data.all_entries || [],
      isUploadedDoc: true
    };

    // Set risk tag
    if (currentInvoice.riskLevel === 'HIGH') currentInvoice.riskTag = '';
    else if (currentInvoice.riskLevel === 'MEDIUM') currentInvoice.riskTag = 'med';
    else currentInvoice.riskTag = 'low';

    // Set JET flags for high risk
    if (currentInvoice.riskScore >= 70) {
      currentInvoice.jetFlags = ['AMOUNT_DRIFT_200%', 'UPLOADED_DOCUMENT'];
    }

    // Add flags if refunds or salary issues found
    if (currentInvoice.pendingRefunds.length > 0) {
      currentInvoice.jetFlags.push('PENDING_REFUNDS');
    }
    if (currentInvoice.unpaidSalaries.length > 0) {
      currentInvoice.jetFlags.push('UNPAID_SALARIES');
    }

    // Set CFO data
    if (data.cfo_assistant) {
      currentInvoice.newRunway = data.cfo_assistant.updated_runway_months;
      currentInvoice.runwayImpact = `This ${currentInvoice.total} invoice updates cash runway to <strong>${data.cfo_assistant.updated_runway_months} months</strong>.`;
      if (data.cfo_assistant.action_steps && data.cfo_assistant.action_steps.length >= 3) {
        currentInvoice.cfoSteps = data.cfo_assistant.action_steps;
      }
    }

    // Update the uploaded file indicator with success
    if (uploadFileStatus) uploadFileStatus.textContent = '✅ Scan complete — ' + currentInvoice.vendor;

    // Update processing screen labels
    if (procVendor) procVendor.textContent = currentInvoice.vendor.toUpperCase();
    if (procTotal) procTotal.textContent = currentInvoice.total;

    showToast(`✅ Extracted: ${currentInvoice.vendor} — ${currentInvoice.total}`, 'success');

    // --- DIRECTLY populate results and switch to results tab ---
    populateResultsScreen();
    switchMobileTab('mobTabResults');
  })
  .catch(err => {
    console.error('Upload failed:', err);
    if (uploadFileStatus) uploadFileStatus.textContent = '❌ Scan failed';
    showToast(`❌ Upload failed: ${err.message}. Check server connection and try again.`, 'warning');
  });

  // Reset the input so the same file can be re-selected
  inputElem.value = '';
}

/**
 * Start the full Edge Processing flow:
 * Camera capture → NPU Processing → Verification → CFO Handoff
 */
function startEdgeProcessingFlow() {
  showToast('📸 Document captured! Starting Snapdragon NPU extraction...', 'info');

  // Update processing screen with current invoice
  const procVendor = document.getElementById('processingVendor');
  const procTotal = document.getElementById('processingTotal');
  if (procVendor) procVendor.textContent = currentInvoice.vendor.toUpperCase();
  if (procTotal) procTotal.textContent = currentInvoice.total;

  // Switch to processing tab
  setTimeout(() => {
    switchMobileTab('mobTabProcessing');
    runNpuTelemetrySimulation();
  }, 400);
}

/**
 * Simulate NPU processing telemetry with realistic timing
 */
function runNpuTelemetrySimulation() {
  const rows = [
    document.getElementById('telRow1'),
    document.getElementById('telRow2'),
    document.getElementById('telRow3'),
    document.getElementById('telRow4'),
    document.getElementById('telRow5')
  ];
  const progressBar = document.getElementById('edgeProgressBar');
  const timerChip = document.getElementById('edgeTimerChip');
  const badgeTop = document.getElementById('edgeBadgeTop');
  const laser = document.getElementById('holoScanLaser');

  // Reset all rows
  rows.forEach((r, i) => {
    if (r) {
      r.className = 'telemetry-row' + (i === 0 ? ' active' : '');
      const icon = r.querySelector('.telemetry-icon i');
      if (icon) icon.className = i === 0 ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle';
    }
  });
  if (progressBar) progressBar.style.width = '0%';
  if (laser) laser.style.display = 'block';

  // Timer
  let elapsed = 0;
  const timerInterval = setInterval(() => {
    elapsed += 10;
    if (timerChip) timerChip.textContent = elapsed + 'ms';
  }, 10);

  const stages = [
    { idx: 0, delay: 0,    progress: '10%',  label: 'Initializing ExecuTorch Runtime...' },
    { idx: 1, delay: 600,  progress: '30%',  label: 'Loading INT8 Vision Transformer on Hexagon NPU...' },
    { idx: 2, delay: 1400, progress: '55%',  label: 'Extracting tables & key-value pairs... (240ms)' },
    { idx: 3, delay: 2200, progress: '80%',  label: 'Structuring JSON payload on-device...' },
    { idx: 4, delay: 3000, progress: '95%',  label: 'Connecting to Secure Triton Server...' },
  ];

  stages.forEach(stage => {
    setTimeout(() => {
      // Mark previous as done
      for (let i = 0; i < stage.idx; i++) {
        if (rows[i]) {
          rows[i].className = 'telemetry-row done';
          const icon = rows[i].querySelector('.telemetry-icon i');
          if (icon) icon.className = 'fa-solid fa-check';
        }
      }
      // Mark current as active
      if (rows[stage.idx]) {
        rows[stage.idx].className = 'telemetry-row active';
        const icon = rows[stage.idx].querySelector('.telemetry-icon i');
        if (icon) icon.className = 'fa-solid fa-spinner fa-spin';
      }
      if (progressBar) progressBar.style.width = stage.progress;

      // Update badge for cloud stage
      if (stage.idx === 4 && badgeTop) {
        badgeTop.innerHTML = '<span>☁️ Connecting to Secure Triton Server...</span><span class="edge-timer-chip" id="edgeTimerChip">' + elapsed + 'ms</span>';
      }
    }, stage.delay);
  });

  // Complete after all stages — call backend API during "Triton Server" stage
  setTimeout(() => {
    clearInterval(timerInterval);

    // Mark all done
    rows.forEach(r => {
      if (r) {
        r.className = 'telemetry-row done';
        const icon = r.querySelector('.telemetry-icon i');
        if (icon) icon.className = 'fa-solid fa-check';
      }
    });
    if (progressBar) progressBar.style.width = '100%';
    if (laser) laser.style.display = 'none';

    // --- Skip the audit API call if this was an uploaded document ---
    // The upload endpoint already ran analysis; don't overwrite with preset data
    if (currentInvoice.isUploadedDoc) {
      // Already populated by handleFileUpload, just switch to results
      setTimeout(() => {
        populateResultsScreen();
        switchMobileTab('mobTabResults');
      }, 600);
      return;
    }

    // --- Call the FastAPI backend (preset demo flow only) ---
    const inv = currentInvoice;
    const requestBody = {
      device_id: 'iQOO_15_edge',
      auth_token: 'bearer_edge_demo',
      request_type: 'audit_and_cfo_analysis',
      extracted_data: {
        document_type: inv.docType || 'tax_invoice',
        vendor_name: inv.vendor,
        invoice_date: inv.dateRaw || '2026-08-22',
        line_items_total: inv.subtotalNum,
        tax_amount: inv.taxNum,
        gross_total: inv.totalNum
      }
    };

    fetch(`${API_BASE_URL}/api/v1/audit-and-cfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    .then(res => {
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      return res.json();
    })
    .then(data => {
      // Merge real backend data into currentInvoice for display
      if (data.audit_results) {
        currentInvoice.riskScore = data.audit_results.risk_score;
        currentInvoice.riskLevel = data.audit_results.risk_level;
        currentInvoice.xaiReason = data.audit_results.explainable_ai_reason;
        currentInvoice.riskTag = data.audit_results.risk_level === 'HIGH' ? '' : 'low';
        if (data.audit_results.risk_level === 'MEDIUM') currentInvoice.riskTag = 'med';
      }
      if (data.cfo_assistant) {
        currentInvoice.newRunway = data.cfo_assistant.updated_runway_months;
        currentInvoice.runwayImpact = `This $${inv.totalNum.toLocaleString()} invoice updates cash runway to <strong>${data.cfo_assistant.updated_runway_months} months</strong>.`;
        if (data.cfo_assistant.action_steps && data.cfo_assistant.action_steps.length >= 3) {
          currentInvoice.cfoSteps = data.cfo_assistant.action_steps;
        }
      }
      showToast('⚡ NPU extraction + Cloud AI verified! Rendering live results...', 'success');
    })
    .catch(err => {
      console.warn('Backend API unreachable, using preset data:', err.message);
      showToast('⚡ NPU extraction complete! (Offline mode — using preset data)', 'success');
    })
    .finally(() => {
      // Always populate results and switch tab, whether API succeeded or not
      setTimeout(() => {
        populateResultsScreen();
        switchMobileTab('mobTabResults');
      }, 600);
    });
  }, 3800);
}

/**
 * Populate the verification results screen with current invoice data
 */
function populateResultsScreen() {
  const inv = currentInvoice;

  // Extracted data table
  const resDocType = document.getElementById('resDocType');
  const resVendor = document.getElementById('resVendor');
  const resDate = document.getElementById('resDate');
  const resSubtotal = document.getElementById('resSubtotal');
  const resTax = document.getElementById('resTax');
  const resTotal = document.getElementById('resTotal');
  const resLatency = document.getElementById('resLatency');

  if (resDocType) resDocType.textContent = inv.docType;
  if (resVendor) resVendor.textContent = inv.vendor;
  if (resDate) {
    resDate.innerHTML = inv.dateAnomaly
      ? `<span class="highlight-anomaly">${inv.date} (Sun)</span>`
      : inv.date;
  }
  if (resSubtotal) resSubtotal.textContent = inv.lineItem;
  if (resTax) resTax.textContent = inv.tax;
  if (resTotal) resTotal.textContent = inv.total;
  if (resLatency) resLatency.textContent = '240ms (NPU)';

  // Risk score card
  const riskCard = document.getElementById('riskScoreCard');
  const riskScoreVal = document.getElementById('riskScoreVal');
  const riskLevelTag = document.getElementById('riskLevelTag');
  const xaiReasonText = document.getElementById('xaiReasonText');

  if (riskScoreVal) riskScoreVal.textContent = inv.riskScore;
  if (riskLevelTag) {
    riskLevelTag.textContent = inv.riskLevel + ' RISK';
    riskLevelTag.className = 'risk-level-tag' + (inv.riskTag ? ' ' + inv.riskTag : '');
  }
  if (riskCard) {
    riskCard.className = 'risk-score-card' + (inv.riskTag ? ' risk-' + inv.riskTag : '');
  }
  if (xaiReasonText) xaiReasonText.innerHTML = inv.xaiReason;

  // JET flags
  const flagsContainer = document.querySelector('.jet-flags-list');
  if (flagsContainer) {
    if (inv.jetFlags.length > 0) {
      flagsContainer.innerHTML = inv.jetFlags.map(f => `<span class="jet-flag-pill">${f}</span>`).join('');
    } else {
      flagsContainer.innerHTML = '<span style="color: var(--emerald); font-size: 0.72rem; font-family: var(--font-mono);"><i class="fa-solid fa-check"></i> No JET flags triggered</span>';
    }
  }

  // Hide XAI body initially
  const xaiBody = document.getElementById('xaiContentBody');
  if (xaiBody) xaiBody.style.display = 'none';

  // Smart Analysis (only for uploaded docs)
  populateSmartAnalysis();

  // CFO strategy screen
  populateCfoScreen();
}

/**
 * Populate the Smart Analysis section with document content, refunds, and salary data
 */
function populateSmartAnalysis() {
  const inv = currentInvoice;
  const section = document.getElementById('smartAnalysisSection');
  const summaryEl = document.getElementById('contentSummaryText');
  const rawPreviewEl = document.getElementById('rawTextPreview');
  const entriesCard = document.getElementById('allEntriesCard');
  const entriesBody = document.getElementById('allEntriesBody');
  const entriesBadge = document.getElementById('entriesCountBadge');
  const tableStatsBar = document.getElementById('tableStatsBar');
  const refundsCard = document.getElementById('pendingRefundsCard');
  const refundsList = document.getElementById('pendingRefundsList');
  const refundBadge = document.getElementById('refundCountBadge');
  const salariesCard = document.getElementById('unpaidSalariesCard');
  const salariesList = document.getElementById('unpaidSalariesList');
  const salaryBadge = document.getElementById('salaryCountBadge');
  const allClear = document.getElementById('allClearMessage');

  if (!section) return;

  // Only show for uploaded documents
  if (!inv.isUploadedDoc) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Content Summary
  if (summaryEl) summaryEl.textContent = inv.contentSummary || 'Document scanned successfully.';
  if (rawPreviewEl) rawPreviewEl.textContent = inv.rawTextPreview || '(No raw text available)';

  // --- Full Data Table ---
  const entries = inv.allEntries || [];
  if (entries.length > 0 && entriesCard && entriesBody) {
    entriesCard.style.display = 'block';
    if (entriesBadge) entriesBadge.textContent = entries.length + ' entries';

    const fmtAmt = (v) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—';

    const statusClass = (s) => {
      const sl = s.toLowerCase();
      if (sl === 'paid' || sl === 'received' || sl === 'credited') return 'paid';
      if (sl === 'pending' || sl === 'not received') return 'pending';
      if (sl === 'overdue' || sl === 'delayed') return 'overdue';
      if (sl === 'failed') return 'failed';
      if (sl === 'on hold') return 'hold';
      return 'unknown';
    };

    entriesBody.innerHTML = entries.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(e.name)}</td>
        <td>${fmtAmt(e.amount)}</td>
        <td><span class="status-pill ${statusClass(e.status)}">${escapeHtml(e.status)}</span></td>
      </tr>
    `).join('');

    // Table stats
    if (tableStatsBar) {
      const paid = entries.filter(e => e.status === 'PAID').length;
      const pending = entries.filter(e => ['PENDING', 'NOT RECEIVED'].includes(e.status)).length;
      const overdue = entries.filter(e => ['OVERDUE', 'FAILED'].includes(e.status)).length;
      const other = entries.length - paid - pending - overdue;
      const totalAmt = entries.reduce((s, e) => s + (e.amount || 0), 0);

      tableStatsBar.innerHTML = `
        <span class="table-stat"><span class="table-stat-dot paid"></span> ${paid} Paid</span>
        <span class="table-stat"><span class="table-stat-dot pending"></span> ${pending} Pending</span>
        <span class="table-stat"><span class="table-stat-dot overdue"></span> ${overdue} Overdue</span>
        ${other > 0 ? `<span class="table-stat">${other} Other</span>` : ''}
        <span class="table-stat" style="margin-left:auto; font-weight:600; color:var(--text-primary);">Total: ₹${totalAmt.toLocaleString('en-IN')}</span>
      `;
    }
  } else if (entriesCard) {
    entriesCard.style.display = 'none';
  }

  // --- Pending Refunds ---
  const refunds = inv.pendingRefunds || [];
  if (refunds.length > 0 && refundsCard && refundsList) {
    refundsCard.style.display = 'block';
    if (refundBadge) refundBadge.textContent = refunds.length + ' found';

    const fmtAmt = (v) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—';
    refundsList.innerHTML = refunds.map(r => `
      <div class="analysis-item">
        <div class="analysis-item-icon danger"><i class="fa-solid fa-rotate-left"></i></div>
        <div class="analysis-item-details">
          <div class="analysis-item-name">${escapeHtml(r.name)}
            <span class="analysis-status-pill danger">${escapeHtml(r.status)}</span>
          </div>
          <div class="analysis-item-meta">${escapeHtml(r.line_ref || '')}</div>
        </div>
        <div class="analysis-item-amount danger">${fmtAmt(r.amount)}</div>
      </div>
    `).join('');
  } else if (refundsCard) {
    refundsCard.style.display = 'none';
  }

  // --- Unpaid Salaries ---
  const salaries = inv.unpaidSalaries || [];
  if (salaries.length > 0 && salariesCard && salariesList) {
    salariesCard.style.display = 'block';
    if (salaryBadge) salaryBadge.textContent = salaries.length + ' found';

    const fmtAmt = (v) => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—';
    salariesList.innerHTML = salaries.map(s => `
      <div class="analysis-item">
        <div class="analysis-item-icon warning"><i class="fa-solid fa-user-clock"></i></div>
        <div class="analysis-item-details">
          <div class="analysis-item-name">${escapeHtml(s.name)}
            <span class="analysis-status-pill warning">${escapeHtml(s.status)}</span>
          </div>
          <div class="analysis-item-meta">${escapeHtml(s.line_ref || '')}</div>
        </div>
        <div class="analysis-item-amount warning">${fmtAmt(s.amount)}</div>
      </div>
    `).join('');
  } else if (salariesCard) {
    salariesCard.style.display = 'none';
  }

  // All clear message
  if (allClear) {
    allClear.style.display = (refunds.length === 0 && salaries.length === 0 && entries.length === 0) ? 'block' : 'none';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Populate the AI CFO Strategy screen
 */
function populateCfoScreen() {
  const inv = currentInvoice;

  const impactAlert = document.getElementById('runwayImpactAlert');
  if (impactAlert) {
    impactAlert.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i><span><strong>Warning:</strong> ${inv.runwayImpact}</span>`;
  }

  const step1 = document.getElementById('cfoStep1');
  const step2 = document.getElementById('cfoStep2');
  const step3 = document.getElementById('cfoStep3');
  if (step1 && inv.cfoSteps[0]) step1.innerHTML = inv.cfoSteps[0];
  if (step2 && inv.cfoSteps[1]) step2.innerHTML = inv.cfoSteps[1];
  if (step3 && inv.cfoSteps[2]) step3.innerHTML = inv.cfoSteps[2];
}

/**
 * Toggle XAI Accordion
 */
function toggleXaiAccordion() {
  const body = document.getElementById('xaiContentBody');
  const chevron = document.getElementById('xaiChevron');
  if (!body) return;

  if (body.style.display === 'none') {
    body.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    body.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
}

/**
 * Net-60 Email Modal
 */
function openNet60EmailModal() {
  const modal = document.getElementById('net60EmailModal');
  if (modal) modal.classList.add('active');
}

function closeNet60EmailModal() {
  const modal = document.getElementById('net60EmailModal');
  if (modal) modal.classList.remove('active');
}

function sendNet60Email() {
  closeNet60EmailModal();
  showToast('📧 Net-60 payment terms email sent to accounts@acmesoftware.com!', 'success');
}

/**
 * Flag as High Risk to Board
 */
function flagHighRiskToBoard() {
  showToast('🚩 Invoice flagged as HIGH RISK to Board of Directors. SOX exception logged with SHA-256 hash.', 'warning');
}

/**
 * Simulate Runway Recovery
 */
function simulateRunwayRecovery() {
  const inv = currentInvoice;

  // Animate the runway gauge from current impacted value back up
  const gaugeVal = document.getElementById('gaugeMonthsVal');
  const gaugeBadge = document.getElementById('runwayBadge');
  const gaugeArc = document.getElementById('gaugeValueArc');

  // Show recovery toast
  showToast('📊 Simulating cash flow recovery with Net-60 terms + AR acceleration...', 'info');

  setTimeout(() => {
    const recoveredRunway = Math.min(inv.newRunway + 1.2, 4.2);

    if (gaugeVal) gaugeVal.textContent = recoveredRunway.toFixed(1);

    // Update gauge arc (percentage of 12 months max)
    const percent = recoveredRunway / 12;
    const arcLength = 283;
    const offset = arcLength * (1 - percent);
    if (gaugeArc) gaugeArc.setAttribute('stroke-dashoffset', offset);

    if (gaugeBadge) {
      if (recoveredRunway >= 3) {
        gaugeBadge.className = 'gauge-badge';
        gaugeBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Recovered';
      } else {
        gaugeBadge.className = 'gauge-badge warning';
        gaugeBadge.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Caution';
      }
    }

    showToast(`✅ Runway recovered to ${recoveredRunway.toFixed(1)} months with Net-60 + 2% AR discount strategy!`, 'success');

    // Switch back to dashboard to show the updated gauge
    setTimeout(() => switchMobileTab('mobTabHome'), 1000);
  }, 1200);
}

/**
 * Data Contracts Inspector - Tab Switching
 */
function switchContractTab(tab) {
  const reqPanel = document.getElementById('contractRequest');
  const resPanel = document.getElementById('contractResponse');
  const reqTab = document.getElementById('contractTabReq');
  const resTab = document.getElementById('contractTabRes');

  if (tab === 'request') {
    if (reqPanel) reqPanel.style.display = 'block';
    if (resPanel) resPanel.style.display = 'none';
    if (reqTab) reqTab.classList.add('active');
    if (resTab) resTab.classList.remove('active');
  } else {
    if (reqPanel) reqPanel.style.display = 'none';
    if (resPanel) resPanel.style.display = 'block';
    if (reqTab) reqTab.classList.remove('active');
    if (resTab) resTab.classList.add('active');
  }
}

/**
 * Copy contract JSON to clipboard
 */
function copyContractJson() {
  const reqPanel = document.getElementById('contractRequest');
  const isReqVisible = reqPanel && reqPanel.style.display !== 'none';

  const targetPre = isReqVisible
    ? document.querySelector('#contractRequest pre')
    : document.querySelector('#contractResponse pre');

  if (targetPre) {
    const text = targetPre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 JSON payload copied to clipboard!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('📋 JSON payload copied to clipboard!', 'success');
    });
  }
}

