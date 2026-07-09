document.addEventListener('DOMContentLoaded', () => {
  // State
  let income = parseFloat(localStorage.getItem('budget_income')) || 0;
  let expenses = JSON.parse(localStorage.getItem('budget_expenses')) || [];

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
    
    updateUI();
  }

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
      // Optional visual feedback could go here
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
