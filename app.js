// AuraHabit - App Logic

// --- STATE MANAGEMENT ---
const DEFAULT_HABITS = [
  {
    id: "habit-1",
    name: "Drink Water",
    desc: "Stay hydrated by drinking at least 8 glasses of water throughout the day.",
    category: "health",
    target: "8 glasses",
    frequency: "daily",
    days: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
  },
  {
    id: "habit-2",
    name: "Morning Workout",
    desc: "30 minutes of cardio, strength, or yoga to kickstart the day.",
    category: "fitness",
    target: "30 mins",
    frequency: "weekly",
    days: [1, 3, 5], // Mon, Wed, Fri
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "habit-3",
    name: "Read a Book",
    desc: "Read at least 10 pages of a non-fiction or educational book.",
    category: "mind",
    target: "10 pages",
    frequency: "daily",
    days: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  }
];

const DEFAULT_LOGS = {};
// Pre-populate some historical logs for the default habits to make the dashboard look rich
const todayStr = getLocalDateString(new Date());
const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
const dayBeforeStr = getLocalDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
const threeDaysAgoStr = getLocalDateString(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));

DEFAULT_LOGS[yesterdayStr] = { "habit-1": true, "habit-2": true, "habit-3": true };
DEFAULT_LOGS[dayBeforeStr] = { "habit-1": true, "habit-3": true };
DEFAULT_LOGS[threeDaysAgoStr] = { "habit-1": true, "habit-2": true };

let habits = JSON.parse(localStorage.getItem("aurahabit_habits")) || DEFAULT_HABITS;
let logs = JSON.parse(localStorage.getItem("aurahabit_logs")) || DEFAULT_LOGS;
let settings = JSON.parse(localStorage.getItem("aurahabit_settings")) || { theme: "dark" };

let selectedDate = new Date();
let currentWeekStart = getStartOfWeek(new Date(selectedDate));
let activeCategoryFilter = "all";
let currentView = "dashboard"; // "dashboard" or "settings"

// --- THEME COLOR RGB MAPPINGS FOR INLINE CSS VARIABLES ---
const CATEGORY_COLORS = {
  health: "0, 212, 255",     // cyan/light blue
  fitness: "255, 62, 126",    // rose
  mind: "168, 85, 247",      // purple
  work: "249, 115, 22",      // orange
  finance: "34, 197, 94",     // emerald green
  custom: "59, 130, 246"      // blue
};

// --- DOM ELEMENTS ---
const elements = {
  navDashboard: document.getElementById("nav-dashboard"),
  navSettings: document.getElementById("nav-settings"),
  dashboardView: document.getElementById("dashboard-view"),
  settingsView: document.getElementById("settings-view"),
  
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  themeLabel: document.getElementById("theme-label"),
  themeIcon: document.getElementById("theme-icon"),
  settingsThemeToggle: document.getElementById("settings-theme-toggle"),
  
  greetingTitle: document.getElementById("greeting-title"),
  todayDateText: document.getElementById("today-date-text"),
  addHabitBtn: document.getElementById("add-habit-btn"),
  
  todayProgressPercent: document.getElementById("today-progress-percent"),
  todayProgressFraction: document.getElementById("today-progress-fraction"),
  progressCircle: document.getElementById("progress-circle"),
  bestStreakVal: document.getElementById("best-streak-val"),
  consistencyVal: document.getElementById("consistency-val"),
  
  calendarMonthYear: document.getElementById("calendar-month-year"),
  calendarPrevWeek: document.getElementById("calendar-prev-week"),
  calendarNextWeek: document.getElementById("calendar-next-week"),
  calendarTodayBtn: document.getElementById("calendar-today-btn"),
  calendarDaysContainer: document.getElementById("calendar-days-container"),
  
  categoryFiltersContainer: document.getElementById("category-filters-container"),
  habitsListContainer: document.getElementById("habits-list-container"),
  
  // Create/Edit Modal
  habitModalOverlay: document.getElementById("habit-modal-overlay"),
  habitModalTitle: document.getElementById("habit-modal-title"),
  habitModalClose: document.getElementById("habit-modal-close"),
  habitForm: document.getElementById("habit-form"),
  habitFormId: document.getElementById("habit-form-id"),
  habitNameInput: document.getElementById("habit-name-input"),
  habitDescInput: document.getElementById("habit-desc-input"),
  categoryPicker: document.getElementById("category-picker"),
  habitTargetInput: document.getElementById("habit-target-input"),
  habitFreqSelect: document.getElementById("habit-freq-select"),
  weekdayPickerContainer: document.getElementById("weekday-picker-container"),
  habitFormCancel: document.getElementById("habit-form-cancel"),
  habitFormSubmit: document.getElementById("habit-form-submit"),
  
  // Detail Modal
  detailModalOverlay: document.getElementById("detail-modal-overlay"),
  detailCategoryBadge: document.getElementById("detail-category-badge"),
  detailHabitTitle: document.getElementById("detail-habit-title"),
  detailModalClose: document.getElementById("detail-modal-close"),
  detailHabitDesc: document.getElementById("detail-habit-desc"),
  detailCurrentStreak: document.getElementById("detail-current-streak"),
  detailLongestStreak: document.getElementById("detail-longest-streak"),
  detailTotalCompletions: document.getElementById("detail-total-completions"),
  detailFrequencyLabel: document.getElementById("detail-frequency-label"),
  heatmapMonthsHeader: document.getElementById("heatmap-months-header"),
  detailHeatmapGrid: document.getElementById("detail-heatmap-grid"),
  detailRecentLogs: document.getElementById("detail-recent-logs"),
  detailDeleteBtn: document.getElementById("detail-delete-btn"),
  detailEditBtn: document.getElementById("detail-edit-btn"),
  detailDoneBtn: document.getElementById("detail-done-btn"),
  
  // Data actions
  testCelebrationBtn: document.getElementById("test-celebration-btn"),
  exportDataBtn: document.getElementById("export-data-btn"),
  importDataBtn: document.getElementById("import-data-btn"),
  importFileInput: document.getElementById("import-file-input"),
  resetLogsBtn: document.getElementById("reset-logs-btn"),
  factoryResetBtn: document.getElementById("factory-reset-btn"),
  
  toastContainer: document.getElementById("toast-container"),
  celebCanvas: document.getElementById("celeb-canvas")
};

