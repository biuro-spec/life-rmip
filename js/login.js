// Login screen logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (session.isLoggedIn()) {
        window.location.href = 'orders.html';
        return;
    }

    // Elements
    const workerSelect = document.getElementById('worker-select');
    const pinInput = document.getElementById('pin-input');
    const vehicleSelect = document.getElementById('vehicle-select');
    const startWorkBtn = document.getElementById('start-work-btn');
    const timestampEl = document.getElementById('current-time');
    const loginError = document.getElementById('login-error');

    // Update timestamp every second
    function updateTimestamp() {
        const now = new Date();
        timestampEl.textContent = formatDateTime(now);
    }

    updateTimestamp();
    setInterval(updateTimestamp, 1000);

    // Enable/disable start button based on selection
    function checkFormValidity() {
        const isValid = workerSelect.value && pinInput.value.length >= 4 && vehicleSelect.value;
        startWorkBtn.disabled = !isValid;
    }

    workerSelect.addEventListener('change', checkFormValidity);
    pinInput.addEventListener('input', checkFormValidity);
    vehicleSelect.addEventListener('change', checkFormValidity);

    // Hide error on input change
    [workerSelect, pinInput, vehicleSelect].forEach(el => {
        el.addEventListener('input', () => {
            loginError.style.display = 'none';
        });
        el.addEventListener('change', () => {
            loginError.style.display = 'none';
        });
    });

    // Handle start work
    startWorkBtn.addEventListener('click', async () => {
        const workerLogin = workerSelect.value;
        const workerName = workerSelect.options[workerSelect.selectedIndex].text;
        const pin = pinInput.value;
        const vehicleNumber = vehicleSelect.value;

        // Disable button during login
        startWorkBtn.textContent = 'Logowanie...';
        startWorkBtn.disabled = true;
        loginError.style.display = 'none';

        try {
            const result = await loginWorkerAPI(workerLogin, pin, vehicleNumber);

            if (result.success) {
                // Save to session
                const workerData = result.data || {
                    id: workerLogin,
                    name: workerName,
                    vehicleId: vehicleNumber,
                    vehicleName: 'Karetka ' + vehicleNumber,
                    startTime: new Date().toISOString()
                };

                // Upewnij się że dane sesji są kompletne
                if (!workerData.vehicleName) {
                    workerData.vehicleName = 'Karetka ' + vehicleNumber;
                }
                if (!workerData.vehicleId) {
                    workerData.vehicleId = vehicleNumber;
                }

                session.setCurrentWorker(workerData);
                storage.set('workStartTime', workerData.startTime);

                // Redirect to orders list
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 300);
            } else {
                // Show error
                loginError.textContent = result.message || 'Nieprawidłowy PIN';
                loginError.style.display = 'block';
                startWorkBtn.textContent = 'Rozpocznij pracę';
                startWorkBtn.disabled = false;
                checkFormValidity();
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Błąd połączenia z serwerem';
            loginError.style.display = 'block';
            startWorkBtn.textContent = 'Rozpocznij pracę';
            startWorkBtn.disabled = false;
            checkFormValidity();
        }
    });
});
