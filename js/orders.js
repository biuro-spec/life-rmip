// Orders list screen logic (v2 - Mobile UX)

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    if (!session.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Get current worker
    const worker = session.getCurrentWorker();

    // Elements
    const workerNameEl = document.getElementById('worker-name');
    const vehicleNameEl = document.getElementById('vehicle-name');
    const logoutBtn = document.getElementById('logout-btn');
    const currentDateEl = document.getElementById('current-date');
    const currentDayNameEl = document.getElementById('current-day-name');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const ordersListEl = document.getElementById('orders-list');
    const refreshBtn = document.getElementById('refresh-btn');
    const statusFiltersEl = document.getElementById('status-filters');
    const pullIndicator = document.getElementById('pull-indicator');

    // State
    let currentDate = new Date();
    let isLoading = false;
    let allOrders = []; // All orders for current date (before filtering)
    let activeFilter = 'all'; // Current filter

    // Day names
    const DAY_NAMES = ['Niedziela', 'Poniedzia\u0142ek', 'Wtorek', '\u015Aroda', 'Czwartek', 'Pi\u0105tek', 'Sobota'];

    // Initialize
    function init() {
        workerNameEl.textContent = worker.name;
        vehicleNameEl.textContent = worker.vehicleName;
        updateDateDisplay();
        loadOrders();

        // Auto-refresh co 30 sekund
        if (typeof autoRefresh !== 'undefined') {
            autoRefresh.start(() => loadOrders(true), 30000);
        }

        // Pull-to-refresh
        setupPullToRefresh();
    }

    // Update date display with day name
    function updateDateDisplay() {
        currentDateEl.textContent = formatDate(currentDate);

        if (currentDayNameEl) {
            currentDayNameEl.textContent = DAY_NAMES[currentDate.getDay()];

            // Add "Dzi\u015B" badge if today
            const today = new Date();
            const isToday = currentDate.toDateString() === today.toDateString();
            const existingBadge = currentDayNameEl.querySelector('.date-today-badge');
            if (existingBadge) existingBadge.remove();

            if (isToday) {
                const badge = document.createElement('span');
                badge.className = 'date-today-badge';
                badge.textContent = 'Dzi\u015B';
                currentDayNameEl.appendChild(badge);
            }
        }
    }

    // Skeleton loading
    function showSkeletonLoading() {
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += '<div class="skeleton-card">' +
                '<div class="skeleton-line tall"></div>' +
                '<div class="skeleton-line medium"></div>' +
                '<div class="skeleton-line long"></div>' +
                '</div>';
        }
        ordersListEl.innerHTML = html;
    }

    // Load orders for current date (async)
    async function loadOrders(silent = false) {
        if (isLoading) return;
        isLoading = true;

        if (!silent) {
            showSkeletonLoading();
        }

        try {
            const orders = await getOrdersForDate(currentDate, worker.id);

            if (!orders || orders.length === 0) {
                allOrders = [];
                renderFilterPills();
                showEmptyState();
            } else {
                allOrders = orders;
                renderFilterPills();
                renderOrders(getFilteredOrders());
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            if (!silent) {
                ordersListEl.innerHTML =
                    '<div class="empty-state">' +
                    '<div class="empty-icon"><span class="material-icons-round">error_outline</span></div>' +
                    '<div class="empty-title">B\u0142\u0105d \u0142adowania</div>' +
                    '<div class="empty-text">Nie uda\u0142o si\u0119 za\u0142adowa\u0107 zlece\u0144. Sprawd\u017A po\u0142\u0105czenie.</div>' +
                    '</div>';
            }
            if (typeof toast !== 'undefined') {
                toast.error('Nie uda\u0142o si\u0119 za\u0142adowa\u0107 zlece\u0144');
            }
        } finally {
            isLoading = false;
        }
    }

    // Get filtered orders
    function getFilteredOrders() {
        if (activeFilter === 'all') return allOrders;
        if (activeFilter === 'active') {
            return allOrders.filter(o => o.status === 'in_transit' || o.status === 'with_patient' || o.status === 'available');
        }
        return allOrders.filter(o => o.status === activeFilter);
    }

    // Render status filter pills
    function renderFilterPills() {
        if (!statusFiltersEl) return;

        // Count by status
        const counts = { all: allOrders.length, active: 0, scheduled: 0, completed: 0 };
        allOrders.forEach(o => {
            if (o.status === 'in_transit' || o.status === 'with_patient' || o.status === 'available') counts.active++;
            if (o.status === 'scheduled') counts.scheduled++;
            if (o.status === 'completed') counts.completed++;
        });

        const filters = [
            { key: 'all', label: 'Wszystkie', count: counts.all },
            { key: 'active', label: 'Aktywne', count: counts.active },
            { key: 'scheduled', label: 'Zaplanowane', count: counts.scheduled },
            { key: 'completed', label: 'Zako\u0144czone', count: counts.completed }
        ];

        // Only show pills if there are orders
        if (allOrders.length === 0) {
            statusFiltersEl.innerHTML = '';
            return;
        }

        statusFiltersEl.innerHTML = '';
        filters.forEach(f => {
            const pill = document.createElement('button');
            pill.className = 'filter-pill' + (activeFilter === f.key ? ' active' : '');
            pill.innerHTML = f.label + '<span class="pill-count">' + f.count + '</span>';
            pill.addEventListener('click', () => {
                activeFilter = f.key;
                renderFilterPills();
                const filtered = getFilteredOrders();
                if (filtered.length === 0) {
                    showEmptyState('Brak zlece\u0144 w tej kategorii');
                } else {
                    renderOrders(filtered);
                }
            });
            statusFiltersEl.appendChild(pill);
        });
    }

    // Render orders
    function renderOrders(orders) {
        ordersListEl.innerHTML = '';

        // Sortuj: aktywne na g\u00F3rze, potem zaplanowane, zako\u0144czone na dole
        const priority = { 'in_transit': 0, 'with_patient': 1, 'available': 2, 'scheduled': 3, 'completed': 4 };
        orders.sort((a, b) => (priority[a.status] ?? 5) - (priority[b.status] ?? 5));

        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersListEl.appendChild(orderCard);
        });
    }

    // Create order card element
    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card status-' + order.status;
        card.onclick = () => viewOrder(order.id);

        card.innerHTML =
            '<div class="order-header">' +
                '<div class="order-time">' + order.time + '</div>' +
                '<div class="order-status">' +
                    '<span class="status-dot-sm"></span>' +
                    getStatusLabel(order.status) +
                '</div>' +
            '</div>' +
            '<div class="order-patient">' + order.patientName + '</div>' +
            '<div class="order-route">' +
                '<span class="route-from">' +
                    '<span class="material-icons-round">location_on</span>' +
                    '<span class="route-text">' + shortenAddress(order.from) + '</span>' +
                '</span>' +
                '<span class="route-arrow material-icons-round">east</span>' +
                '<span class="route-to">' +
                    '<span class="material-icons-round">local_hospital</span>' +
                    '<span class="route-text">' + shortenAddress(order.to) + '</span>' +
                '</span>' +
            '</div>' +
            '<span class="order-chevron material-icons-round">chevron_right</span>';

        return card;
    }

    // Shorten address for display
    function shortenAddress(address) {
        if (!address) return '-';
        const parts = address.split(',');
        return parts[0].trim();
    }

    // Show empty state
    function showEmptyState(message) {
        ordersListEl.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon"><span class="material-icons-round">assignment</span></div>' +
                '<div class="empty-title">Brak zlece\u0144</div>' +
                '<div class="empty-text">' + (message || 'Nie masz \u017Cadnych zlece\u0144 na ten dzie\u0144') + '</div>' +
            '</div>';
    }

    // View order details
    function viewOrder(orderId) {
        window.location.href = 'order-details.html?id=' + orderId;
    }

    // Date navigation
    prevDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        activeFilter = 'all';
        updateDateDisplay();
        loadOrders();
    });

    nextDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        activeFilter = 'all';
        updateDateDisplay();
        loadOrders();
    });

    // Refresh
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('refreshing');
        refreshBtn.querySelector('span:last-child').textContent = 'Od\u015Bwie\u017Canie...';

        loadOrders().then(() => {
            refreshBtn.classList.remove('refreshing');
            refreshBtn.querySelector('span:last-child').textContent = 'Od\u015Bwie\u017C';
            if (typeof toast !== 'undefined') toast.success('Od\u015Bwie\u017Cono', 1500);
        });
    });

    // Pull-to-refresh (mobile gesture)
    function setupPullToRefresh() {
        if (!pullIndicator) return;

        let startY = 0;
        let pulling = false;

        const ordersScreen = document.querySelector('.orders-screen');
        if (!ordersScreen) return;

        ordersScreen.addEventListener('touchstart', (e) => {
            if (window.scrollY <= 0 && !isLoading) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });

        ordersScreen.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const diff = e.touches[0].clientY - startY;
            if (diff > 60) {
                pullIndicator.classList.add('visible');
            } else {
                pullIndicator.classList.remove('visible');
            }
        }, { passive: true });

        ordersScreen.addEventListener('touchend', () => {
            if (!pulling) return;
            pulling = false;

            if (pullIndicator.classList.contains('visible')) {
                pullIndicator.classList.add('loading');
                loadOrders().then(() => {
                    pullIndicator.classList.remove('visible', 'loading');
                    if (typeof toast !== 'undefined') toast.success('Od\u015Bwie\u017Cono', 1500);
                });
            }
        }, { passive: true });
    }

    // Logout
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Czy na pewno chcesz si\u0119 wylogowa\u0107?')) {
            if (typeof autoRefresh !== 'undefined') autoRefresh.stop();
            await logoutWorkerAPI();
            session.clearSession();
            if (typeof toast !== 'undefined') toast.info('Wylogowano');
            setTimeout(() => { window.location.href = 'index.html'; }, 500);
        }
    });

    // Initialize on load
    init();
});
