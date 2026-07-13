document.addEventListener('DOMContentLoaded', () => {
  // State
  let income = parseFloat(localStorage.getItem('budget_income')) || 0;
  let expenses = JSON.parse(localStorage.getItem('budget_expenses')) || [];
  let categoryBudgets = JSON.parse(localStorage.getItem('category_budgets')) || {};
  let currency = localStorage.getItem('currency') || 'USD';
  let expenseChart = null;

  // DOM Elements
  const incomeForm = document.getElementById('income-form');
  const incomeInput = document.getElementById('monthly-income');
  const expenseForm = document.getElementById('expense-form');
  const expenseIdInput = document.getElementById('expense-id');
  const amountInput = document.getElementById('amount');
  const categorySelect = document.getElementById('category');
  const notesInput = document.getElementById('notes');
  const dateInput = document.getElementById('date');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const expenseFormTitle = document.getElementById('expense-form-title');
  const submitExpenseBtn = document.getElementById('submit-expense');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const saveDataBtn = document.getElementById('save-data');
  const exportJsonBtn = document.getElementById('export-json');
  const importJsonBtn = document.getElementById('import-json');
  const exportPdfBtn = document.getElementById('export-pdf');
  const currencySelect = document.getElementById('currency-select');
  const categoryBudgetsContainer = document.getElementById('category-budgets-container');
  const addCategoryBudgetBtn = document.getElementById('add-category-budget');
  const filterCategory = document.getElementById('filter-category');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  const clearFiltersBtn = document.getElementById('clear-filters');

  // Summary Elements
  const dispIncome = document.getElementById('disp-income');
  const dispExpenses = document.getElementById('disp-expenses');
  const dispBalance = document.getElementById('disp-balance');
  const budgetProgress = document.getElementById('budget-progress');
  const progressLabel = document.getElementById('progress-label');
  const progressStatus = document.getElementById('progress-status');

  // List Elements
  const expensesTbody = document.getElementById('expenses-tbody');
  const emptyState = document.getElementById('empty-state');
  const expensesTable = document.querySelector('.expenses-table');

  // Initialization
  function init() {
    // Set default date to today
    dateInput.valueAsDate = new Date();
    if (income > 0) incomeInput.value = income;

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    
    // Initialize Currency
    currencySelect.value = currency;
    
    updateUI();
    renderCategoryBudgets();
  }

  // Format Currency
  const formatCurrency = (amount) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': '$',
      'AUD': '$'
    };
    
    const symbol = currencySymbols[currency] || '$';
    const locales = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'INR': 'en-IN',
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
      'AUD': 'en-AU'
    };
    
    return new Intl.NumberFormat(locales[currency] || 'en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Theme Applier
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️';
    } else {
      document.body.removeAttribute('data-theme');
      themeToggleBtn.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
    // Re-render chart to update colors if initialized
    if (expenses.length > 0 && expenseChart) {
      updateChart();
    }
  }

  // Theme Toggle Event
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  // Export to PDF
  exportPdfBtn.addEventListener('click', () => {
    window.print();
  });

  // Save Data
  saveDataBtn.addEventListener('click', () => {
    localStorage.setItem('budget_income', income);
    localStorage.setItem('budget_expenses', JSON.stringify(expenses));
    localStorage.setItem('category_budgets', JSON.stringify(categoryBudgets));
    localStorage.setItem('currency', currency);
    
    // Show save confirmation
    const originalText = saveDataBtn.textContent;
    saveDataBtn.textContent = '✓ Saved!';
    saveDataBtn.style.background = 'var(--success-color)';
    saveDataBtn.style.color = '#fff';
    
    setTimeout(() => {
      saveDataBtn.textContent = originalText;
      saveDataBtn.style.background = '';
      saveDataBtn.style.color = '';
    }, 2000);
  });

  // Export JSON
  exportJsonBtn.addEventListener('click', () => {
    const data = {
      income,
      expenses,
      categoryBudgets,
      currency,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  importJsonBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          if (data.income !== undefined) income = data.income;
          if (data.expenses) expenses = data.expenses;
          if (data.categoryBudgets) categoryBudgets = data.categoryBudgets;
          if (data.currency) currency = data.currency;
          
          currencySelect.value = currency;
          incomeInput.value = income;
          
          updateUI();
          renderCategoryBudgets();
          
          // Show import confirmation
          const originalText = importJsonBtn.textContent;
          importJsonBtn.textContent = '✓ Imported!';
          importJsonBtn.style.background = 'var(--success-color)';
          importJsonBtn.style.color = '#fff';
          
          setTimeout(() => {
            importJsonBtn.textContent = originalText;
            importJsonBtn.style.background = '';
            importJsonBtn.style.color = '';
          }, 2000);
          
        } catch (error) {
          alert('Error importing file. Please make sure it\'s a valid JSON file.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });

  // Currency Change
  currencySelect.addEventListener('change', (e) => {
    currency = e.target.value;
    localStorage.setItem('currency', currency);
    updateUI();
    updateChart();
  });

  // Update Summary and Progress
  function updateSummary() {
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = income - totalExpenses;

    dispIncome.textContent = formatCurrency(income);
    dispExpenses.textContent = formatCurrency(totalExpenses);
    dispBalance.textContent = formatCurrency(balance);

    // Progress Bar Logic
    if (income > 0) {
      const percentage = (totalExpenses / income) * 100;
      budgetProgress.value = percentage;
      progressLabel.textContent = `${percentage.toFixed(1)}% of budget used`;

      if (percentage >= 100) {
        progressStatus.textContent = 'Exceeded';
        progressStatus.className = 'status-danger';
        budgetProgress.classList.add('danger');
      } else if (percentage >= 80) {
        progressStatus.textContent = 'Warning';
        progressStatus.className = 'status-warning';
        budgetProgress.classList.remove('danger');
      } else {
        progressStatus.textContent = 'Safe';
        progressStatus.className = 'status-safe';
        budgetProgress.classList.remove('danger');
      }
    } else {
      budgetProgress.value = 0;
      progressLabel.textContent = '0% of budget used';
      progressStatus.textContent = 'No income set';
      progressStatus.className = 'status-warning';
    }
  }

  // Update Chart.js Doughnut Chart
  function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Group expenses by category
    const categoriesData = {};
    expenses.forEach(exp => {
      categoriesData[exp.category] = (categoriesData[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(categoriesData);
    const data = Object.values(categoriesData);

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const textColors = isDark ? '#f8fafc' : '#0f172a';

    const colors = {
      'Food': '#3b82f6',
      'Travel': '#10b981',
      'Rent': '#f59e0b',
      'Entertainment': '#ec4899',
      'Utilities': '#8b5cf6',
      'Other': '#64748b'
    };

    const backgroundColors = labels.map(label => colors[label] || '#94a3b8');

    if (expenseChart) {
      expenseChart.destroy();
    }

    if (data.length === 0) {
      document.querySelector('.chart-section').classList.add('hidden');
      return;
    } else {
      document.querySelector('.chart-section').classList.remove('hidden');
    }

    expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? '#1e293b' : '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColors,
              font: {
                family: 'Inter',
                weight: '500'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += formatCurrency(context.parsed);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  // Render Expenses Table
  function renderExpenses() {
    expensesTbody.innerHTML = '';

    // Apply filters
    let filteredExpenses = [...expenses];
    
    const categoryFilter = filterCategory.value;
    const dateFrom = filterDateFrom.value;
    const dateTo = filterDateTo.value;
    
    if (categoryFilter !== 'all') {
      filteredExpenses = filteredExpenses.filter(exp => exp.category === categoryFilter);
    }
    
    if (dateFrom) {
      filteredExpenses = filteredExpenses.filter(exp => exp.date >= dateFrom);
    }
    
    if (dateTo) {
      filteredExpenses = filteredExpenses.filter(exp => exp.date <= dateTo);
    }

    if (filteredExpenses.length === 0) {
      expensesTable.classList.add('hidden');
      emptyState.classList.remove('hidden');
      if (expenses.length > 0) {
        emptyState.textContent = 'No expenses match the current filters.';
      } else {
        emptyState.textContent = 'No expenses recorded yet. Add one above!';
      }
    } else {
      expensesTable.classList.remove('hidden');
      emptyState.classList.add('hidden');

      // Sort by date descending
      const sortedExpenses = filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

      sortedExpenses.forEach(expense => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${expense.date}</td>
          <td><span class="category-badge">${expense.category}</span></td>
          <td class="notes-cell">${expense.notes}</td>
          <td class="amount-cell">${formatCurrency(expense.amount)}</td>
          <td class="actions-cell">
            <button class="btn-icon-edit" data-id="${expense.id}">Edit</button>
            <button class="btn-icon-delete" data-id="${expense.id}">Delete</button>
          </td>
        `;
        expensesTbody.appendChild(tr);
      });
    }
  }

  function updateUI() {
    updateSummary();
    renderExpenses();
    updateChart();
    localStorage.setItem('budget_income', income);
    localStorage.setItem('budget_expenses', JSON.stringify(expenses));
    localStorage.setItem('category_budgets', JSON.stringify(categoryBudgets));
    localStorage.setItem('currency', currency);
  }

  // Handle Income Submit
  incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newIncome = parseFloat(incomeInput.value);
    if (!isNaN(newIncome) && newIncome >= 0) {
      income = newIncome;
      updateUI();
    }
  });

  // Handle Expense form submit (Add or Edit)
  expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const notes = notesInput.value.trim();
    const date = dateInput.value;
    const id = expenseIdInput.value;

    if (!amount || !category || !notes || !date) return;

    if (id) {
      // Edit mode
      const index = expenses.findIndex(exp => exp.id === id);
      if (index !== -1) {
        expenses[index] = { id, amount, category, notes, date };
      }
      resetExpenseForm();
    } else {
      // Add mode
      const newExpense = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        amount,
        category,
        notes,
        date
      };
      expenses.push(newExpense);
    }

    updateUI();
    if(!id) {
       // Reset fields but keep date
       amountInput.value = '';
       notesInput.value = '';
       categorySelect.value = '';
    }
  });

  // Handle Edit/Delete clicks via Event Delegation
  expensesTbody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-icon-delete')) {
      const id = e.target.getAttribute('data-id');
      if(confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(exp => exp.id !== id);
        updateUI();
      }
    }

    if (e.target.classList.contains('btn-icon-edit')) {
      const id = e.target.getAttribute('data-id');
      const expense = expenses.find(exp => exp.id === id);
      if (expense) {
        // Populate form
        expenseIdInput.value = expense.id;
        amountInput.value = expense.amount;
        categorySelect.value = expense.category;
        notesInput.value = expense.notes;
        dateInput.value = expense.date;

        // Change UI to edit mode
        expenseFormTitle.textContent = 'Edit Expense';
        submitExpenseBtn.textContent = 'Update Expense';
        cancelEditBtn.classList.remove('hidden');
        
        // Scroll to form
        expenseForm.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Cancel Edit
  cancelEditBtn.addEventListener('click', () => {
    resetExpenseForm();
  });

  function resetExpenseForm() {
    expenseIdInput.value = '';
    amountInput.value = '';
    notesInput.value = '';
    categorySelect.value = '';
    dateInput.valueAsDate = new Date();
    
    expenseFormTitle.textContent = 'Add Expense';
    submitExpenseBtn.textContent = 'Add Expense';
    cancelEditBtn.classList.add('hidden');
  }

  // Filter Event Listeners
  filterCategory.addEventListener('change', renderExpenses);
  filterDateFrom.addEventListener('change', renderExpenses);
  filterDateTo.addEventListener('change', renderExpenses);
  
  clearFiltersBtn.addEventListener('click', () => {
    filterCategory.value = 'all';
    filterDateFrom.value = '';
    filterDateTo.value = '';
    renderExpenses();
  });

  // Category Budgets
  function renderCategoryBudgets() {
    categoryBudgetsContainer.innerHTML = '';
    
    const categories = ['Food', 'Travel', 'Rent', 'Entertainment', 'Utilities', 'Other'];
    
    categories.forEach(category => {
      const budget = categoryBudgets[category] || 0;
      const spent = expenses
        .filter(exp => exp.category === category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const isOverBudget = budget > 0 && spent > budget;
      const isNearLimit = budget > 0 && percentage >= 80 && percentage < 100;
      
      const div = document.createElement('div');
      div.className = 'category-budget-item';
      div.innerHTML = `
        <div class="category-budget-header">
          <span class="category-name">${category}</span>
          <div class="category-budget-actions">
            <button class="btn-icon-edit-budget" data-category="${category}">Edit Budget</button>
            ${budget > 0 ? `<button class="btn-icon-delete-budget" data-category="${category}">Clear</button>` : ''}
          </div>
        </div>
        <div class="category-budget-progress">
          <div class="budget-labels">
            <span>${formatCurrency(spent)} spent</span>
            <span>${budget > 0 ? formatCurrency(budget) + ' budget' : 'No budget set'}</span>
          </div>
          ${budget > 0 ? `
            <div class="budget-progress-bar">
              <div class="budget-progress-fill ${isOverBudget ? 'over-budget' : isNearLimit ? 'near-limit' : ''}" 
                   style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="budget-status ${isOverBudget ? 'status-danger' : isNearLimit ? 'status-warning' : 'status-safe'}">
              ${isOverBudget ? '⚠️ Over budget!' : isNearLimit ? '⚡ Near limit' : '✓ On track'}
            </div>
          ` : '<div class="budget-status status-muted">Set a budget to track spending</div>'}
        </div>
      `;
      
      categoryBudgetsContainer.appendChild(div);
    });
    
    // Add event listeners for budget edit/delete buttons
    document.querySelectorAll('.btn-icon-edit-budget').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        const currentBudget = categoryBudgets[category] || 0;
        const newBudget = prompt(`Set budget for ${category}:`, currentBudget);
        
        if (newBudget !== null) {
          const budgetValue = parseFloat(newBudget);
          if (!isNaN(budgetValue) && budgetValue >= 0) {
            categoryBudgets[category] = budgetValue;
            updateUI();
            renderCategoryBudgets();
          }
        }
      });
    });
    
    document.querySelectorAll('.btn-icon-delete-budget').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        if (confirm(`Clear budget for ${category}?`)) {
          delete categoryBudgets[category];
          updateUI();
          renderCategoryBudgets();
        }
      });
    });
  }

  addCategoryBudgetBtn.addEventListener('click', () => {
    const category = prompt('Enter category name (Food, Travel, Rent, Entertainment, Utilities, Other):');
    if (category && ['Food', 'Travel', 'Rent', 'Entertainment', 'Utilities', 'Other'].includes(category)) {
      const budget = prompt(`Set budget for ${category}:`);
      if (budget !== null) {
        const budgetValue = parseFloat(budget);
        if (!isNaN(budgetValue) && budgetValue >= 0) {
          categoryBudgets[category] = budgetValue;
          updateUI();
          renderCategoryBudgets();
        }
      }
    } else if (category) {
      alert('Please enter a valid category name.');
    }
  });

  // Run on load
  init();
});