// --- INIT APP ---
function init() {
  applyTheme();
  setupViewNavigation();
  setupThemeToggles();
  setupCalendarActions();
  setupModalActions();
  setupSettingsActions();
  setupOrbitActions();
  
  // Render initial dashboard content
  updateDateGreeting();
  renderCalendarStrip();
  renderFilters();
  renderHabits();
  updateOverviewStats();
  
  window.addEventListener("resize", () => {
    // Redraw calendar or canvas if size changes significantly
  });
}

function setupOrbitActions() {
  document.querySelectorAll(".orbit-button.orbit-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      activeCategoryFilter = cat;
      
      // Update active class on orbit buttons
      document.querySelectorAll(".orbit-button.orbit-filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Sync and render
      renderHabits();
      renderFilters();
    });
    
    // Add Hover listeners to dynamically update the center circle label and color!
    btn.addEventListener("mouseenter", () => {
      const cat = btn.dataset.category;
      const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
      
      // Find today's progress for this category
      const todayStr = getLocalDateString(selectedDate);
      const scheduledCat = habits.filter(h => (cat === "all" || h.category === cat) && isHabitScheduledForDay(h, selectedDate));
      const completedCat = scheduledCat.filter(h => logs[todayStr] && logs[todayStr][h.id]).length;
      const pct = scheduledCat.length > 0 ? Math.round((completedCat / scheduledCat.length) * 100) : 0;
      
      // Update central orb text temporarily
      elements.todayProgressPercent.textContent = `${pct}%`;
      elements.todayProgressFraction.textContent = `${completedCat} of ${scheduledCat.length} done`;
      
      const labelEl = document.getElementById("orbit-center-label");
      if (labelEl) {
        labelEl.textContent = catName;
        const themeRgb = btn.style.getPropertyValue("--theme-rgb");
        labelEl.style.color = themeRgb ? `rgb(${themeRgb})` : "var(--accent-color)";
      }
      
      // Temporarily change stroke color of progress circle to match category color
      const themeRgb = btn.style.getPropertyValue("--theme-rgb");
      if (themeRgb) {
        elements.progressCircle.style.stroke = `rgb(${themeRgb})`;
        elements.progressCircle.style.filter = `drop-shadow(0 0 6px rgb(${themeRgb}))`;
        // Also glow the center circle border
        const centerOrb = document.querySelector(".orbit-center-circle");
        if (centerOrb) {
          centerOrb.style.borderColor = `rgba(${themeRgb}, 0.5)`;
          centerOrb.style.boxShadow = `var(--shadow-lg), 0 0 35px rgba(${themeRgb}, 0.3)`;
        }
      }
    });
    
    btn.addEventListener("mouseleave", () => {
      // Restore standard stats
      updateOverviewStats();
      
      const labelEl = document.getElementById("orbit-center-label");
      if (labelEl) {
        labelEl.textContent = "TODAY";
        labelEl.style.color = "";
      }
      
      // Restore original stroke color & shadow
      elements.progressCircle.style.stroke = "";
      elements.progressCircle.style.filter = "";
      const centerOrb = document.querySelector(".orbit-center-circle");
      if (centerOrb) {
        centerOrb.style.borderColor = "";
        centerOrb.style.boxShadow = "";
      }
    });
  });
}

// --- UTILITY DATE FUNCTIONS ---
function getLocalDateString(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust so Monday is first day of the week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getDayNameShort(dayIndex) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[dayIndex];
}

function getMonthNameShort(monthIndex) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
}

// --- PERSISTENCE ---
function saveToStorage() {
  localStorage.setItem("aurahabit_habits", JSON.stringify(habits));
  localStorage.setItem("aurahabit_logs", JSON.stringify(logs));
  localStorage.setItem("aurahabit_settings", JSON.stringify(settings));
}

