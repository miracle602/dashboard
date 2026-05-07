"""
从伯俊ERP Oracle数据库拉数据，按Excel 12个Sheet的格式生成JSON数据文件
"""
import oracledb, json, openpyxl

# === 1. 连接数据库 ===
conn = oracledb.connect(user='bosnds3', password='abc123', dsn='8.130.178.145:1521/orcl')
cur = conn.cursor()

# === 2. 读取维度映射 ===
cur.execute("SELECT ID, M_DIMDEF_ID, ATTRIBNAME FROM M_DIM")
dim_all = {}
for r in cur.fetchall():
    dim_all[r[0]] = {"def": r[1], "name": r[2]}

dim4 = {k:v for k,v in dim_all.items() if v["def"]==4}
dim6 = {k:v for k,v in dim_all.items() if v["def"]==6}
dim7 = {k:v for k,v in dim_all.items() if v["def"]==7}

print(f"性别: {[v['name'] for v in dim7.values()]}")

# === 3. 读取产品、门店 ===
print("读取产品...")
cur.execute("SELECT ID, NAME, VALUE, PRICELIST, M_DIM4_ID, M_DIM6_ID, M_DIM7_ID FROM M_PRODUCT")
prods = {}
for r in cur.fetchall():
    prods[r[0]] = {
        "name": r[2], "code": r[1], "price": r[3] or 0,
        "d4": r[4], "d6": r[5], "d7": r[6]
    }
print(f"  产品: {len(prods)}")

print("读取门店...")
cur.execute("SELECT ID, NAME FROM C_STORE")
stores = {}
for r in cur.fetchall():
    stores[r[0]] = r[1]
print(f"  门店: {len(stores)}")

# === 4. 库存数据 ===
print("读取库存...")
cur.execute("SELECT C_STORE_ID, M_PRODUCT_ID, SUM(QTY) as QTY, SUM(QTY * PRICELIST) as AMT FROM V_FA_STORAGE WHERE QTY > 0 GROUP BY C_STORE_ID, M_PRODUCT_ID")
stock = {}
for r in cur.fetchall():
    stock[(r[0], r[1])] = {"qty": r[2], "amt": round(r[3] or 0, 2)}
print(f"  库存: {len(stock)}")

# === 5. Q2销售数据 ===
print("读取Q2销售...")
cur.execute("""
SELECT r.C_STORE_ID, ri.M_PRODUCT_ID, 
       SUM(ri.QTY) as QTY, SUM(ri.TOT_AMT_LIST) as LIST, SUM(ri.TOT_AMT_ACTUAL) as ACT
FROM M_RETAIL r JOIN M_RETAILITEM ri ON r.ID = ri.M_RETAIL_ID
WHERE r.BILLDATE >= 20260401 AND r.BILLDATE <= 20260630 AND r.STATUS = 2
GROUP BY r.C_STORE_ID, ri.M_PRODUCT_ID
""")
sale = {}
for r in cur.fetchall():
    sale[(r[0], r[1])] = {"qty": r[2] or 0, "list": round(r[3] or 0, 2), "act": round(r[4] or 0, 2)}
print(f"  Q2销售: {len(sale)}")

cur.close()
conn.close()

# === 6. 区域映射（从Excel）===
f_excel = "/Users/ynmiracle/.openclaw/media/inbound/26Q2周售罄跟踪表排名.xlsx"
wb = openpyxl.load_workbook(f_excel, read_only=True)

ws = wb['零售库存母表']
store_region = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    sn = str(row[4]) if row[4] and str(row[4]) not in ('#N/A','#REF!','') else ""
    if sn and sn not in store_region:
        store_region[sn] = {
            "area": str(row[0]) if row[0] and str(row[0]) not in ('','#N/A','#REF!') else "",
            "city": str(row[1]) if row[1] and str(row[1]) not in ('','#N/A','#REF!') else "",
            "province": str(row[2]) if row[2] and str(row[2]) not in ('','#N/A','#REF!') else "",
            "manager": str(row[3]) if row[3] and str(row[3]) not in ('','#N/A','#REF!') else "",
            "prop": str(row[7]) if row[7] and str(row[7]) not in ('','#N/A','#REF!') else "代理直营"
        }

