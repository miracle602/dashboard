/**
 * 伯俊ERP REST API 代理服务
 * 
 * 功能：
 * 1. 接收前端请求，加上签名后转发给伯俊 REST API
 * 2. 将伯俊的数组格式数据转为带字段名的 JSON 对象
 * 3. 提供聚合报表接口（门店排行、月度趋势等）
 * 4. 用户鉴权（每个用户用自己的 AppKey）
 * 
 * 启动：node proxy-server.js
 * 默认端口：3000
 * 
 * 前端调用示例：
 *   fetch('/api/query?table=M_RETAIL&range=100')
 *   fetch('/api/report/summary?year=2026')
 *   fetch('/api/report/store-rank')
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

// ============ 配置 ============
const CONFIG = {
  port: 3000,
  // 伯俊 REST API 地址
  erpHost: '8.130.178.145',
  erpPort: 90,
  erpPath: '/servlets/binserv/Rest',
  erpDb: 'kmyg',
  // 用户账号映射（实际使用时换成数据库或配置文件）
  // 每个用户有独立的 AppKey/AppSecret
  users: {
    'admin': { appkey: 'nea@burgeon.com.cn', appsecret: 'bos31', name: '管理员' }
  }
};

// ============ 表字段映射 ============
// REST API 返回的是数组，需要这里的字段名来转换成对象
const TABLE_FIELDS = {
  M_RETAIL: [
    'ID', 'DOCNO', 'BILLDATE', 'C_STORE_ID', 'VIP', 'C_VIP_ID',
    'TOT_QTY', 'UNUSED1', 'STATUS', 'UNUSED2', 'CARD_TYPE', 'UNUSED3',
    'CARD_NO', 'IS_PAY', 'IS_PRINT', 'IS_POST', 'POST_NO',
    'TOT_AMT_ACTUAL', 'TOT_AMT_LIST', 'UNUSED4',
    'DISCOUNT_RATE', 'UNUSED5', 'UNUSED6', 'UNUSED7', 'UNUSED8',
    'UNUSED9', 'WEATHER', 'ITEM_COUNT', 'STORE_NO', 'AMT_AFTER',
    'AMT_BEFORE', 'DISCOUNT_MULTI', 'UNUSED10', 'TOT_AMT_ORIG',
    'UNUSED11', 'STATUS_NAME', 'UNUSED12', 'UNUSED13', 'RED_STATUS',
    'UNUSED14', 'UNUSED15', 'UNUSED16', 'UNUSED17', 'IS_REFUND',
    'UNUSED18', 'IS_ACTIVE', 'IS_DEL', 'IS_GIFT'
  ],
  M_RETAILITEM: [
    'ID', 'M_RETAIL_ID', 'M_PRODUCT_ID', 'QTY', 'PRICE',
    'PRICEACTUAL', 'TOT_AMT_ACTUAL', 'TOT_AMT_LIST', 'DISCOUNT',
    'UNUSED1', 'UNUSED2', 'UNUSED3'
  ],
  M_PRODUCT: [
    'ID', 'NAME', 'VALUE', 'PRICE', 'PRICELIST', 'PRICELIST2',
    'MARKETDATE', 'M_DIM1_ID', 'M_DIM2_ID', 'M_DIM3_ID', 'M_DIM4_ID',
    'M_DIM6_ID', 'M_DIM7_ID', 'C_SUPPLIER_ID', 'COLORS', 'SIZES', 'ISACTIVE'
  ],
  C_STORE: [
    'ID', 'NAME', 'CODE', 'C_AREA_ID'
  ],
  C_VIP: [
    'ID', 'NAME', 'MOBILE', 'SCORE'
  ]
};

// ============ REST API 签名 ============
function signRequest(appkey, appsecret) {
  const now = new Date();
  const ts = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0') + '.000';
  const md5Secret = crypto.createHash('md5').update(appsecret).digest('hex');
  const sign = crypto.createHash('md5').update(appkey + ts + md5Secret).digest('hex');
  return { timestamp: ts, sign: sign };
}

// ============ 调用伯俊 REST API ============
function callErpApi(transactions, appkey, appsecret) {
  return new Promise((resolve, reject) => {
    const { timestamp, sign } = signRequest(appkey, appsecret);
    const transJson = JSON.stringify(transactions);
    const params = new url.URLSearchParams({
      appdb: CONFIG.erpDb,
      sip_appkey: appkey,
      sip_timestamp: timestamp,
      sip_sign: sign,
      transactions: transJson
    }).toString();

    const options = {
      hostname: CONFIG.erpHost,
      port: CONFIG.erpPort,
      path: CONFIG.erpPath + '?' + params,
      method: 'GET',
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error: ' + data.substring(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// ============ 数组转对象 ============
function rowsToObjects(tableName, rows) {
  const fields = TABLE_FIELDS[tableName];
  if (!fields) return rows;
  return rows.map(row => {
    const obj = {};
    fields.forEach((f, i) => {
      if (i < row.length && !f.startsWith('UNUSED')) {
        obj[f] = row[i];
      }
    });
    return obj;
  });
}

// ============ 报表 API 实现 ============
async function getSummary(user, year) {
  const { appkey, appsecret } = user;
  // 查 M_RETAIL
  const retailRes = await callErpApi(
    [{ command: 'Query', params: { table: 'M_RETAIL', range: 20000, orderby: 'ID desc' } }],
    appkey, appsecret
  );
  const rows = retailRes[0]?.data?.rows || retailRes[0]?.rows || [];
  const retails = rowsToObjects('M_RETAIL', rows);
  
  // 查门店
  const storeRes = await callErpApi(
    [{ command: 'Query', params: { table: 'C_STORE', range: 500 } }],
    appkey, appsecret
  );
  const storeRows = storeRes[0]?.data?.rows || storeRes[0]?.rows || [];
  const storeMap = {};
  storeRows.forEach(r => { if (r.length >= 2) storeMap[r[0]] = r[1]; });

  // 过滤年份
  const filtered = year ? retails.filter(r => {
    const d = String(r.BILLDATE || '');
    return d.startsWith(year);
  }) : retails;

  // 聚合计算
  let totalAmt = 0, totalQty = 0, totalOrders = 0;
  const storeStats = {};
  const monthStats = {};
  const monthAmtList = {};

  filtered.forEach(r => {
    const amt = Number(r.TOT_AMT_ACTUAL || 0);
    const qty = Number(r.TOT_QTY || 0);
    totalAmt += amt;
    totalQty += qty;
    totalOrders++;

    const sid = String(r.C_STORE_ID || '');
    if (!storeStats[sid]) storeStats[sid] = { orders: 0, amt: 0, qty: 0 };
    storeStats[sid].orders++;
    storeStats[sid].amt += amt;
    storeStats[sid].qty += qty;

    const bd = String(r.BILLDATE || '');
    const mo = bd.substring(0, 6);
    if (mo.length === 6) {
      if (!monthStats[mo]) monthStats[mo] = { orders: 0, amt: 0, qty: 0, amt_list: 0 };
      monthStats[mo].orders++;
      monthStats[mo].amt += amt;
      monthStats[mo].qty += qty;
      monthStats[mo].amt_list += Number(r.TOT_AMT_LIST || 0);
    }
  });

  const storeRank = Object.entries(storeStats)
    .map(([id, s]) => ({ id, name: storeMap[Number(id)] || '未知', ...s }))
    .sort((a, b) => b.amt - a.amt);

  const monthTrend = Object.entries(monthStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mo, d]) => ({
      month: mo, label: mo.substring(0, 4) + '.' + mo.substring(4, 6),
      ...d, amt: Math.round(d.amt * 100) / 100
    }));

  return {
    summary: { total_amt: Math.round(totalAmt * 100) / 100, total_qty: totalQty, total_orders: totalOrders },
    store_rank: storeRank.slice(0, 50),
    monthly_trend: monthTrend,
    stores: storeMap
  };
}

// ============ HTTP 服务 ============
const server = http.createServer(async (req, res) => {
  // CORS 头（允许前端跨域调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') { res.end(); return; }

  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const query = parsed.query;

  // 用户鉴权（从 query 或 header 取 token）
  const token = query.token || req.headers['authorization'] || 'admin';
  const user = CONFIG.users[token] || CONFIG.users['admin'];

  try {
    if (path === '/api/query') {
      // 通用查询：/api/query?table=M_RETAIL&range=100&orderby=ID desc
      const { table = 'M_RETAIL', range = 100, orderby = '' } = query;
      const params = { table, range: parseInt(range) };
      if (orderby) params.orderby = orderby;
      const result = await callErpApi(
        [{ command: 'Query', params }],
        user.appkey, user.appsecret
      );
      const rows = result[0]?.data?.rows || result[0]?.rows || [];
      const objects = rowsToObjects(table, rows);
      res.end(JSON.stringify({ code: 0, data: objects, total: rows.length }));
    }
    else if (path === '/api/report/summary') {
      const data = await getSummary(user, query.year || '');
      res.end(JSON.stringify({ code: 0, data }));
    }
    else if (path === '/api/ping') {
      res.end(JSON.stringify({ code: 0, message: 'pong', time: new Date().toISOString() }));
    }
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ code: -1, message: 'Not found. Available: /api/query, /api/report/summary, /api/ping' }));
    }
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ code: -1, message: e.message }));
  }
});

server.listen(CONFIG.port, () => {
  console.log(`🚀 伯俊ERP 代理服务已启动`);
  console.log(`   http://localhost:${CONFIG.port}`);
  console.log(`   `);
  console.log(`   接口列表:`);
  console.log(`   GET /api/ping              - 健康检查`);
  console.log(`   GET /api/query?table=X     - 通用查询`);
  console.log(`   GET /api/report/summary    - 报表汇总`);
  console.log(`   `);
  console.log(`   前端调用示例:`);
  console.log(`   fetch('/api/report/summary?year=2026')`);
  console.log(`   fetch('/api/query?table=M_RETAIL&range=100')`);
});