// --- THEME ---
function applyTheme() {
  if (settings.theme === "light") {
    document.body.classList.add("light-mode");
    elements.themeLabel.textContent = "Dark Mode";
    // Sun icon SVG
    elements.themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    `;
  } else {
    document.body.classList.remove("light-mode");
    elements.themeLabel.textContent = "Light Mode";
    // Moon icon SVG
    elements.themeIcon.innerHTML = `
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    `;
  }
}

function setupThemeToggles() {
  const toggleAction = () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    saveToStorage();
    applyTheme();
    showToast("Theme switched successfully!", "success");
  };
  
  elements.themeToggleBtn.addEventListener("click", toggleAction);
  elements.settingsThemeToggle.addEventListener("click", toggleAction);
}

// --- VIEW NAVIGATION ---
function setupViewNavigation() {
  elements.navDashboard.addEventListener("click", () => {
    switchView("dashboard");
  });
  elements.navSettings.addEventListener("click", () => {
    switchView("settings");
  });
}

function switchView(view) {
  currentView = view;
  if (view === "dashboard") {
    elements.navDashboard.classList.add("active");
    elements.navSettings.classList.remove("active");
    elements.dashboardView.style.display = "flex";
    elements.settingsView.style.display = "none";
    // Re-render contents to capture updates
    updateDateGreeting();
    renderCalendarStrip();
    renderFilters();
    renderHabits();
    updateOverviewStats();
  } else {
    elements.navDashboard.classList.remove("active");
    elements.navSettings.classList.add("active");
    elements.dashboardView.style.display = "none";
    elements.settingsView.style.display = "block";
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icon = type === "success" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Trigger animation reflow
  setTimeout(() => toast.classList.add("active"), 10);
  
  // Remove toast after delay
  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// --- DATE GREETING ---
function updateDateGreeting() {
  const hour = new Date().getHours();
  let greet = "Hello, Champion!";
  if (hour < 12) greet = "Good morning, Champion!";
  else if (hour < 17) greet = "Good afternoon, Builder!";
  else greet = "Good evening, Achiever!";
  
  elements.greetingTitle.textContent = greet;
  
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  elements.todayDateText.textContent = selectedDate.toLocaleDateString("en-US", options);
}

// --- CALENDAR STRIP RENDERER ---
function setupCalendarActions() {
  elements.calendarPrevWeek.addEventListener("click", () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    renderCalendarStrip();
  });
  
  elements.calendarNextWeek.addEventListener("click", () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    renderCalendarStrip();
  });
  
  elements.calendarTodayBtn.addEventListener("click", () => {
    selectedDate = new Date();
    currentWeekStart = getStartOfWeek(selectedDate);
    updateDateGreeting();
    renderCalendarStrip();
    renderHabits();
    updateOverviewStats();
  });
}

function renderCalendarStrip() {
  elements.calendarDaysContainer.innerHTML = "";
  
  // Set Calendar Header month/year name (based on the middle day of the week)
  const middleDay = addDays(currentWeekStart, 3);
  elements.calendarMonthYear.textContent = middleDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  const todayStr = getLocalDateString(new Date());
  const selectedStr = getLocalDateString(selectedDate);
  
  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(currentWeekStart, i);
    const dayStr = getLocalDateString(dayDate);
    const dayOfWeek = dayDate.getDay(); // 0 (Sun) - 6 (Sat)
    
    const isToday = dayStr === todayStr;
    const isSelected = dayStr === selectedStr;
    
    // Calculate habits scheduled & completed on this day to render status dots
    const dayHabits = habits.filter(habit => isHabitScheduledForDay(habit, dayDate));
    const completedCount = dayHabits.filter(habit => logs[dayStr] && logs[dayStr][habit.id]).length;
    
    const dayCell = document.createElement("div");
    dayCell.className = `calendar-day-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`;
    dayCell.dataset.date = dayStr;
    
    // Dot progress list representation
    let dotsHtml = "";
    if (dayHabits.length > 0) {
      dotsHtml = `<div class="day-progress-dots">`;
      dayHabits.forEach(h => {
        const isCompleted = logs[dayStr] && logs[dayStr][h.id];
        dotsHtml += `<span class="day-progress-dot ${isCompleted ? 'completed' : ''}"></span>`;
      });
      dotsHtml += `</div>`;
    }
    
    dayCell.innerHTML = `
      <span class="day-name">${getDayNameShort(dayOfWeek)}</span>
      <span class="day-num">${dayDate.getDate()}</span>
      ${dotsHtml}
    `;
    
    dayCell.addEventListener("click", () => {
      selectedDate = dayDate;
      updateDateGreeting();
      
      // Update selected state in DOM
      document.querySelectorAll(".calendar-day-cell").forEach(cell => cell.classList.remove("selected"));
      dayCell.classList.add("selected");
      
      renderHabits();
      updateOverviewStats();
    });
    
    elements.calendarDaysContainer.appendChild(dayCell);
  }
}

function isHabitScheduledForDay(habit, date) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday ...
  
  // Weekly limits check: if date is before creation date, it wasn't active
  const createdDate = new Date(habit.createdAt);
  // Zero out times for date comparison
  const compareDate = new Date(date);
  compareDate.setHours(0,0,0,0);
  createdDate.setHours(0,0,0,0);
  if (compareDate < createdDate) return false;
  
  if (habit.frequency === "daily") {
    return true;
  }
  
  // If weekly, check scheduled days
  return habit.days.includes(dayOfWeek);
}

// --- FILTER CHIPS ---
function renderFilters() {
  elements.categoryFiltersContainer.innerHTML = "";
  
  // Collect all unique categories from habits list (or standard set)
  const categories = ["all", "health", "fitness", "mind", "work", "finance", "custom"];
  
  categories.forEach(cat => {
    // Count active habits in this category for the current selected date
    let count = 0;
    if (cat === "all") {
      count = habits.filter(h => isHabitScheduledForDay(h, selectedDate)).length;
    } else {
      count = habits.filter(h => h.category === cat && isHabitScheduledForDay(h, selectedDate)).length;
    }
    
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `filter-chip ${activeCategoryFilter === cat ? "active" : ""}`;
    chip.innerHTML = `${cat.charAt(0).toUpperCase() + cat.slice(1)} <span style="font-weight:700; opacity:0.8; margin-left:4px;">${count}</span>`;
    
    chip.addEventListener("click", () => {
      activeCategoryFilter = cat;
      // Toggle active visual
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      
      renderHabits();
    });
    
    elements.categoryFiltersContainer.appendChild(chip);
    
    // Update Orbit Hub buttons active visual & count inside tooltip
    const orbitBtn = document.querySelector(`.orbit-button.orbit-filter[data-category="${cat}"]`);
    if (orbitBtn) {
      if (activeCategoryFilter === cat) {
        orbitBtn.classList.add("active");
      } else {
        orbitBtn.classList.remove("active");
      }
      
      const tooltip = orbitBtn.querySelector(".orbit-tooltip");
      if (tooltip) {
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
        tooltip.textContent = `${catName} (${count})`;
      }
    }
  });
}

// --- HABIT FEED RENDERER ---
function renderHabits() {
  elements.habitsListContainer.innerHTML = "";
  const dateStr = getLocalDateString(selectedDate);
  
  // Filter habits for selected date & selected category
  const scheduledHabits = habits.filter(habit => {
    const isSched = isHabitScheduledForDay(habit, selectedDate);
    const matchesCat = activeCategoryFilter === "all" || habit.category === activeCategoryFilter;
    return isSched && matchesCat;
  });
  
  if (scheduledHabits.length === 0) {
    elements.habitsListContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <h3>No Habits Scheduled</h3>
        <p>No habits match your filters or are scheduled for this day. Click "New Habit" above to expand your routines!</p>
      </div>
    `;
    return;
  }
  
  scheduledHabits.forEach(habit => {
    const isCompleted = logs[dateStr] && logs[dateStr][habit.id];
    
    const streakStats = calculateStreakStats(habit);
    const completionRate = calculateHabitCompletionRate(habit);
    const themeRgb = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.custom;
    
    const card = document.createElement("div");
    card.className = "habit-card";
    card.style.setProperty("--theme-rgb", themeRgb);
    card.style.setProperty("--theme-border", `rgba(${themeRgb}, 0.3)`);
    
    card.innerHTML = `
      <div class="habit-card-top">
        <div class="habit-details">
          <span class="habit-category-badge">${habit.category}</span>
          <h3 class="habit-title" data-id="${habit.id}">${habit.name}</h3>
          <p class="habit-desc">${habit.desc || 'No description provided.'}</p>
        </div>
        <div class="habit-checkbox-wrapper">
          <button class="habit-checkbox ${isCompleted ? 'completed' : ''}" data-id="${habit.id}" aria-label="Toggle completion">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="habit-card-bottom">
        <div class="habit-stats-summary">
          <div class="habit-stat-pill streak">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            <span>${streakStats.current}d streak</span>
          </div>
          <div class="habit-stat-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${completionRate}% rate</span>
          </div>
          ${habit.target ? `
          <div class="habit-stat-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            <span>Goal: ${habit.target}</span>
          </div>` : ''}
        </div>
        
        <button class="habit-options-btn" data-id="${habit.id}" aria-label="Habit Options">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
    `;
    
    // Add Event Listeners
    // Toggle Completion Checkbox
    const checkbox = card.querySelector(".habit-checkbox");
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleHabitCompletion(habit.id);
    });
    
    // Open Detail Modal
    card.querySelector(".habit-title").addEventListener("click", () => {
      openDetailModal(habit.id);
    });
    
    // Options button opens detailed modal as well
    card.querySelector(".habit-options-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailModal(habit.id);
    });
    
    elements.habitsListContainer.appendChild(card);
  });
}

