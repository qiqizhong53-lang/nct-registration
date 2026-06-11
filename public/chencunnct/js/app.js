// ============ 倒计时 ============
function updateCountdown() {
    var examDate = new Date('2026-08-22T09:00:00');
    var now = new Date();
    var diff = examDate - now;
    if (diff <= 0) {
        document.getElementById('cd-days').textContent = '0';
        document.getElementById('cd-hours').textContent = '0';
        document.getElementById('cd-mins').textContent = '0';
        document.getElementById('cd-secs').textContent = '0';
        return;
    }
    document.getElementById('cd-days').textContent = Math.floor(diff / 864e5);
    document.getElementById('cd-hours').textContent = Math.floor((diff % 864e5) / 36e5);
    document.getElementById('cd-mins').textContent = Math.floor((diff % 36e5) / 6e4);
    document.getElementById('cd-secs').textContent = Math.floor((diff % 6e4) / 1e3);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============ FAQ 折叠 ============
document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
        this.parentElement.classList.toggle('open');
    });
});

// ============ 滚动渐入 ============
var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(function(el) {
    observer.observe(el);
});

// ============ Toast 提示 ============
function showToast(msg, duration) {
    duration = duration || 2500;
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() {
        el.classList.remove('show');
    }, duration);
}

// ============ 报名流程 ============
var pendingPeriod = '';

function register(btn, period) {
    var row = btn.closest('.reg-input-row');
    var name = row.querySelector('.reg-input').value.trim();
    if (!name) {
        row.querySelector('.reg-input').focus();
        row.querySelector('.reg-input').style.borderColor = '#FF4444';
        setTimeout(function() {
            row.querySelector('.reg-input').style.borderColor = '';
        }, 1500);
        return;
    }
    pendingPeriod = period;
    document.getElementById('modalPeriod').textContent = period;
    document.getElementById('modalName').value = name;
    document.getElementById('regModal').classList.add('show');
    document.getElementById('modalName').focus();
}

function closeModal() {
    document.getElementById('regModal').classList.remove('show');
    pendingPeriod = '';
}

document.getElementById('regModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

function submitReg() {
    var name = document.getElementById('modalName').value.trim();
    var teacher = document.getElementById('modalTeacher').value;
    var btn = document.getElementById('modalSubmit');

    if (!name) {
        document.getElementById('modalName').focus();
        return;
    }
    if (!teacher) {
        document.getElementById('modalTeacher').style.borderColor = '#FF4444';
        setTimeout(function() {
            document.getElementById('modalTeacher').style.borderColor = '';
        }, 1500);
        return;
    }

    btn.disabled = true;
    btn.textContent = '提交中...';

    fetch('api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'name=' + encodeURIComponent(name) +
              '&period=' + encodeURIComponent(pendingPeriod) +
              '&teacher=' + encodeURIComponent(teacher)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        closeModal();
        if (data.ok) {
            showToast('✅ 报名成功！\n\n' + name + '\n' + pendingPeriod + '\n' + teacher, 3000);
            document.querySelectorAll('.reg-input').forEach(function(el) { el.value = ''; });
            document.getElementById('modalTeacher').selectedIndex = 0;
            document.getElementById('modalTeacher').classList.remove('has-value');
        } else {
            showToast('❌ ' + (data.msg || '提交失败，请稍后再试'));
        }
    })
    .catch(function() {
        showToast('❌ 网络错误，请稍后再试');
    })
    .finally(function() {
        btn.disabled = false;
        btn.textContent = '确认提交';
    });
}
