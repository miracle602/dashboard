// ========== 真实数据驱动的零售分析 ==========
// 数据来源: real-data.js (Oracle直连2026年数据)

var C = {};
var AD = typeof REAL_DATA !== 'undefined' ? REAL_DATA : [];
var FD = AD;

function fmt(v) { return '¥' + v.toLocaleString('zh-CN'); }
function gd(s) { return parseInt(s.replace(/-/g, '')); }

// 门店列表（去重）
var STORE_IDS = [];
var STORE_NAMES = {};
for (var i = 0; i < AD.length; i++) {
    var sid = AD[i].store_id;
    var sname = AD[i].store_name;
    if (STORE_NAMES[sid] === undefined) {
        STORE_NAMES[sid] = sname;
        STORE_IDS.push({ id: sid, name: sname });
    }
}
STORE_IDS.sort(function(a, b) { return a.name.localeCompare(b.name); });

function doQuery() {
    var sn = gd(document.getElementById('startDate').value);
    var en = gd(document.getElementById('endDate').value);

    var brand = document.getElementById('brandSelect').value;
    var styleNo = document.getElementById('styleNo').value.trim();

    var years = new Set();
    var ycbs = document.querySelectorAll('#yearGroup input:checked');
    for (var i = 0; i < ycbs.length; i++) years.add(ycbs[i].value);

    var seasons = new Set();
    var scbs = document.querySelectorAll('.season-cb:checked');
    for (var i = 0; i < scbs.length; i++) seasons.add(scbs[i].value);

    var stores = new Set();
    var scbs2 = document.querySelectorAll('#storeGroup input:checked');
    for (var i = 0; i < scbs2.length; i++) stores.add(parseInt(scbs2[i].value));

    FD = AD.filter(function(r) {
        if (r.date < sn || r.date > en) return false;
        if (stores.size > 0 && !stores.has(r.store_id)) return false;
        if (styleNo) {
            var found = false;
            for (var j = 0; j < (r.items || []).length; j++) {
                if ((r.items[j].pname || '').indexOf(styleNo) >= 0) found = true;
            }
            if (!found && (r.docno || '').indexOf(styleNo) < 0) return false;
        }
        if (years.size > 0 && !years.has(String(r.date).substring(0, 4))) return false;
        return true;
    });

    document.getElementById('updateTime').textContent = '⏱ ' + new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    renderAll();
}

function toggleAllStores(sel) {
    var cbs = document.querySelectorAll('#storeGroup input[type=checkbox]');
    for (var i = 0; i < cbs.length; i++) cbs[i].checked = sel;
    doQuery();
}

function resetQuery() {
    document.getElementById('startDate').value = '2026-01-01';
    document.getElementById('endDate').value = '2026-04-27';
    document.getElementById('brandSelect').value = 'all';
    document.getElementById('styleNo').value = '';
    var ycbs = document.querySelectorAll('#yearGroup input[type=checkbox]');
    for (var i = 0; i < ycbs.length; i++) ycbs[i].checked = (ycbs[i].value === '2026');
    var scbs = document.querySelectorAll('.season-cb');
    for (var i = 0; i < scbs.length; i++) scbs[i].checked = false;
    var scbs2 = document.querySelectorAll('#storeGroup input[type=checkbox]');
    for (var i = 0; i < scbs2.length; i++) scbs2[i].checked = true;
    doQuery();
}

function renderAll() { rKPI(); rTrend(); rStore(); rProfit(); rDaily(); rTable(); }