function toggleHabitCompletion(habitId) {
  const dateStr = getLocalDateString(selectedDate);
  
  if (!logs[dateStr]) {
    logs[dateStr] = {};
  }
  
  const currentlyCompleted = !!logs[dateStr][habitId];
  
  if (currentlyCompleted) {
    delete logs[dateStr][habitId];
    if (Object.keys(logs[dateStr]).length === 0) {
      delete logs[dateStr];
    }
    showToast("Habit marked as incomplete.", "error");
  } else {
    logs[dateStr][habitId] = true;
    showToast("Habit completed! Well done! 🎉", "success");
    
    // Check if ALL daily habits are completed to launch celebration!
    const dailyHabits = habits.filter(h => isHabitScheduledForDay(h, selectedDate));
    const completedCount = dailyHabits.filter(h => logs[dateStr] && logs[dateStr][h.id]).length;
    
    if (completedCount === dailyHabits.length && dailyHabits.length > 0) {
      setTimeout(() => {
        startCelebration();
        showToast("Perfect Day! You've crushed all scheduled habits! 🌟🏆", "success");
      }, 300);
    }
  }
  
  saveToStorage();
  
  // Re-render updates
  renderCalendarStrip();
  renderHabits();
  updateOverviewStats();
}

// --- OVERVIEW STATS UPDATER ---
function updateOverviewStats() {
  const todayStr = getLocalDateString(selectedDate);
  
  // 1. Progress circle & percentage
  const scheduledToday = habits.filter(h => isHabitScheduledForDay(h, selectedDate));
  const completedToday = scheduledToday.filter(h => logs[todayStr] && logs[todayStr][h.id]).length;
  
  const percentage = scheduledToday.length > 0 ? Math.round((completedToday / scheduledToday.length) * 100) : 0;
  elements.todayProgressPercent.textContent = `${percentage}%`;
  elements.todayProgressFraction.textContent = `${completedToday} of ${scheduledToday.length} habits done`;
  
  // Animate progress circle SVG dashoffset
  // radius r=65 -> circumference = 2 * PI * r = 408.4
  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (percentage / 100) * circumference;
  elements.progressCircle.setAttribute("stroke-dashoffset", offset);
  
  // 2. Best Streak overall habits
  let maxStreak = 0;
  habits.forEach(h => {
    const streak = calculateStreakStats(h).longest;
    if (streak > maxStreak) maxStreak = streak;
  });
  elements.bestStreakVal.textContent = `${maxStreak} ${maxStreak === 1 ? 'day' : 'days'}`;
  
  // 3. Consistency
  let totalScheduled = 0;
  let totalCompletions = 0;
  
  habits.forEach(h => {
    const creationDate = new Date(h.createdAt);
    creationDate.setHours(0,0,0,0);
    const todayCompare = new Date();
    todayCompare.setHours(0,0,0,0);
    
    // Iterate from creation date to today
    for (let d = new Date(creationDate); d <= todayCompare; d.setDate(d.getDate() + 1)) {
      if (isHabitScheduledForDay(h, d)) {
        totalScheduled++;
        const dStr = getLocalDateString(d);
        if (logs[dStr] && logs[dStr][h.id]) {
          totalCompletions++;
        }
      }
    }
  });
  
  const consistencyRate = totalScheduled > 0 ? Math.round((totalCompletions / totalScheduled) * 100) : 0;
  elements.consistencyVal.textContent = `${consistencyRate}%`;
}

