(() => {
  const STORAGE_KEY = "hayatuk-blank-v1";
  const AUTH_KEY = "hayatuk-auth-v1";
  const THEME_KEY = "hayatuk-theme-v1";

  const createEmptyState = (name = "") => ({
    profile: { name },
    quran: { todayDone: 0, todayTarget: 0, khatmaProgress: 0, current: "", nextPage: "", reminder: "" },
    finance: { dailyBudget: 0, monthBudget: 0, expenses: [] },
    goals: [],
    tasks: [],
    reminders: [],
    library: [],
    notes: [],
    memories: [],
    selectedDay: 0
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
  const money = (value) => new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const formatDay = (date = new Date()) => new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long" }).format(date);
  const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء الخير"; };
  const dateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayKey = () => dateKey();
  const localDateTime = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    return `${dateKey(now)}T${hour}:${minute}`;
  };

  const loadJson = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  };

  function normalizeState(stored) {
    const empty = createEmptyState();
    const source = stored || {};
    return {
      ...empty,
      ...source,
      profile: { ...empty.profile, ...(source.profile || {}) },
      quran: { ...empty.quran, ...(source.quran || {}) },
      finance: {
        ...empty.finance,
        ...(source.finance || {}),
        expenses: Array.isArray(source.finance?.expenses) ? source.finance.expenses : []
      },
      goals: Array.isArray(source.goals) ? source.goals : [],
      tasks: Array.isArray(source.tasks) ? source.tasks : [],
      reminders: Array.isArray(source.reminders) ? source.reminders : [],
      library: Array.isArray(source.library) ? source.library : [],
      notes: Array.isArray(source.notes) ? source.notes : [],
      memories: Array.isArray(source.memories) ? source.memories : []
    };
  }

  const storedState = loadJson(STORAGE_KEY);
  let state = normalizeState(storedState);
  let auth = loadJson(AUTH_KEY);
  let route = "today";
  let libraryFilter = "all";
  let fileTarget = "library";
  let toastTimer;

  const screen = document.getElementById("screen");
  const sheetRoot = document.getElementById("sheetRoot");
  const toastElement = document.getElementById("toast");
  const filePicker = document.getElementById("filePicker");
  const authView = document.getElementById("authView");
  const avatarLetter = document.getElementById("avatarLetter");
  const themeIcon = document.getElementById("themeIcon");
  const themeToggle = document.getElementById("themeToggle");
  const themeColor = document.getElementById("themeColor");

  const typeLabels = { all: "الكل", book: "كتب", audio: "صوتي", video: "فيديو", course: "دورات", movie: "أفلام" };
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const doneTasks = () => state.tasks.filter((task) => task.done).length;
  const quranPercent = () => state.quran.todayTarget ? clamp(state.quran.todayDone / state.quran.todayTarget * 100) : 0;
  const progressBar = (value) => `<div class="progress" aria-label="نسبة الإنجاز ${clamp(value)}%"><span style="--progress:${clamp(value)}%"></span></div>`;
  const ring = (value, label, color = "var(--accent)") => `<div class="ring" style="--value:${clamp(value)};--ring-color:${color}" role="img" aria-label="${esc(label)} ${clamp(value)} بالمئة"><div class="ring-copy"><strong>${clamp(value)}%</strong><span>${esc(label)}</span></div></div>`;

  function expenseTotals() {
    const month = todayKey().slice(0, 7);
    return state.finance.expenses.reduce((totals, expense) => {
      const date = String(expense.date || todayKey()).slice(0, 10);
      const amount = Math.max(0, Number(expense.amount) || 0);
      if (date === todayKey()) totals.day += amount;
      if (date.startsWith(month)) totals.month += amount;
      return totals;
    }, { day: 0, month: 0 });
  }

  function hasContent() {
    return Boolean(
      state.goals.length || state.tasks.length || state.reminders.length || state.library.length ||
      state.notes.length || state.memories.length || state.finance.expenses.length ||
      state.finance.dailyBudget || state.finance.monthBudget || state.quran.todayTarget
    );
  }

  function toast(message) {
    clearTimeout(toastTimer);
    toastElement.textContent = message;
    toastElement.classList.add("show");
    toastTimer = setTimeout(() => toastElement.classList.remove("show"), 2500);
  }

  function applyTheme(theme) {
    const selected = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selected;
    localStorage.setItem(THEME_KEY, selected);
    themeIcon.textContent = selected === "dark" ? "☼" : "☾";
    themeToggle.setAttribute("aria-label", selected === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي");
    themeColor.setAttribute("content", selected === "dark" ? "#0d1924" : "#edf3f6");
    document.querySelectorAll("[data-theme-choice]").forEach((button) => button.classList.toggle("active", button.dataset.themeChoice === selected));
  }

  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }

  function showAuth(show) {
    authView.setAttribute("aria-hidden", show ? "false" : "true");
    document.body.classList.toggle("auth-open", show);
    if (show) {
      const nameInput = document.getElementById("loginName");
      const emailInput = document.getElementById("loginEmail");
      if (nameInput && !nameInput.value) nameInput.value = auth?.name || storedState?.profile?.name || "";
      if (emailInput && !emailInput.value) emailInput.value = auth?.email || "";
      setTimeout(() => nameInput?.focus(), 120);
    }
  }

  function syncProfile() {
    const name = auth?.name || state.profile.name || "صديقي";
    state.profile.name = name;
    avatarLetter.textContent = Array.from(name.trim())[0] || "ح";
  }

  function emptyBlock(message, action = "quick-add", label = "إضافة") {
    return `<div class="empty empty-state"><span class="empty-mark">＋</span><p>${esc(message)}</p><button class="soft-button" type="button" data-action="${esc(action)}">${esc(label)}</button></div>`;
  }

  function renderToday() {
    const totals = expenseTotals();
    const blank = !hasContent();
    const taskTotal = state.tasks.length;
    const completed = doneTasks();
    const scoreParts = [];
    if (taskTotal) scoreParts.push(completed / taskTotal * 100);
    if (state.quran.todayTarget) scoreParts.push(quranPercent());
    const score = scoreParts.length ? Math.round(scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length) : 0;

    return `
      <section class="screen">
        <header class="welcome">
          <div>
            <p class="welcome-kicker">${esc(greeting())}</p>
            <h1>${esc(state.profile.name)}</h1>
            <p class="welcome-date">${esc(formatDay())}</p>
          </div>
        </header>

        ${blank ? `
          <article class="day-card blank-card">
            <div class="day-copy">
              <span class="day-label">بداية نظيفة</span>
              <h2>مساحتك فاضية</h2>
              <p>ما فيه أي محتوى جاهز. كل شيء هنا بيكون من إضافتك أنت.</p>
              <button class="primary-button blank-primary" type="button" data-action="quick-add">أضف أول شيء</button>
            </div>
            <span class="blank-orbit" aria-hidden="true">＋</span>
          </article>` : `
          <article class="day-card">
            <div class="day-copy">
              <span class="day-label">ملخصك</span>
              <h2>هذا ما أضفته اليوم</h2>
              <p>لا اقتراحات جاهزة ولا بيانات تجريبية؛ الأرقام من محتواك فقط.</p>
              <div class="day-stats">
                <span>${Math.max(0, taskTotal - completed)} مهام باقية</span>
                <span>${state.reminders.length} تذكيرات</span>
                <span>${money(totals.day)} ر.س اليوم</span>
              </div>
            </div>
            ${scoreParts.length ? `<div class="day-ring" style="--value:${score}" role="img" aria-label="اكتمل ${score} بالمئة"><div class="ring-copy"><strong>${score}%</strong><span>إنجازك</span></div></div>` : `<span class="blank-orbit" aria-hidden="true">ح</span>`}
          </article>`}

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>إضافة سريعة</h2><p>اختر ما تريد إضافته</p></div></div>
          <div class="quick-grid">
            <button class="quick-action" type="button" data-compose="task"><span class="quick-icon" style="--icon-bg:var(--blue-soft);--icon-color:var(--blue)">✓</span><strong>مهمة</strong></button>
            <button class="quick-action" type="button" data-compose="reminder"><span class="quick-icon" style="--icon-bg:var(--accent-soft);--icon-color:var(--accent-strong)">□</span><strong>تذكير</strong></button>
            <button class="quick-action" type="button" data-compose="note"><span class="quick-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">✎</span><strong>ملاحظة</strong></button>
            <button class="quick-action" type="button" data-compose="expense"><span class="quick-icon" style="--icon-bg:var(--green-soft);--icon-color:var(--green)">ر.س</span><strong>مصروف</strong></button>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>مساحاتك</h2><p>كل قسم يبدأ فارغًا</p></div></div>
          <div class="spaces-grid">
            <button class="space-card" type="button" data-module="quran"><span class="space-icon" style="--icon-bg:var(--green-soft);--icon-color:var(--green)">۞</span><span><strong>الورد</strong><small>${state.quran.todayTarget ? `${state.quran.todayDone}/${state.quran.todayTarget} صفحات` : "فارغ"}</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="finance"><span class="space-icon">ر.س</span><span><strong>الميزانية</strong><small>${state.finance.expenses.length ? `${money(totals.month)} ر.س هذا الشهر` : "فارغة"}</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="memories"><span class="space-icon" style="--icon-bg:var(--rose-soft);--icon-color:var(--rose)">◫</span><span><strong>الذكريات</strong><small>${state.memories.length ? `${state.memories.length} محفوظة` : "فارغة"}</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="growth"><span class="space-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">↗</span><span><strong>تطويري</strong><small>${state.library.length ? `${state.library.length} مواد` : "فارغ"}</small></span><span class="space-arrow">‹</span></button>
          </div>
          <button class="more-card" type="button" data-action="open-more"><span>☰</span><span>عرض كل الأقسام</span></button>
        </section>
      </section>`;
  }

  function renderTasks() {
    if (!state.tasks.length) return emptyBlock("لا توجد مهام.", "compose-task", "إضافة مهمة");
    return state.tasks.map((task) => `<article class="task ${task.done ? "done" : ""}"><button class="check ${task.done ? "done" : ""}" type="button" data-action="toggle-task" data-id="${esc(task.id)}" aria-label="${task.done ? "إلغاء إكمال" : "إكمال"} ${esc(task.title)}">${task.done ? "✓" : ""}</button><div class="task-copy"><strong>${esc(task.title)}</strong><span>${esc(task.meta || "بدون تفاصيل")}</span></div><span class="task-tag">${task.done ? "مكتملة" : "مهمة"}</span></article>`).join("");
  }

  function renderPlan() {
    return `
      <section class="screen">
        <header class="page-head"><div class="page-head-row"><div><p class="eyebrow">من الصفر</p><h1>خطتي</h1><p>لا توجد أهداف أو مهام جاهزة.</p></div><button class="soft-button" type="button" data-compose="goal">＋ هدف</button></div></header>
        <section class="section"><div class="section-head"><div class="section-title"><h2>أهدافي</h2><p>${state.goals.length} أهداف</p></div></div><div class="goal-list">
          ${state.goals.length ? state.goals.map((goal) => `<article class="goal-card"><div class="goal-top"><div class="goal-title"><span class="module-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">◇</span><div><strong>${esc(goal.title)}</strong><span>${esc(goal.area || "هدف شخصي")}</span></div></div><span class="goal-percent">${clamp(goal.progress)}%</span></div>${progressBar(goal.progress)}<div class="goal-next"><span>${esc(goal.next || "")}</span><button class="mini-action" type="button" data-action="goal-step" data-id="${esc(goal.id)}">سجّل خطوة</button></div></article>`).join("") : emptyBlock("لا توجد أهداف.", "compose-goal", "إضافة هدف")}
        </div></section>
        <section class="section"><div class="section-head"><div class="section-title"><h2>المهام</h2><p>${state.tasks.length} مهام</p></div><button class="text-button" type="button" data-compose="task">＋ مهمة</button></div><div class="task-list">${renderTasks()}</div></section>
      </section>`;
  }

  function renderLibrary() {
    const items = state.library.filter((item) => libraryFilter === "all" || item.type === libraryFilter);
    return `
      <section class="screen">
        <header class="page-head"><div class="page-head-row"><div><p class="eyebrow">ملفاتك فقط</p><h1>مكتبتي</h1><p>لا توجد كتب أو مواد مضافة مسبقًا.</p></div><button class="soft-button" type="button" data-action="pick-files" data-target="library">＋ ملف</button></div></header>
        <div class="filter-row">${Object.entries(typeLabels).map(([key, label]) => `<button class="filter-chip ${libraryFilter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("")}</div>
        <section class="section"><div class="section-head"><div class="section-title"><h2>${esc(typeLabels[libraryFilter])}</h2><p>${items.length} مواد</p></div><button class="text-button" type="button" data-compose="library">＋ إضافة يدوية</button></div><div class="media-list">
          ${items.length ? items.map((item) => `<article class="media-item"><div class="media-thumb" style="--thumb:${esc(item.cover)}">${esc(item.icon)}</div><div class="media-copy"><strong>${esc(item.title)}</strong><span>${esc(item.author || "")}${item.detail ? ` · ${esc(item.detail)}` : ""}</span>${progressBar(item.progress)}</div><button class="continue-button" type="button" data-action="library-progress" data-id="${esc(item.id)}" aria-label="زيادة تقدم ${esc(item.title)}">›</button></article>`).join("") : emptyBlock("لا توجد مواد في هذا القسم.", "pick-library", "اختيار ملف")}
        </div></section>
      </section>`;
  }

  function calendarDays() {
    const labels = ["اليوم", "غدًا", "بعده"];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return {
        index,
        key: dateKey(date),
        label: labels[index] || new Intl.DateTimeFormat("ar-SA", { weekday: "short" }).format(date),
        day: new Intl.DateTimeFormat("ar-SA-u-nu-latn", { day: "numeric" }).format(date)
      };
    });
  }

  function renderCalendar() {
    const days = calendarDays();
    const selectedKey = days[state.selectedDay]?.key || days[0].key;
    const selectedItems = state.reminders.filter((item) => String(item.date || todayKey()).slice(0, 10) === selectedKey);
    return `
      <section class="screen">
        <header class="page-head"><div class="page-head-row"><div><p class="eyebrow">مواعيدك أنت</p><h1>التقويم</h1><p>لا توجد مواعيد أو تذكيرات جاهزة.</p></div><button class="soft-button" type="button" data-compose="reminder">＋ تذكير</button></div></header>
        <div class="week-strip">${days.map((day) => `<button class="day-button ${state.selectedDay === day.index ? "active" : ""}" type="button" data-day="${day.index}"><span>${esc(day.label)}</span><strong>${esc(day.day)}</strong></button>`).join("")}</div>
        <section class="section"><div class="section-head"><div class="section-title"><h2>${state.selectedDay === 0 ? "اليوم" : "المواعيد"}</h2><p>${selectedItems.length} عناصر</p></div></div><div class="timeline">
          ${selectedItems.length ? selectedItems.map((item) => `<article class="timeline-item"><span class="timeline-time">${esc(item.time || "—")}</span><div class="timeline-copy"><strong>${esc(item.title)}</strong><span>${esc(item.meta || "بدون تفاصيل")}</span></div><span class="status-pill">تذكير</span></article>`).join("") : emptyBlock("لا توجد تذكيرات في هذا اليوم.", "compose-reminder", "إضافة تذكير")}
        </div></section>
      </section>`;
  }

  function render() {
    syncProfile();
    screen.innerHTML = route === "plan" ? renderPlan() : route === "library" ? renderLibrary() : route === "calendar" ? renderCalendar() : renderToday();
    document.querySelectorAll("[data-route]").forEach((button) => button.classList.toggle("active", button.dataset.route === route));
    applyTheme(document.documentElement.dataset.theme || "light");
  }

  function sheetFrame(title, subtitle, body) {
    return `<div class="sheet-backdrop" data-action="close-sheet"><section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-handle"></div><header class="sheet-head"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="close" type="button" data-action="close-sheet" aria-label="إغلاق">×</button></header>${body}</section></div>`;
  }

  function openQuickAdd() {
    const types = [
      ["task", "✓", "مهمة", ""], ["reminder", "□", "تذكير", ""], ["note", "✎", "ملاحظة", ""],
      ["expense", "ر.س", "مصروف", ""], ["memory", "◫", "ذكرى", ""], ["library", "▤", "مادة", ""]
    ];
    sheetRoot.innerHTML = sheetFrame("إضافة جديدة", "اختر النوع", `<div class="type-grid">${types.map(([key, icon, label, hint]) => `<button class="type-button" type="button" data-compose="${key}"><span class="type-icon">${icon}</span><strong>${label}</strong><span>${hint}</span></button>`).join("")}</div>`);
  }

  function openComposer(type) {
    const info = {
      task: ["مهمة جديدة", "", "اكتب عنوان المهمة"],
      reminder: ["تذكير جديد", "", "اكتب عنوان التذكير"],
      note: ["ملاحظة جديدة", "", "اكتب عنوان الملاحظة"],
      expense: ["مصروف جديد", "", "اكتب اسم المصروف"],
      memory: ["ذكرى جديدة", "", "اكتب عنوان الذكرى"],
      library: ["مادة جديدة", "", "اكتب اسم المادة"],
      goal: ["هدف جديد", "", "اكتب اسم الهدف"]
    }[type] || ["إضافة جديدة", "", "اكتب العنوان"];
    const goalOptions = state.goals.map((goal) => `<option value="${esc(goal.id)}">${esc(goal.title)}</option>`).join("");
    const amountField = type === "expense" ? `<div class="field"><label for="quickAmount">المبلغ (ر.س)</label><input id="quickAmount" name="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" required></div>` : "";
    const fileButton = type === "memory" || type === "library" ? `<button class="ghost-button" type="button" data-action="pick-files" data-target="${type === "memory" ? "memories" : "library"}">اختيار ملف من الجهاز</button>` : "";
    const dateRequired = type === "reminder" ? "required" : "";
    sheetRoot.innerHTML = sheetFrame(info[0], info[1], `<form class="form" id="quickForm" data-type="${esc(type)}"><div class="field"><label for="quickTitle">العنوان</label><input id="quickTitle" name="title" required maxlength="120" placeholder="${esc(info[2])}" autocomplete="off"></div><div class="field"><label for="quickDetails">التفاصيل <span>اختياري</span></label><textarea id="quickDetails" name="details" maxlength="500"></textarea></div>${amountField}<div class="field"><label for="quickDate">${type === "reminder" ? "التاريخ والوقت" : "الموعد (اختياري)"}</label><input id="quickDate" name="date" type="datetime-local" dir="ltr" ${dateRequired}></div><div class="field"><label for="quickGoal">مرتبط بهدف <span>اختياري</span></label><select id="quickGoal" name="goal"><option value="">بدون ارتباط</option>${goalOptions}</select></div>${fileButton}<div class="form-actions"><button class="primary-button" type="submit">حفظ</button><button class="ghost-button" type="button" data-action="close-sheet">إلغاء</button></div></form>`);
    setTimeout(() => document.getElementById("quickTitle")?.focus(), 80);
  }

  function openQuranSetup() {
    sheetRoot.innerHTML = sheetFrame("إعداد الورد", "لن يظهر شيء حتى تدخله أنت", `<form class="form" id="quranForm"><div class="field"><label for="quranTarget">عدد صفحات اليوم</label><input id="quranTarget" name="target" type="number" min="1" max="604" inputmode="numeric" required value="${esc(state.quran.todayTarget || "")}"></div><div class="field"><label for="quranCurrent">السورة الحالية <span>اختياري</span></label><input id="quranCurrent" name="current" maxlength="80" value="${esc(state.quran.current)}"></div><div class="field"><label for="quranPage">رقم الصفحة الحالية <span>اختياري</span></label><input id="quranPage" name="nextPage" type="number" min="1" max="604" inputmode="numeric" value="${esc(state.quran.nextPage)}"></div><div class="field"><label for="quranReminder">وقت التذكير <span>اختياري</span></label><input id="quranReminder" name="reminder" type="time" dir="ltr" value="${esc(state.quran.reminder)}"></div><div class="form-actions"><button class="primary-button" type="submit">حفظ</button><button class="ghost-button" type="button" data-action="close-sheet">إلغاء</button></div></form>`);
  }

  function openFinanceSetup() {
    sheetRoot.innerHTML = sheetFrame("إعداد الميزانية", "اترك أي خانة لا تحتاجها", `<form class="form" id="budgetForm"><div class="field"><label for="dailyBudget">ميزانية اليوم (ر.س)</label><input id="dailyBudget" name="dailyBudget" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(state.finance.dailyBudget || "")}"></div><div class="field"><label for="monthBudget">ميزانية الشهر (ر.س)</label><input id="monthBudget" name="monthBudget" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(state.finance.monthBudget || "")}"></div><div class="form-actions"><button class="primary-button" type="submit">حفظ</button><button class="ghost-button" type="button" data-action="close-sheet">إلغاء</button></div></form>`);
  }

  function moduleBody(module) {
    if (module === "quran") {
      if (!state.quran.todayTarget) return sheetFrame("ورد القرآن", "فارغ", `${emptyBlock("لم تحدد وردًا بعد.", "configure-quran", "إعداد الورد")}`);
      const location = [state.quran.current ? `سورة ${esc(state.quran.current)}` : "", state.quran.nextPage ? `الصفحة ${esc(state.quran.nextPage)}` : ""].filter(Boolean).join(" · ");
      return sheetFrame("ورد القرآن", "بياناتك أنت", `<article class="detail-hero"><div class="detail-hero-row"><div><span class="tiny">ورد اليوم</span><div class="detail-big">${state.quran.todayDone} <small>من ${state.quran.todayTarget} صفحة</small></div>${location ? `<p class="quran-line">${location}</p>` : ""}</div>${ring(quranPercent(), "ورد اليوم", "var(--green)")}</div><button class="primary-button full-button" type="button" data-action="quran-page">سجّل صفحة</button><button class="ghost-button full-button" type="button" data-action="configure-quran">تعديل الإعداد</button></article>`);
    }
    if (module === "finance") {
      const totals = expenseTotals();
      const hasFinance = state.finance.expenses.length || state.finance.dailyBudget || state.finance.monthBudget;
      if (!hasFinance) return sheetFrame("المال والميزانية", "فارغة", `${emptyBlock("لم تسجل ميزانية أو مصروفًا.", "compose-expense", "تسجيل مصروف")}<button class="ghost-button full-button" type="button" data-action="configure-finance">إعداد الميزانية</button>`);
      const monthlyPercent = state.finance.monthBudget ? totals.month / state.finance.monthBudget * 100 : 0;
      return sheetFrame("المال والميزانية", "بياناتك أنت", `<article class="detail-hero"><span class="tiny">مصروف هذا الشهر</span><div class="detail-big">${money(totals.month)} <small>ر.س</small></div>${state.finance.monthBudget ? progressBar(monthlyPercent) : ""}<div class="library-actions"><button class="primary-button" type="button" data-compose="expense">تسجيل مصروف</button><button class="ghost-button" type="button" data-action="configure-finance">إعداد الميزانية</button></div></article><div class="detail-list">${state.finance.expenses.length ? state.finance.expenses.map((expense) => `<div class="detail-row"><div><strong>${esc(expense.title)}</strong><span>${esc(expense.details || expense.date || "")}</span></div><span class="detail-value">${money(expense.amount)} ر.س</span></div>`).join("") : `<div class="empty">لا توجد مصروفات.</div>`}</div>`);
    }
    if (module === "memories") return sheetFrame("الذكريات", "فارغة حتى تضيف", `${state.memories.length ? `<div class="detail-list">${state.memories.map((item) => `<div class="detail-row"><div><strong>${esc(item.title)}</strong><span>${esc(item.body || "")}</span></div><span class="detail-value">${esc(item.icon || "◫")}</span></div>`).join("")}</div>` : emptyBlock("لا توجد ذكريات محفوظة.", "compose-memory", "إضافة ذكرى")}<button class="ghost-button full-button" type="button" data-action="pick-files" data-target="memories">اختيار صورة أو فيديو</button>`);
    if (module === "notes") return sheetFrame("الملاحظات", "فارغة حتى تكتب", `${state.notes.length ? `<div class="note-grid">${state.notes.map((note) => `<article class="note" style="--note-bg:${esc(note.tone)}"><strong>${esc(note.title)}</strong><p>${esc(note.body || "")}</p></article>`).join("")}</div>` : emptyBlock("لا توجد ملاحظات.", "compose-note", "إضافة ملاحظة")}<button class="primary-button full-button" type="button" data-compose="note">ملاحظة جديدة</button>`);
    if (module === "tasks") return sheetFrame("المهام", "فارغة حتى تضيف", `<div class="task-list">${renderTasks()}</div><button class="primary-button full-button" type="button" data-compose="task">مهمة جديدة</button>`);
    if (module === "growth") return sheetFrame("تطويري", "موادك أنت فقط", `${state.library.length ? `<div class="detail-list">${state.library.map((item) => `<div class="detail-row"><div><strong>${esc(item.title)}</strong><span>${esc(typeLabels[item.type] || "مادة")}</span></div><span class="detail-value">${clamp(item.progress)}%</span></div>`).join("")}</div>` : emptyBlock("لا توجد كتب أو دورات أو مواد.", "compose-library", "إضافة مادة")}<button class="ghost-button full-button" type="button" data-route="library">فتح المكتبة</button>`);
    return sheetFrame("حياتك", "", `<div class="empty">هذه المساحة فارغة.</div>`);
  }

  function openMore() {
    const modules = [
      ["tasks", "✓", "المهام", ""], ["notes", "✎", "الملاحظات", ""], ["memories", "◫", "الذكريات", ""],
      ["quran", "۞", "الورد", ""], ["finance", "ر.س", "الميزانية", ""], ["growth", "↗", "تطويري", ""]
    ];
    sheetRoot.innerHTML = sheetFrame("كل الأقسام", "بدون محتوى جاهز", `<div class="module-grid">${modules.map(([key, icon, label, hint]) => `<button class="module-button" type="button" data-module="${key}"><span class="module-icon">${icon}</span><strong>${label}</strong><span>${hint}</span></button>`).join("")}</div>`);
  }

  function openProfile() {
    const selectedTheme = document.documentElement.dataset.theme || "light";
    sheetRoot.innerHTML = sheetFrame("ملفي", "إعدادات التطبيق", `<article class="profile-card"><div class="profile-row"><span class="profile-avatar">${esc(Array.from(state.profile.name)[0] || "ح")}</span><div class="profile-copy"><strong>${esc(state.profile.name)}</strong><span>${esc(auth?.email || "دخول محلي على هذا الجهاز")}</span></div></div></article><section class="section"><div class="section-head"><div class="section-title"><h2>المظهر</h2><p>يُحفظ اختيارك على الجهاز</p></div></div><div class="theme-choice"><button class="${selectedTheme === "light" ? "active" : ""}" type="button" data-theme-choice="light">☼ نهاري</button><button class="${selectedTheme === "dark" ? "active" : ""}" type="button" data-theme-choice="dark">☾ ليلي</button></div></section><div class="detail-list sheet-gap"><div class="detail-row"><div><strong>الخصوصية</strong><span>بيانات هذه النسخة محلية</span></div><span class="detail-value">على جهازك</span></div></div><div class="profile-actions"><button class="ghost-button danger" type="button" data-action="clear-data">تفريغ المحتوى</button><button class="ghost-button" type="button" data-action="logout">تسجيل الخروج</button></div>`);
  }

  function closeSheet() {
    sheetRoot.innerHTML = "";
  }

  function handleQuickForm(form) {
    const data = new FormData(form);
    const type = form.dataset.type;
    const title = String(data.get("title") || "").trim();
    const details = String(data.get("details") || "").trim();
    const date = String(data.get("date") || "");
    if (!title) return;
    const id = `${type}-${Date.now()}`;
    if (type === "task") state.tasks.unshift({ id, title, meta: details, date, goalId: String(data.get("goal") || ""), done: false });
    if (type === "reminder") state.reminders.push({ id, date, time: date ? date.slice(11, 16) : "", title, meta: details, goalId: String(data.get("goal") || "") });
    if (type === "note") state.notes.unshift({ id, title, body: details, tone: "var(--blue-soft)" });
    if (type === "expense") state.finance.expenses.unshift({ id, title, details, date: date || localDateTime(), amount: Math.max(0, Number(data.get("amount")) || 0) });
    if (type === "memory") state.memories.unshift({ id, title, body: details, icon: "◫" });
    if (type === "library") state.library.unshift({ id, type: "book", icon: "▤", title, author: details, progress: 0, detail: "", cover: "linear-gradient(145deg,#688790,#32454a)" });
    if (type === "goal") state.goals.unshift({ id, title, area: details, progress: 0, next: "" });
    save();
    closeSheet();
    render();
    toast("تم الحفظ");
  }

  function handleClick(event) {
    const target = event.target.closest("button, [data-module], [data-action]");
    if (!target || target.disabled) return;

    if (target.dataset.route) {
      route = target.dataset.route;
      closeSheet();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (target.dataset.module) { sheetRoot.innerHTML = moduleBody(target.dataset.module); return; }
    if (target.dataset.compose) { openComposer(target.dataset.compose); return; }
    if (target.dataset.filter) { libraryFilter = target.dataset.filter; render(); return; }
    if (target.dataset.day !== undefined) { state.selectedDay = Number(target.dataset.day); save(); render(); return; }
    if (target.dataset.themeChoice) { applyTheme(target.dataset.themeChoice); return; }

    const action = target.dataset.action;
    if (action === "close-sheet" && target.classList.contains("sheet-backdrop") && event.target.closest(".sheet")) return;
    if (action === "toggle-theme") toggleTheme();
    if (action === "quick-add") openQuickAdd();
    if (action === "open-more") openMore();
    if (action === "close-sheet") closeSheet();
    if (action === "profile") openProfile();
    if (action === "pick-files") { fileTarget = target.dataset.target || "library"; filePicker.click(); }
    if (action === "pick-library") { fileTarget = "library"; filePicker.click(); }
    if (action === "compose-task") openComposer("task");
    if (action === "compose-goal") openComposer("goal");
    if (action === "compose-reminder") openComposer("reminder");
    if (action === "compose-expense") openComposer("expense");
    if (action === "compose-memory") openComposer("memory");
    if (action === "compose-note") openComposer("note");
    if (action === "compose-library") openComposer("library");
    if (action === "configure-quran") openQuranSetup();
    if (action === "configure-finance") openFinanceSetup();
    if (action === "toggle-task") {
      const task = state.tasks.find((item) => item.id === target.dataset.id);
      if (task) { task.done = !task.done; save(); render(); if (sheetRoot.innerHTML) sheetRoot.innerHTML = moduleBody("tasks"); toast(task.done ? "تم الإنجاز" : "أعيدت المهمة"); }
    }
    if (action === "goal-step") {
      const goal = state.goals.find((item) => item.id === target.dataset.id);
      if (goal) { goal.progress = clamp(goal.progress + 5); save(); render(); toast("سُجل التقدم"); }
    }
    if (action === "quran-page") {
      if (!state.quran.todayTarget) { openQuranSetup(); return; }
      state.quran.todayDone = Math.min(state.quran.todayTarget, state.quran.todayDone + 1);
      state.quran.khatmaProgress = clamp(state.quran.khatmaProgress + 1);
      save(); render(); if (sheetRoot.innerHTML) sheetRoot.innerHTML = moduleBody("quran"); toast("سُجلت صفحة");
    }
    if (action === "library-progress") {
      const item = state.library.find((entry) => entry.id === target.dataset.id);
      if (item) { item.progress = clamp(item.progress + 5); item.detail = `${item.progress}%`; save(); render(); toast("سُجل التقدم"); }
    }
    if (action === "clear-data") {
      if (!window.confirm("هل تريد تفريغ جميع محتويات التطبيق من هذا الجهاز؟")) return;
      state = createEmptyState(auth?.name || "");
      save(); closeSheet(); route = "today"; render(); toast("تم تفريغ المحتوى");
    }
    if (action === "logout") {
      localStorage.removeItem(AUTH_KEY);
      auth = null;
      closeSheet();
      showAuth(true);
    }
  }

  document.addEventListener("click", handleClick);

  document.addEventListener("submit", (event) => {
    if (event.target.id === "quickForm") {
      event.preventDefault();
      handleQuickForm(event.target);
    }
    if (event.target.id === "quranForm") {
      event.preventDefault();
      const data = new FormData(event.target);
      state.quran.todayTarget = Math.max(1, Number(data.get("target")) || 1);
      state.quran.todayDone = Math.min(state.quran.todayDone, state.quran.todayTarget);
      state.quran.current = String(data.get("current") || "").trim();
      state.quran.nextPage = String(data.get("nextPage") || "").trim();
      state.quran.reminder = String(data.get("reminder") || "");
      save(); sheetRoot.innerHTML = moduleBody("quran"); render(); toast("تم حفظ الورد");
    }
    if (event.target.id === "budgetForm") {
      event.preventDefault();
      const data = new FormData(event.target);
      state.finance.dailyBudget = Math.max(0, Number(data.get("dailyBudget")) || 0);
      state.finance.monthBudget = Math.max(0, Number(data.get("monthBudget")) || 0);
      save(); sheetRoot.innerHTML = moduleBody("finance"); render(); toast("تم حفظ الميزانية");
    }
    if (event.target.id === "loginForm") {
      event.preventDefault();
      const data = new FormData(event.target);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      if (!name) return;
      auth = { name, email, signedInAt: new Date().toISOString() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
      state.profile.name = name;
      save();
      showAuth(false);
      render();
      toast(`أهلًا ${name}`);
    }
  });

  filePicker.addEventListener("change", () => {
    const files = Array.from(filePicker.files || []);
    if (!files.length) return;
    if (fileTarget === "memories") {
      files.forEach((file) => state.memories.unshift({ id: `memory-file-${Date.now()}-${Math.random()}`, title: file.name.replace(/\.[^.]+$/, ""), body: `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`, icon: file.type.startsWith("video/") ? "▶" : file.type.startsWith("audio/") ? "♫" : "◫" }));
      save(); closeSheet(); render(); toast(`أُضيف ${files.length} ملف`);
    } else {
      files.forEach((file) => {
        const type = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : /pdf|epub|mobi/i.test(file.name) ? "book" : "course";
        state.library.unshift({ id: `file-${Date.now()}-${Math.random()}`, type, icon: type === "audio" ? "♫" : type === "video" ? "▶" : "▤", title: file.name.replace(/\.[^.]+$/, ""), author: `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`, progress: 0, detail: "", cover: "linear-gradient(145deg,#688790,#32454a)" });
      });
      save(); closeSheet(); route = "library"; render(); toast(`أُضيف ${files.length} ملف`);
    }
    filePicker.value = "";
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSheet();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openQuickAdd(); }
  });

  applyTheme(document.documentElement.dataset.theme || "light");
  render();
  showAuth(!(auth && auth.name));
})();
