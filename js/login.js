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
    const pinBoxes = document.querySelectorAll('.pin-box');
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

    // PIN boxes logic
    function collectPin() {
        let pin = '';
        pinBoxes.forEach(box => { pin += box.value; });
        pinInput.value = pin;
        checkFormValidity();
    }

    pinBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;

            if (val) {
                e.target.classList.add('filled');
                // Auto-advance to next box
                if (index < pinBoxes.length - 1) {
                    pinBoxes[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }

            loginError.style.display = 'none';
            collectPin();
        });

        box.addEventListener('keydown', (e) => {
            // Backspace: clear current and go back
            if (e.key === 'Backspace' && !box.value && index > 0) {
                pinBoxes[index - 1].value = '';
                pinBoxes[index - 1].classList.remove('filled');
                pinBoxes[index - 1].focus();
                collectPin();
            }
        });

        // Select all text on focus for easy overwrite
        box.addEventListener('focus', () => {
            box.select();
        });

        // Handle paste (e.g. paste full 4-digit PIN)
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            for (let i = 0; i < Math.min(pasteData.length, pinBoxes.length); i++) {
                pinBoxes[i].value = pasteData[i];
                pinBoxes[i].classList.add('filled');
            }
            if (pasteData.length >= pinBoxes.length) {
                pinBoxes[pinBoxes.length - 1].focus();
            } else {
                pinBoxes[Math.min(pasteData.length, pinBoxes.length - 1)].focus();
            }
            collectPin();
        });
    });

    // Enable/disable start button based on selection
    function checkFormValidity() {
        const isValid = workerSelect.value && pinInput.value.length >= 4 && vehicleSelect.value;
        startWorkBtn.disabled = !isValid;
    }

    workerSelect.addEventListener('change', () => {
        loginError.style.display = 'none';
        checkFormValidity();
    });
    vehicleSelect.addEventListener('change', () => {
        loginError.style.display = 'none';
        checkFormValidity();
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
                // Show error with shake animation
                loginError.textContent = result.message || 'Nieprawidłowy PIN';
                loginError.style.display = 'block';
                pinBoxes.forEach(box => {
                    box.classList.add('error');
                    setTimeout(() => box.classList.remove('error'), 400);
                });
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
