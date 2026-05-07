#!/usr/bin/env python3
"""伯俊ERP · 阶段性销售汇总生成器
从伯俊ERP Oracle数据库查询数据，生成可部署的HTML报表。

用法: python3 gen-erp-report.py
输出: erp-sales-summary.html (注入数据后的完整HTML)
"""

import oracledb, json, hashlib, http.client, os, sys
from urllib.parse import quote
from datetime import datetime, timedelta

# ===== 配置 =====
STORE_ID = 10        # 小西门店
DAYS_BACK = 8        # 查最近N天
SPLIT_DAY = 4        # 分段点（前N天/后N天）
APP_KEY = 'nea@burgeon.com.cn'
APP_SECRET = 'bos31'
DB_DSN = '8.130.178.145:1521/orcl'
DB_USER = 'bosnds3'
DB_PASS = 'abc123'

# ===== 数据获取：Oracle直连 =====
def query_oracle(store_id, days_back):
    """从Oracle数据库查询销售明细"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    start = int(start_date.strftime('%Y%m%d'))
    end = int(end_date.strftime('%Y%m%d'))
    
    conn = oracledb.connect(user=DB_USER, password=DB_PASS, dsn=DB_DSN, mode=oracledb.DEFAULT_AUTH)
    cur = conn.cursor()
    
    cur.execute("""
    SELECT p.NAME, NVL(p.VALUE,''), NVL(d4.ATTRIBNAME,''), NVL(d6.ATTRIBNAME,''), NVL(d8.ATTRIBNAME,''),
           NVL(d1.ATTRIBNAME,''), NVL(d2.ATTRIBNAME,''), NVL(d3.ATTRIBNAME,''),
           NVL(p.PRICELIST,0), NVL(ri.QTY,0), NVL(ri.TOT_AMT_ACTUAL,0), NVL(ri.TOT_AMT_LIST,0), m.BILLDATE
    FROM M_RETAIL m, M_RETAILITEM ri, M_PRODUCT p
    LEFT JOIN M_DIM d4 ON p.M_DIM4_ID=d4.ID
    LEFT JOIN M_DIM d6 ON p.M_DIM6_ID=d6.ID
    LEFT JOIN M_DIM d8 ON p.M_DIM8_ID=d8.ID
    LEFT JOIN M_DIM d1 ON p.M_DIM1_ID=d1.ID
    LEFT JOIN M_DIM d2 ON p.M_DIM2_ID=d2.ID
    LEFT JOIN M_DIM d3 ON p.M_DIM3_ID=d3.ID
    WHERE m.ID=ri.M_RETAIL_ID AND ri.M_PRODUCT_ID=p.ID
      AND m.BILLDATE>={s} AND m.BILLDATE<={e}
      AND m.STATUS=2
      AND m.C_STORE_ID={st}
    ORDER BY m.BILLDATE
    """.format(s=start, e=end, st=store_id))
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    print(f"  Oracle查询: {len(rows)}条明细")
    return rows

# ===== 数据获取：REST API =====
def query_restapi(store_id, start_date, end_date):
    """备用方案：通过REST API查询（如果Oracle不可用）"""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '.000'
    msec = hashlib.md5(APP_SECRET.encode()).hexdigest()
    sign = hashlib.md5((APP_KEY + now + msec).encode()).hexdigest()
    
    conn = http.client.HTTPConnection('8.130.178.145', 90, timeout=30)
    trans = json.dumps([{'command':'Query','params':{
        'table':'M_RETAIL',
        'columns':['ID','DOCNO','BILLDATE','C_STORE_ID','TOT_AMT_ACTUAL','TOT_QTY','STATUS'],
        'range':20000
    }}])
    params = f'appdb=kmyg&sip_appkey={quote(APP_KEY,safe="")}&sip_timestamp={quote(now,safe="")}&sip_sign={sign}&transactions={quote(trans,safe="")}'
    conn.request('GET', '/servlets/binserv/Rest?' + params)
    resp = conn.getresponse()
    data = json.loads(resp.read().decode())
    conn.close()
    
    if data[0]['code'] != 0:
        print(f"  REST API错误: {data[0].get('message','')}")
        return []
    
    rows = data[0]['data']['rows']
    # 在职过滤
    filtered = [r for r in rows if r[2] and r[2] >= start_date and r[2] <= end_date and r[3] == int(store_id)]
    print(f"  REST API查询: {len(filtered)}条")
    return filtered

# ===== HTML生成 =====
def generate_html(data_rows, start_date, end_date, split_day, store_id):
    """将数据注入HTML模板"""
    
    # 读取模板
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, 'erp-sales-summary.html')
    
    with open(template_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 注入数据
    data_json = json.dumps(data_rows, ensure_ascii=False)
    html = html.replace('window.__DATA__ = null;', f'window.__DATA__ = {data_json};')
    
    # 设置查询日期
    html = html.replace('value="2026-05-01"', f'value="{start_date}"')
    html = html.replace('value="2026-05-08"', f'value="{end_date}"')
    html = html.replace('<option value="10">小西门店</option>', f'<option value="{store_id}">门店{store_id}</option>')
    
    output = os.path.join(script_dir, 'erp-sales-summary.html')
    with open(output, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"  HTML生成: {len(data_rows)}条数据注入")
    return output

# ===== 主入口 =====
def main():
    print("=" * 50)
    print("伯俊ERP · 阶段性销售汇总生成器")
    print("=" * 50)
    
    store_id = STORE_ID
    days_back = DAYS_BACK
    split_day = SPLIT_DAY
    
    # 计算日期
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    start_str = start_date.strftime('%Y%m%d')
    end_str = end_date.strftime('%Y%m%d')
    start_iso = start_date.strftime('%Y-%m-%d')
    end_iso = end_date.strftime('%Y-%m-%d')
    
    print(f"\n📅 查询区间: {start_iso} ~ {end_iso} ({days_back}天)")
    print(f"🏪 门店ID: {store_id}")
    print(f"✂️  分段点: 前{split_day}天 / 后{days_back-split_day}天")
    
    # 查询数据
    print("\n📡 正在从Oracle数据库查询...")
    try:
        rows = query_oracle(store_id, days_back)
    except Exception as e:
        print(f"  Oracle查询失败: {e}")
        print("  尝试REST API...")
        start_int = int(start_str)
        end_int = int(end_str)
        rows = query_restapi(store_id, start_int, end_int)
    
    if not rows:
        print("❌ 无数据")
        sys.exit(1)
    
    # 生成HTML
    print("\n📄 正在生成HTML报表...")
    output = generate_html(rows, start_iso, end_iso, split_day, store_id)
    
    print(f"\n✅ 完成！报表已生成: {output}")
    print(f"   打开链接查看: https://miracle602.github.io/dashboard/bergerun-dashboard/erp-sales-summary.html")

if __name__ == '__main__':
    main()
