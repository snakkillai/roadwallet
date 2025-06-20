// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5nefHsU7qs_23_FphChnPT3HJCkvW11U",
    authDomain: "roadwallet-c9ea8.firebaseapp.com",
    databaseURL: "https://roadwallet-c9ea8-default-rtdb.firebaseio.com",
    projectId: "roadwallet-c9ea8",
    storageBucket: "roadwallet-c9ea8.firebasestorage.app",
    messagingSenderId: "444889299595",
    appId: "1:444889299595:web:17e937014fca19d8af728e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global variables
let travelers = {};
let expenses = {};
let balances = {};

// PWA Variables
let deferredPrompt;
let isInstalled = false;

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const totalExpensesAmount = document.getElementById('total-expenses-amount');
const openModalButton = document.getElementById('open-modal-button');
const settlementButton = document.getElementById('settlement-button');
const travelersModal = document.getElementById('travelers-modal');
const settlementModal = document.getElementById('settlement-modal');
const closeButton = document.querySelector('.close-button');
const settlementCloseButton = document.querySelector('.settlement-close');
const travelersForm = document.getElementById('travelers-form');
const travelerNameInput = document.getElementById('traveler-name');
const travelersList = document.getElementById('travelers-list');
const expenseForm = document.getElementById('expense-form');
const expenseDescriptionInput = document.getElementById('expense-description');
const expenseCategorySelect = document.getElementById('expense-category');
const expenseAmountInput = document.getElementById('expense-amount');
const paidBySelect = document.getElementById('paid-by');
const expenseList = document.getElementById('expense-list');
const settlementContent = document.getElementById('settlement-content');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializePWA();
    handleShortcuts(); // Handle PWA shortcuts
});

// ===== PWA FUNCTIONALITY =====

function initializePWA() {
    console.log('🚀 Initializing PWA...');
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 New service worker available');
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showMessage('New version available! Refresh to update.', 'success');
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    }
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('✅ beforeinstallprompt fired');
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
        console.log('✅ App installed');
        isInstalled = true;
        hideInstallButton();
        showMessage('RoadWallet installed successfully! 📱', 'success');
    });
    
    // Check if already running as PWA
    if (isRunningAsPWA()) {
        console.log('✅ Already running as PWA');
        isInstalled = true;
    }
}

function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

function showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('install-btn') && !isInstalled) {
        const installBtn = document.createElement('button');
        installBtn.id = 'install-btn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
        installBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.8em;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
            transition: all 0.3s ease;
        `;
        installBtn.addEventListener('click', installApp);
        installBtn.addEventListener('mouseover', () => {
            installBtn.style.transform = 'translateY(-1px)';
            installBtn.style.boxShadow = '0 6px 16px rgba(72, 187, 120, 0.4)';
        });
        installBtn.addEventListener('mouseout', () => {
            installBtn.style.transform = 'translateY(0)';
            installBtn.style.boxShadow = '0 4px 12px rgba(72, 187, 120, 0.3)';
        });
        document.body.appendChild(installBtn);
    }
}

function hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.remove();
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted install');
            } else {
                console.log('❌ User dismissed install');
            }
            deferredPrompt = null;
            hideInstallButton();
        });
    } else {
        // Fallback instructions for manual installation
        const instructions = getManualInstallInstructions();
        showMessage(instructions, 'info');
    }
}

function getManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
        return 'To install: Tap Share button → Add to Home Screen';
    } else if (isAndroid) {
        return 'To install: Tap menu (⋮) → Install app';
    } else {
        return 'Look for install icon in browser address bar';
    }
}

// Handle PWA shortcuts
function handleShortcuts() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'add-expense') {
        // Focus on expense form
        setTimeout(() => {
            expenseDescriptionInput.focus();
        }, 500);
    } else if (action === 'manage-travelers') {
        // Open travelers modal
        setTimeout(() => {
            openTravelersModal();
        }, 500);
    }
}

// ===== MODAL FUNCTIONS =====

// Travelers Modal Functions
function openTravelersModal() {
    travelersModal.style.display = 'block';
    travelerNameInput.focus();
}

function closeTravelersModal() {
    travelersModal.style.display = 'none';
    travelersForm.reset();
}

// Settlement Modal Functions
function openSettlementModal() {
    updateSettlementModalContent();
    settlementModal.style.display = 'block';
}

function closeSettlementModal() {
    settlementModal.style.display = 'none';
}

function updateSettlementModalContent() {
    const travelerIds = Object.keys(travelers);
    
    if (travelerIds.length === 0) {
        settlementContent.innerHTML = `
            <div class="settlement-no-travelers">
                <i class="fas fa-users" style="font-size: 2em; margin-bottom: 10px; display: block; color: #a0aec0;"></i>
                <p>Add travelers to see settlement suggestions</p>
                <button onclick="closeSettlementModal(); openTravelersModal();" style="margin-top: 10px; background: linear-gradient(135deg, #e53e3e, #c53030);">
                    <i class="fas fa-users"></i> Add Travelers
                </button>
            </div>
        `;
        return;
    }
    
    const settlements = calculateSettlements();
    
    if (settlements.length === 0) {
        settlementContent.innerHTML = `
            <div class="settlement-all-even">
                <i class="fas fa-check-circle"></i>
                <div style="margin-top: 8px;">All settled up!</div>
                <div style="font-size: 0.9em; margin-top: 4px; opacity: 0.8;">Everyone is even. No payments needed!</div>
            </div>
        `;
        return;
    }
    
    // Show individual balances first
    let balanceHTML = '<div style="margin-bottom: 15px;"><h3 style="font-size: 0.9em; color: #4a5568; margin-bottom: 8px;">Individual Balances:</h3>';
    
    travelerIds.forEach(travelerId => {
        const traveler = travelers[travelerId];
        const balance = balances[travelerId] || 0;
        
        let balanceClass = 'even';
        let balanceText = 'Even';
        let balanceIcon = 'fas fa-check-circle';
        
        if (balance > 0.01) {
            balanceClass = 'owed';
            balanceText = `Owed $${balance.toFixed(2)}`;
            balanceIcon = 'fas fa-arrow-down';
        } else if (balance < -0.01) {
            balanceClass = 'owes';
            balanceText = `Owes $${Math.abs(balance).toFixed(2)}`;
            balanceIcon = 'fas fa-arrow-up';
        }
        
        balanceHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; margin-bottom: 4px; background: rgba(255,255,255,0.5); border-radius: 6px;">
                <span style="font-weight: 500;">${traveler.name}</span>
                <span class="traveler-balance ${balanceClass}" style="display: flex; align-items: center; gap: 4px;">
                    <i class="${balanceIcon}" style="font-size: 0.7em;"></i>
                    ${balanceText}
                </span>
            </div>
        `;
    });
    balanceHTML += '</div>';
    
    // Show settlement plan
    let settlementHTML = '<h3 style="font-size: 0.9em; color: #4a5568; margin-bottom: 8px;">Settlement Plan:</h3>';
    
    settlementHTML += settlements.map(settlement => {
        const fromName = travelers[settlement.from]?.name || 'Unknown';
        const toName = travelers[settlement.to]?.name || 'Unknown';
        
        return `
            <div class="settlement-item">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="settlement-from">${fromName}</span>
                        <span class="settlement-arrow">→</span>
                        <span class="settlement-to">${toName}</span>
                    </div>
                    <span class="settlement-amount">$${settlement.amount.toFixed(2)}</span>
                </div>
                <div class="settlement-description">
                    <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                    ${fromName} pays ${toName} $${settlement.amount.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
    
    settlementContent.innerHTML = balanceHTML + settlementHTML;
}

// ===== EXISTING ROADWALLET FUNCTIONALITY =====

// Show/Hide Loading
function showLoading() {
    loadingOverlay.classList.add('show');
}

function hideLoading() {
    loadingOverlay.classList.remove('show');
}

// Show Message
function showMessage(text, type = 'success') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const container = document.querySelector('.container');
    container.insertBefore(message, container.children[2]);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
}

// Initialize App
function initializeApp() {
    showLoading();
    
    // Listen for travelers data
    database.ref('travelers').on('value', (snapshot) => {
        travelers = snapshot.val() || {};
        updateTravelersUI();
        updatePaidBySelect();
        calculateBalances();
    });
    
    // Listen for expenses data
    database.ref('expenses').on('value', (snapshot) => {
        expenses = snapshot.val() || {};
        updateExpensesUI();
        updateTotalExpenses();
        calculateBalances();
        hideLoading();
    });
}

// Add Traveler
function addTraveler(event) {
    event.preventDefault();
    
    const name = travelerNameInput.value.trim();
    if (!name) {
        showMessage('Please enter a traveler name', 'error');
        return;
    }
    
    if (Object.values(travelers).some(traveler => traveler.name.toLowerCase() === name.toLowerCase())) {
        showMessage('Traveler already exists', 'error');
        return;
    }
    
    showLoading();
    const travelerId = database.ref('travelers').push().key;
    
    database.ref(`travelers/${travelerId}`).set({
        name: name,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        travelerNameInput.value = '';
        showMessage(`${name} added successfully!`);
        hideLoading();
    }).catch((error) => {
        console.error('Error adding traveler:', error);
        showMessage('Error adding traveler. Please try again.', 'error');
        hideLoading();
    });
}

// Delete Traveler
function deleteTraveler(travelerId) {
    const travelerName = travelers[travelerId]?.name;
    if (!confirm(`Are you sure you want to delete ${travelerName}? This will also delete all their expenses.`)) {
        return;
    }
    
    showLoading();
    
    // Delete traveler and their expenses
    const updates = {};
    updates[`travelers/${travelerId}`] = null;
    
    // Find and delete expenses paid by this traveler
    Object.keys(expenses).forEach(expenseId => {
        if (expenses[expenseId].paidBy === travelerId) {
            updates[`expenses/${expenseId}`] = null;
        }
    });
    
    database.ref().update(updates).then(() => {
        showMessage(`${travelerName} deleted successfully!`);
        hideLoading();
    }).catch((error) => {
        console.error('Error deleting traveler:', error);
        showMessage('Error deleting traveler. Please try again.', 'error');
        hideLoading();
    });
}

// Add Expense
function addExpense(event) {
    event.preventDefault();
    
    const description = expenseDescriptionInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategorySelect.value;
    const paidBy = paidBySelect.value;
    
    if (!description || !amount || !category || !paidBy) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (amount <= 0) {
        showMessage('Amount must be greater than 0', 'error');
        return;
    }
    
    showLoading();
    const expenseId = database.ref('expenses').push().key;
    
    database.ref(`expenses/${expenseId}`).set({
        description: description,
        amount: amount,
        category: category,
        paidBy: paidBy,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        expenseForm.reset();
        showMessage('Expense added successfully!');
        hideLoading();
    }).catch((error) => {
        console.error('Error adding expense:', error);
        showMessage('Error adding expense. Please try again.', 'error');
        hideLoading();
    });
}

// Delete Expense
function deleteExpense(expenseId) {
    const expense = expenses[expenseId];
    if (!confirm(`Are you sure you want to delete "${expense.description}"?`)) {
        return;
    }
    
    showLoading();
    database.ref(`expenses/${expenseId}`).remove().then(() => {
        showMessage('Expense deleted successfully!');
        hideLoading();
    }).catch((error) => {
        console.error('Error deleting expense:', error);
        showMessage('Error deleting expense. Please try again.', 'error');
        hideLoading();
    });
}

// Update Travelers UI
function updateTravelersUI() {
    const travelerIds = Object.keys(travelers);
    
    if (travelerIds.length === 0) {
        travelersList.innerHTML = '<div class="empty-state"><h3>No travelers added yet</h3><p>Add travelers to start splitting expenses</p></div>';
        return;
    }
    
    travelersList.innerHTML = travelerIds.map(travelerId => {
        const traveler = travelers[travelerId];
        const balance = balances[travelerId] || 0;
        
        let balanceClass = 'even';
        let balanceText = 'Even';
        
        if (balance > 0.01) {
            balanceClass = 'owed';
            balanceText = `Owed $${balance.toFixed(2)}`;
        } else if (balance < -0.01) {
            balanceClass = 'owes';
            balanceText = `Owes $${Math.abs(balance).toFixed(2)}`;
        }
        
        return `
            <div class="traveler-item">
                <div class="traveler-info">
                    <div class="traveler-name">${traveler.name}</div>
                    <div class="traveler-balance ${balanceClass}">${balanceText}</div>
                </div>
                <button class="delete-traveler" data-traveler-id="${travelerId}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }).join('');
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-traveler').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const travelerId = this.getAttribute('data-traveler-id');
            deleteTraveler(travelerId);
        });
    });
}