// --- STREAK & LOGIC CALCULATIONS ---
function calculateStreakStats(habit) {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0,0,0,0);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Calculate longest streak chronologically
  for (let d = new Date(creationDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (isHabitScheduledForDay(habit, d)) {
      const dStr = getLocalDateString(d);
      if (logs[dStr] && logs[dStr][habit.id]) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        // If it's a scheduled day but not completed
        // Wait, if it's today and not completed yet, don't break the streak just yet in chronological scan
        const dateCompare = new Date(d);
        dateCompare.setHours(0,0,0,0);
        if (dateCompare.getTime() === today.getTime()) {
          // It's today. We do not count today in tempStreak, but we don't break it either because they still have time to finish.
        } else {
          tempStreak = 0;
        }
      }
    }
  }
  
  // Calculate current streak backwards from today
  // If today is scheduled and completed: streak continues, look at yesterday...
  // If today is scheduled but NOT completed:
  //    Check if yesterday (or last scheduled day before today) was completed.
  //    If yes, streak is alive and counts the completed items.
  //    If no, streak is 0.
  let checkDate = new Date(today);
  let streakActive = true;
  let isFirstDay = true;
  
  while (checkDate >= creationDate) {
    if (isHabitScheduledForDay(habit, checkDate)) {
      const dStr = getLocalDateString(checkDate);
      const isDone = logs[dStr] && logs[dStr][habit.id];
      
      if (isDone) {
        currentStreak++;
        isFirstDay = false;
      } else {
        // Not completed
        if (isFirstDay && checkDate.getTime() === today.getTime()) {
          // If today is scheduled but not checked yet, check yesterday.
          isFirstDay = false;
        } else {
          // Broken streak
          break;
        }
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return {
    current: currentStreak,
    longest: longestStreak
  };
}

function calculateHabitCompletionRate(habit) {
  let scheduled = 0;
  let completed = 0;
  
  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  for (let d = new Date(creationDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (isHabitScheduledForDay(habit, d)) {
      scheduled++;
      const dStr = getLocalDateString(d);
      if (logs[dStr] && logs[dStr][habit.id]) {
        completed++;
      }
    }
  }
  
  return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
}

// --- CREATE & EDIT MODAL HANDLERS ---
let selectedFormCategory = "health";

function setupModalActions() {
  elements.addHabitBtn.addEventListener("click", () => {
    openHabitModal();
  });
  
  elements.habitModalClose.addEventListener("click", closeHabitModal);
  elements.habitFormCancel.addEventListener("click", closeHabitModal);
  
  // Frequency selector toggle weekday grid visibility
  elements.habitFreqSelect.addEventListener("change", (e) => {
    if (e.target.value === "weekly") {
      elements.weekdayPickerContainer.style.display = "grid";
    } else {
      elements.weekdayPickerContainer.style.display = "none";
    }
  });
  
  // Category Picker logic
  const options = elements.categoryPicker.querySelectorAll(".category-picker-option");
  options.forEach(opt => {
    opt.addEventListener("click", () => {
      options.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      selectedFormCategory = opt.dataset.value;
    });
  });
  
  // Weekday selection toggles
  const weekdays = elements.weekdayPickerContainer.querySelectorAll(".weekday-btn");
  weekdays.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("selected");
    });
  });
  
  // Form submission
  elements.habitForm.addEventListener("submit", (e) => {
    console.log("Form submit event triggered");
    e.preventDefault();
    saveHabitFromForm();
  });
}

