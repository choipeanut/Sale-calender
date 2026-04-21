(function () {
  const STORAGE = {
    favorites: "sc_apk_favorites",
    events: "sc_apk_events",
  };

  const EVENT_DATA_VERSION = 3;

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
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "무신사 뉴스룸 기반 11월 중순 패턴",
      description: "무신사 겨울 메가 세일",
      sourceUrl: "https://newsroom.musinsa.com/",
      sourceTitle: "무신사 뉴스룸",
      confidence: 0.76,
      lastVerified: 2,
    },
    {
      id: "ev-29cm-1",
      brandId: "29cm",
      title: "이구위크",
      eventType: "fashion-week",
      datePrecision: "estimated",
      estimated: true,
      estimationBasis: "과거 시즌 패턴 기반",
      description: "29CM 대표 할인 행사",
      sourceUrl: "https://www.29cm.co.kr/",
      sourceTitle: "29CM 사이트",
      confidence: 0.62,
      lastVerified: 1,
    },
    {
      id: "ev-uniqlo-1",
      brandId: "uniqlo",
      title: "유니클로 감사제",
      eventType: "appreciation-sale",
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
  const shopDialog = document.getElementById("shop-dialog");
  const shopDialogContent = document.getElementById("shop-dialog-content");
  const toastEl = document.getElementById("toast");

  const state = {
    month: getMonthString(new Date()),
    favorites: new Set(loadJson(STORAGE.favorites, ["oliveyoung", "musinsa", "29cm"])),
    events: loadEvents(),
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

  function monthOffset(monthValue, delta) {
    const [year, month] = monthValue.split("-").map(Number);
    return getMonthString(new Date(year, month - 1 + delta, 1, 12, 0, 0));
  }

  function shiftMonth(delta) {
    state.month = monthOffset(state.month, delta);
    render();
  }

  function addDays(baseDate, diff) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function toYmd(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

    const now = new Date();

    const nextAnnualDate = (month, day) => {
      const candidate = new Date(now.getFullYear(), month - 1, day, 12, 0, 0);
      if (candidate < now) {
        candidate.setFullYear(candidate.getFullYear() + 1);
      }
      return candidate;
    };

    const nextFromMonths = (months, day) => {
      return months
        .map((month) => nextAnnualDate(month, day))
        .sort((a, b) => a.getTime() - b.getTime())[0];
    };

    const nextOliveyoungDayStart = () => {
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 25, 12, 0, 0);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth(), 27, 23, 59, 59);
      if (now <= thisMonthEnd) return thisMonthStart;
      return new Date(now.getFullYear(), now.getMonth() + 1, 25, 12, 0, 0);
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

      return { startDate: null, endDate: null };
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
        lastVerifiedAt: toYmd(addDays(now, -seed.lastVerified)),
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

  function eventsForMonth(monthValue) {
    const { start, end } = monthBounds(monthValue);
    const source = listEvents();
    const scoped = state.favorites.size > 0 ? source.filter((event) => state.favorites.has(event.brandId)) : source;
    return scoped.filter((event) => eventOverlapsMonth(event, start, end));
  }

  function buildCalendarRows(monthValue) {
    const { start } = monthBounds(monthValue);
    const year = start.getFullYear();
    const month = start.getMonth();
    const firstWeekday = start.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day, 12, 0, 0));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }

  function renderGhostStrip(monthValue, monthEvents, direction) {
    const rows = buildCalendarRows(monthValue);
    const segment = direction === "prev" ? rows.slice(-2) : rows.slice(0, 2);
    const opacities = direction === "prev" ? [0.32, 0.56] : [0.56, 0.32];
    const action = direction === "prev" ? "month-prev" : "month-next";
    const label = direction === "prev" ? "이전 월 미리보기" : "다음 월 미리보기";

    return `
      <button type="button" class="calendar-ghost-strip ${direction}" data-action="${action}" aria-label="${label}">
        <div class="ghost-grid" aria-hidden="true">
          ${segment
            .map((week, rowIndex) => {
              return `
                <div class="ghost-row" style="--ghost-opacity:${opacities[rowIndex] || 0.35}">
                  ${week
                    .map((cell) => {
                      if (!cell) return '<div class="ghost-cell empty"></div>';
                      const hasEvent = monthEvents.some((event) => dayInRange(cell, event));
                      return `
                        <div class="ghost-cell ${hasEvent ? "active" : ""}">
                          <span>${cell.getDate()}</span>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              `;
            })
            .join("")}
        </div>
      </button>
    `;
  }

  function shortBrandLabel(name) {
    if (name.length <= 3) return name;
    return `${name.slice(0, 2)}.`;
  }

  function renderCalendarGrid(monthValue, monthEvents) {
    const rows = buildCalendarRows(monthValue);

    return `
      <div class="calendar-weekheads">
        <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
      </div>
      <div class="calendar-grid">
        ${rows
          .flat()
          .map((cell) => {
            if (!cell) return '<div class="calendar-cell empty"></div>';

            const dayEvents = monthEvents.filter((event) => dayInRange(cell, event));
            const visibleEvents = dayEvents.slice(0, 2);
            const extraCount = dayEvents.length - visibleEvents.length;

            const now = new Date();
            const isToday =
              now.getFullYear() === cell.getFullYear() &&
              now.getMonth() === cell.getMonth() &&
              now.getDate() === cell.getDate();

            return `
              <div class="calendar-cell ${dayEvents.length ? "has-events" : ""} ${isToday ? "today" : ""}">
                <div class="calendar-day">${cell.getDate()}</div>
                <div class="calendar-pill-wrap">
                  ${visibleEvents
                    .map(
                      (event) =>
                        `<button type="button" class="calendar-pill ${event.status}" data-action="detail" data-event-id="${event.id}">${escapeHtml(shortBrandLabel(event.brandName))}</button>`,
                    )
                    .join("")}
                  ${extraCount > 0 ? `<span class="calendar-extra">+${extraCount}</span>` : ""}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderShopDialog() {
    const items = BRANDS.map((brand) => {
      const checked = state.favorites.has(brand.id) ? "checked" : "";
      return `
        <label class="shop-item">
          <input type="checkbox" data-brand-checkbox="${brand.id}" ${checked} />
          <div class="shop-item-text">
            <strong>${brand.name}</strong>
            <span>${brand.category}</span>
          </div>
        </label>
      `;
    }).join("");

    shopDialogContent.innerHTML = `
      <h2>샵 선택</h2>
      <p class="muted">선택한 샵의 할인 기간만 캘린더에 표시됩니다.</p>
      <div class="shop-grid">${items}</div>
    `;
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
      <div class="pills" style="margin-top:10px">
        <span class="pill">${precisionLabel(event)}</span>
        <span class="pill">신뢰도 ${Math.round(event.confidence * 100)}%</span>
      </div>
      <div class="source-box">
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

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toastEl.classList.remove("show"), 1700);
  }

  function render() {
    const currentMonth = state.month;
    const prevMonth = monthOffset(currentMonth, -1);
    const nextMonth = monthOffset(currentMonth, 1);
    const currentEvents = eventsForMonth(currentMonth);
    const prevEvents = eventsForMonth(prevMonth);
    const nextEvents = eventsForMonth(nextMonth);

    const favoriteSummary =
      state.favorites.size > 0
        ? `${state.favorites.size}개 샵 선택됨`
        : "전체 샵 표시 중";

    root.innerHTML = `
      <section class="calendar-panel">
        <div class="month-head">
          <button type="button" class="month-btn" data-action="month-prev" aria-label="이전 달">‹</button>
          <div class="month-title-wrap">
            <p class="month-subtitle">${favoriteSummary}</p>
            <h1 class="month-title">${formatMonthLabel(currentMonth)}</h1>
          </div>
          <button type="button" class="month-btn" data-action="month-next" aria-label="다음 달">›</button>
        </div>

        <section class="calendar-swipe-area" data-swipe-zone="true" aria-label="월간 캘린더 스와이프 영역">
          ${renderGhostStrip(prevMonth, prevEvents, "prev")}
          ${renderCalendarGrid(currentMonth, currentEvents)}
          ${renderGhostStrip(nextMonth, nextEvents, "next")}
        </section>
      </section>

      <section class="shop-action">
        <button type="button" class="shop-select-btn" data-action="open-shop-selection">샵 선택</button>
      </section>
    `;
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target instanceof HTMLButtonElement && target.value === "cancel") {
      const hostDialog = target.closest("dialog");
      if (hostDialog && typeof hostDialog.close === "function") hostDialog.close();
      return;
    }

    const actionTarget = target.closest("[data-action]");
    if (!(actionTarget instanceof HTMLElement)) return;
    const action = actionTarget.dataset.action;

    if (action === "month-prev") {
      shiftMonth(-1);
      return;
    }

    if (action === "month-next") {
      shiftMonth(1);
      return;
    }

    if (action === "detail" && actionTarget.dataset.eventId) {
      openDetail(actionTarget.dataset.eventId);
      return;
    }

    if (action === "open-shop-selection") {
      renderShopDialog();
      if (typeof shopDialog.showModal === "function") shopDialog.showModal();
      return;
    }

    if (action === "save-shop-selection") {
      const selected = Array.from(shopDialog.querySelectorAll("input[data-brand-checkbox]:checked")).map((input) => input.dataset.brandCheckbox);
      state.favorites = new Set(selected.filter(Boolean));
      saveJson(STORAGE.favorites, Array.from(state.favorites));
      if (typeof shopDialog.close === "function") shopDialog.close();
      showToast("샵 선택이 저장되었습니다.");
      render();
    }
  });

  const gesture = {
    active: false,
    preventScroll: false,
    startX: 0,
    startY: 0,
    startAt: 0,
  };

  root.addEventListener(
    "touchstart",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest("[data-swipe-zone]")) return;

      const point = event.touches[0];
      gesture.active = true;
      gesture.preventScroll = false;
      gesture.startX = point.clientX;
      gesture.startY = point.clientY;
      gesture.startAt = Date.now();
    },
    { passive: true },
  );

  root.addEventListener(
    "touchmove",
    (event) => {
      if (!gesture.active) return;
      const point = event.touches[0];
      const deltaY = point.clientY - gesture.startY;
      const deltaX = point.clientX - gesture.startX;

      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 1.05) {
        gesture.preventScroll = true;
        event.preventDefault();
      }
    },
    { passive: false },
  );

  root.addEventListener(
    "touchend",
    (event) => {
      if (!gesture.active) return;
      gesture.active = false;

      if (!gesture.preventScroll) return;

      const point = event.changedTouches[0];
      const deltaY = point.clientY - gesture.startY;
      const deltaX = point.clientX - gesture.startX;
      const elapsed = Date.now() - gesture.startAt;
      const isVerticalSwipe = Math.abs(deltaY) > 52 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2 && elapsed < 700;

      if (!isVerticalSwipe) return;
      if (deltaY < 0) shiftMonth(1);
      else shiftMonth(-1);
    },
    { passive: true },
  );

  render();
})();
