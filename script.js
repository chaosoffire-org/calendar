const translations = {
  zh: {
    prev: '< 上個月',
    next: '下個月 >',
    print: '🖨️ 列印 / 存為PDF',
    weekHeaders: [
      '日(7)',
      '一(1)',
      '二(2)',
      '三(3)',
      '四(4)',
      '五(5)',
      '六(6)',
    ],
  },
  en: {
    prev: '< Prev',
    next: 'Next >',
    print: '🖨️ Print / Save PDF',
    weekHeaders: [
      'Sun(7)',
      'Mon(1)',
      'Tue(2)',
      'Wed(3)',
      'Thu(4)',
      'Fri(5)',
      'Sat(6)',
    ],
  },
};

const userLang = (navigator.language || navigator.userLanguage).startsWith('zh')
  ? 'zh'
  : 'en';
const t = translations[userLang];

let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();

const monthYearDisplay = document.getElementById('monthYearDisplay');
const calendarHeader = document.getElementById('calendarHeader');
const calendarGrid = document.getElementById('calendarGrid');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const printBtn = document.getElementById('printBtn');

async function init() {
  prevBtn.textContent = t.prev;
  nextBtn.textContent = t.next;
  printBtn.textContent = t.print;

  renderHeaders();

  // First render without holidays (fast)
  renderCalendar(currentYear, currentMonth);

  // Fetch holidays from government API, then re-render
  await fetchHolidays();
  renderCalendar(currentYear, currentMonth);

  prevBtn.addEventListener('click', () => changeMonth(-1));
  nextBtn.addEventListener('click', () => changeMonth(1));
  printBtn.addEventListener('click', () => window.print());
}

function renderHeaders() {
  calendarHeader.innerHTML = '';
  t.weekHeaders.forEach((text, index) => {
    const div = document.createElement('div');
    div.className = 'header-cell';
    div.textContent = text;
    div.setAttribute('data-print', translations.en.weekHeaders[index]);
    calendarHeader.appendChild(div);
  });
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
}

function renderCalendar(year, month) {
  const displayMonth = (month + 1).toString().padStart(2, '0');
  monthYearDisplay.textContent = `${displayMonth} - ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  calendarGrid.innerHTML = '';

  const today = new Date();
  const monthHolidays = getMonthHolidays(year, month);

  // Fill empty cells before the first day
  for (let i = 0; i < firstDayIndex; i++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell empty';
    calendarGrid.appendChild(cell);
  }

  // Fill date cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    // Day number
    const dayNum = document.createElement('span');
    dayNum.className = 'day-number';
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    // Determine the day of week (0 = Sunday)
    const dayOfWeek = new Date(year, month, day).getDay();
    const isSunday = dayOfWeek === 0;

    // Check if it's a holiday
    const holiday = monthHolidays.get(day);

    // Mark Sundays
    if (isSunday) {
      cell.classList.add('sunday');
    }

    // Mark holidays
    if (holiday) {
      cell.classList.add('holiday');
      const label = document.createElement('div');
      label.className = 'holiday-label';
      // Display based on browser language, print shows Chinese only
      label.textContent = userLang === 'zh' ? holiday.zh : holiday.en;
      label.setAttribute('data-print', holiday.zh);
      cell.appendChild(label);
    }

    // Mark today
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      cell.classList.add('today');
    }

    calendarGrid.appendChild(cell);
  }

  // Fill remaining cells at the end
  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell empty';
    calendarGrid.appendChild(cell);
  }
}

init();
