// ===========================
// 커스텀 달력 모달
// ===========================

let calendarModal = null;
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

function showTideDatePicker() {
    // 모달이 없으면 생성
    if (!calendarModal) {
        createCalendarModal();
    }

    // 현재 선택된 날짜 기준으로 달력 설정
    calendarYear = currentTideDate.getFullYear();
    calendarMonth = currentTideDate.getMonth();

    renderCalendar();
    calendarModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideCalendarModal() {
    if (calendarModal) {
        calendarModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function createCalendarModal() {
    const modal = document.createElement('div');
    modal.className = 'tide-calendar-modal';
    modal.innerHTML = `
        <div class="tide-calendar-overlay" onclick="hideCalendarModal()"></div>
        <div class="tide-calendar-content">
            <div class="tide-calendar-header">
                <button class="tide-cal-nav-btn" onclick="prevCalendarMonth()">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="tide-calendar-title">
                    <select id="tide-calendar-year" class="tide-cal-select"></select>
                    <select id="tide-calendar-month" class="tide-cal-select"></select>
                </div>
                <button class="tide-cal-nav-btn" onclick="nextCalendarMonth()">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button class="tide-cal-close-btn" onclick="hideCalendarModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="tide-calendar-weekdays">
                <div>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div>토</div>
            </div>
            <div class="tide-calendar-days" id="tide-calendar-days"></div>
            <div class="tide-calendar-footer">
                <button class="tide-cal-today-btn" onclick="selectToday()">
                    <i class="fa-solid fa-calendar-day"></i> 오늘
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    calendarModal = modal;

    // 연도 선택 초기화 (현재 연도 ± 10년)
    const yearSelect = document.getElementById('tide-calendar-year');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y + '년';
        yearSelect.appendChild(option);
    }

    // 월 선택 초기화
    const monthSelect = document.getElementById('tide-calendar-month');
    for (let m = 0; m < 12; m++) {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = (m + 1) + '월';
        monthSelect.appendChild(option);
    }

    // 이벤트 리스너
    yearSelect.addEventListener('change', () => {
        calendarYear = parseInt(yearSelect.value);
        renderCalendar();
    });

    monthSelect.addEventListener('change', () => {
        calendarMonth = parseInt(monthSelect.value);
        renderCalendar();
    });
}

function renderCalendar() {
    const yearSelect = document.getElementById('tide-calendar-year');
    const monthSelect = document.getElementById('tide-calendar-month');
    const daysContainer = document.getElementById('tide-calendar-days');

    yearSelect.value = calendarYear;
    monthSelect.value = calendarMonth;

    // 달력 날짜 생성
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const prevLastDay = new Date(calendarYear, calendarMonth, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    let html = '';

    // 이전 달 날짜
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        html += `<div class="tide-cal-day other-month">${prevLastDate - i}</div>`;
    }

    // 현재 달 날짜
    const today = new Date();
    const isCurrentMonth = (calendarYear === today.getFullYear() && calendarMonth === today.getMonth());
    const selectedDate = currentTideDate.getDate();
    const isSelectedMonth = (calendarYear === currentTideDate.getFullYear() && calendarMonth === currentTideDate.getMonth());

    for (let date = 1; date <= lastDate; date++) {
        let className = 'tide-cal-day';

        if (isCurrentMonth && date === today.getDate()) {
            className += ' today';
        }

        if (isSelectedMonth && date === selectedDate) {
            className += ' selected';
        }

        html += `<div class="${className}" onclick="selectCalendarDate(${date})">${date}</div>`;
    }

    // 다음 달 날짜
    const totalCells = Math.ceil((firstDayOfWeek + lastDate) / 7) * 7;
    const nextDays = totalCells - (firstDayOfWeek + lastDate);
    for (let i = 1; i <= nextDays; i++) {
        html += `<div class="tide-cal-day other-month">${i}</div>`;
    }

    daysContainer.innerHTML = html;
}

function prevCalendarMonth() {
    calendarMonth--;
    if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
    }
    renderCalendar();
}

function nextCalendarMonth() {
    calendarMonth++;
    if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
    }
    renderCalendar();
}

function selectCalendarDate(date) {
    currentTideDate = new Date(calendarYear, calendarMonth, date);
    updateTideDateDisplay();
    hideCalendarModal();
}

function selectToday() {
    currentTideDate = new Date();
    calendarYear = currentTideDate.getFullYear();
    calendarMonth = currentTideDate.getMonth();
    updateTideDateDisplay();
    hideCalendarModal();
}
