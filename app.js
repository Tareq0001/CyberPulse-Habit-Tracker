/**
 * CYBERPULSE HABIT TRACKER - CLIENT SCRIPT
 * Lightweight, LocalStorage-backed, Streak & Activity Engine
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cyberpulse_habits_v1';
  let habits = [];
  let isEnglish = false;

  const defaultHabits = [
    { id: 1, name: 'جلسة تركيز وبرمجة عميقة (45 دقيقة)', category: '💻 برمجة وعمل', streak: 4, history: {} },
    { id: 2, name: 'قراءة في كتاب تقني أو علمي', category: '💡 تعلم وتطوير', streak: 7, history: {} },
    { id: 3, name: 'رياضة ومشي 5000 خطوة', category: '🏃 صحة ولياقة', streak: 3, history: {} },
    { id: 4, name: 'أذكار الصباح والمساء وتأمل', category: '🧘 تركيز وروحانية', streak: 12, history: {} }
  ];

  // Helper: get today's date string YYYY-MM-DD
  function getTodayKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  }

  // Load or initialize habits
  function loadHabits() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        habits = JSON.parse(saved);
      } catch (e) {
        habits = defaultHabits;
      }
    } else {
      // Seed initial mock history for nice visualization on first launch
      const today = getTodayKey();
      defaultHabits.forEach(h => {
        for (let i = 0; i < 28; i++) {
          if (Math.random() > 0.35) {
            h.history[getTodayKey(i)] = true;
          }
        }
      });
      habits = defaultHabits;
      saveHabits();
    }
  }

  function saveHabits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  // Recalculate streak for a habit
  function calculateStreak(habit) {
    let streak = 0;
    let offset = 0;
    const today = getTodayKey(0);

    // If done today, start counting from today, else start from yesterday
    if (habit.history[today]) {
      streak++;
      offset = 1;
    } else {
      offset = 1;
    }

    while (true) {
      const prevDay = getTodayKey(offset);
      if (habit.history[prevDay]) {
        streak++;
        offset++;
      } else {
        break;
      }
    }
    habit.streak = streak;
    return streak;
  }

  // Render UI
  function render() {
    const today = getTodayKey();
    const container = document.getElementById('habits-list');
    container.innerHTML = '';

    let completedToday = 0;

    habits.forEach(h => {
      calculateStreak(h);
      const isDone = !!h.history[today];
      if (isDone) completedToday++;

      const item = document.createElement('div');
      item.className = `habit-item ${isDone ? 'done' : ''}`;
      item.innerHTML = `
        <div class="habit-left">
          <button class="habit-check-btn" data-id="${h.id}" title="تبديل حالة الإنجاز">
            ${isDone ? '✓' : ''}
          </button>
          <div>
            <div class="habit-title">${escapeHTML(h.name)}</div>
            <span class="habit-cat-badge">${escapeHTML(h.category)}</span>
          </div>
        </div>
        <div class="habit-right">
          <span class="streak-badge">🔥 ${h.streak} ${isEnglish ? 'days' : 'يوم'}</span>
          <button class="delete-btn" data-id="${h.id}" title="حذف العادة">✕</button>
        </div>
      `;
      container.appendChild(item);
    });

    // Update HUD
    const total = habits.length;
    const percent = total > 0 ? Math.round((completedToday / total) * 100) : 0;
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    document.getElementById('total-habits-val').textContent = total;
    document.getElementById('today-completion-val').textContent = `${percent}%`;
    document.getElementById('today-progress-fill').style.width = `${percent}%`;
    document.getElementById('best-streak-val').textContent = `🔥 ${bestStreak} ${isEnglish ? 'days' : 'يوم'}`;

    renderActivityGrid();
  }

  // Render 28-day Activity Grid
  function renderActivityGrid() {
    const grid = document.getElementById('activity-grid');
    grid.innerHTML = '';

    // Loop backwards from 27 days ago to today
    for (let i = 27; i >= 0; i--) {
      const dateKey = getTodayKey(i);
      let count = 0;
      habits.forEach(h => {
        if (h.history[dateKey]) count++;
      });

      const cell = document.createElement('div');
      cell.className = 'activity-cell';
      cell.title = `${dateKey}: ${count} / ${habits.length}`;

      const ratio = habits.length > 0 ? count / habits.length : 0;
      if (ratio > 0.75) cell.classList.add('lvl-3');
      else if (ratio > 0.4) cell.classList.add('lvl-2');
      else if (ratio > 0) cell.classList.add('lvl-1');

      grid.appendChild(cell);
    }
  }

  function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }

  // Event handlers
  function initEvents() {
    // Add habit
    const form = document.getElementById('add-habit-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const nameInput = document.getElementById('habit-name-input');
      const catInput = document.getElementById('habit-cat-input');

      const name = nameInput.value.trim();
      if (!name) return;

      const newHabit = {
        id: Date.now(),
        name,
        category: catInput.value,
        streak: 0,
        history: {}
      };

      habits.push(newHabit);
      saveHabits();
      render();
      nameInput.value = '';
    });

    // Toggle or Delete click delegation
    const list = document.getElementById('habits-list');
    list.addEventListener('click', e => {
      const checkBtn = e.target.closest('.habit-check-btn');
      const deleteBtn = e.target.closest('.delete-btn');

      if (checkBtn) {
        const id = Number(checkBtn.getAttribute('data-id'));
        const habit = habits.find(h => h.id === id);
        if (habit) {
          const today = getTodayKey();
          habit.history[today] = !habit.history[today];
          saveHabits();
          render();
        }
      } else if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        if (confirm(isEnglish ? 'Are you sure you want to delete this habit?' : 'هل أنت متأكد من حذف هذه العادة؟')) {
          habits = habits.filter(h => h.id !== id);
          saveHabits();
          render();
        }
      }
    });

    // Export JSON
    document.getElementById('btn-export').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(habits, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `cyberpulse_habits_${getTodayKey()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Language toggle
    document.getElementById('btn-lang').addEventListener('click', () => {
      isEnglish = !isEnglish;
      document.body.classList.toggle('lang-en', isEnglish);
      document.documentElement.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
      document.documentElement.setAttribute('lang', isEnglish ? 'en' : 'ar');
      document.getElementById('btn-lang').textContent = isEnglish ? 'العربية' : 'English';
      render();
    });

    // Set today date label
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').textContent = today.toLocaleDateString('ar-SA', options);
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadHabits();
    initEvents();
    render();
  });
})();