function openHabitModal(habitId = null) {
  elements.habitForm.reset();
  elements.habitFormId.value = "";
  selectedFormCategory = "health";
  
  // Update categories selection visual
  elements.categoryPicker.querySelectorAll(".category-picker-option").forEach(o => {
    o.classList.remove("selected");
    if (o.dataset.value === "health") o.classList.add("selected");
  });
  
  // Reset weekday selection (all active by default)
  elements.weekdayPickerContainer.querySelectorAll(".weekday-btn").forEach(btn => btn.classList.add("selected"));
  elements.habitFreqSelect.value = "daily";
  elements.weekdayPickerContainer.style.display = "none";
  
  if (habitId) {
    // Edit Mode
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    elements.habitModalTitle.textContent = "Edit Habit";
    elements.habitFormId.value = habit.id;
    elements.habitNameInput.value = habit.name;
    elements.habitDescInput.value = habit.desc || "";
    elements.habitTargetInput.value = habit.target || "";
    
    selectedFormCategory = habit.category;
    elements.categoryPicker.querySelectorAll(".category-picker-option").forEach(o => {
      o.classList.remove("selected");
      if (o.dataset.value === habit.category) o.classList.add("selected");
    });
    
    elements.habitFreqSelect.value = habit.frequency;
    if (habit.frequency === "weekly") {
      elements.weekdayPickerContainer.style.display = "grid";
      elements.weekdayPickerContainer.querySelectorAll(".weekday-btn").forEach(btn => {
        const dayVal = parseInt(btn.dataset.day);
        if (habit.days.includes(dayVal)) {
          btn.classList.add("selected");
        } else {
          btn.classList.remove("selected");
        }
      });
    }
  } else {
    // Create Mode
    elements.habitModalTitle.textContent = "Create New Habit";
  }
  
  elements.habitModalOverlay.classList.add("active");
}

function closeHabitModal() {
  elements.habitModalOverlay.classList.remove("active");
}

function saveHabitFromForm() {
  const id = elements.habitFormId.value;
  const name = elements.habitNameInput.value.trim();
  const desc = elements.habitDescInput.value.trim();
  const target = elements.habitTargetInput.value.trim();
  const frequency = elements.habitFreqSelect.value;
  
  console.log("Form submission:", { id, name, desc, target, frequency, selectedFormCategory });
  
  // Validate habit name
  if (!name) {
    showToast("Please enter a habit name.", "error");
    return;
  }
  
  let scheduledDays = [0, 1, 2, 3, 4, 5, 6];
  if (frequency === "weekly") {
    scheduledDays = [];
    elements.weekdayPickerContainer.querySelectorAll(".weekday-btn.selected").forEach(btn => {
      scheduledDays.push(parseInt(btn.dataset.day));
    });
    
    if (scheduledDays.length === 0) {
      showToast("Please choose at least one active day of the week.", "error");
      return;
    }
  }
  
  if (id) {
    // Edit existing
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
      habits[index].name = name;
      habits[index].desc = desc;
      habits[index].category = selectedFormCategory;
      habits[index].target = target;
      habits[index].frequency = frequency;
      habits[index].days = scheduledDays;
      showToast("Habit updated successfully!", "success");
    }
  } else {
    // Create new habit
    const newHabit = {
      id: "habit-" + Date.now(),
      name: name,
      desc: desc,
      category: selectedFormCategory,
      target: target,
      frequency: frequency,
      days: scheduledDays,
      createdAt: new Date().toISOString()
    };
    habits.push(newHabit);
    showToast("Habit added to your feed!", "success");
  }
  
  saveToStorage();
  closeHabitModal();
  
  // Re-render
  renderCalendarStrip();
  renderFilters();
  renderHabits();
  updateOverviewStats();
}

// --- HABIT DETAIL / ANALYTICS MODAL ---
let currentDetailHabitId = null;

function setupCalendarMonthsHeader(daysCount) {
  elements.heatmapMonthsHeader.innerHTML = "";
  // Display names of last few months ending with current month
  const today = new Date();
  const monthsList = [];
  
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthsList.push(d.toLocaleDateString("en-US", { month: "short" }));
  }
  
  monthsList.forEach(m => {
    const label = document.createElement("span");
    label.textContent = m;
    elements.heatmapMonthsHeader.appendChild(label);
  });
}

function openDetailModal(habitId) {
  currentDetailHabitId = habitId;
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  const themeRgb = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.custom;
  elements.detailModalOverlay.style.setProperty("--theme-rgb", themeRgb);
  
  elements.detailCategoryBadge.textContent = habit.category;
  elements.detailCategoryBadge.style.background = `rgba(${themeRgb}, 0.12)`;
  elements.detailCategoryBadge.style.color = `rgb(${themeRgb})`;
  elements.detailCategoryBadge.style.borderColor = `rgba(${themeRgb}, 0.25)`;
  
  elements.detailHabitTitle.textContent = habit.name;
  elements.detailHabitDesc.textContent = habit.desc || "No description provided for this habit.";
  
  // Streaks & Stats
  const streaks = calculateStreakStats(habit);
  const totalCompleted = countTotalCompletions(habit);
  
  elements.detailCurrentStreak.textContent = `${streaks.current} ${streaks.current === 1 ? 'day' : 'days'}`;
  elements.detailLongestStreak.textContent = `${streaks.longest} ${streaks.longest === 1 ? 'day' : 'days'}`;
  elements.detailTotalCompletions.textContent = `${totalCompleted} ${totalCompleted === 1 ? 'time' : 'times'}`;
  
  // Render Frequency label
  if (habit.frequency === "daily") {
    elements.detailFrequencyLabel.textContent = "Frequency: Every Day";
  } else {
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const scheduledDaysText = habit.days.map(d => daysShort[d]).join(", ");
    elements.detailFrequencyLabel.textContent = `Frequency: Weekly (${scheduledDaysText})`;
  }
  
  // Render Heatmap Grid (Last 15 weeks / 105 days)
  renderHeatmap(habit);
  
  // Render recent logs
  renderRecentLogsList(habit);
  
  elements.detailModalOverlay.classList.add("active");
}

