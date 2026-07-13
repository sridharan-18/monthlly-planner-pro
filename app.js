document.addEventListener('DOMContentLoaded', () => {
  // State
  let income = parseFloat(localStorage.getItem('budget_income')) || 0;
  let expenses = JSON.parse(localStorage.getItem('budget_expenses')) || [];
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
  const exportPdfBtn = document.getElementById('export-pdf');

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
    
    updateUI();
  }

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

    if (expenses.length === 0) {
      expensesTable.classList.add('hidden');
      emptyState.classList.remove('hidden');
    } else {
      expensesTable.classList.remove('hidden');
      emptyState.classList.add('hidden');

      // Sort by date descending
      const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

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

  // Run on load
  init();
});