ws2 = wb['周销售汇总母表']
for row in ws2.iter_rows(min_row=2, values_only=True):
    sn = str(row[4]) if row[4] else ""
    prop = str(row[0]) if row[0] and str(row[0]) not in ('#REF!','#N/A') else ""
    if sn and prop and sn in store_region:
        store_region[sn]["prop"] = prop

wb.close()
print(f"Excel区域映射: {len(store_region)} 门店")

def get_updown(sc_name):
    if not sc_name: return ""
    s = sc_name.lower()
    top = ["上衣","上装","t恤","卫衣","衬衫","外套","夹克","背心","毛衫","防晒","风衣",
           "polo","针织衫","开衫","马夹","马甲","羽绒","棉衣","西装","帽衫","单衣","衬衣",
           "毛衣","毛呢","小上衣","吊带","皮草","内衣","打底","家居服","睡衣"]
    bottom = ["裤","裙","下装","连衣裙","半裙","短裙","长裙","连体裤","连身装","下装裙","下装裤"]
    for kw in top:
        if kw in s: return "上装"
    for kw in bottom:
        if kw in s: return "下装"
    return ""

outdir = "/Users/ynmiracle/.openclaw/workspace/bergerun-dashboard"

# === 品类售罄 ===
print("\n生成品类售罄...")
cat_sellthru = {}
for (sid, pid), s in stock.items():
    p = prods.get(pid, {})
    d4 = p.get("d4"); d6 = p.get("d6"); d7 = p.get("d7")
    big_cat = dim4.get(d4, {}).get("name", "") if d4 else ""
    small_cat = dim6.get(d6, {}).get("name", "") if d6 else ""
    gender = dim7.get(d7, {}).get("name", "") if d7 else ""
    key = (big_cat, gender, small_cat)
    if key not in cat_sellthru:
        cat_sellthru[key] = {"stock_qty": 0, "sale_qty": 0}
    sa = sale.get((sid, pid), {"qty": 0})
    cat_sellthru[key]["stock_qty"] += s["qty"]
    cat_sellthru[key]["sale_qty"] += sa["qty"]

cat_rows = []
for (big, gen, small), d in sorted(cat_sellthru.items(), key=lambda x: -x[1]["stock_qty"]):
    total = d["stock_qty"] + d["sale_qty"]
    sr = round(d["sale_qty"] / total * 100, 2) if total > 0 else 0
    cat_rows.append([big, gen, small, d["stock_qty"], d["sale_qty"], d["stock_qty"], sr])

json.dump({"headers": ["大类","性别","品类","预计数量","销售数量","预计库存","售罄"], "rows": cat_rows},
    open(f"{outdir}/cat-sellthru-data.json", "w"), ensure_ascii=False)
print(f"  品类售罄: {len(cat_rows)}行")

# === 总零售库存 ===
print("生成总零售库存...")
total_stock = {}
for (sid, pid), s in stock.items():
    p = prods.get(pid, {}); code = p.get("code", "")
    sa = sale.get((sid, pid), {"qty": 0, "list": 0, "act": 0})
    if code not in total_stock:
        total_stock[code] = {"qty": 0, "amt": 0, "sale_qty": 0, "sale_list": 0, "sale_amt": 0}
    total_stock[code]["qty"] += s["qty"]
    total_stock[code]["amt"] += s["amt"]
    total_stock[code]["sale_qty"] += sa["qty"]
    total_stock[code]["sale_list"] += sa["list"]
    total_stock[code]["sale_amt"] += sa["act"]

ts_rows = [[code, d["qty"], round(d["amt"],2), d["sale_qty"], round(d["sale_list"],2), round(d["sale_amt"],2), d["qty"]]
    for code, d in sorted(total_stock.items(), key=lambda x: -x[1]["qty"])]

