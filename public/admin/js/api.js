function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function api(path, options = {}) {
    const res = await fetch(path, {
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });
    let data = {};
    try {
        data = await res.json();
    } catch (error) {
        data = {};
    }
    if (res.status === 401 && !path.endsWith('/login')) {
        if (!window.location.pathname.endsWith('/login.html')) {
            window.location.href = '/admin/login.html';
        }
        throw new Error(data.message || '未授權');
    }
    if (!res.ok) {
        throw new Error(data.message || '請求失敗');
    }
    return data;
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('zh-TW');
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('zh-TW', { hour12: false });
}

function genderLabel(gender) {
    if (gender === 'male') return '男';
    if (gender === 'female') return '女';
    if (gender === 'other') return '其他';
    return gender || '—';
}

function toDateInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

async function requireAdmin() {
    const data = await api('/api/admin/me');
    return data.admin;
}

async function logoutAdmin() {
    await api('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
}