function countTotalCompletions(habit) {
  let count = 0;
  Object.values(logs).forEach(dayLogs => {
    if (dayLogs && dayLogs[habit.id]) {
      count++;
    }
  });
  return count;
}

function renderHeatmap(habit) {
  elements.detailHeatmapGrid.innerHTML = "";
  
  // Let's draw the last 15 weeks = 105 days ending on Sunday of current week
  const endDate = new Date(selectedDate);
  // Get Sunday of current week
  const day = endDate.getDay();
  const diff = endDate.getDate() + (day === 0 ? 0 : 7 - day);
  const calendarEnd = new Date(endDate.setDate(diff));
  
  const cellsCount = 105; // 15 weeks * 7 days
  const calendarStart = addDays(calendarEnd, -cellsCount + 1);
  
  // Months header labeling setup
  setupCalendarMonthsHeader();
  
  const themeRgb = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.custom;
  
  for (let i = 0; i < cellsCount; i++) {
    const cellDate = addDays(calendarStart, i);
    const dateStr = getLocalDateString(cellDate);
    
    const isScheduled = isHabitScheduledForDay(habit, cellDate);
    const isCompleted = logs[dateStr] && logs[dateStr][habit.id];
    
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.style.setProperty("--theme-rgb", themeRgb);
    
    if (!isScheduled) {
      cell.classList.add("not-applicable");
    } else if (isCompleted) {
      cell.classList.add("completed");
    }
    
    // Add Tooltip info
    const dateOptions = { month: "short", day: "numeric", year: "numeric" };
    const dateReadable = cellDate.toLocaleDateString("en-US", dateOptions);
    let statusText = isCompleted ? "Completed" : "Missed";
    if (!isScheduled) statusText = "Not scheduled";
    cell.setAttribute("data-tooltip", `${dateReadable}: ${statusText}`);
    
    // Add click handler to toggle historical date completion
    if (isScheduled) {
      cell.addEventListener("click", () => {
        toggleHistoricalCompletion(habit.id, dateStr);
        // Re-render detail modal visualizations
        openDetailModal(habit.id);
        // Refresh dashboard overview
        renderCalendarStrip();
        renderHabits();
        updateOverviewStats();
      });
    }
    
    elements.detailHeatmapGrid.appendChild(cell);
  }
}

function toggleHistoricalCompletion(habitId, dateStr) {
  if (!logs[dateStr]) {
    logs[dateStr] = {};
  }
  
  const currentlyCompleted = !!logs[dateStr][habitId];
  if (currentlyCompleted) {
    delete logs[dateStr][habitId];
    if (Object.keys(logs[dateStr]).length === 0) {
      delete logs[dateStr];
    }
    showToast(`Removed log for ${dateStr}.`, "error");
  } else {
    logs[dateStr][habitId] = true;
    showToast(`Log marked completed for ${dateStr}!`, "success");
  }
  
  saveToStorage();
}

function renderRecentLogsList(habit) {
  elements.detailRecentLogs.innerHTML = "";
  
  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0,0,0,0);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const logRows = [];
  
  // Trace back last 14 days
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, -i);
    if (d < creationDate) break;
    
    if (isHabitScheduledForDay(habit, d)) {
      const dStr = getLocalDateString(d);
      const isDone = logs[dStr] && logs[dStr][habit.id];
      logRows.push({
        date: d,
        dateStr: dStr,
        completed: isDone
      });
    }
  }
  
  if (logRows.length === 0) {
    elements.detailRecentLogs.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">
        No recent activity logged.
      </div>
    `;
    return;
  }
  
  logRows.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "recent-log-row";
    
    const options = { weekday: "short", month: "short", day: "numeric" };
    const dateLabel = row.date.toLocaleDateString("en-US", options);
    const isToday = getLocalDateString(row.date) === getLocalDateString(new Date());
    
    rowDiv.innerHTML = `
      <span style="font-weight: 500;">${dateLabel} ${isToday ? '<strong style="color: var(--accent-color); font-size:0.75rem;">(TODAY)</strong>' : ''}</span>
      <span class="recent-log-status ${row.completed ? 'completed' : 'missed'}">
        ${row.completed 
          ? `Completed <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` 
          : `Missed <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
        }
      </span>
    `;
    
    elements.detailRecentLogs.appendChild(rowDiv);
  });
}

function setupModalActions_detail() {
  elements.detailModalClose.addEventListener("click", () => {
    elements.detailModalOverlay.classList.remove("active");
  });
  
  elements.detailDoneBtn.addEventListener("click", () => {
    elements.detailModalOverlay.classList.remove("active");
  });
  
  elements.detailDeleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this habit and all its history? This action is permanent!")) {
      deleteHabit(currentDetailHabitId);
    }
  });
  
  elements.detailEditBtn.addEventListener("click", () => {
    const editId = currentDetailHabitId;
    elements.detailModalOverlay.classList.remove("active");
    // Open create/edit form
    openHabitModal(editId);
  });
}
setupModalActions_detail();

function deleteHabit(id) {
  // Remove from habits list
  habits = habits.filter(h => h.id !== id);
  
  // Clean logs
  Object.keys(logs).forEach(date => {
    if (logs[date] && logs[date][id]) {
      delete logs[date][id];
      if (Object.keys(logs[date]).length === 0) {
        delete logs[date];
      }
    }
  });
  
  saveToStorage();
  elements.detailModalOverlay.classList.remove("active");
  showToast("Habit deleted successfully.", "error");
  
  // Refresh views
  renderCalendarStrip();
  renderFilters();
  renderHabits();
  updateOverviewStats();
}