json.dump({"headers": ["货号","库存数量","库存金额","销售数量","标准金额","成交金额","预计数量"], "rows": ts_rows},
    open(f"{outdir}/total-stock-data.json", "w"), ensure_ascii=False)
print(f"  总零售库存: {len(ts_rows)}行")

# === 第一次销售日期 ===
print("生成第一次销售日期...")
conn2 = oracledb.connect(user='bosnds3', password='abc123', dsn='8.130.178.145:1521/orcl')
cur2 = conn2.cursor()
cur2.execute("SELECT ri.M_PRODUCT_ID, MIN(r.BILLDATE) FROM M_RETAIL r JOIN M_RETAILITEM ri ON r.ID = ri.M_RETAIL_ID WHERE r.STATUS = 2 GROUP BY ri.M_PRODUCT_ID")
first_sale = []
for r in cur2.fetchall():
    pid = r[0]; bd = str(r[1])
    p = prods.get(pid, {})
    first_sale.append([p.get("code",""), bd])
cur2.close(); conn2.close()

json.dump({"headers": ["货号","第一次销售日期"], "rows": first_sale},
    open(f"{outdir}/first-sale-data.json", "w"), ensure_ascii=False)
print(f"  第一次销售日期: {len(first_sale)}行")

# === 零售库存母表（19列）===
print("生成零售库存母表...")
all_keys = set(list(stock.keys()) + list(sale.keys()))
stock_master = []
for key in all_keys:
    sid, pid = key; p = prods.get(pid, {}); sname = stores.get(sid, "")
    d4 = p.get("d4"); d6 = p.get("d6")
    big_cat = dim4.get(d4, {}).get("name", "") if d4 else ""
    small_cat = dim6.get(d6, {}).get("name", "") if d6 else ""
    updown = get_updown(small_cat)
    sd = stock.get(key, {"qty": 0, "amt": 0})
    sa = sale.get(key, {"qty": 0, "list": 0, "act": 0})
    row = ["","","","", sname, p.get("code",""), big_cat, "代理直营",
           p.get("name",""), small_cat, updown, p.get("price",0),
           sd["qty"], round(sd["amt"],2), sa["qty"], round(sa["list"],2), round(sa["act"],2),
           sd["qty"], round(sd["amt"],2)]
    stock_master.append(row)

json.dump({"headers":["地区","城市","省份","区域经理","店仓","货号","大类","店仓属性","商品.品名","二级品类","上下装",
    "标准价","库存数量","库存金额","销售数量","标准金额","成交金额","预计数量","预计金额"], "rows": stock_master},
    open(f"{outdir}/q2-stock-master.json", "w"), ensure_ascii=False)
print(f"  零售库存母表: {len(stock_master)}行")

# === 单店售罄 ===
print("生成单店售罄...")
store_st = {}
for key in all_keys:
    sid, pid = key; sname = stores.get(sid, ""); p = prods.get(pid, {})
    d4 = p.get("d4"); big_cat = dim4.get(d4, {}).get("name", "") if d4 else ""
    sd = stock.get(key, {"qty": 0, "amt": 0})
    sa = sale.get(key, {"qty": 0, "list": 0, "act": 0})
    k2 = (sname, big_cat)
    if k2 not in store_st:
        store_st[k2] = {"sq":0,"sa":0,"sale_q":0,"sale_l":0,"sale_a":0}
    store_st[k2]["sq"]+=sd["qty"]; store_st[k2]["sa"]+=sd["amt"]
    store_st[k2]["sale_q"]+=sa["qty"]; store_st[k2]["sale_l"]+=sa["list"]; store_st[k2]["sale_a"]+=sa["act"]