// Update Paid By Select
function updatePaidBySelect() {
    const travelerIds = Object.keys(travelers);
    
    paidBySelect.innerHTML = '<option value="">Select who paid</option>' +
        travelerIds.map(travelerId => 
            `<option value="${travelerId}">${travelers[travelerId].name}</option>`
        ).join('');
}

// Update Expenses UI
function updateExpensesUI() {
    const expenseIds = Object.keys(expenses).sort((a, b) => {
        return (expenses[b].dateAdded || 0) - (expenses[a].dateAdded || 0);
    });
    
    if (expenseIds.length === 0) {
        expenseList.innerHTML = '<li class="empty-state"><h3>No expenses recorded yet</h3><p>Add your first expense to get started</p></li>';
        return;
    }
    
    expenseList.innerHTML = expenseIds.map(expenseId => {
        const expense = expenses[expenseId];
        const paidByName = travelers[expense.paidBy]?.name || 'Unknown';
        const date = expense.dateAdded ? new Date(expense.dateAdded).toLocaleDateString() : 'Unknown';
        
        return `
            <li class="expense-item">
                <div class="expense-header">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                </div>
                <div class="expense-details">
                    <div class="expense-meta">
                        <span class="expense-category">${expense.category}</span>
                        <span>Paid by ${paidByName}</span>
                        <span>${date}</span>
                    </div>
                    <button class="delete-expense" data-expense-id="${expenseId}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </li>
        `;
    }).join('');
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-expense').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const expenseId = this.getAttribute('data-expense-id');
            deleteExpense(expenseId);
        });
    });
}

