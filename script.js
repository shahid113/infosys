let questionsData = [];
let solvedQuestionIds = new Set(JSON.parse(localStorage.getItem('infosys_solved_ids')) || []);

// DOM Elements
const tableBody = document.getElementById('question-table-body');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const statusFilter = document.getElementById('status-filter');
const noResults = document.getElementById('no-results');
const resetBtn = document.getElementById('reset-btn');

// Theme Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const darkIcon = document.getElementById('theme-toggle-dark-icon');
const lightIcon = document.getElementById('theme-toggle-light-icon');

// Stats Elements
const solvedCountEl = document.getElementById('solved-count');
const totalCountEl = document.getElementById('total-count');
const progressPercentEl = document.getElementById('progress-percent');
const progressBarEl = document.getElementById('progress-bar');

const easyCountEl = document.getElementById('easy-count');
const easyRatioEl = document.getElementById('easy-ratio');
const easyBarEl = document.getElementById('easy-bar');

const mediumCountEl = document.getElementById('medium-count');
const mediumRatioEl = document.getElementById('medium-ratio');
const mediumBarEl = document.getElementById('medium-bar');

const hardCountEl = document.getElementById('hard-count');
const hardRatioEl = document.getElementById('hard-ratio');
const hardBarEl = document.getElementById('hard-bar');

// Initialize Application
async function init() {
  setupTheme();
  
  try {
    const res = await fetch('./questions.json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    questionsData = await res.json();
    
    populateCategories();
    updateStats();
    renderQuestions();
    
    // Event Listeners
    searchInput.addEventListener('input', renderQuestions);
    categoryFilter.addEventListener('change', renderQuestions);
    difficultyFilter.addEventListener('change', renderQuestions);
    statusFilter.addEventListener('change', renderQuestions);
    resetBtn.addEventListener('click', resetProgress);
    themeToggleBtn.addEventListener('click', toggleTheme);

  } catch (error) {
    console.error('Error fetching questions JSON:', error);
  }
}

// Theme Handling
function setupTheme() {
  const savedTheme = localStorage.getItem('infosys_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    darkIcon.classList.remove('hidden');
    lightIcon.classList.add('hidden');
  }
}

function toggleTheme() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('infosys_theme', 'light');
    darkIcon.classList.remove('hidden');
    lightIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('infosys_theme', 'dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
  }
}

// Populate Category Dropdown
function populateCategories() {
  const categories = [...new Set(questionsData.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// Render Questions Table
function renderQuestions() {
  const query = searchInput.value.toLowerCase().trim();
  const selectedCat = categoryFilter.value;
  const selectedDiff = difficultyFilter.value;
  const selectedStatus = statusFilter.value;

  const filtered = questionsData.filter(q => {
    const isSolved = solvedQuestionIds.has(q.id);
    
    const matchesSearch = q.title.toLowerCase().includes(query) || 
                          q.tags.some(tag => tag.toLowerCase().includes(query)) ||
                          q.category.toLowerCase().includes(query);
                          
    const matchesCategory = selectedCat === 'ALL' || q.category === selectedCat;
    const matchesDifficulty = selectedDiff === 'ALL' || q.difficulty === selectedDiff;
    const matchesStatus = selectedStatus === 'ALL' || 
                          (selectedStatus === 'SOLVED' && isSolved) || 
                          (selectedStatus === 'UNSOLVED' && !isSolved);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    noResults.classList.remove('hidden');
  } else {
    noResults.classList.add('hidden');
    filtered.forEach(q => {
      const isSolved = solvedQuestionIds.has(q.id);
      const row = document.createElement('tr');
      row.className = `hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors ${isSolved ? 'bg-slate-50/60 dark:bg-zinc-900/40' : ''}`;

      row.innerHTML = `
        <td class="py-3 px-3 sm:px-4 text-center">
          <input type="checkbox" ${isSolved ? 'checked' : ''} 
            onchange="toggleSolved(${q.id})"
            class="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-green-500 focus:ring-0 focus:ring-offset-0 bg-slate-100 dark:bg-zinc-950 cursor-pointer">
        </td>
        <td class="py-3 px-3 sm:px-4 font-medium text-slate-800 dark:text-zinc-100">
          <a href="${q.link}" target="_blank" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center space-x-1.5">
            <span>${q.title}</span>
            <svg class="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </td>
        <td class="py-3 px-3 sm:px-4 text-xs text-slate-600 dark:text-zinc-400">
          <span class="px-2 py-1 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60">${q.category}</span>
        </td>
        <td class="py-3 px-3 sm:px-4 text-xs font-semibold">
          <span class="${getDifficultyClass(q.difficulty)}">${q.difficulty}</span>
        </td>
        <td class="py-3 px-3 sm:px-4">
          <div class="flex flex-wrap gap-1">
            ${q.tags.map(tag => `<span class="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">${tag}</span>`).join('')}
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
}

// Toggle Solved State
function toggleSolved(id) {
  if (solvedQuestionIds.has(id)) {
    solvedQuestionIds.delete(id);
  } else {
    solvedQuestionIds.add(id);
  }
  localStorage.setItem('infosys_solved_ids', JSON.stringify([...solvedQuestionIds]));
  updateStats();
  renderQuestions();
}

// Reset Progress
function resetProgress() {
  if (confirm('Are you sure you want to reset all solved progress?')) {
    solvedQuestionIds.clear();
    localStorage.removeItem('infosys_solved_ids');
    updateStats();
    renderQuestions();
  }
}

// Helper for Difficulty text styles
function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case 'Easy': return 'text-green-600 dark:text-green-400';
    case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'Hard': return 'text-red-600 dark:text-red-400';
    default: return 'text-slate-500 dark:text-zinc-400';
  }
}

// Update Stats
function updateStats() {
  const total = questionsData.length;
  const solved = solvedQuestionIds.size;
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;

  solvedCountEl.textContent = solved;
  totalCountEl.textContent = total;
  progressPercentEl.textContent = `${percent}%`;
  progressBarEl.style.width = `${percent}%`;

  // Easy
  const easyTotal = questionsData.filter(q => q.difficulty === 'Easy').length;
  const easySolved = questionsData.filter(q => q.difficulty === 'Easy' && solvedQuestionIds.has(q.id)).length;
  easyCountEl.textContent = easySolved;
  easyRatioEl.textContent = `${easySolved}/${easyTotal}`;
  easyBarEl.style.width = easyTotal > 0 ? `${(easySolved / easyTotal) * 100}%` : '0%';

  // Medium
  const mediumTotal = questionsData.filter(q => q.difficulty === 'Medium').length;
  const mediumSolved = questionsData.filter(q => q.difficulty === 'Medium' && solvedQuestionIds.has(q.id)).length;
  mediumCountEl.textContent = mediumSolved;
  mediumRatioEl.textContent = `${mediumSolved}/${mediumTotal}`;
  mediumBarEl.style.width = mediumTotal > 0 ? `${(mediumSolved / mediumTotal) * 100}%` : '0%';

  // Hard
  const hardTotal = questionsData.filter(q => q.difficulty === 'Hard').length;
  const hardSolved = questionsData.filter(q => q.difficulty === 'Hard' && solvedQuestionIds.has(q.id)).length;
  hardCountEl.textContent = hardSolved;
  hardRatioEl.textContent = `${hardSolved}/${hardTotal}`;
  hardBarEl.style.width = hardTotal > 0 ? `${(hardSolved / hardTotal) * 100}%` : '0%';
}

window.toggleSolved = toggleSolved;
document.addEventListener('DOMContentLoaded', init);