st_rows = []
for (sn, bc), d in sorted(store_st.items()):
    disc = round(d["sale_a"]/d["sale_l"],2) if d["sale_l"]>0 else 0
    qsr = round(d["sale_q"]/(d["sq"]+d["sale_q"])*100,2) if (d["sq"]+d["sale_q"])>0 else 0
    asr = round(d["sale_a"]/(d["sa"]+d["sale_a"])*100,2) if (d["sa"]+d["sale_a"])>0 else 0
    st_rows.append(["", "", sn, bc, d["sq"], round(d["sa"],2), d["sale_q"], round(d["sale_l"],2), round(d["sale_a"],2), disc, qsr, asr])

json.dump({"headers":["省份","区域经理","店仓","大类","预计数量","预计金额","销售数量","标准金额","成交金额","平均折扣","数量售罄","金额售罄"], "rows":st_rows, "props":["代理直营"]},
    open(f"{outdir}/store-sellthru-data.json","w"), ensure_ascii=False)
print(f"  单店售罄: {len(st_rows)}行")

# === Q2销售排名 ===
print("生成Q2销售排名...")
q2_rows = []
for key, sa in sorted(sale.items(), key=lambda x: -x[1]["qty"]):
    sid, pid = key; p = prods.get(pid, {}); sname = stores.get(sid, "")
    d4=p.get("d4"); d6=p.get("d6"); d7=p.get("d7")
    big_cat=dim4.get(d4,{}).get("name","") if d4 else ""
    small_cat=dim6.get(d6,{}).get("name","") if d6 else ""
    gender=dim7.get(d7,{}).get("name","") if d7 else ""
    updown=get_updown(small_cat)
    sd=stock.get(key,{"qty":0,"amt":0})
    disc = round(sa["act"]/sa["list"],4) if sa["list"]>0 else 0
    sr = round(sa["qty"]/(sd["qty"]+sa["qty"])*100,2) if (sd["qty"]+sa["qty"])>0 else 0
    q2_rows.append([p.get("code",""),big_cat,gender,small_cat,updown,
        p.get("price",0), round(sa["act"]/sa["qty"],2) if sa["qty"]>0 else 0,
        sa["qty"],round(sa["list"],2),round(sa["act"],2),disc,sd["qty"],sr])

json.dump({"headers":["货号","大类","性别","品类","上下装","标准价","销售价","销售数量","销售吊牌","销售金额","平均折扣","预计库存","商品售罄"], "rows":q2_rows},
    open(f"{outdir}/q2-rank-data.json","w"), ensure_ascii=False)
print(f"  Q2销售排名: {len(q2_rows)}行")

# === 周趋势 ===
print("生成周趋势...")
conn3 = oracledb.connect(user='bosnds3', password='abc123', dsn='8.130.178.145:1521/orcl')
cur3 = conn3.cursor()
cur3.execute("SELECT ri.M_PRODUCT_ID, r.BILLDATE, SUM(ri.QTY) FROM M_RETAIL r JOIN M_RETAILITEM ri ON r.ID=ri.M_RETAIL_ID WHERE r.BILLDATE>=20260401 AND r.BILLDATE<=20260630 AND r.STATUS=2 GROUP BY ri.M_PRODUCT_ID, r.BILLDATE")
weekly = {}
for r in cur3.fetchall():
    p = prods.get(r[0],{}); code=p.get("code","")
    if not code: continue
    bd = str(r[1]); wk = f"W{int(bd[4:6]):02d}"
    if code not in weekly: weekly[code]={}
    weekly[code][wk]=weekly[code].get(wk,0)+(r[2] or 0)

all_wks=sorted(set(wk for code,wks in weekly.items() for wk in wks))
wr_rows=[[code]+[wks.get(wk,0) for wk in all_wks]+[sum(wks.values())] for code,wks in sorted(weekly.items())]
json.dump({"headers":["货号"]+all_wks+["总计"],"rows":wr_rows},
    open(f"{outdir}/weekly-data.json","w"), ensure_ascii=False)
print(f"  周趋势: {len(wr_rows)}行×{len(all_wks)+2}列")

cur3.close(); conn3.close()

print("\n✅ 全部完成!")
PYEOF