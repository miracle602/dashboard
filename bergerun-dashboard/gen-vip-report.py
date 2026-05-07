#!/usr/bin/env python3
"""伯俊ERP · VIP会员销售分析生成器"""

import oracledb, json, sys, os
from collections import defaultdict

def main():
    sid, start, end = 10, 20260501, 20260508
    
    print("查询Oracle...")
    conn = oracledb.connect(user='bosnds3', password='abc123', dsn='8.130.178.145:1521/orcl', mode=oracledb.DEFAULT_AUTH)
    cur = conn.cursor()
    cur.execute(f"""
    SELECT m.DOCNO, m.BILLDATE, NVL(v.NAME,'散客'), NVL(v.MOBIL,''),
           p.NAME, NVL(p.VALUE,''), ri.QTY, ri.TOT_AMT_ACTUAL, ri.DISCOUNT, p.PRICELIST
    FROM M_RETAIL m, M_RETAILITEM ri, M_PRODUCT p, C_VIP v
    WHERE m.ID=ri.M_RETAIL_ID AND ri.M_PRODUCT_ID=p.ID AND m.C_VIP_ID=v.ID
      AND m.BILLDATE>={start} AND m.BILLDATE<={end}
      AND m.STATUS=2 AND m.C_STORE_ID={sid}
    ORDER BY m.BILLDATE, v.NAME
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    print(f"  {len(rows)}条")
    
    # VIP汇总
    vs = defaultdict(lambda: {'amt':0,'qty':0,'n':0,'mobile':''})
    daily_amt = defaultdict(float)
    daily_cnt = defaultdict(int)
    vip_mobile = {}
    
    for r in rows:
        doc, date, vname, mob, pname, pval, qty, amt, disc, price = r
        key = vname if vname != '散客' else mob[-4:]
        vs[key]['amt'] += (amt or 0)
        vs[key]['qty'] += (qty or 0)
        vs[key]['n'] += 1
        vs[key]['mobile'] = mob
        
        d = str(date)[6:8]
        daily_amt[d] += (amt or 0)
        daily_cnt[d] += 1
        
        # 收尾
        last_vname, last_mob = vname, mob
    
    vip_rank = sorted(vs.items(), key=lambda x: -x[1]['amt'])[:10]
    
    # 总汇
    total_amt = sum(r[7] or 0 for r in rows)
    total_qty = sum(r[6] or 0 for r in rows)
    
    # ---- 生成HTML ----
    # VIP排行行
    vr = ""
    for name, d in vip_rank:
        vr += f"<tr><td style='font-weight:600'>{name}</td><td class='text-right'>{d['n']}</td><td class='text-right'>{int(d['qty'])}</td><td class='text-right' style='color:#be185d;font-weight:700'>¥{d['amt']:,.0f}</td></tr>"
    
    # 明细行
    detail = ""
    for r in rows:
        doc, date, vname, mob, pname, pval, qty, amt, disc, price = r
        ds = str(date)
        dd = f"{ds[0:4]}-{ds[4:6]}-{ds[6:8]}"
        disc_s = f"{disc*10:.0f}折" if disc and disc < 1 else (f"{disc:.1f}折" if disc else "-")
        detail += f"<tr><td style='font-size:10px'>{doc}</td><td>{dd}</td><td>{vname}</td><td>{pname}</td><td>{pval}</td><td class='text-right'>{int(qty)}</td><td class='text-right' style='font-weight:600'>¥{amt:,.1f}</td><td class='text-right'>{disc_s}</td></tr>"
    
    detail += f"<tr class='total-row'><td colspan='5'>合计</td><td class='text-right'>{int(total_qty)}</td><td class='text-right' style='font-weight:700'>¥{total_amt:,.1f}</td><td></td></tr>"
    
    # 图表数据
    vip_names = json.dumps([n[:6] for n,_ in vip_rank])
    vip_amts = json.dumps([int(d['amt']) for _,d in vip_rank])
    
    daily_labels = json.dumps([f"5.{i}" for i in range(1,9)])
    daily_amts = json.dumps([int(daily_amt.get(str(i),0)) for i in range(1,9)])
    daily_cnts = json.dumps([daily_cnt.get(str(i),0) for i in range(1,9)])
    
    html = f'''<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>伯俊ERP · VIP销售分析</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:"PingFang SC","Microsoft YaHei",sans-serif;background:#f0f2f5;color:#1e293b;padding:16px;max-width:1200px;margin:0 auto}}
.header{{background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:14px}}
.header h1{{font-size:18px;font-weight:700}}
.header .sub{{font-size:11px;opacity:.7;margin-top:2px}}
.kpi-row{{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}}
.kpi-card{{background:#fff;border-radius:10px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);text-align:center}}
.kpi-card .kl{{font-size:10px;color:#64748b;margin-bottom:2px}}
.kpi-card .kv{{font-size:18px;font-weight:700}}
.kpi-card .ks{{font-size:10px;color:#94a3b8;margin-top:2px}}
.card{{background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-bottom:10px}}
.card .ct{{font-size:13px;font-weight:600;margin-bottom:8px;padding-left:8px;border-left:3px solid #f5576c}}
.ct-blue{{border-left-color:#4361ee}}
table{{width:100%;border-collapse:collapse;font-size:11px}}
th{{text-align:left;padding:6px 5px;background:#fdf2f8;color:#6b21a8;font-weight:600;font-size:10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}}
td{{padding:5px;border-bottom:1px solid #f1f5f9;white-space:nowrap}}
tr:hover{{background:#fdf2f8}}
.text-right{{text-align:right}}
.total-row{{background:#fdf2f8!important;font-weight:600}}
.total-row td{{border-top:2px solid #f5576c}}
.chart-row{{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px}}
@media(max-width:768px){{.chart-row{{grid-template-columns:1fr}}}}
footer{{text-align:center;font-size:10px;color:#94a3b8;padding:16px 0}}
</style></head>
<body>
<div class="header"><h1>👑 小西门店 · VIP销售分析</h1><div class="sub">伯俊ERP · 2026年5月1日-5月8日</div></div>

<div class="kpi-row">
<div class="kpi-card"><div class="kl">👤 消费VIP</div><div class="kv" style="color:#f5576c">{len(vs)}</div><div class="ks">人</div></div>
<div class="kpi-card"><div class="kl">📄 交易笔数</div><div class="kv" style="color:#4361ee">{len(rows)}</div><div class="ks">笔</div></div>
<div class="kpi-card"><div class="kl">🛍️ 销售件数</div><div class="kv" style="color:#06d6a0">{int(total_qty)}</div><div class="ks">件</div></div>
<div class="kpi-card"><div class="kl">💰 销售金额</div><div class="kv" style="color:#10b981">¥{total_amt:,.0f}</div><div class="ks">元</div></div>
</div>

<div class="chart-row">
<div class="card"><div class="ct">🥇 VIP消费排行 TOP10</div><canvas id="vipChart" style="height:200px"></canvas></div>
<div class="card"><div class="ct">📊 每日销售趋势</div><canvas id="dailyChart" style="height:200px"></canvas></div>
</div>

<div class="card"><div class="ct">🏆 VIP消费排行</div>
<table><thead><tr><th>VIP会员</th><th class="text-right">次数</th><th class="text-right">件数</th><th class="text-right">金额</th></tr></thead><tbody>{vr}</tbody></table></div>

<div class="card"><div class="ct">📋 VIP销售明细</div><div style="overflow-x:auto"><table><thead><tr>
<th>单号</th><th>日期</th><th>会员</th><th>货号</th><th>品名</th><th class="text-right">数量</th><th class="text-right">金额</th><th class="text-right">折扣</th>
</tr></thead><tbody>{detail}</tbody></table></div></div>

<footer>伯俊ERP · VIP数据分析 · 生成于2026-05-07</footer>
<script>
new Chart(document.getElementById('vipChart'),{{type:'bar',data:{{
labels:{vip_names},
datasets:[{{label:'消费金额',data:{vip_amts},backgroundColor:'#f5576c',borderRadius:4}}]
}},options:{{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{{legend:{{display:false}}}},
scales:{{x:{{beginAtZero:true,ticks:{{font:{{size:9}}}}}},y:{{ticks:{{font:{{size:9},weight:'bold'}}}}}}}}}}}});
new Chart(document.getElementById('dailyChart'),{{type:'line',data:{{
labels:{daily_labels},
datasets:[
{{label:'金额(元)',data:{daily_amts},borderColor:'#f5576c',backgroundColor:'rgba(245,87,108,.1)',fill:true,tension:.3,pointRadius:4}},
{{label:'笔数',data:{daily_cnts},borderColor:'#4361ee',backgroundColor:'transparent',tension:.3,pointRadius:3,yAxisID:'y1',borderDash:[5,3]}
]}},options:{{responsive:true,maintainAspectRatio:false,plugins:{{legend:{{position:'top',labels:{{font:{{size:10}}}}}}}},
scales:{{y:{{beginAtZero:true,ticks:{{font:{{size:9}}}}}},y1:{{position:'right',beginAtZero:true,ticks:{{font:{{size:9}}}}}}}}}}}}});
</script>
</body></html>'''
    
    out = os.path.join(os.path.dirname(__file__), 'erp-vip-analysis.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✅ 生成完成: {out} ({len(html)}字节)")

if __name__ == '__main__':
    main()