// --- SETTINGS / BACKUP & SYSTEM ACTIONS ---
function setupSettingsActions() {
  elements.testCelebrationBtn.addEventListener("click", () => {
    startCelebration();
    showToast("Splendid milestone achieved! Keep up the grind! 🏆🚀", "success");
  });
  
  elements.exportDataBtn.addEventListener("click", exportTrackerBackup);
  elements.importDataBtn.addEventListener("click", () => elements.importFileInput.click());
  elements.importFileInput.addEventListener("change", importTrackerBackup);
  
  elements.resetLogsBtn.addEventListener("click", () => {
    if (confirm("WARNING: This clears completion checklists and breaks streak tracking records. Habit lists are retained. Continue?")) {
      logs = {};
      saveToStorage();
      showToast("Completion checklists wiped.", "error");
      if (currentView === "dashboard") {
        renderCalendarStrip();
        renderHabits();
        updateOverviewStats();
      }
    }
  });
  
  elements.factoryResetBtn.addEventListener("click", () => {
    if (confirm("CRITICAL WARNING: This deletes everything, returning habits and logs to default settings. Are you absolutely sure?")) {
      localStorage.removeItem("aurahabit_habits");
      localStorage.removeItem("aurahabit_logs");
      localStorage.removeItem("aurahabit_settings");
      habits = DEFAULT_HABITS;
      logs = DEFAULT_LOGS;
      settings = { theme: "dark" };
      saveToStorage();
      applyTheme();
      showToast("App reverted to original default setup.", "error");
      
      // Auto return to dashboard view
      switchView("dashboard");
    }
  });
}

// Export Data
function exportTrackerBackup() {
  const dataStr = JSON.stringify({
    version: "1.0",
    habits: habits,
    logs: logs,
    settings: settings
  }, null, 2);
  
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `aurahabit_backup_${getLocalDateString(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Backup exported successfully!", "success");
}

// Import Data
function importTrackerBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (Array.isArray(parsedData.habits) && typeof parsedData.logs === "object") {
        habits = parsedData.habits;
        logs = parsedData.logs;
        if (parsedData.settings) settings = parsedData.settings;
        
        saveToStorage();
        applyTheme();
        showToast("Backup imported successfully!", "success");
        
        // Auto return to dashboard and refresh content
        switchView("dashboard");
      } else {
        showToast("Invalid file content structure. Unable to parse habits history data.", "error");
      }
    } catch (err) {
      showToast("Failed to parse data. Ensure file is a valid JSON backup.", "error");
    }
  };
  reader.readAsText(file);
  // Clear input
  elements.importFileInput.value = "";
}

// --- CELEBRATION CANVAS ANIMATION ---
let celebrationActive = false;
let celebParticles = [];
const canvasCtx = elements.celebCanvas.getContext("2d");

function resizeCanvas() {
  elements.celebCanvas.width = window.innerWidth;
  elements.celebCanvas.height = window.innerHeight;
}

class ConfettiParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 5;
    this.color = `hsl(${Math.random() * 360}, 90%, 65%)`;
    
    // Vector movement velocity
    this.vx = Math.random() * 6 - 3;
    this.vy = Math.random() * -8 - 4; // Shoot up initially
    this.gravity = 0.25;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 4 - 2;
    this.opacity = 1;
    this.fade = Math.random() * 0.015 + 0.008;
  }
  
  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.fade;
  }
  
  draw() {
    canvasCtx.save();
    canvasCtx.translate(this.x, this.y);
    canvasCtx.rotate((this.rotation * Math.PI) / 180);
    canvasCtx.fillStyle = this.color;
    canvasCtx.globalAlpha = this.opacity;
    // Draw a small polygon/rectangle
    canvasCtx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    canvasCtx.restore();
  }
}

function startCelebration() {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  
  celebParticles = [];
  celebrationActive = true;
  
  // Fire multiple bursts
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Left side burst
  for (let i = 0; i < 75; i++) {
    celebParticles.push(new ConfettiParticle(screenWidth * 0.2, screenHeight + 20));
  }
  // Right side burst
  for (let i = 0; i < 75; i++) {
    celebParticles.push(new ConfettiParticle(screenWidth * 0.8, screenHeight + 20));
  }
  
  // Middle burst
  setTimeout(() => {
    if (!celebrationActive) return;
    for (let i = 0; i < 50; i++) {
      celebParticles.push(new ConfettiParticle(screenWidth * 0.5, screenHeight * 0.7));
    }
  }, 350);
  
  requestAnimationFrame(updateCelebrationFrame);
}

function updateCelebrationFrame() {
  if (!celebrationActive) return;
  
  canvasCtx.clearRect(0, 0, elements.celebCanvas.width, elements.celebCanvas.height);
  
  celebParticles.forEach((p, idx) => {
    p.update();
    p.draw();
    
    // Remove faded/offscreen particles
    if (p.opacity <= 0 || p.y > elements.celebCanvas.height + 40) {
      celebParticles.splice(idx, 1);
    }
  });
  
  if (celebParticles.length > 0) {
    requestAnimationFrame(updateCelebrationFrame);
  } else {
    celebrationActive = false;
    window.removeEventListener("resize", resizeCanvas);
    canvasCtx.clearRect(0, 0, elements.celebCanvas.width, elements.celebCanvas.height);
  }
}

// Start executing
document.addEventListener("DOMContentLoaded", init);
