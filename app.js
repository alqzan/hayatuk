(() => {
  const STORAGE_KEY = "hayatuk-preview-v3";
  const LEGACY_KEY = "hayatuk-preview-v2";
  const AUTH_KEY = "hayatuk-auth-v1";
  const THEME_KEY = "hayatuk-theme-v1";

  const seed = {
    profile: { name: "عبدالرحمن", streak: 12 },
    quran: { todayDone: 8, todayTarget: 12, khatmaProgress: 37, current: "آل عمران", nextPage: 64, reminder: "بعد الفجر" },
    finance: { dailySpent: 128, dailyBudget: 220, monthSpent: 3670, monthBudget: 5200 },
    intention: { selected: "إتقان العمل", done: false },
    reflection: { answers: [null, null, null], saved: false },
    goals: [
      { id: "g1", icon: "✦", title: "الاستعداد لاختبار CFA", area: "تطوير مهني", progress: 64, next: "جلسة مذاكرة 45 دقيقة" },
      { id: "g2", icon: "◌", title: "ختم القرآن بانتظام", area: "روحاني", progress: 37, next: "إكمال 4 صفحات اليوم" },
      { id: "g3", icon: "↗", title: "ضبط المصروف الشهري", area: "مالي", progress: 71, next: "مراجعة اشتراكات هذا الأسبوع" }
    ],
    tasks: [
      { id: "t1", title: "مراجعة القراءة الثالثة", meta: "CFA · قبل 8:00 م", tag: "هدف", done: false },
      { id: "t2", title: "تسجيل مصروفات اليوم", meta: "المال · دقيقتان", tag: "روتين", done: true },
      { id: "t3", title: "الاتصال بالوالدة", meta: "شخصي · 9:00 م", tag: "موعد", done: false }
    ],
    reminders: [
      { id: "r1", time: "05:10", title: "ورد القرآن", meta: "12 صفحة · مرتبط بهدف الختمة", status: "متكرر" },
      { id: "r2", time: "18:30", title: "جلسة مذاكرة CFA", meta: "45 دقيقة · الهدف المهني", status: "اليوم" },
      { id: "r3", time: "20:00", title: "سداد فاتورة الإنترنت", meta: "متوقع 287 ر.س · الميزانية", status: "مالي" },
      { id: "r4", time: "21:15", title: "إغلاق اليوم وكتابة سطر", meta: "مذكرة قصيرة قبل النوم", status: "يومي" }
    ],
    library: [
      { id: "l1", type: "book", icon: "ب", title: "العادات الذرية", author: "جيمس كلير", progress: 42, detail: "صفحة 136 من 320", cover: "linear-gradient(145deg,#8e7047,#463725)" },
      { id: "l2", type: "course", icon: "▶", title: "مراجعة التحليل المالي", author: "دورة · 18 درسًا", progress: 61, detail: "الدرس 11 من 18", cover: "linear-gradient(145deg,#66839a,#2d4353)" },
      { id: "l3", type: "audio", icon: "♫", title: "فن التركيز والإنجاز", author: "كتاب صوتي · 6 س 20 د", progress: 28, detail: "1 س 46 د مستمع", cover: "linear-gradient(145deg,#7b7197,#3d374f)" },
      { id: "l4", type: "video", icon: "◉", title: "محاضرة: إدارة الطاقة", author: "فيديو · 54 دقيقة", progress: 73, detail: "39 دقيقة مشاهدة", cover: "linear-gradient(145deg,#568579,#29443e)" },
      { id: "l5", type: "movie", icon: "▣", title: "فيلم محفوظ للمشاهدة", author: "فيلم · ساعتان", progress: 12, detail: "14 دقيقة مشاهدة", cover: "linear-gradient(145deg,#95656c,#4a3237)" }
    ],
    notes: [
      { id: "n1", title: "فكرة اليوم", body: "التقدم الذي أراه أهم من الخطة المثالية التي لا أبدأها.", tone: "var(--green-soft)" },
      { id: "n2", title: "قائمة سريعة", body: "تحديث الوثائق، حجز الموعد، مراجعة مصروف السيارة.", tone: "var(--accent-soft)" },
      { id: "n3", title: "من كتاب", body: "اجعل البيئة تساعدك على العادة بدل الاعتماد على الإرادة وحدها.", tone: "var(--violet-soft)" }
    ],
    memories: [
      { id: "m1", title: "رحلة شتوية", body: "قبل 4 سنوات · 7 صور وفيديو", icon: "◫" },
      { id: "m2", title: "يوم هادئ", body: "مذكرة صوتية · دقيقتان", icon: "♫" }
    ],
    selectedDay: 0
  };

  const intentionOptions = ["الصدق", "كف اللسان", "الإحسان للوالدين", "الصبر عند الغضب", "إتقان العمل"];
  const reflectionQuestions = [
    { question: "ما أحسنت فيه اليوم؟", options: ["خطوة نحو هدفي", "صلة رحم", "ورد لم أتركه", "كلمة طيبة"] },
    { question: "ما الذي قصّرت فيه؟", options: ["تأخير مهمة", "وقت ضاع", "مصروف زائد", "راحة لم آخذها"] },
    { question: "ماذا تنوي غدًا؟", options: ["أبدأ بالأهم", "أخفف المشتتات", "أتحرك أكثر", "أكون أهدأ"] }
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
  const money = (value) => new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 }).format(value);
  const formatDay = (date = new Date()) => new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long" }).format(date);
  const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "صباح الخير" : hour < 18 ? "مساء النشاط" : "مساء الخير"; };

  const mergeState = (stored) => ({
    ...clone(seed),
    ...(stored || {}),
    profile: { ...clone(seed.profile), ...(stored?.profile || {}) },
    quran: { ...clone(seed.quran), ...(stored?.quran || {}) },
    finance: { ...clone(seed.finance), ...(stored?.finance || {}) },
    intention: { ...clone(seed.intention), ...(stored?.intention || {}) },
    reflection: { ...clone(seed.reflection), ...(stored?.reflection || {}) }
  });

  const loadJson = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  };

  const storedState = loadJson(STORAGE_KEY) || loadJson(LEGACY_KEY);
  let state = mergeState(storedState);
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

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const doneTasks = () => state.tasks.filter((task) => task.done).length;
  const quranPercent = () => clamp(state.quran.todayDone / Math.max(1, state.quran.todayTarget) * 100);
  const dailyScore = () => Math.round((quranPercent() + (state.tasks.length ? doneTasks() / state.tasks.length * 100 : 100) + (state.intention.done ? 100 : 55)) / 3);
  const typeLabels = { all: "الكل", book: "كتب", audio: "صوتي", video: "فيديو", course: "دورات", movie: "أفلام" };

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
    themeColor.setAttribute("content", selected === "dark" ? "#171c18" : "#f7f3eb");
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
      if (nameInput && !nameInput.value) nameInput.value = auth?.name || (storedState?.profile?.name ?? "");
      if (emailInput && !emailInput.value) emailInput.value = auth?.email || "";
      setTimeout(() => nameInput?.focus(), 120);
    }
  }

  function syncProfile() {
    const name = auth?.name || state.profile.name || "صديقي";
    state.profile.name = name;
    avatarLetter.textContent = Array.from(name.trim())[0] || "ح";
  }

  const progressBar = (value) => `<div class="progress" aria-label="نسبة الإنجاز ${clamp(value)}%"><span style="--progress:${clamp(value)}%"></span></div>`;
  const ring = (value, label, color = "var(--accent)") => `<div class="ring" style="--value:${clamp(value)};--ring-color:${color}" role="img" aria-label="${esc(label)} ${clamp(value)} بالمئة"><div class="ring-copy"><strong>${clamp(value)}%</strong><span>${esc(label)}</span></div></div>`;

  function compassSuggestion() {
    const task = state.tasks.find((item) => !item.done);
    if (task) return { kind: "task", id: task.id, icon: "✓", title: task.title, meta: task.meta, reason: "أقرب خطوة واضحة تحرّك أحد أهدافك", action: "أنجزتها" };
    if (state.quran.todayDone < state.quran.todayTarget) return { kind: "quran", icon: "۞", title: `اقرأ ${state.quran.todayTarget - state.quran.todayDone} صفحات`, meta: `سورة ${state.quran.current} · الصفحة ${state.quran.nextPage}`, reason: "تكمل بها ورد اليوم", action: "قرأت صفحة" };
    const item = state.library.find((entry) => entry.progress < 100);
    return { kind: "library", id: item?.id, icon: "▤", title: item?.title || "اختر مادة من مكتبتك", meta: item?.detail || "جلسة قصيرة", reason: "عشر دقائق تكفي لبدء الحركة", action: "ابدأ" };
  }

  function renderToday() {
    const score = dailyScore();
    const compass = compassSuggestion();
    const remainingTasks = Math.max(0, state.tasks.length - doneTasks());
    const remainingPages = Math.max(0, state.quran.todayTarget - state.quran.todayDone);
    return `
      <section class="screen">
        <header class="welcome">
          <div>
            <p class="welcome-kicker">${esc(greeting())}</p>
            <h1>${esc(state.profile.name)}</h1>
            <p class="welcome-date">${esc(formatDay())}</p>
          </div>
          <span class="streak">✦ ${state.profile.streak} يومًا</span>
        </header>

        <article class="day-card">
          <div class="day-copy">
            <span class="day-label">صورة يومك</span>
            <h2>${score >= 75 ? "يومك يسير باتزان" : "بقي القليل ليكتمل يومك"}</h2>
            <p>لا تحتاج رؤية كل شيء الآن؛ ركّز على الخطوة الأقرب فقط.</p>
            <div class="day-stats">
              <span>${remainingTasks} مهام باقية</span>
              <span>${remainingPages} صفحات</span>
              <span>${money(state.finance.dailySpent)} ر.س اليوم</span>
            </div>
          </div>
          <div class="day-ring" style="--value:${score}" role="img" aria-label="اكتمل ${score} بالمئة من اليوم"><div class="ring-copy"><strong>${score}%</strong><span>من يومك</span></div></div>
        </article>

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>أضف بسرعة</h2><p>أكثر الأشياء استخدامًا</p></div></div>
          <div class="quick-grid">
            <button class="quick-action" type="button" data-compose="task"><span class="quick-icon" style="--icon-bg:var(--blue-soft);--icon-color:var(--blue)">✓</span><strong>مهمة</strong></button>
            <button class="quick-action" type="button" data-compose="expense"><span class="quick-icon" style="--icon-bg:var(--green-soft);--icon-color:var(--green)">ر.س</span><strong>مصروف</strong></button>
            <button class="quick-action" type="button" data-compose="note"><span class="quick-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">✎</span><strong>ملاحظة</strong></button>
            <button class="quick-action" type="button" data-action="quran-page"><span class="quick-icon" style="--icon-bg:var(--accent-soft);--icon-color:var(--accent-strong)">۞</span><strong>صفحة ورد</strong></button>
          </div>
        </section>

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>بوصلة اليوم</h2><p>اقتراح واحد فقط، مع السبب</p></div><button class="text-button" type="button" data-action="snooze-compass">ليس الآن</button></div>
          <article class="compass-card">
            <span class="compass-icon">${esc(compass.icon)}</span>
            <div class="compass-copy"><span>خطوتك الآن</span><h3>${esc(compass.title)}</h3><p>${esc(compass.reason)} · ${esc(compass.meta)}</p></div>
            <button class="small-action" type="button" data-action="compass-done" data-kind="${esc(compass.kind)}" data-id="${esc(compass.id || "")}">${esc(compass.action)}</button>
          </article>
        </section>

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>نيّة اليوم</h2><p>فكرة من مدار: نية واحدة تكفي</p></div><button class="text-button" type="button" data-module="intention">تغيير</button></div>
          <article class="intention-card ${state.intention.done ? "done" : ""}">
            <div class="intention-seed"><i></i></div>
            <div class="intention-copy"><span>${state.intention.done ? "وفيت بها اليوم" : "النية التي اخترتها"}</span><strong>${esc(state.intention.selected || "اختر نية يومك")}</strong></div>
            <button class="small-action" type="button" data-action="toggle-intention">${state.intention.done ? "تراجع" : "وفيت بها"}</button>
          </article>
        </section>

        <section class="section">
          <div class="section-head"><div class="section-title"><h2>مساحاتك</h2><p>البقية في مكان واضح ومنظم</p></div></div>
          <div class="spaces-grid">
            <button class="space-card" type="button" data-module="quran"><span class="space-icon" style="--icon-bg:var(--green-soft);--icon-color:var(--green)">۞</span><span><strong>الورد</strong><small>${state.quran.todayDone}/${state.quran.todayTarget} صفحات اليوم</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="finance"><span class="space-icon">ر.س</span><span><strong>الميزانية</strong><small>${money(Math.max(0, state.finance.dailyBudget - state.finance.dailySpent))} ر.س متاح</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="memories"><span class="space-icon" style="--icon-bg:var(--rose-soft);--icon-color:var(--rose)">◫</span><span><strong>الذكريات</strong><small>${state.memories.length} لحظات محفوظة</small></span><span class="space-arrow">‹</span></button>
            <button class="space-card" type="button" data-module="growth"><span class="space-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">↗</span><span><strong>تطويري</strong><small>قراءة ودورات ومهارات</small></span><span class="space-arrow">‹</span></button>
          </div>
          <button class="more-card" type="button" data-action="open-more"><span>☰</span><span>عرض كل الأقسام والأفكار التجريبية</span></button>
        </section>
      </section>`;
  }

  function renderPlan() {
    const average = Math.round(state.goals.reduce((sum, goal) => sum + goal.progress, 0) / Math.max(1, state.goals.length));
    return `
      <section class="screen">
        <header class="page-head">
          <div class="page-head-row"><div><p class="eyebrow">خطوات واضحة</p><h1>خطتي</h1><p>كل هدف يظهر هنا ومعه خطوة واحدة تالية، بلا ازدحام.</p></div><button class="soft-button" type="button" data-compose="goal">＋ هدف</button></div>
          <div class="overview-strip"><div class="overview-item"><strong>${average}%</strong><span>تقدم الأهداف</span></div><div class="overview-item"><strong>${doneTasks()}/${state.tasks.length}</strong><span>مهام اليوم</span></div><div class="overview-item"><strong>${state.profile.streak}</strong><span>يومًا متتاليًا</span></div></div>
        </header>

        <section class="section"><div class="section-head"><div class="section-title"><h2>أهدافي</h2><p>الخطوة التالية تحت كل هدف</p></div></div><div class="goal-list">
          ${state.goals.map((goal) => `<article class="goal-card"><div class="goal-top"><div class="goal-title"><span class="module-icon" style="--icon-bg:var(--violet-soft);--icon-color:var(--violet)">${esc(goal.icon)}</span><div><strong>${esc(goal.title)}</strong><span>${esc(goal.area)}</span></div></div><span class="goal-percent">${clamp(goal.progress)}%</span></div>${progressBar(goal.progress)}<div class="goal-next"><span>${esc(goal.next)}</span><button class="mini-action" type="button" data-action="goal-step" data-id="${esc(goal.id)}">سجّل خطوة</button></div></article>`).join("")}
        </div></section>

        <section class="section"><div class="section-head"><div class="section-title"><h2>مهام اليوم</h2><p>اضغط المربع عند الإنجاز</p></div><button class="text-button" type="button" data-compose="task">＋ مهمة</button></div><div class="task-list">
          ${renderTasks()}
        </div></section>

        <section class="section"><article class="calendar-card"><div class="calendar-link"><div class="calendar-link-copy"><span class="module-icon">✦</span><div><strong>صحيفة المساء</strong><span>ثلاثة أسئلة خفيفة لإغلاق يومك</span></div></div><button class="soft-button" type="button" data-module="reflection">افتح</button></div></article></section>
      </section>`;
  }

  function renderTasks() {
    if (!state.tasks.length) return `<div class="empty">لا توجد مهام بعد. أضف أول خطوة صغيرة.</div>`;
    return state.tasks.map((task) => `<article class="task ${task.done ? "done" : ""}"><button class="check ${task.done ? "done" : ""}" type="button" data-action="toggle-task" data-id="${esc(task.id)}" aria-label="${task.done ? "إلغاء إكمال" : "إكمال"} ${esc(task.title)}">${task.done ? "✓" : ""}</button><div class="task-copy"><strong>${esc(task.title)}</strong><span>${esc(task.meta)}</span></div><span class="task-tag">${esc(task.tag)}</span></article>`).join("");
  }

  function renderLibrary() {
    const items = state.library.filter((item) => libraryFilter === "all" || item.type === libraryFilter);
    const current = state.library.find((item) => item.progress < 100) || state.library[0];
    return `
      <section class="screen">
        <header class="page-head"><div class="page-head-row"><div><p class="eyebrow">اقرأ، شاهد، استمع</p><h1>مكتبتي</h1><p>كل موادك ونسبة تقدمك، في قائمة واحدة سهلة.</p></div><button class="soft-button" type="button" data-action="pick-files" data-target="library">＋ إضافة</button></div></header>
        ${current ? `<article class="library-hero"><div class="cover" style="--cover:${esc(current.cover)}"><span>${esc(current.title)}</span></div><div class="library-hero-copy"><span class="kind">تتابع الآن · ${esc(typeLabels[current.type] || current.type)}</span><h2>${esc(current.title)}</h2><p>${esc(current.author)} · ${esc(current.detail)}</p>${progressBar(current.progress)}<div class="library-actions"><button class="primary-button" type="button" data-action="library-progress" data-id="${esc(current.id)}">متابعة</button><button class="ghost-button" type="button" data-action="library-details">التفاصيل</button></div></div></article>` : ""}
        <div class="filter-row">${Object.entries(typeLabels).map(([key, label]) => `<button class="filter-chip ${libraryFilter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("")}</div>
        <section class="section"><div class="section-head"><div class="section-title"><h2>${esc(typeLabels[libraryFilter])}</h2><p>${items.length} مواد</p></div></div><div class="media-list">
          ${items.length ? items.map((item) => `<article class="media-item"><div class="media-thumb" style="--thumb:${esc(item.cover)}">${esc(item.icon)}</div><div class="media-copy"><strong>${esc(item.title)}</strong><span>${esc(item.author)} · ${esc(item.detail)}</span>${progressBar(item.progress)}</div><button class="continue-button" type="button" data-action="library-progress" data-id="${esc(item.id)}" aria-label="زيادة تقدم ${esc(item.title)}">›</button></article>`).join("") : `<div class="empty">لا توجد مواد في هذا القسم حتى الآن.</div>`}
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
        label: labels[index] || new Intl.DateTimeFormat("ar-SA", { weekday: "short" }).format(date),
        day: new Intl.DateTimeFormat("ar-SA-u-nu-latn", { day: "numeric" }).format(date)
      };
    });
  }

  function renderCalendar() {
    const selectedItems = state.selectedDay === 0 ? state.reminders : state.reminders.slice(0, Math.max(1, 3 - state.selectedDay % 3));
    return `
      <section class="screen">
        <header class="page-head"><div class="page-head-row"><div><p class="eyebrow">مواعيدك وتذكيراتك</p><h1>التقويم</h1><p>كل ما له وقت يظهر هنا، بما فيه الورد والفواتير.</p></div><button class="soft-button" type="button" data-compose="reminder">＋ تذكير</button></div></header>
        <div class="week-strip">${calendarDays().map((day) => `<button class="day-button ${state.selectedDay === day.index ? "active" : ""}" type="button" data-day="${day.index}"><span>${esc(day.label)}</span><strong>${esc(day.day)}</strong></button>`).join("")}</div>
        <section class="section"><div class="section-head"><div class="section-title"><h2>${state.selectedDay === 0 ? "اليوم" : "المواعيد"}</h2><p>${selectedItems.length} عناصر مرتبة بالوقت</p></div></div><div class="timeline">
          ${selectedItems.map((item) => `<article class="timeline-item"><span class="timeline-time">${esc(item.time)}</span><div class="timeline-copy"><strong>${esc(item.title)}</strong><span>${esc(item.meta)}</span></div><span class="status-pill">${esc(item.status)}</span></article>`).join("")}
        </div></section>
        <section class="section"><article class="calendar-card"><div class="calendar-link"><div class="calendar-link-copy"><span class="module-icon" style="--icon-bg:var(--green-soft);--icon-color:var(--green)">↔</span><div><strong>تقويم الجهاز والتذكيرات</strong><span>سيطلب إذنك قبل الربط الحقيقي</span></div></div><button class="soft-button" type="button" data-action="connect-calendar">ربط</button></div></article></section>
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
      ["task", "✓", "مهمة", "خطوة واضحة"], ["reminder", "□", "تذكير", "مع التقويم"], ["note", "✎", "ملاحظة", "فكرة سريعة"],
      ["expense", "ر.س", "مصروف", "ضمن الميزانية"], ["memory", "◫", "ذكرى", "صورة أو فيديو"], ["library", "▤", "مادة", "كتاب أو دورة"]
    ];
    sheetRoot.innerHTML = sheetFrame("أضف إلى حياتك", "اختر النوع، والباقي يظهر عند الحاجة", `<div class="type-grid">${types.map(([key, icon, label, hint]) => `<button class="type-button" type="button" data-compose="${key}"><span class="type-icon">${icon}</span><strong>${label}</strong><span>${hint}</span></button>`).join("")}</div>`);
  }

  function openComposer(type) {
    const info = {
      task: ["مهمة جديدة", "اكتب الخطوة الواضحة فقط", "مثال: مراجعة الفصل الرابع"],
      reminder: ["تذكير جديد", "سيظهر داخل التقويم", "مثال: سداد فاتورة الكهرباء"],
      note: ["ملاحظة جديدة", "احفظ الفكرة الآن", "عنوان الملاحظة"],
      expense: ["تسجيل مصروف", "يُضاف إلى ميزانية اليوم", "مثال: قهوة واجتماع"],
      memory: ["حفظ ذكرى", "نص أو صورة أو فيديو", "مثال: غروب نهاية الأسبوع"],
      library: ["إضافة مادة", "كتاب أو صوت أو فيديو أو دورة", "اسم المادة"],
      goal: ["هدف جديد", "نتيجة واضحة تستطيع قياسها", "مثال: إنهاء المستوى الثاني"]
    }[type] || ["إضافة جديدة", "", "العنوان"];
    const goalOptions = state.goals.map((goal) => `<option value="${esc(goal.id)}">${esc(goal.title)}</option>`).join("");
    const amountField = type === "expense" ? `<div class="field"><label for="quickAmount">المبلغ (ر.س)</label><input id="quickAmount" name="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0"></div>` : "";
    const fileButton = type === "memory" || type === "library" ? `<button class="ghost-button" type="button" data-action="pick-files" data-target="${type === "memory" ? "memories" : "library"}">اختيار ملف من الجهاز</button>` : "";
    sheetRoot.innerHTML = sheetFrame(info[0], info[1], `<form class="form" id="quickForm" data-type="${esc(type)}"><div class="field"><label for="quickTitle">العنوان</label><input id="quickTitle" name="title" required maxlength="120" placeholder="${esc(info[2])}" autocomplete="off"></div><div class="field"><label for="quickDetails">تفاصيل اختيارية</label><textarea id="quickDetails" name="details" maxlength="500" placeholder="اكتب ما يساعدك عند العودة إليه…"></textarea></div>${amountField}<div class="field"><label for="quickDate">الموعد أو التذكير</label><input id="quickDate" name="date" type="datetime-local"></div><div class="field"><label for="quickGoal">مرتبط بـ</label><select id="quickGoal" name="goal"><option value="">بدون ارتباط</option>${goalOptions}</select></div>${fileButton}<div class="form-actions"><button class="primary-button" type="submit">حفظ</button><button class="ghost-button" type="button" data-action="close-sheet">إلغاء</button></div></form>`);
    setTimeout(() => document.getElementById("quickTitle")?.focus(), 80);
  }

  function renderIntention() {
    return sheetFrame("نيّة اليوم", "اختر واحدة فقط؛ تستطيع تغييرها في أي وقت", `<div class="intention-options">${intentionOptions.map((option) => `<button class="intention-option ${state.intention.selected === option ? "active" : ""}" type="button" data-action="select-intention" data-value="${esc(option)}"><span>${state.intention.selected === option ? "✦" : "○"}</span><strong>${esc(option)}</strong></button>`).join("")}</div><button class="primary-button full-button" type="button" data-action="toggle-intention">${state.intention.done ? "إلغاء علامة الوفاء" : "وفيت بنيتي اليوم"}</button>`);
  }

  function renderReflection() {
    const complete = state.reflection.answers.every(Boolean);
    return sheetFrame("صحيفة المساء", "ثلاثة أسئلة، ثم تُحفظ خلاصة قصيرة في ملاحظاتك", `<div class="reflection-list">${reflectionQuestions.map((item, questionIndex) => `<section class="reflection-question"><h3>${esc(item.question)}</h3><div class="choice-row">${item.options.map((option) => `<button class="choice-chip ${state.reflection.answers[questionIndex] === option ? "active" : ""}" type="button" data-action="reflection-answer" data-question="${questionIndex}" data-value="${esc(option)}">${esc(option)}</button>`).join("")}</div></section>`).join("")}</div><button class="primary-button full-button" type="button" data-action="save-reflection" ${complete ? "" : "disabled"}>${state.reflection.saved ? "تحديث صحيفة اليوم" : "حفظ صحيفة اليوم"}</button>`);
  }

  function moduleBody(module) {
    if (module === "intention") return renderIntention();
    if (module === "reflection") return renderReflection();
    if (module === "quran") return sheetFrame("ورد القرآن", "ورد واضح مرتبط بهدف الختمة", `<article class="detail-hero"><div class="detail-hero-row"><div><span class="tiny">ورد اليوم</span><div class="detail-big">${state.quran.todayDone} <small>من ${state.quran.todayTarget} صفحة</small></div><p class="quran-line">سورة ${esc(state.quran.current)} · الصفحة ${state.quran.nextPage}</p></div>${ring(quranPercent(), "ورد اليوم", "var(--green)")}</div><button class="primary-button full-button" type="button" data-action="quran-page">قرأت صفحة الآن</button></article><div class="detail-list"><div class="detail-row"><div><strong>تقدم الختمة</strong><span>الهدف يتحرك مع إنجازك</span></div><span class="detail-value">${state.quran.khatmaProgress}%</span></div><div class="detail-row"><div><strong>التذكير</strong><span>مرتبط بالتقويم</span></div><span class="detail-value">${esc(state.quran.reminder)}</span></div></div>`);
    if (module === "finance") return sheetFrame("المال والميزانية", "صورة مالية واضحة بلا جداول معقدة", `<article class="detail-hero"><span class="tiny">المتبقي هذا الشهر</span><div class="detail-big">${money(Math.max(0, state.finance.monthBudget - state.finance.monthSpent))} <small>ر.س</small></div>${progressBar(state.finance.monthSpent / state.finance.monthBudget * 100)}<button class="primary-button full-button" type="button" data-compose="expense">تسجيل مصروف</button></article><div class="detail-list"><div class="detail-row"><div><strong>ميزانية اليوم</strong><span>صرفت ${money(state.finance.dailySpent)} من ${money(state.finance.dailyBudget)}</span></div><span class="detail-value">${money(Math.max(0, state.finance.dailyBudget - state.finance.dailySpent))} متاح</span></div><div class="detail-row"><div><strong>فاتورة الإنترنت</strong><span>بعد يومين · تذكير مفعّل</span></div><span class="detail-value">287 ر.س</span></div></div>`);
    if (module === "memories") return sheetFrame("الذكريات", "صور وفيديو وصوت ومذكرات في مكان واحد", `<div class="memory-grid"><div class="memory-tile" style="--memory-bg:linear-gradient(145deg,#7c8b81,#35443d)">◫</div><div class="memory-tile" style="--memory-bg:linear-gradient(145deg,#916f68,#45322f)">▶</div><div class="memory-tile" style="--memory-bg:linear-gradient(145deg,#747991,#373a4c)">♫</div><div class="memory-tile" style="--memory-bg:linear-gradient(145deg,#85845d,#41412c)">◫</div></div><div class="detail-list sheet-gap">${state.memories.map((item) => `<div class="detail-row"><div><strong>${esc(item.title)}</strong><span>${esc(item.body)}</span></div><span class="detail-value">${esc(item.icon)}</span></div>`).join("")}</div><button class="primary-button full-button" type="button" data-compose="memory">حفظ ذكرى جديدة</button>`);
    if (module === "notes") return sheetFrame("الملاحظات", "دفتر سريع وبسيط", `<div class="note-grid">${state.notes.map((note) => `<article class="note" style="--note-bg:${esc(note.tone)}"><strong>${esc(note.title)}</strong><p>${esc(note.body)}</p></article>`).join("")}</div><button class="primary-button full-button" type="button" data-compose="note">ملاحظة جديدة</button>`);
    if (module === "tasks") return sheetFrame("المهام", "خطوات اليوم المرتبطة بأهدافك", `<div class="task-list">${renderTasks()}</div><button class="primary-button full-button" type="button" data-compose="task">مهمة جديدة</button>`);
    if (module === "growth") return sheetFrame("تطويري", "القراءة والدورات والمهارات", `<article class="detail-hero"><span class="tiny">هذا الأسبوع</span><div class="detail-big">4 س 35 د <small>وقت تعلّم مركز</small></div>${progressBar(76)}</article><div class="detail-list"><div class="detail-row"><div><strong>العادات الذرية</strong><span>قراءة · 136 من 320 صفحة</span></div><span class="detail-value">42%</span></div><div class="detail-row"><div><strong>التحليل المالي</strong><span>دورة · 11 من 18 درسًا</span></div><span class="detail-value">61%</span></div><div class="detail-row"><div><strong>فن التركيز</strong><span>كتاب صوتي</span></div><span class="detail-value">28%</span></div></div><button class="primary-button full-button" type="button" data-route="library">فتح مكتبتي</button>`);
    return sheetFrame("حياتك", "هذه المساحة قيد التطوير", `<div class="empty">ستظهر تفاصيل هذه المساحة هنا.</div>`);
  }

  function openMore() {
    const modules = [
      ["tasks", "✓", "المهام", "خطوات اليوم"], ["notes", "✎", "الملاحظات", "أفكار وقوائم"], ["memories", "◫", "الذكريات", "صور وفيديو"],
      ["quran", "۞", "الورد", "الختمة والتذكير"], ["finance", "ر.س", "الميزانية", "مصروف وفواتير"], ["growth", "↗", "تطويري", "كتب ودورات"],
      ["intention", "✦", "نيّة اليوم", "فكرة تجريبية"], ["reflection", "☾", "صحيفة المساء", "فكرة تجريبية"]
    ];
    sheetRoot.innerHTML = sheetFrame("كل مساحاتك", "الأقسام الأساسية والأفكار التي نجربها الآن", `<div class="module-grid">${modules.map(([key, icon, label, hint]) => `<button class="module-button" type="button" data-module="${key}"><span class="module-icon">${icon}</span><strong>${label}</strong><span>${hint}</span></button>`).join("")}</div>`);
  }

  function openProfile() {
    const selectedTheme = document.documentElement.dataset.theme || "light";
    sheetRoot.innerHTML = sheetFrame("ملفي", "إعدادات بسيطة لنسخة العرض", `<article class="profile-card"><div class="profile-row"><span class="profile-avatar">${esc(Array.from(state.profile.name)[0] || "ح")}</span><div class="profile-copy"><strong>${esc(state.profile.name)}</strong><span>${esc(auth?.email || "دخول محلي على هذا الجهاز")}</span></div><span class="streak">${state.profile.streak} يومًا</span></div></article><section class="section"><div class="section-head"><div class="section-title"><h2>المظهر</h2><p>يُحفظ اختيارك على الجهاز</p></div></div><div class="theme-choice"><button class="${selectedTheme === "light" ? "active" : ""}" type="button" data-theme-choice="light">☼ نهاري</button><button class="${selectedTheme === "dark" ? "active" : ""}" type="button" data-theme-choice="dark">☾ ليلي</button></div></section><div class="detail-list sheet-gap"><div class="detail-row"><div><strong>الخصوصية</strong><span>بيانات نسخة العرض محلية</span></div><span class="detail-value">على جهازك</span></div><div class="detail-row"><div><strong>المزامنة والنسخ الاحتياطي</strong><span>ستُضاف في النسخة الإنتاجية</span></div><span class="detail-value">قريبًا</span></div></div><div class="profile-actions"><button class="ghost-button" type="button" data-action="reset-demo">إعادة بيانات العرض</button><button class="ghost-button danger" type="button" data-action="logout">تسجيل الخروج</button></div>`);
  }

  function closeSheet() {
    sheetRoot.innerHTML = "";
  }

  function handleQuickForm(form) {
    const data = new FormData(form);
    const type = form.dataset.type;
    const title = String(data.get("title") || "").trim();
    const details = String(data.get("details") || "").trim();
    if (!title) return;
    const id = `${type}-${Date.now()}`;
    if (type === "task") state.tasks.unshift({ id, title, meta: details || "مهمة جديدة · بدون موعد", tag: data.get("goal") ? "هدف" : "شخصي", done: false });
    if (type === "reminder") state.reminders.push({ id, time: data.get("date") ? String(data.get("date")).slice(11, 16) : "09:00", title, meta: details || "تذكير جديد", status: data.get("goal") ? "مرتبط" : "جديد" });
    if (type === "note") state.notes.unshift({ id, title, body: details || "ملاحظة محفوظة الآن.", tone: "var(--blue-soft)" });
    if (type === "expense") { const amount = Math.max(0, Number(data.get("amount")) || 0); state.finance.dailySpent += amount; state.finance.monthSpent += amount; }
    if (type === "memory") state.memories.unshift({ id, title, body: details || "ذكرى جديدة", icon: "◫" });
    if (type === "library") state.library.unshift({ id, type: "book", icon: "▤", title, author: details || "مادة مضافة يدويًا", progress: 0, detail: "لم تبدأ بعد", cover: "linear-gradient(145deg,#688790,#32454a)" });
    if (type === "goal") state.goals.unshift({ id, icon: "◇", title, area: details || "هدف شخصي", progress: 0, next: "حدّد أول خطوة" });
    save();
    closeSheet();
    render();
    toast("تم الحفظ في مكانه المناسب");
  }

  function completeCompass(kind, id) {
    if (kind === "task") {
      const task = state.tasks.find((item) => item.id === id);
      if (task) task.done = true;
    }
    if (kind === "quran") {
      state.quran.todayDone = Math.min(state.quran.todayTarget, state.quran.todayDone + 1);
      state.quran.khatmaProgress = clamp(state.quran.khatmaProgress + 1);
    }
    if (kind === "library") {
      const item = state.library.find((entry) => entry.id === id);
      if (item) item.progress = clamp(item.progress + 5);
      route = "library";
    }
    save(); render(); toast("أحسنت — ظهرت لك الخطوة التالية");
  }

  document.addEventListener("click", (event) => {
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
    if (action === "connect-calendar") toast("الربط الحقيقي سيطلب إذنك أولًا — لا وصول دون موافقتك");
    if (action === "library-details") toast("كل مادة ستحفظ الجلسات والوقت والملاحظات ونسبة الإنجاز");
    if (action === "snooze-compass") toast("حسنًا، ستبقى الخطوة محفوظة من دون إزعاج");
    if (action === "compass-done") completeCompass(target.dataset.kind, target.dataset.id);
    if (action === "toggle-task") {
      const task = state.tasks.find((item) => item.id === target.dataset.id);
      if (task) { task.done = !task.done; save(); render(); if (sheetRoot.innerHTML) sheetRoot.innerHTML = moduleBody("tasks"); toast(task.done ? "سُجل الإنجاز" : "أُعيدت المهمة"); }
    }
    if (action === "goal-step") {
      const goal = state.goals.find((item) => item.id === target.dataset.id);
      if (goal) { goal.progress = clamp(goal.progress + 5); save(); render(); toast("تحرك هدفك خطوة"); }
    }
    if (action === "quran-page") {
      state.quran.todayDone = Math.min(state.quran.todayTarget, state.quran.todayDone + 1);
      state.quran.khatmaProgress = clamp(state.quran.khatmaProgress + 1);
      save(); render(); if (sheetRoot.innerHTML) sheetRoot.innerHTML = moduleBody("quran"); toast("تقبّل الله — سُجلت صفحة");
    }
    if (action === "library-progress") {
      const item = state.library.find((entry) => entry.id === target.dataset.id);
      if (item) { item.progress = clamp(item.progress + 5); item.detail = `تقدمك الآن ${item.progress}%`; save(); render(); toast("سُجل تقدم جديد"); }
    }
    if (action === "select-intention") {
      state.intention.selected = target.dataset.value;
      state.intention.done = false;
      save();
      sheetRoot.innerHTML = renderIntention();
      render();
    }
    if (action === "toggle-intention") {
      if (!state.intention.selected) { sheetRoot.innerHTML = renderIntention(); return; }
      state.intention.done = !state.intention.done;
      save(); render();
      if (sheetRoot.innerHTML) sheetRoot.innerHTML = renderIntention();
      toast(state.intention.done ? "ثبتت نية اليوم" : "ألغيت علامة الوفاء");
    }
    if (action === "reflection-answer") {
      state.reflection.answers[Number(target.dataset.question)] = target.dataset.value;
      state.reflection.saved = false;
      save();
      sheetRoot.innerHTML = renderReflection();
    }
    if (action === "save-reflection") {
      const [good, short, tomorrow] = state.reflection.answers;
      if (!good || !short || !tomorrow) return;
      const body = `أحسنت في: ${good}. قصّرت في: ${short}. وغدًا أنوي: ${tomorrow}.`;
      const existing = state.notes.find((note) => note.id === "daily-reflection");
      if (existing) existing.body = body;
      else state.notes.unshift({ id: "daily-reflection", title: "صحيفة اليوم", body, tone: "var(--accent-soft)" });
      state.reflection.saved = true;
      save(); closeSheet(); render(); toast("حُفظت صحيفة اليوم في ملاحظاتك");
    }
    if (action === "reset-demo") {
      const name = auth?.name || "عبدالرحمن";
      state = clone(seed);
      state.profile.name = name;
      save(); closeSheet(); render(); toast("عادت بيانات العرض إلى البداية");
    }
    if (action === "logout") {
      localStorage.removeItem(AUTH_KEY);
      auth = null;
      closeSheet();
      showAuth(true);
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "quickForm") {
      event.preventDefault();
      handleQuickForm(event.target);
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
      files.forEach((file) => state.memories.unshift({ id: `memory-file-${Date.now()}-${Math.random()}`, title: file.name.replace(/\.[^.]+$/, ""), body: `ملف من جهازك · ${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`, icon: file.type.startsWith("video/") ? "▶" : file.type.startsWith("audio/") ? "♫" : "◫" }));
      save(); closeSheet(); render(); toast(`أُضيف ${files.length} ملف إلى ذكرياتك`);
    } else {
      files.forEach((file) => {
        const type = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : /pdf|epub|mobi/i.test(file.name) ? "book" : "course";
        state.library.unshift({ id: `file-${Date.now()}-${Math.random()}`, type, icon: type === "audio" ? "♫" : type === "video" ? "▶" : "▤", title: file.name.replace(/\.[^.]+$/, ""), author: `ملف من جهازك · ${Math.max(1, Math.round(file.size / 1024 / 1024))} MB`, progress: 0, detail: "جاهز للبدء", cover: "linear-gradient(145deg,#688790,#32454a)" });
      });
      save(); closeSheet(); route = "library"; render(); toast(`أُضيف ${files.length} ملف إلى مكتبتك`);
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
