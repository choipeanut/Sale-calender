(function () {
  const STORAGE = {
    favorites: "sc_apk_favorites",
    prefs: "sc_apk_prefs",
    events: "sc_apk_events",
    adminLogs: "sc_apk_admin_logs",
  };
  const EVENT_DATA_VERSION = 2;

  const BRANDS = [
    { id: "oliveyoung", name: "올리브영", category: "뷰티", site: "https://www.oliveyoung.co.kr/" },
    { id: "musinsa", name: "무신사", category: "패션", site: "https://www.musinsa.com/" },
    { id: "29cm", name: "29CM", category: "패션", site: "https://www.29cm.co.kr/" },
    { id: "uniqlo", name: "유니클로", category: "SPA", site: "https://www.uniqlo.com/kr/ko/" },
    { id: "gmarket", name: "G마켓", category: "종합몰", site: "https://www.gmarket.co.kr/" },
    { id: "11st", name: "11번가", category: "종합몰", site: "https://www.11st.co.kr/" },
    { id: "coupang", name: "쿠팡", category: "종합몰", site: "https://www.coupang.com/" },
  ];

  const EVENT_SEED = [
    {
      id: "ev-olive-1",
      brandId: "oliveyoung",
      title: "올영세일",
      eventType: "season-sale",
      startOffset: 0,
      endOffset: 6,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "분기 정기 패턴(3/6/9/12월)",
      description: "올리브영 대표 정기 대형 할인 행사",
      sourceUrl: "https://www.oliveyoung.co.kr/store/main/getEventList.do",
      sourceTitle: "올리브영 이벤트 페이지",
      confidence: 0.78,
      lastVerified: 1,
    },
    {
      id: "ev-olive-day-1",
      brandId: "oliveyoung",
      title: "올영데이",
      eventType: "monthly-membership-sale",
      startOffset: 0,
      endOffset: 2,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "운영 규칙(매월 25~27일)",
      description: "올리브영 월간 멤버십 행사",
      sourceUrl: "https://www.oliveyoung.co.kr/store/main/main.do",
      sourceTitle: "운영 규칙 기반",
      confidence: 0.58,
      lastVerified: 1,
    },
    {
      id: "ev-musinsa-1",
      brandId: "musinsa",
      title: "무진장 겨울 블랙프라이데이",
      eventType: "blackfriday",
      startOffset: 0,
      endOffset: 10,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "무신사 뉴스룸 기반 11월 중순 패턴",
      description: "무신사 겨울 메가 세일",
      sourceUrl: "https://newsroom.musinsa.com/newsroom-menu/2025-1114",
      sourceTitle: "무신사 뉴스룸",
      confidence: 0.76,
      lastVerified: 2,
    },
    {
      id: "ev-29cm-1",
      brandId: "29cm",
      title: "이구위크",
      eventType: "fashion-week",
      startOffset: 0,
      endOffset: 9,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "여름/겨울 시즌 패턴 기반",
      description: "29CM 대표 할인 행사",
      sourceUrl: "https://newsroom.musinsa.com/newsroom-menu/2025-0616-29cm",
      sourceTitle: "29CM/무신사 뉴스룸",
      confidence: 0.74,
      lastVerified: 1,
    },
    {
      id: "ev-uniqlo-1",
      brandId: "uniqlo",
      title: "유니클로 감사제",
      eventType: "appreciation-sale",
      startOffset: 18,
      endOffset: 21,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "최근 3년 패턴",
      description: "시즌 감사 특별 행사",
      sourceUrl: "https://www.uniqlo.com/kr/ko/news",
      sourceTitle: "유니클로 뉴스",
      confidence: 0.61,
      lastVerified: 3,
    },
    {
      id: "ev-gmarket-1",
      brandId: "gmarket",
      title: "빅스마일데이",
      eventType: "mega-sale",
      startOffset: 12,
      endOffset: 18,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "작년 패턴 + 티저",
      description: "G마켓 대형 할인 행사",
      sourceUrl: "https://www.gmarket.co.kr/n/smile",
      sourceTitle: "G마켓 공지",
      confidence: 0.67,
      lastVerified: 1,
    },
    {
      id: "ev-11st-1",
      brandId: "11st",
      title: "그랜드십일절",
      eventType: "mega-sale",
      startOffset: 0,
      endOffset: 6,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "11월 시즌 패턴 기반",
      description: "11번가 대표 행사",
      sourceUrl: "https://www.11st.co.kr/main",
      sourceTitle: "11번가 공지",
      confidence: 0.72,
      lastVerified: 2,
    },
    {
      id: "ev-coupang-1",
      brandId: "coupang",
      title: "와우위크",
      eventType: "wow-sale",
      startOffset: 0,
      endOffset: 6,
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "와우 이벤트 시즌 패턴 기반",
      description: "와우 회원 대상 할인 이벤트",
      sourceUrl: "https://www.coupang.com/",
      sourceTitle: "쿠팡 메인",
      confidence: 0.58,
      lastVerified: 4,
    },
  ];

  const root = document.getElementById("view-root");
  const modal = document.getElementById("detail-modal");
  const modalContent = document.getElementById("detail-content");
  const toastEl = document.getElementById("toast");
  const navButtons = Array.from(document.querySelectorAll(".bottom-nav button"));

  const state = {
    view: "home",
    favorites: new Set(loadJson(STORAGE.favorites, ["oliveyoung", "musinsa", "29cm"])),
    prefs: loadJson(STORAGE.prefs, {
      enabled: true,
      notify7: true,
      notify1: true,
      notifyStart: true,
      customMinutes: 180,
    }),
    events: loadEvents(),
    filters: {
      month: getMonthString(new Date()),
      q: "",
      status: "all",
      favoriteOnly: true,
    },
    adminLogs: loadJson(STORAGE.adminLogs, []),
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getMonthString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatMonthLabel(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    return `${year}년 ${month}월`;
  }

  function shiftMonth(delta) {
    const [year, month] = state.filters.month.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1, 12, 0, 0);
    state.filters.month = getMonthString(next);
    render();
  }

  function toDate(yyyyMmDd) {
    if (!yyyyMmDd) return null;
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function formatDate(date) {
    if (!date) return "미정";
    const d = toDate(date);
    if (!d) return "미정";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  function formatRange(startDate, endDate) {
    if (!startDate && !endDate) return "일정 미정";
    if (startDate && !endDate) return `${formatDate(startDate)} ~`;
    if (!startDate && endDate) return `~ ${formatDate(endDate)}`;
    if (startDate === endDate) return formatDate(startDate);
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  }

  function addDays(baseDate, diff) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function toYmd(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function loadEvents() {
    const saved = loadJson(STORAGE.events, null);
    if (
      saved &&
      typeof saved === "object" &&
      saved.version === EVENT_DATA_VERSION &&
      Array.isArray(saved.data)
    ) {
      return saved.data;
    }

    const today = new Date();

    const nextAnnualDate = (month, day) => {
      const candidate = new Date(today.getFullYear(), month - 1, day, 12, 0, 0);
      if (candidate < today) {
        candidate.setFullYear(candidate.getFullYear() + 1);
      }
      return candidate;
    };

    const nextFromMonths = (months, day) => {
      const sorted = months.map((month) => nextAnnualDate(month, day)).sort((a, b) => a.getTime() - b.getTime());
      return sorted[0];
    };

    const nextOliveyoungDayStart = () => {
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 25, 12, 0, 0);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth(), 27, 23, 59, 59);
      if (today <= thisMonthEnd) {
        return thisMonthStart;
      }
      return new Date(today.getFullYear(), today.getMonth() + 1, 25, 12, 0, 0);
    };

    const scheduleForSeed = (seed) => {
      if (seed.id === "ev-olive-1") {
        const start = nextFromMonths([3, 6, 9, 12], 1);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 6)) };
      }

      if (seed.id === "ev-olive-day-1") {
        const start = nextOliveyoungDayStart();
        const end = new Date(start.getFullYear(), start.getMonth(), 27, 12, 0, 0);
        return { startDate: toYmd(start), endDate: toYmd(end) };
      }

      if (seed.id === "ev-musinsa-1") {
        const start = nextAnnualDate(11, 16);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 10)) };
      }

      if (seed.id === "ev-29cm-1") {
        const start = nextFromMonths([6, 11], 4);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 9)) };
      }

      if (seed.id === "ev-uniqlo-1") {
        const start = nextAnnualDate(5, 15);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 6)) };
      }

      if (seed.id === "ev-gmarket-1") {
        const start = nextFromMonths([5, 11], 11);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 6)) };
      }

      if (seed.id === "ev-11st-1") {
        const start = nextAnnualDate(11, 11);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 6)) };
      }

      if (seed.id === "ev-coupang-1") {
        const start = nextFromMonths([4, 11], 1);
        return { startDate: toYmd(start), endDate: toYmd(addDays(start, 6)) };
      }

      const startDate = seed.datePrecision === "tbd" ? null : toYmd(addDays(today, seed.startOffset ?? 0));
      const endDate = seed.datePrecision === "tbd" ? null : toYmd(addDays(today, seed.endOffset ?? 0));
      return { startDate, endDate };
    };

    const generated = EVENT_SEED.map((seed) => {
      const { startDate, endDate } = scheduleForSeed(seed);
      return {
        id: seed.id,
        brandId: seed.brandId,
        title: seed.title,
        eventType: seed.eventType,
        startDate,
        endDate,
        datePrecision: seed.datePrecision,
        estimated: seed.estimated,
        estimationBasis: seed.estimationBasis,
        description: seed.description,
        sourceUrl: seed.sourceUrl,
        sourceTitle: seed.sourceTitle,
        confidence: seed.confidence,
        lastVerifiedAt: toYmd(addDays(today, -seed.lastVerified)),
      };
    });
    saveJson(STORAGE.events, { version: EVENT_DATA_VERSION, data: generated });
    return generated;
  }

  function brandById(brandId) {
    return BRANDS.find((brand) => brand.id === brandId);
  }

  function eventStatus(event) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const start = toDate(event.startDate);
    const end = toDate(event.endDate || event.startDate);
    if (!start) return "scheduled";
    if (end && today > end) return "ended";
    if (today >= start && (!end || today <= end)) return "ongoing";
    return "scheduled";
  }

  function statusLabel(status) {
    if (status === "scheduled") return "예정";
    if (status === "ongoing") return "진행중";
    return "종료";
  }

  function precisionLabel(event) {
    if (event.datePrecision === "tbd") return "미정";
    if (event.datePrecision === "estimated" || event.estimated) return "예상 일정";
    if (event.datePrecision === "month") return "월 단위";
    return "확정";
  }

  function listEvents() {
    return state.events
      .map((event) => {
        const brand = brandById(event.brandId);
        return {
          ...event,
          brandName: brand ? brand.name : "브랜드",
          category: brand ? brand.category : "기타",
          status: eventStatus(event),
          isFavorite: state.favorites.has(event.brandId),
        };
      })
      .sort((a, b) => (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31"));
  }

    function monthBounds(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    const start = new Date(year, month - 1, 1, 12, 0, 0);
    const end = new Date(year, month, 0, 12, 0, 0);
    return { start, end };
  }

  function eventOverlapsMonth(event, monthStart, monthEnd) {
    const start = toDate(event.startDate);
    if (!start) return false;
    const end = toDate(event.endDate || event.startDate) || start;
    return start <= monthEnd && end >= monthStart;
  }

  function dayInRange(day, event) {
    const start = toDate(event.startDate);
    if (!start) return false;
    const end = toDate(event.endDate || event.startDate) || start;
    return day >= start && day <= end;
  }

  function renderCalendarGrid(monthValue, events) {
    const { start: monthStart } = monthBounds(monthValue);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstWeekday = monthStart.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day, 12, 0, 0));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return `
      <div class="calendar-grid">
        <div class="calendar-head">일</div>
        <div class="calendar-head">월</div>
        <div class="calendar-head">화</div>
        <div class="calendar-head">수</div>
        <div class="calendar-head">목</div>
        <div class="calendar-head">금</div>
        <div class="calendar-head">토</div>
        ${cells
          .map((cell) => {
            if (!cell) {
              return '<div class="calendar-cell empty"></div>';
            }

            const dayNumber = cell.getDate();
            const today = new Date();
            const isToday =
              today.getFullYear() === cell.getFullYear() &&
              today.getMonth() === cell.getMonth() &&
              today.getDate() === cell.getDate();
            const allDayEvents = events.filter((event) => dayInRange(cell, event));
            const dayEvents = allDayEvents.slice(0, 3);

            return `
              <div class="calendar-cell ${isToday ? "today" : ""}">
                <div class="calendar-day">${dayNumber}</div>
                <div class="calendar-events">
                  ${dayEvents
                    .map(
                      (event) =>
                        `<button class="calendar-event ${event.status}" data-action="detail" data-event-id="${event.id}">${event.brandName} · ${event.title}</button>`,
                    )
                    .join("")}
                  ${allDayEvents.length > dayEvents.length ? `<div class="calendar-more">+${allDayEvents.length - dayEvents.length}</div>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  function renderEventCard(event) {
    return `
      <article class="event">
        <div class="event-top">
          <div>
            <div class="event-title">${event.title}</div>
            <div class="muted">${event.brandName}</div>
          </div>
          <span class="badge ${event.status}">${statusLabel(event.status)}</span>
        </div>
        <div class="event-meta">
          <span>${formatRange(event.startDate, event.endDate)}</span>
          <span>·</span>
          <span>${event.eventType}</span>
          <span>·</span>
          <span>${event.category}</span>
        </div>
        <div class="pills">
          <span class="pill">${precisionLabel(event)}</span>
          ${event.isFavorite ? '<span class="pill">관심 브랜드</span>' : ""}
          ${event.sourceUrl ? '<span class="pill">출처 링크</span>' : ""}
        </div>
        <div class="row">
          <button class="small ghost" data-action="detail" data-event-id="${event.id}">상세 보기</button>
          <button class="small" data-action="toggle-favorite" data-brand-id="${event.brandId}">
            ${event.isFavorite ? "관심 해제" : "관심 등록"}
          </button>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const events = listEvents();
    const upcoming = events.filter((item) => item.status === "scheduled").slice(0, 4);
    const ongoing = events.filter((item) => item.status === "ongoing").slice(0, 4);
    const favoriteOnly = events.filter((item) => item.isFavorite).slice(0, 4);

    root.innerHTML = `
      <section class="card">
        <h2>실동작 APK 대시보드</h2>
        <p class="muted">로컬 저장 기반으로 캘린더/즐겨찾기/알림설정/관리자 기능이 동작합니다.</p>
        <div class="metrics">
          <div class="metric"><div class="value">${events.length}</div><div class="label">총 행사</div></div>
          <div class="metric"><div class="value">${upcoming.length}</div><div class="label">예정 행사</div></div>
          <div class="metric"><div class="value">${state.favorites.size}</div><div class="label">관심 브랜드</div></div>
        </div>
      </section>

      <section class="card">
        <div class="section-head"><h3>곧 시작하는 행사</h3></div>
        <div class="event-list">${upcoming.map(renderEventCard).join("") || '<p class="muted">예정 행사가 없습니다.</p>'}</div>
      </section>

      <section class="card">
        <div class="section-head"><h3>진행 중인 행사</h3></div>
        <div class="event-list">${ongoing.map(renderEventCard).join("") || '<p class="muted">진행 중인 행사가 없습니다.</p>'}</div>
      </section>

      <section class="card">
        <div class="section-head"><h3>관심 브랜드 행사</h3></div>
        <div class="event-list">${favoriteOnly.map(renderEventCard).join("") || '<p class="muted">관심 브랜드를 선택해 주세요.</p>'}</div>
      </section>
    `;
  }

    function renderCalendar() {
    const { start: monthStart, end: monthEnd } = monthBounds(state.filters.month);

    const filtered = listEvents().filter((event) => {
      if (!eventOverlapsMonth(event, monthStart, monthEnd)) return false;
      if (state.filters.status !== "all" && event.status !== state.filters.status) return false;
      if (state.filters.favoriteOnly && !event.isFavorite) return false;
      if (state.filters.q) {
        const q = state.filters.q.toLowerCase();
        return event.title.toLowerCase().includes(q) || event.brandName.toLowerCase().includes(q);
      }
      return true;
    });

    root.innerHTML = `
      <section class="card">
        <h2>월간 할인 캘린더</h2>
        <p class="muted">내가 선택한 샵의 할인 기간을 날짜별로 정리해서 보여줍니다.</p>
        <div class="month-nav">
          <button class="ghost month-nav-btn" data-action="month-prev" aria-label="이전 달">이전</button>
          <div class="month-title">${formatMonthLabel(state.filters.month)}</div>
          <button class="ghost month-nav-btn" data-action="month-next" aria-label="다음 달">다음</button>
        </div>
        <div class="grid-2">
          <label><span class="muted">월</span><input type="month" id="filter-month" value="${state.filters.month}" /></label>
          <label>
            <span class="muted">상태</span>
            <select id="filter-status">
              <option value="all" ${state.filters.status === "all" ? "selected" : ""}>전체</option>
              <option value="scheduled" ${state.filters.status === "scheduled" ? "selected" : ""}>예정</option>
              <option value="ongoing" ${state.filters.status === "ongoing" ? "selected" : ""}>진행중</option>
              <option value="ended" ${state.filters.status === "ended" ? "selected" : ""}>종료</option>
            </select>
          </label>
        </div>
        <div class="row" style="margin-top:8px">
          <input id="filter-q" placeholder="샵/행사명 검색" value="${escapeHtml(state.filters.q)}" />
          <label class="row" style="width:auto"><input type="checkbox" id="filter-favorite" ${state.filters.favoriteOnly ? "checked" : ""} /><span class="muted">선택한 샵만</span></label>
        </div>
      </section>

      <section class="card calendar-swipe-area">
        <div class="section-head"><h3>캘린더 보기</h3><span class="muted">${filtered.length}건</span></div>
        <p class="muted swipe-hint">위/아래로 스와이프해서 월 이동</p>
        ${renderCalendarGrid(state.filters.month, filtered)}
      </section>

      <section class="card">
        <div class="section-head"><h3>선택 월 행사 목록</h3><span class="muted">${filtered.length}건</span></div>
        <div class="event-list">${filtered.map(renderEventCard).join("") || '<p class="muted">조건에 맞는 행사가 없습니다.</p>'}</div>
      </section>
    `;
  }
  function renderUpcoming() {
    const events = listEvents().filter((event) => event.status === "scheduled");
    root.innerHTML = `
      <section class="card">
        <h2>다가오는 행사</h2>
        <p class="muted">시작 예정 순으로 정렬됩니다.</p>
        <div class="event-list">${events.map(renderEventCard).join("") || '<p class="muted">예정된 행사가 없습니다.</p>'}</div>
      </section>
    `;
  }

  function renderSettings() {
    const brandItems = BRANDS.map((brand) => {
      const checked = state.favorites.has(brand.id) ? "checked" : "";
      return `<label class="brand-item"><input type="checkbox" data-setting="favorite-brand" value="${brand.id}" ${checked} /><div><div>${brand.name}</div><div class="muted">${brand.category}</div></div></label>`;
    }).join("");

    root.innerHTML = `
      <section class="card">
        <h2>관심 브랜드 설정</h2>
        <p class="muted">홈 개인화와 알림 대상 계산에 사용됩니다.</p>
        <div class="brand-grid">${brandItems}</div>
        <div class="row" style="margin-top:10px"><button data-action="save-favorites">관심 브랜드 저장</button></div>
      </section>

      <section class="card">
        <h2>알림 설정</h2>
        <p class="muted">웹푸시 대신 로컬 시뮬레이션 로그로 동작합니다.</p>
        <label class="row"><input type="checkbox" id="pref-enabled" ${state.prefs.enabled ? "checked" : ""} /><span>전체 알림 사용</span></label>
        <label class="row"><input type="checkbox" id="pref-7" ${state.prefs.notify7 ? "checked" : ""} /><span>시작 7일 전</span></label>
        <label class="row"><input type="checkbox" id="pref-1" ${state.prefs.notify1 ? "checked" : ""} /><span>시작 1일 전</span></label>
        <label class="row"><input type="checkbox" id="pref-start" ${state.prefs.notifyStart ? "checked" : ""} /><span>시작 당일</span></label>
        <label><span class="muted">커스텀(분 전)</span><input type="number" id="pref-custom" value="${state.prefs.customMinutes}" min="0" /></label>
        <div class="row" style="margin-top:10px">
          <button data-action="save-prefs">알림 설정 저장</button>
          <button class="secondary" data-action="simulate-notification">알림 시뮬레이션</button>
        </div>
      </section>
    `;
  }

  function renderAdmin() {
    const rows = listEvents()
      .map((event) => {
        return `
      <tr>
        <td>${event.brandName}</td>
        <td><input data-admin="title" data-id="${event.id}" value="${escapeHtml(event.title)}" /></td>
        <td><input type="date" data-admin="startDate" data-id="${event.id}" value="${event.startDate || ""}" /></td>
        <td><input type="date" data-admin="endDate" data-id="${event.id}" value="${event.endDate || ""}" /></td>
        <td>
          <select data-admin="datePrecision" data-id="${event.id}">
            <option value="day" ${event.datePrecision === "day" ? "selected" : ""}>day</option>
            <option value="month" ${event.datePrecision === "month" ? "selected" : ""}>month</option>
            <option value="estimated" ${event.datePrecision === "estimated" ? "selected" : ""}>estimated</option>
            <option value="tbd" ${event.datePrecision === "tbd" ? "selected" : ""}>tbd</option>
          </select>
        </td>
        <td><button class="small" data-action="admin-save" data-id="${event.id}">저장</button></td>
      </tr>`;
      })
      .join("");

    const logs = state.adminLogs.slice(-6).reverse();

    root.innerHTML = `
      <section class="card">
        <h2>관리자 대시보드</h2>
        <p class="muted">날짜 수정/정밀도 조정/중복 분석이 로컬 데이터에 반영됩니다.</p>
        <div class="row">
          <button data-action="admin-run-ingest">수집 재실행 시뮬레이션</button>
          <button class="warn" data-action="admin-dedupe">중복 후보 분석</button>
        </div>
      </section>

      <section class="card">
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>브랜드</th><th>행사명</th><th>시작일</th><th>종료일</th><th>정밀도</th><th>저장</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h3>운영 로그</h3>
        <div class="event-list">
          ${logs.map((line) => `<div class="event"><div class="muted">${escapeHtml(line)}</div></div>`).join("") || '<p class="muted">로그가 없습니다.</p>'}
        </div>
      </section>
    `;
  }

  function render() {
    navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === state.view));
    if (state.view === "home") return renderHome();
    if (state.view === "calendar") return renderCalendar();
    if (state.view === "upcoming") return renderUpcoming();
    if (state.view === "settings") return renderSettings();
    return renderAdmin();
  }

  function persistEvents() {
    saveJson(STORAGE.events, { version: EVENT_DATA_VERSION, data: state.events });
  }

  function openDetail(eventId) {
    const event = listEvents().find((item) => item.id === eventId);
    if (!event) return;

    modalContent.innerHTML = `
      <h3>${event.title}</h3>
      <p class="muted">${event.brandName}</p>
      <div class="event-meta" style="margin-top:8px">
        <span>${formatRange(event.startDate, event.endDate)}</span>
        <span>· ${event.eventType}</span>
        <span>· ${statusLabel(event.status)}</span>
      </div>
      <p style="margin-top:10px">${event.description || "설명 없음"}</p>
      <div class="pills" style="margin-top:8px">
        <span class="pill">${precisionLabel(event)}</span>
        <span class="pill">신뢰도 ${Math.round(event.confidence * 100)}%</span>
      </div>
      <div class="card" style="margin-top:10px; padding:10px;">
        <div><strong>출처</strong></div>
        <div class="muted">${event.sourceTitle}</div>
        <a href="${event.sourceUrl}" target="_blank" rel="noopener noreferrer">${event.sourceUrl}</a>
        <div class="muted" style="margin-top:6px">마지막 검증: ${formatDate(event.lastVerifiedAt)}</div>
        <div class="muted">${event.estimated ? `예상 일정: ${event.estimationBasis}` : "공식 공지 기반 일정"}</div>
      </div>
    `;
    if (typeof modal.showModal === "function") modal.showModal();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseDuplicates(events) {
    const candidates = [];
    for (let i = 0; i < events.length; i += 1) {
      for (let j = i + 1; j < events.length; j += 1) {
        const left = events[i];
        const right = events[j];
        if (left.brandId !== right.brandId) continue;
        const sameSource = left.sourceUrl === right.sourceUrl;
        const titleLeft = left.title.replace(/\s+/g, "").toLowerCase();
        const titleRight = right.title.replace(/\s+/g, "").toLowerCase();
        const similarTitle = titleLeft.includes(titleRight) || titleRight.includes(titleLeft);
        if (sameSource || similarTitle) candidates.push(`${left.title} ↔ ${right.title}`);
      }
    }
    return candidates;
  }

  document.body.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;

    if (action === "detail" && target.dataset.eventId) return openDetail(target.dataset.eventId);

    if (action === "month-prev") {
      shiftMonth(-1);
      return;
    }

    if (action === "month-next") {
      shiftMonth(1);
      return;
    }

    if (action === "toggle-favorite" && target.dataset.brandId) {
      if (state.favorites.has(target.dataset.brandId)) state.favorites.delete(target.dataset.brandId);
      else state.favorites.add(target.dataset.brandId);
      saveJson(STORAGE.favorites, Array.from(state.favorites));
      showToast("관심 브랜드가 변경되었습니다.");
      return render();
    }

    if (action === "save-favorites") {
      const selected = Array.from(document.querySelectorAll('input[data-setting="favorite-brand"]:checked')).map((input) => input.value);
      state.favorites = new Set(selected);
      saveJson(STORAGE.favorites, selected);
      showToast("관심 브랜드를 저장했습니다.");
      return render();
    }

    if (action === "save-prefs") {
      state.prefs = {
        enabled: document.getElementById("pref-enabled").checked,
        notify7: document.getElementById("pref-7").checked,
        notify1: document.getElementById("pref-1").checked,
        notifyStart: document.getElementById("pref-start").checked,
        customMinutes: Number(document.getElementById("pref-custom").value || 0),
      };
      saveJson(STORAGE.prefs, state.prefs);
      return showToast("알림 설정을 저장했습니다.");
    }

    if (action === "simulate-notification") {
      const upcoming = listEvents().filter((item) => item.status === "scheduled" && state.favorites.has(item.brandId));
      return showToast(`알림 시뮬레이션 완료: 대상 ${upcoming.length}건`);
    }

    if (action === "admin-save" && target.dataset.id) {
      const id = target.dataset.id;
      const item = state.events.find((eventRow) => eventRow.id === id);
      if (!item) return;
      item.title = document.querySelector(`input[data-admin="title"][data-id="${id}"]`).value;
      item.startDate = document.querySelector(`input[data-admin="startDate"][data-id="${id}"]`).value || null;
      item.endDate = document.querySelector(`input[data-admin="endDate"][data-id="${id}"]`).value || null;
      item.datePrecision = document.querySelector(`select[data-admin="datePrecision"][data-id="${id}"]`).value;
      item.lastVerifiedAt = toYmd(new Date());
      persistEvents();
      state.adminLogs.push(`[${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}] ${item.title} 수정 저장`);
      saveJson(STORAGE.adminLogs, state.adminLogs);
      showToast("이벤트를 저장했습니다.");
      return render();
    }

    if (action === "admin-run-ingest") {
      state.adminLogs.push(`[${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}] 수집 재실행 완료 (시뮬레이션)`);
      saveJson(STORAGE.adminLogs, state.adminLogs);
      showToast("수집 재실행(시뮬레이션) 완료");
      return render();
    }

    if (action === "admin-dedupe") {
      const dupes = parseDuplicates(state.events);
      const summary = dupes.length > 0 ? `중복 후보 ${dupes.length}건` : "중복 후보 없음";
      state.adminLogs.push(`[${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}] ${summary}`);
      saveJson(STORAGE.adminLogs, state.adminLogs);
      showToast(summary);
      return render();
    }
  });

  root.addEventListener("input", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === "filter-month") {
      state.filters.month = target.value;
      return render();
    }
    if (target.id === "filter-status") {
      state.filters.status = target.value;
      return render();
    }
    if (target.id === "filter-q") {
      state.filters.q = target.value;
      return render();
    }
    if (target.id === "filter-favorite") {
      state.filters.favoriteOnly = target.checked;
      return render();
    }
  });

  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      state.view = button.dataset.view;
      render();
    });
  });

  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartAt = 0;

  root.addEventListener(
    "touchstart",
    (event) => {
      if (state.view !== "calendar") return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest(".calendar-swipe-area")) return;

      const point = event.touches[0];
      touchStartY = point.clientY;
      touchStartX = point.clientX;
      touchStartAt = Date.now();
    },
    { passive: true },
  );

  root.addEventListener(
    "touchend",
    (event) => {
      if (state.view !== "calendar") return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest(".calendar-swipe-area")) return;

      const point = event.changedTouches[0];
      const deltaY = point.clientY - touchStartY;
      const deltaX = point.clientX - touchStartX;
      const elapsed = Date.now() - touchStartAt;

      const isVerticalSwipe = Math.abs(deltaY) > 56 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25 && elapsed < 700;
      if (!isVerticalSwipe) return;

      if (deltaY < 0) {
        shiftMonth(1);
      } else {
        shiftMonth(-1);
      }
    },
    { passive: true },
  );

  document.getElementById("build-badge").textContent = `APK ${new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}`;
  render();
})();