// Update Total Expenses
function updateTotalExpenses() {
    const expenseIds = Object.keys(expenses);
    const total = expenseIds.reduce((sum, expenseId) => sum + expenses[expenseId].amount, 0);
    totalExpensesAmount.textContent = `$${total.toFixed(2)}`;
}

// Calculate Balances
function calculateBalances() {
    const travelerIds = Object.keys(travelers);
    const totalTravelers = travelerIds.length;
    
    if (totalTravelers === 0) {
        balances = {};
        return;
    }
    
    // Initialize balances
    balances = {};
    travelerIds.forEach(id => {
        balances[id] = 0;
    });
    
    // Calculate total expenses and individual contributions
    const expenseIds = Object.keys(expenses);
    const totalExpenses = expenseIds.reduce((sum, expenseId) => sum + expenses[expenseId].amount, 0);
    const perPersonShare = totalExpenses / totalTravelers;
    
    // Calculate what each person paid
    const paidAmounts = {};
    travelerIds.forEach(id => {
        paidAmounts[id] = 0;
    });
    
    expenseIds.forEach(expenseId => {
        const expense = expenses[expenseId];
        if (paidAmounts[expense.paidBy] !== undefined) {
            paidAmounts[expense.paidBy] += expense.amount;
        }
    });
    
    // Calculate balances (positive = owed money, negative = owes money)
    travelerIds.forEach(travelerId => {
        balances[travelerId] = paidAmounts[travelerId] - perPersonShare;
    });
}

// Calculate optimal settlements to minimize transactions
function calculateSettlements() {
    const travelerIds = Object.keys(travelers);
    
    if (travelerIds.length === 0) {
        return [];
    }
    
    // Create arrays for creditors (people owed money) and debtors (people who owe money)
    const creditors = [];
    const debtors = [];
    
    travelerIds.forEach(travelerId => {
        const balance = balances[travelerId] || 0;
        if (balance > 0.01) {
            creditors.push({ id: travelerId, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ id: travelerId, amount: Math.abs(balance) });
        }
    });
    
    // Calculate minimal settlements using greedy algorithm
    const settlements = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        
        const settlementAmount = Math.min(creditor.amount, debtor.amount);
        
        if (settlementAmount > 0.01) {
            settlements.push({
                from: debtor.id,
                to: creditor.id,
                amount: settlementAmount
            });
        }
        
        creditor.amount -= settlementAmount;
        debtor.amount -= settlementAmount;
        
        if (creditor.amount <= 0.01) {
            creditorIndex++;
        }
        if (debtor.amount <= 0.01) {
            debtorIndex++;
        }
    }
    
    return settlements;
}

// Event Listeners
openModalButton.addEventListener('click', openTravelersModal);
settlementButton.addEventListener('click', openSettlementModal);
closeButton.addEventListener('click', closeTravelersModal);
settlementCloseButton.addEventListener('click', closeSettlementModal);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === travelersModal) {
        closeTravelersModal();
    }
    if (event.target === settlementModal) {
        closeSettlementModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (travelersModal.style.display === 'block') {
            closeTravelersModal();
        }
        if (settlementModal.style.display === 'block') {
            closeSettlementModal();
        }
    }
});

travelersForm.addEventListener('submit', addTraveler);
expenseForm.addEventListener('submit', addExpense);

// Handle connection state
database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) {
        console.log('Disconnected from Firebase');
        showMessage('Connection lost. Trying to reconnect...', 'error');
    } else {
        console.log('Connected to Firebase');
    }
});

// Error handling for Firebase
database.ref().on('error', (error) => {
    console.error('Firebase error:', error);
    hideLoading();
    showMessage('Connection error. Please check your internet connection and try again.', 'error');
});