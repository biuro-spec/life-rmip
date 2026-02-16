/**
 * Life RMiP - Dostepnosc pracownika
 * ====================================
 * Kalendarz miesieczny do zaznaczania dostepnosci
 */

// Stan
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDates = new Set();
let existingDates = {}; // { 'YYYY-MM-DD': { status, uwagi } }

// ============================================================
// INICJALIZACJA
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Sprawdz sesje
    if (!session || !session.getCurrentWorker()) {
        window.location.href = 'index.html';
        return;
    }

    var worker = session.getCurrentWorker();
    document.getElementById('worker-name').textContent = worker.name || '-';

    // Event listeners
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        loadMonth();
    });

    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        loadMonth();
    });

    document.getElementById('save-btn').addEventListener('click', saveAvailability);

    // Zaladuj biezacy miesiac
    loadMonth();
});

// ============================================================
// RENDER KALENDARZA
// ============================================================

const MONTH_NAMES = [
    'Styczen', 'Luty', 'Marzec', 'Kwiecien', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpien', 'Wrzesien', 'Pazdziernik', 'Listopad', 'Grudzien'
];

async function loadMonth() {
    document.getElementById('current-month').textContent =
        MONTH_NAMES[currentMonth] + ' ' + currentYear;

    // Pobierz istniejace dane z API
    var worker = session.getCurrentWorker();
    var month = String(currentMonth + 1).padStart(2, '0');
    var year = String(currentYear);

    existingDates = {};
    var apiData = await apiGet({
        action: 'getWorkerAvailability',
        login: worker.id,
        month: month,
        year: year
    });

    if (apiData) {
        existingDates = apiData;
        // Dodaj istniejace daty do selected
        selectedDates.clear();
        Object.keys(existingDates).forEach(function(d) {
            if (existingDates[d].status === 'Dostepny') {
                selectedDates.add(d);
            }
        });

        // Zaladuj uwagi z pierwszego wpisu
        var firstDate = Object.keys(existingDates)[0];
        if (firstDate && existingDates[firstDate].uwagi) {
            document.getElementById('availability-notes').value = existingDates[firstDate].uwagi;
        }
    } else {
        selectedDates.clear();
    }

    renderCalendar();
    updateSelectedCount();
}

function renderCalendar() {
    var grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    var today = new Date();
    var todayStr = formatDateISO(today);

    // Pierwszy dzien miesiaca
    var firstDay = new Date(currentYear, currentMonth, 1);
    var startDay = (firstDay.getDay() + 6) % 7; // Monday = 0

    // Dni w miesiacu
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Puste komorki przed
    for (var i = 0; i < startDay; i++) {
        var empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }

    // Dni miesiaca
    for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = currentYear + '-' +
            String(currentMonth + 1).padStart(2, '0') + '-' +
            String(d).padStart(2, '0');

        var dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = d;
        dayEl.dataset.date = dateStr;

        // Dzisiaj
        if (dateStr === todayStr) {
            dayEl.classList.add('today');
        }

        // Przeszlosc (nie mozna zaznaczac)
        var dayDate = new Date(currentYear, currentMonth, d);
        dayDate.setHours(0, 0, 0, 0);
        var todayClear = new Date(today);
        todayClear.setHours(0, 0, 0, 0);
        if (dayDate < todayClear) {
            dayEl.classList.add('past');
        } else {
            // Zaznaczony
            if (selectedDates.has(dateStr)) {
                dayEl.classList.add('selected');
            }

            // Klikniecie - toggle
            dayEl.addEventListener('click', toggleDay);
        }

        grid.appendChild(dayEl);
    }
}

function toggleDay(e) {
    var el = e.currentTarget;
    var date = el.dataset.date;

    if (selectedDates.has(date)) {
        selectedDates.delete(date);
        el.classList.remove('selected');
    } else {
        selectedDates.add(date);
        el.classList.add('selected');
    }

    updateSelectedCount();
}

function updateSelectedCount() {
    var count = selectedDates.size;
    document.getElementById('selected-count').textContent =
        'Zaznaczonych dni: ' + count;
    document.getElementById('save-btn').disabled = false;
}

// ============================================================
// ZAPIS DOSTEPNOSCI
// ============================================================

async function saveAvailability() {
    var btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons-round spin">refresh</span><span>Zapisywanie...</span>';

    var worker = session.getCurrentWorker();
    var uwagi = document.getElementById('availability-notes').value.trim();

    // Oblicz jakie daty dodac/usunac
    var month = String(currentMonth + 1).padStart(2, '0');
    var year = String(currentYear);
    var prefix = year + '-' + month;

    // Daty do zapisania (nowe lub zmienione)
    var datesToSave = [];
    selectedDates.forEach(function(d) {
        if (d.indexOf(prefix) === 0) {
            datesToSave.push(d);
        }
    });

    // Daty do usuniecia (byly zaznaczone, teraz nie)
    var datesToRemove = [];
    Object.keys(existingDates).forEach(function(d) {
        if (d.indexOf(prefix) === 0 && existingDates[d].status === 'Dostepny' && !selectedDates.has(d)) {
            datesToRemove.push(d);
        }
    });

    var success = true;

    // Zapisz nowe/zaktualizowane
    if (datesToSave.length > 0) {
        var result = await apiPost({
            action: 'saveAvailability',
            login: worker.id,
            dates: datesToSave,
            status: 'Dostepny',
            uwagi: uwagi
        });
        if (!result) success = false;
    }

    // Usun odznaczone
    if (datesToRemove.length > 0) {
        var removeResult = await apiPost({
            action: 'removeAvailability',
            login: worker.id,
            dates: datesToRemove
        });
        if (!removeResult) success = false;
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="material-icons-round">save</span><span>Zapisz dostepnosc</span>';

    if (success) {
        showToast('Dostepnosc zapisana', 'success');
        // Odswierz dane
        loadMonth();
    } else {
        showToast('Blad zapisu. Sprobuj ponownie.', 'error');
    }
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, type) {
    // Usun istniejacy toast
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        if (toast.parentNode) toast.remove();
    }, 3000);
}