function rKPI() {
    var g = document.getElementById('kpiGrid');
    if (!FD.length) { g.innerHTML = '<div class="kpi-card"><div class="label">暂无</div><div class="val">—</div></div>'.repeat(6); return; }
    var a = 0, la = 0, q = 0, ss = {}, vs = {};
    for (var i = 0; i < FD.length; i++) {
        var r = FD[i];
        a += r.amt_actual;
        la += r.amt_list;
        q += r.qty;
        ss[r.store_id] = 1;
        if (r.vip) vs[r.vip] = 1;
    }
    var gr = a > 0 && la > 0 ? ((la - a) / la * 100).toFixed(1) : 0;
    var sc = Object.keys(ss).length, vc = Object.keys(vs).length;

    // 毛利估算(55%)
    var gp = a * 0.55;

    g.innerHTML =
        '<div class="kpi-card"><div class="label">💰 成交金额</div><div class="val">' + fmt(a) + '</div><div class="subrow"><span class="info">原价 ' + fmt(la) + '</span></div></div>' +
        '<div class="kpi-card"><div class="label">📊 折扣率</div><div class="val">' + (la > 0 ? (a / la * 100).toFixed(1) : 0) + '%</div><div class="subrow"><span class="info">毛利(估) ' + fmt(gp) + '</span></div></div>' +
        '<div class="kpi-card"><div class="label">📦 总销量</div><div class="val">' + q + '</div><div class="subrow"><span class="info">' + FD.length + '笔订单</span></div></div>' +
        '<div class="kpi-card"><div class="label">🏬 活跃门店</div><div class="val">' + sc + '</div><div class="subrow"><span class="info">' + vc + '位会员</span></div></div>' +
        '<div class="kpi-card"><div class="label">📈 客单价</div><div class="val">¥' + (FD.length > 0 ? (a / FD.length).toFixed(0) : 0) + '</div><div class="subrow"><span class="info">件单价 ¥' + (q > 0 ? (a / q).toFixed(0) : 0) + '</span></div></div>' +
        '<div class="kpi-card"><div class="label">🔄 总销售额</div><div class="val">' + (a / 10000).toFixed(1) + '万</div><div class="subrow"><span class="info">' + FD.length + '笔</span></div></div>';
}

function rTrend() {
    if (C.trend) C.trend.destroy();
    var ctx = document.getElementById('trendChart').getContext('2d');
    var md = {};
    for (var i = 0; i < FD.length; i++) {
        var m = String(FD[i].date).substring(0, 6);
        md[m] = (md[m] || 0) + FD[i].amt_actual;
    }
    var ms = Object.keys(md).sort();
    C.trend = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ms.map(function(m) { return m.substring(0, 4) + '.' + m.substring(4, 6); }),
            datasets: [{ label: '成交金额', data: ms.map(function(m) { return Math.round(md[m]); }), backgroundColor: '#4361ee', borderRadius: 3, barPercentage: .6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return '¥' + ctx.raw.toLocaleString(); } } } },
            scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '¥' + (v / 10000).toFixed(1) + '万'; } }, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false } } }
        }
    });
}

function rStore() {
    if (C.store) C.store.destroy();
    var ctx = document.getElementById('storeChart').getContext('2d');
    var sd = {};
    for (var i = 0; i < FD.length; i++) sd[FD[i].store_name] = (sd[FD[i].store_name] || 0) + FD[i].amt_actual;
    var s = Object.entries(sd).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 15);
    var colors = ['#4361ee', '#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ff9f1c', '#06d6a0', '#118ab2', '#7209b7', '#f72585', '#4cc9f0', '#4895ef', '#560bad', '#a2d2ff', '#bde0fe'];
    C.store = new Chart(ctx, {
        type: 'bar',
        data: { labels: s.map(function(n) { return n[0].length > 8 ? n[0].substring(0, 8) + '…' : n[0]; }), datasets: [{ label: '成交金额', data: s.map(function(v) { return Math.round(v[1]); }), backgroundColor: s.map(function(_, i) { return colors[i % colors.length]; }), borderRadius: 3, barPercentage: .7 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return '¥' + ctx.raw.toLocaleString('zh-CN'); } } } }, scales: { x: { beginAtZero: true, ticks: { callback: function(v) { return '¥' + (v / 10000).toFixed(1) + '万'; } }, grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { display: false }, ticks: { font: { size: 9 } } } } }
    });
}

