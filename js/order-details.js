// Order details screen logic (Updated for Stitch UI / Tailwind + API)

document.addEventListener('DOMContentLoaded', async () => {
    // Check login
    if (!session.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = 'orders.html';
        return;
    }

    // Pobierz zlecenie (async)
    let order = await getOrderById(orderId);
    if (!order) {
        window.location.href = 'orders.html';
        return;
    }

    // --- ELEMENTS ---
    const els = {
        backBtn: document.getElementById('back-btn'),
        orderTime: document.getElementById('order-time'),
        patientName: document.getElementById('patient-name'),
        patientPesel: document.getElementById('patient-pesel'),
        patientPhoneBtn: document.getElementById('patient-phone-btn'),

        patientTypeIcon: document.getElementById('patient-type-icon'),
        patientTypeLabel: document.getElementById('patient-type-label'),

        routeFrom: document.getElementById('route-from'),
        routeTo: document.getElementById('route-to'),

        medicalNotesSec: document.getElementById('medical-notes-section'),
        medicalNotesText: document.getElementById('medical-notes-text'),

        // Timeline steps
        stepAvailable: document.getElementById('timeline-step-available'),
        stepTransit: document.getElementById('timeline-step-transit'),
        stepPatient: document.getElementById('timeline-step-patient'),

        timeAvailable: document.getElementById('time-available'),
        timeTransit: document.getElementById('time-transit'),
        timePatient: document.getElementById('time-patient'),

        // Buttons & Inputs
        btnStart: document.getElementById('btn-start'),
        btnArrived: document.getElementById('btn-arrived'),
        btnComplete: document.getElementById('btn-complete'),

        kmContainer: document.getElementById('km-input-container'),
        kmInput: document.getElementById('km-input'),
        kmSaveBtn: document.getElementById('km-save-btn'),

        actionGrid: document.getElementById('action-buttons-grid'),
        btnNavigate: document.getElementById('btn-navigate')
    };

    // --- INIT ---
    function init() {
        // Basic Data Binding
        els.orderTime.textContent = order.time;
        els.patientName.textContent = order.patientName;
        els.patientPesel.textContent = 'PESEL: ' + order.patientPESEL;
        els.patientPhoneBtn.href = 'tel:' + order.patientPhone;

        els.routeFrom.textContent = order.from;
        els.routeTo.textContent = order.to;

        // Type
        if (order.patientType === 'leżący') {
            els.patientTypeIcon.textContent = 'bed';
            els.patientTypeLabel.textContent = 'Leżący';
        } else {
            els.patientTypeIcon.textContent = 'accessible';
            els.patientTypeLabel.textContent = 'Siedzący';
        }

        // Notes
        if (order.medicalNotes) {
            els.medicalNotesSec.classList.remove('hidden');
            els.medicalNotesText.textContent = order.medicalNotes;
        }

        updateStatusUI();
        loadStreetView();
        loadETAPrediction(); // AI: Widget ETA
    }

    // --- STREET VIEW ---
    function loadStreetView() {
        var address = order.to || order.from;
        if (!address) return;

        var svImg = document.getElementById('streetview-img');
        if (svImg) {
            // UWAGA BEZPIECZEŃSTWO: Klucz API powinien być konfigurowany jako zmienna środowiskowa
            // lub przekazywany z backendu. W produkcji zabezpiecz klucz ograniczeniami HTTP Referrer
            // w Google Cloud Console: https://console.cloud.google.com/apis/credentials
            var params = new URLSearchParams({
                size: '600x300',
                location: address,
                fov: '90',
                pitch: '10',
                key: 'AIzaSyA0tTZTp2bZBb2cbbSBcnxEoPXERnfx1w8' // TODO: Przenieść do zmiennych środowiskowych
            });
            svImg.src = 'https://maps.googleapis.com/maps/api/streetview?' + params.toString();
        }
    }

    // --- STATUS UI LOGIC (Tailwind Classes) ---
    function updateStatusUI() {
        const s = order.status;

        const setStep = (el, timeEl, state, timeVal) => {
            const iconContainer = el.querySelector('.relative.z-10');
            const textTitle = el.querySelector('p.text-sm');

            // Reset base classes
            iconContainer.className = 'relative z-10 w-6 h-6 rounded-full flex items-center justify-center mr-4 transition-all duration-300';
            iconContainer.innerHTML = '';

            if (state === 'completed') {
                iconContainer.classList.add('bg-green-500', 'text-white', 'shadow-md');
                iconContainer.innerHTML = '<span class="material-icons-round text-sm">check</span>';
                textTitle.classList.add('text-gray-900', 'dark:text-white');
                textTitle.classList.remove('text-gray-500', 'text-gray-400');
                if (timeVal) timeEl.textContent = formatTimeShort(new Date(timeVal));
            }
            else if (state === 'active') {
                iconContainer.classList.add('bg-white', 'dark:bg-surface-dark', 'border-[3px]', 'border-primary', 'shadow-md');
                iconContainer.innerHTML = '<div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>';
                textTitle.classList.add('text-primary', 'font-bold');
                textTitle.classList.remove('text-gray-500');
                timeEl.textContent = 'Teraz';
                timeEl.classList.add('text-primary');
            }
            else { // pending
                iconContainer.classList.add('bg-white', 'dark:bg-surface-dark', 'border-2', 'border-gray-300', 'dark:border-gray-600');
                textTitle.classList.add('text-gray-400');
                textTitle.classList.remove('text-gray-900', 'font-bold', 'text-primary');
                timeEl.textContent = '-';
            }
        };

        // 1. Available Step (Always completed for assigned orders)
        setStep(els.stepAvailable, els.timeAvailable, 'completed', order.date);

        // 2. In Transit
        if (s === 'available' || s === 'scheduled') {
            setStep(els.stepTransit, els.timeTransit, 'pending');
            setStep(els.stepPatient, els.timePatient, 'pending');
            showBtn('btnStart');
        } else if (s === 'in_transit') {
            setStep(els.stepTransit, els.timeTransit, 'active');
            setStep(els.stepPatient, els.timePatient, 'pending');
            showBtn('btnArrived');
        } else if (s === 'with_patient') {
            setStep(els.stepTransit, els.timeTransit, 'completed', order.startTime);
            setStep(els.stepPatient, els.timePatient, 'active');
            showBtn('btnComplete');
        } else if (s === 'completed') {
            setStep(els.stepTransit, els.timeTransit, 'completed', order.startTime);
            setStep(els.stepPatient, els.timePatient, 'completed', order.arrivalTime);
            showBtn('none');
            els.kmContainer.classList.remove('hidden');

            if (order.kilometers) {
                els.kmInput.value = order.kilometers;
                els.kmSaveBtn.textContent = 'Zaktualizuj';
            }
        }
    }

    function showBtn(btnId) {
        els.btnStart.classList.add('hidden');
        els.btnArrived.classList.add('hidden');
        els.btnComplete.classList.add('hidden');

        if (btnId !== 'none' && els[btnId]) {
            els[btnId].classList.remove('hidden');
        }
    }

    function formatTimeShort(date) {
        return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    }

    // --- EVENT LISTENERS ---

    // Back
    els.backBtn.addEventListener('click', () => window.location.href = 'orders.html');

    // Nawigacja Google Maps - trasa od→do
    if (els.btnNavigate) {
        els.btnNavigate.addEventListener('click', () => {
            const destination = order.status === 'in_transit' ? order.from : order.to;
            const origin = order.status === 'in_transit' ? '' : order.from;
            const params = new URLSearchParams({
                api: '1',
                destination: destination,
                travelmode: 'driving'
            });
            if (origin) params.set('origin', origin);
            window.open('https://www.google.com/maps/dir/?' + params.toString(), '_blank');
        });
    }

    // Status Actions (async)
    els.btnStart.addEventListener('click', async () => {
        els.btnStart.disabled = true;
        const now = new Date().toISOString();
        await updateOrderStatus(orderId, 'in_transit', now);
        order.status = 'in_transit';
        order.startTime = now;
        if (typeof toast !== 'undefined') toast.success('Wyruszam do pacjenta');
        updateStatusUI();
    });

    els.btnArrived.addEventListener('click', async () => {
        els.btnArrived.disabled = true;
        const now = new Date().toISOString();
        await updateOrderStatus(orderId, 'with_patient', now);
        order.status = 'with_patient';
        order.arrivalTime = now;
        if (typeof toast !== 'undefined') toast.success('Jestem u pacjenta');
        updateStatusUI();
    });

    els.btnComplete.addEventListener('click', async () => {
        els.btnComplete.disabled = true;
        els.btnComplete.textContent = 'Kończenie...';
        const now = new Date().toISOString();
        await updateOrderStatus(orderId, 'completed', now);
        order.status = 'completed';
        order.endTime = now;
        if (typeof toast !== 'undefined') toast.success('Transport zakończony');
        updateStatusUI();

        // Auto-pobierz km z GPS Cartrack
        try {
            const gpsResult = await fetchGPSKilometers(orderId);
            if (gpsResult && gpsResult.km) {
                order.kilometers = gpsResult.km;
                els.kmInput.value = gpsResult.km;
                els.kmSaveBtn.textContent = 'Potwierdź GPS km';
                if (typeof toast !== 'undefined') toast.gps('GPS: ' + gpsResult.km + ' km');
            }
        } catch (gpsErr) {
            console.log('GPS auto-fetch niedostępny:', gpsErr);
        }
    });

    // KM Save (async)
    els.kmSaveBtn.addEventListener('click', async () => {
        const val = parseFloat(els.kmInput.value);
        if (val > 0) {
            els.kmSaveBtn.disabled = true;
            els.kmSaveBtn.textContent = 'Zapisywanie...';
            const source = order.kilometers ? 'GPS_Cartrack' : 'Recznie';
            await saveKilometers(orderId, val, source);
            if (typeof toast !== 'undefined') toast.success('Zapisano: ' + val + ' km');
            setTimeout(() => { window.location.href = 'orders.html'; }, 1000);
        } else {
            if (typeof toast !== 'undefined') {
                toast.warning('Podaj kilometry > 0');
            } else {
                alert('Podaj warto\u015B\u0107 wi\u0119ksz\u0105 od 0');
            }
        }
    });

    // ============================================================
    // AI: WIDGET ETA (Predykcja czasu dojazdu)
    // ============================================================

    /**
     * Ładuje predykcję ETA dla zlecenia
     */
    async function loadETAPrediction() {
        // Wyświetl widget tylko dla statusów: available, scheduled, in_transit
        if (order.status === 'with_patient' || order.status === 'completed') {
            return; // ETA nieaktualne po dotarciu
        }

        try {
            const result = await apiGet({
                action: 'predictETA',
                orderId: order.id
            });

            if (result && result.success) {
                displayETAWidget(result);
            }
        } catch (error) {
            console.log('ETA prediction error:', error);
        }
    }

    /**
     * Wyświetla widget ETA na ekranie
     */
    function displayETAWidget(etaData) {
        // Znajdź kontener na ETA (możemy dodać dynamicznie przed timeline)
        var timelineContainer = document.querySelector('.timeline-container');
        if (!timelineContainer) return;

        // Sprawdź czy widget już istnieje
        var existingWidget = document.getElementById('eta-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        // Utwórz widget ETA
        var widget = document.createElement('div');
        widget.id = 'eta-widget';
        widget.className = 'eta-widget';

        // Ikona zaufania
        var confidenceIcon = 'schedule';
        var confidenceColor = '#4caf50'; // green
        if (etaData.confidence === 'medium') {
            confidenceIcon = 'schedule';
            confidenceColor = '#ff9800'; // orange
        } else if (etaData.confidence === 'low') {
            confidenceIcon = 'warning';
            confidenceColor = '#f44336'; // red
        }

        // Ruch drogowy
        var trafficBadge = '';
        if (etaData.trafficImpact > 0) {
            var trafficColor = etaData.trafficImpact > 20 ? '#f44336' : '#ff9800';
            trafficBadge = `
                <div style="display: inline-flex; align-items: center; background: ${trafficColor}20; color: ${trafficColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">
                    <span class="material-icons-round" style="font-size: 14px; margin-right: 4px;">traffic</span>
                    +${etaData.trafficImpact}%
                </div>
            `;
        }

        widget.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span class="material-icons-round" style="font-size: 24px; margin-right: 8px;">navigation</span>
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Przewidywany czas dojazdu</h3>
                </div>
                <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
                    <div style="font-size: 36px; font-weight: 700; margin-right: 8px;">${etaData.durationWithTrafficMinutes}</div>
                    <div style="font-size: 18px; opacity: 0.9;">minut</div>
                    ${trafficBadge}
                </div>
                <div style="font-size: 14px; opacity: 0.85; margin-bottom: 12px;">
                    Przewidywany przyjazd: <strong>${formatETATime(etaData.eta)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; opacity: 0.8;">
                    <div>
                        <span class="material-icons-round" style="vertical-align: middle; font-size: 16px;">straighten</span>
                        ${etaData.distanceKm} km
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span class="material-icons-round" style="font-size: 16px; margin-right: 4px; color: ${confidenceColor};">${confidenceIcon}</span>
                        ${getConfidenceLabel(etaData.confidence)}
                    </div>
                </div>
            </div>
        `;

        // Wstaw przed timeline
        timelineContainer.parentNode.insertBefore(widget, timelineContainer);
    }

    /**
     * Formatuje czas ETA
     */
    function formatETATime(etaStr) {
        if (!etaStr) return '-';
        try {
            var date = new Date(etaStr);
            return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return etaStr;
        }
    }

    /**
     * Zwraca label zaufania
     */
    function getConfidenceLabel(confidence) {
        if (confidence === 'high') return 'Wysoka dokładność';
        if (confidence === 'medium') return 'Średnia dokładność';
        if (confidence === 'low') return 'Niska dokładność';
        return 'Szacunek';
    }

    init();
});
