/**
 * SmartSpend - Settings Controller
 */

let resetModal = null;

document.addEventListener('DOMContentLoaded', () => {
    resetModal = new bootstrap.Modal(document.getElementById('resetConfirmModal'));
    loadUserProfile();
    loadCurrentSettings();
    initSettingsForm();

    document.getElementById('btnTriggerReset').addEventListener('click', () => {
        resetModal.show();
    });

    document.getElementById('btnConfirmReset').addEventListener('click', () => {
        SmartSpend.post('/api/seed/reset', {})
            .then(res => {
                resetModal.hide();
                SmartSpend.showToast('Demo dataset restored successfully!', 'success');
            })
            .catch(err => {
                SmartSpend.showToast(err.message, 'danger');
            });
    });
});

function loadUserProfile() {
    const user = SmartSpend.getUser();
    if (user) {
        const initials = user.fullName
            ? user.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            : 'U';
        const avatarEl = document.getElementById('accountAvatar');
        const nameEl = document.getElementById('accountFullName');
        const emailEl = document.getElementById('accountEmail');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = user.fullName || 'User';
        if (emailEl) emailEl.textContent = user.email || '';
    }

    const accountLogoutBtn = document.getElementById('btnAccountLogout');
    if (accountLogoutBtn) {
        accountLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                SmartSpend.logout();
            }
        });
    }
}

function loadCurrentSettings() {
    const s = SmartSpend.settings;

    const currSelect = document.getElementById('settingCurrency');
    if (currSelect) {
        currSelect.value = s.currency || '₹';
    }

    const numFormatSelect = document.getElementById('settingNumberFormat');
    if (numFormatSelect) {
        numFormatSelect.value = s.numberFormat || 'indian';
    }

    const dateSelect = document.getElementById('settingDateFormat');
    if (dateSelect) {
        dateSelect.value = s.dateFormat || 'DD/MM/YYYY';
    }

    if (s.theme === 'dark') {
        document.getElementById('themeDark').checked = true;
    } else {
        document.getElementById('themeLight').checked = true;
    }
}

function initSettingsForm() {
    const form = document.getElementById('settingsForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const currSelect = document.getElementById('settingCurrency');
        const currency = currSelect.value;
        const currencyCode = currSelect.options[currSelect.selectedIndex].getAttribute('data-code') || 'INR';
        const numberFormat = document.getElementById('settingNumberFormat').value;
        const dateFormat = document.getElementById('settingDateFormat').value;
        const theme = document.querySelector('input[name="settingTheme"]:checked').value;

        // Save to localStorage
        localStorage.setItem('smartspend_currency', currency);
        localStorage.setItem('smartspend_currency_code', currencyCode);
        localStorage.setItem('smartspend_number_format', numberFormat);
        localStorage.setItem('smartspend_date_format', dateFormat);
        localStorage.setItem('smartspend_theme', theme);

        // Update in-memory state
        SmartSpend.settings.currency = currency;
        SmartSpend.settings.currencyCode = currencyCode;
        SmartSpend.settings.numberFormat = numberFormat;
        SmartSpend.settings.dateFormat = dateFormat;
        SmartSpend.settings.theme = theme;

        // Apply theme immediately
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggles = document.querySelectorAll('.theme-toggle-btn');
        themeToggles.forEach(btn => {
            btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });

        SmartSpend.showToast('Your settings and display preferences have been saved!', 'success');
    });
}
