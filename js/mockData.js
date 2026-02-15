// Mock data for testing (will be replaced with actual Google Sheets API later)

const mockOrders = [
    {
        id: '001',
        time: '10:00',
        patientName: 'Jan Kowalski',
        patientPESEL: '80010112345',
        patientPhone: '+48 500 123 456',
        patientType: 'siedzący',
        from: 'Dom, Racibórz ul. Długa 15',
        to: 'Szpital Racibórz, Oddz. Neurologii',
        status: 'available',
        contractor: 'Szpital Racibórz',
        transportType: 'sanitarny',
        medicalNotes: 'Pacjent wymaga tlenu',
        assignedWorker: 'krzysztof',
        vehicle: '2',
        date: '2026-02-08'
    },
    {
        id: '002',
        time: '14:30',
        patientName: 'Anna Nowak',
        patientPESEL: '75050567890',
        patientPhone: '+48 600 234 567',
        patientType: 'leżący',
        from: 'Przychodnia ScanMed, Racibórz',
        to: 'Dom, Racibórz ul. Krótka 8',
        status: 'in_transit',
        contractor: 'ScanMed',
        transportType: '',
        medicalNotes: '',
        assignedWorker: 'krzysztof',
        vehicle: '2',
        date: '2026-02-08',
        startTime: '2026-02-08T14:25:00'
    },
    {
        id: '003',
        time: '16:00',
        patientName: 'Piotr Wiśniewski',
        patientPESEL: '90121298765',
        patientPhone: '+48 700 345 678',
        patientType: 'siedzący',
        from: 'Szpital Racibórz',
        to: 'Dom, Kietrz ul. Polna 12',
        status: 'scheduled',
        contractor: 'Kietrz',
        transportType: '',
        medicalNotes: 'Kontrola po zabiegu',
        assignedWorker: 'krzysztof',
        vehicle: '2',
        date: '2026-02-08'
    },
    {
        id: '004',
        time: '09:00',
        patientName: 'Maria Zielińska',
        patientPESEL: '55030145678',
        patientPhone: '+48 500 456 789',
        patientType: 'siedzący',
        from: 'Dom, Racibórz ul. Nowa 3',
        to: 'Przychodnia POZ Krzyżanowice',
        status: 'scheduled',
        contractor: 'POZ Krzyżanowice',
        transportType: '',
        medicalNotes: '',
        assignedWorker: 'krzysztof',
        vehicle: '2',
        date: '2026-02-09'
    }
];

// Get orders for a specific date and worker
function getOrdersForDate(date, workerId) {
    const dateStr = formatDate(new Date(date)).split('.').reverse().join('-');

    return mockOrders.filter(order =>
        order.date === dateStr && order.assignedWorker === workerId
    );
}

// Get single order by ID
function getOrderById(orderId) {
    return mockOrders.find(order => order.id === orderId);
}

// Update order status (in mock data)
function updateOrderStatus(orderId, newStatus, timestamp) {
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;

        // Update timestamps based on status
        if (newStatus === 'in_transit') {
            order.startTime = timestamp;
        } else if (newStatus === 'with_patient') {
            order.arrivalTime = timestamp;
        } else if (newStatus === 'completed') {
            order.endTime = timestamp;
        }

        return true;
    }
    return false;
}

// Save kilometers
function saveKilometers(orderId, kilometers, source = 'manual') {
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
        order.kilometers = kilometers;
        order.kilometersSource = source;
        return true;
    }
    return false;
}

