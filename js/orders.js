// Orders list screen logic

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
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const ordersListEl = document.getElementById('orders-list');
    const refreshBtn = document.getElementById('refresh-btn');

    // State
    let currentDate = new Date();
    let isLoading = false;

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
    }

    // Update date display
    function updateDateDisplay() {
        currentDateEl.textContent = formatDate(currentDate);
    }

    // Load orders for current date (async)
    async function loadOrders(silent = false) {
        if (isLoading) return;
        isLoading = true;

        if (!silent) {
            ordersListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">\u23F3</div><div class="empty-text">\u0141adowanie...</div></div>';
        }

        try {
            const orders = await getOrdersForDate(currentDate, worker.id);

            if (!orders || orders.length === 0) {
                showEmptyState();
            } else {
                renderOrders(orders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            if (!silent) {
                ordersListEl.innerHTML = '<div class="empty-state"><div class="empty-icon">\u26A0\uFE0F</div><div class="empty-text">B\u0142\u0105d \u0142adowania zlece\u0144</div></div>';
            }
            if (typeof toast !== 'undefined') {
                toast.error('Nie uda\u0142o si\u0119 za\u0142adowa\u0107 zlece\u0144');
            }
        } finally {
            isLoading = false;
        }
    }

    // Render orders
    function renderOrders(orders) {
        ordersListEl.innerHTML = '';

        // Sortuj: aktywne na górze, potem zaplanowane, zakończone na dole
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
                    getStatusLabel(order.status) +
                '</div>' +
            '</div>' +
            '<div class="order-patient">' + order.patientName + '</div>' +
            '<div class="order-route">' +
                '<span class="route-from"><span class="material-icons-round">location_on</span> ' + shortenAddress(order.from) + '</span>' +
                '<span class="route-arrow">\u2192</span>' +
                '<span class="route-to"><span class="material-icons-round">local_hospital</span> ' + shortenAddress(order.to) + '</span>' +
            '</div>';

        return card;
    }

    // Shorten address for display
    function shortenAddress(address) {
        if (!address) return '-';
        const parts = address.split(',');
        return parts[0].trim();
    }

    // Show empty state
    function showEmptyState() {
        ordersListEl.innerHTML =
            '<div class="empty-state">' +
                '<div class="empty-icon">\uD83D\uDCCB</div>' +
                '<div class="empty-title">Brak zlece\u0144</div>' +
                '<div class="empty-text">Nie masz \u017Cadnych zlece\u0144 na ten dzie\u0144</div>' +
            '</div>';
    }

    // View order details
    function viewOrder(orderId) {
        window.location.href = 'order-details.html?id=' + orderId;
    }

    // Date navigation
    prevDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadOrders();
    });

    nextDayBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadOrders();
    });

    // Refresh
    refreshBtn.addEventListener('click', () => {
        refreshBtn.textContent = 'Od\u015Bwie\u017Canie...';
        refreshBtn.disabled = true;

        loadOrders().then(() => {
            refreshBtn.innerHTML = '<span class="refresh-icon">\uD83D\uDD04</span> Od\u015Bwie\u017C';
            refreshBtn.disabled = false;
            if (typeof toast !== 'undefined') toast.success('Od\u015Bwie\u017Cono', 1500);
        });
    });

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