function rProfit() {
    if (C.profit) C.profit.destroy();
    var ctx = document.getElementById('profitChart').getContext('2d');
    var sd = {}, sc = {};
    for (var i = 0; i < FD.length; i++) { sd[FD[i].store_name] = (sd[FD[i].store_name] || 0) + FD[i].amt_actual; sc[FD[i].store_name] = (sc[FD[i].store_name] || 0) + FD[i].amt_actual * 0.45; }
    var s = Object.entries(sd).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 12);
    C.profit = new Chart(ctx, {
        type: 'bar',
        data: { labels: s.map(function(n) { return n[0].length > 6 ? n[0].substring(0, 6) + '…' : n[0]; }), datasets: [{ label: '毛利率%', data: s.map(function(n) { var t = sd[n[0]]; return t > 0 ? 55 : 0; }), backgroundColor: '#4361ee', borderRadius: 3, barPercentage: .7, yAxisID: 'y' }, { label: '毛利额(估)', data: s.map(function(n) { return Math.round((sd[n[0]] || 0) * 0.55); }), backgroundColor: 'rgba(46,196,182,.5)', borderRadius: 3, barPercentage: .7, yAxisID: 'y1' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 9 }, boxWidth: 10, padding: 6 } } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: function(v) { return v + '%'; } }, grid: { color: 'rgba(0,0,0,.04)' } }, y1: { position: 'right', beginAtZero: true, ticks: { callback: function(v) { return '¥' + (v / 10000).toFixed(1) + '万'; } }, grid: { display: false } }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } } }
    });
}

function rDaily() {
    if (C.daily) C.daily.destroy();
    var ctx = document.getElementById('dailyChart').getContext('2d');
    var dd = {};
    for (var i = 0; i < FD.length; i++) dd[FD[i].date] = (dd[FD[i].date] || 0) + FD[i].amt_actual;
    var ds = Object.keys(dd).sort();
    C.daily = new Chart(ctx, {
        type: 'line',
        data: { labels: ds.map(function(d) { return String(d).substring(4, 6) + '/' + String(d).substring(6, 8); }), datasets: [{ label: '成交金额', data: ds.map(function(d) { return Math.round(dd[d]); }), borderColor: '#4361ee', backgroundColor: 'rgba(67,97,238,.08)', fill: true, tension: .4, pointRadius: 2, pointBackgroundColor: '#4361ee', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return '¥' + ctx.raw.toLocaleString(); } } } }, scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '¥' + (v / 10000).toFixed(1) + '万'; } }, grid: { color: 'rgba(0,0,0,.04)' } }, x: { grid: { display: false }, ticks: { font: { size: 8 }, maxTicksLimit: 15 } } } }
    });
}

function rTable() {
    var tbody = document.getElementById('tableBody');
    if (!FD.length) { tbody.innerHTML = '<tr><td colspan="10" class="text-center" style="color:#94a3b8;padding:30px">暂无数据</td></tr>'; return; }
    var d = FD.slice();
    d.sort(function(a, b) { return b.date - a.date; });
    d = d.slice(0, 50);
    var html = '';
    for (var i = 0; i < d.length; i++) {
        var r = d[i];
        var dt = String(r.date).substring(0, 4) + '-' + String(r.date).substring(4, 6) + '-' + String(r.date).substring(6, 8);
        html += '<tr><td style="font-family:monospace;font-size:10px">' + r.docno + '</td><td>' + dt + '</td><td><span class="badge blue">' + r.store_name + '</span></td><td class="text-right">' + fmt(r.amt_list) + '</td><td class="text-right">' + fmt(r.amt_actual) + '</td><td class="text-right">' + fmt(r.amt_actual * 0.45) + '</td><td class="text-right">' + fmt(r.amt_actual * 0.55) + '</td><td class="text-center"><span class="badge green">55%</span></td><td class="text-right">' + r.qty + '</td><td>' + (r.vip || '—') + '</td></tr>';
    }
    tbody.innerHTML = html;
}

// 初始化
function initPage() {
    if (!document.getElementById('storeGroup')) return setTimeout(initPage, 50);
    var sg = document.getElementById('storeGroup');
    if (sg.children.length > 0) return;
    for (var i = 0; i < STORE_IDS.length; i++) {
        var l = document.createElement('label');
        l.innerHTML = '<input type="checkbox" value="' + STORE_IDS[i].id + '" checked>' + STORE_IDS[i].name;
        sg.appendChild(l);
    }
    document.getElementById('footerTime').textContent = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    doQuery();
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initPage); } else { initPage(); }
