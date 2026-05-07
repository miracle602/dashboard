import json

outdir = "/Users/ynmiracle/.openclaw/workspace/bergerun-dashboard"

def write_html(filename, content):
    with open(f"{outdir}/{filename}", "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  {filename} OK")

# ========== 品类售罄 ==========
print("生成 category-sellthru.html...")
with open(f"{outdir}/cat-sellthru-data.json") as f:
    d = json.load(f)

headers = d["headers"]
header_html = "".join(f"<th>{h}</th>" for h in headers)

# 用多行字符串 + .format()
html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>品类售罄 - 26Q2</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<style>
body{{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}}
h2{{color:#333;margin-bottom:20px}}.summary{{display:flex;gap:15px;flex-wrap:wrap;margin-bottom:20px}}
.kpi-card{{background:#fff;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);flex:1;min-width:150px;text-align:center}}
.kpi-card .num{{font-size:28px;font-weight:700;color:#e74c3c}}.kpi-card .label{{font-size:13px;color:#999;margin-top:5px}}
.chart-row{{display:flex;gap:15px;margin-bottom:20px}}.chart-box{{flex:1;background:#fff;border-radius:8px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,.1);height:350px}}
.table-wrap{{background:#fff;border-radius:8px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:auto}}
table{{width:100%;border-collapse:collapse;font-size:13px}}th,td{{padding:6px 10px;text-align:center;border-bottom:1px solid #eee;white-space:nowrap}}
th{{background:#f8f9fa;position:sticky;top:0;z-index:1}}tr:hover{{background:#f0f7ff}}
.sr-high{{color:#27ae60;font-weight:700}}.sr-mid{{color:#f39c12}}.sr-low{{color:#e74c3c}}
</style></head><body>
<h2>品类售罄分析（26Q2）</h2>
<div class="summary" id="summary"></div>
<div class="chart-row"><div class="chart-box" id="chart1"></div><div class="chart-box" id="chart2"></div></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
const HDR = HDRJSON;
function init(){
    const totalStock = DATA.reduce((a,r)=>a+r[3],0);
    const totalSale = DATA.reduce((a,r)=>a+r[4],0);
    const totalSell = totalStock+totalSale;
    document.getElementById('summary').innerHTML=
        '<div class="kpi-card"><div class="num">'+totalStock.toLocaleString()+'</div><div class="label">预计库存</div></div>'+
        '<div class="kpi-card"><div class="num">'+totalSale.toLocaleString()+'</div><div class="label">销售数量</div></div>'+
        '<div class="kpi-card"><div class="num">'+(totalSale/totalSell*100).toFixed(1)+'%</div><div class="label">总体售罄</div></div>';
    const top = DATA.filter(r=>r[4]>0).sort((a,b)=>b[4]-a[4]).slice(0,10);
    ech1({id:'chart1',title:'Top10品类销售',x:top.map(r=>r[2]||'(未知)'),y:top.map(r=>r[4]),color:'#3498db'});
    const cats={};DATA.forEach(r=>{cats[r[0]]=(cats[r[0]]||0)+r[4]});
    const pie=Object.entries(cats).filter(([k,v])=>v>0).map(([k,v])=>({name:k,value:v}));
    ech2({id:'chart2',title:'大类销售占比',data:pie});
    const tb=document.getElementById('tbody');
    DATA.forEach(r=>{
        const sr=r[6],cls=sr>=30?'sr-high':sr>=10?'sr-mid':'sr-low';
        let row='<tr>';
        r.forEach((v,i)=>{
            if(i===6) row+='<td class="'+cls+'">'+v+'%</td>';
            else row+='<td>'+(v||'')+'</td>';
        });
        row+='</tr>';tb.innerHTML+=row;
    });
}
function ech1(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:14}},tooltip:{},xAxis:{data:o.x,axisLabel:{rotate:30}},yAxis:{},series:[{name:'销售',type:'bar',data:o.y,itemStyle:{color:o.color}}]});}
function ech2(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:14}},tooltip:{},series:[{type:'pie',data:o.data,radius:['20%','60%'],center:['50%','55%'],label:{formatter:'{b}:{d}%'}}]});}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html)
html = html.replace("DATAJSON", json.dumps(d["rows"]))
html = html.replace("HDRJSON", json.dumps(d["headers"]))
write_html("category-sellthru.html", html)

# ========== 总零售库存 ==========
print("生成 total-stock.html...")
with open(f"{outdir}/total-stock-data.json") as f:
    d = json.load(f)
header_html = "".join(f"<th>{h}</th>" for h in d["headers"])

html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>总零售库存 - 26Q2</title>
<style>
body{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}
h2{color:#333;margin-bottom:15px}
.summary{display:flex;gap:15px;flex-wrap:wrap;margin-bottom:20px}
.kpi-card{background:#fff;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);flex:1;min-width:150px;text-align:center}
.kpi-card .num{font-size:28px;font-weight:700;color:#2980b9}.kpi-card .label{font-size:13px;color:#999;margin-top:5px}
.filter-bar{margin-bottom:15px}input{padding:8px 12px;border:1px solid #ddd;border-radius:5px;width:300px;font-size:14px}
.table-wrap{background:#fff;border-radius:8px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:auto;max-height:70vh}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px 10px;text-align:center;border-bottom:1px solid #eee;white-space:nowrap}
th{background:#f8f9fa;position:sticky;top:0}tr:hover{background:#f0f7ff}
</style></head><body>
<h2>总零售库存（按货号汇总）</h2>
<div class="summary" id="summary"></div>
<div class="filter-bar"><input id="search" placeholder="搜索货号..." oninput="filter()"></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
function init(){
    const sums=[0,0,0,0,0,0,0];DATA.forEach(r=>r.forEach((v,i)=>{if(typeof v==='number')sums[i]+=v}));
    document.getElementById('summary').innerHTML=
        '<div class="kpi-card"><div class="num">'+DATA.length.toLocaleString()+'</div><div class="label">款数</div></div>'+
        '<div class="kpi-card"><div class="num">'+sums[1].toLocaleString()+'</div><div class="label">库存数量</div></div>'+
        '<div class="kpi-card"><div class="num">¥'+sums[2].toLocaleString()+'</div><div class="label">库存金额</div></div>'+
        '<div class="kpi-card"><div class="num">'+sums[3].toLocaleString()+'</div><div class="label">Q2销售</div></div>';
    render(DATA);
}
function render(d){document.getElementById('tbody').innerHTML=d.map(r=>'<tr>'+r.map(v=>typeof v==='number'?'<td>'+v.toLocaleString()+'</td>':'<td>'+(v||'')+'</td>').join('')+'</tr>').join('');}
function filter(){const kw=document.getElementById('search').value.toLowerCase();render(kw?DATA.filter(r=>r[0].toLowerCase().includes(kw)):DATA);}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html).replace("DATAJSON", json.dumps(d["rows"]))
write_html("total-stock.html", html)

# ========== 单店售罄 ==========
print("生成 store-sellthru.html...")
with open(f"{outdir}/store-sellthru-data.json") as f:
    d = json.load(f)
header_html = "".join(f"<th>{h}</th>" for h in d["headers"])

html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>单店售罄 - 26Q2</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<style>
body{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}
h2{color:#333}.summary{display:flex;gap:15px;flex-wrap:wrap;margin-bottom:20px}
.kpi-card{background:#fff;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);flex:1;min-width:150px;text-align:center}
.kpi-card .num{font-size:28px;font-weight:700;color:#8e44ad}.kpi-card .label{font-size:13px;color:#999}
.filter-bar{margin-bottom:15px;display:flex;gap:10px;flex-wrap:wrap}
.filter-bar select,.filter-bar input{padding:8px;border:1px solid #ddd;border-radius:5px}
.chart-row{display:flex;gap:15px;margin-bottom:20px}.chart-box{flex:1;background:#fff;border-radius:8px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,.1);height:300px}
.table-wrap{background:#fff;border-radius:8px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:auto}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px 10px;text-align:center;border-bottom:1px solid #eee;white-space:nowrap}
th{background:#f8f9fa;position:sticky;top:0}tr:hover{background:#f0f7ff}
</style></head><body>
<h2>单店售罄分析（26Q2）</h2>
<div class="summary" id="summary"></div>
<div class="filter-bar">
<select id="catFilter" onchange="filter()"><option value="">全部大类</option></select>
<input id="search" placeholder="搜索门店..." oninput="filter()">
</div>
<div class="chart-row"><div class="chart-box" id="chart1"></div><div class="chart-box" id="chart2"></div></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
function init(){
    const cats=[...new Set(DATA.map(r=>r[3]))].filter(Boolean).sort();
    cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.text=c;document.getElementById('catFilter').appendChild(o)});
    const sums=[0,0,0,0,0,0,0,0,0,0,0,0];DATA.forEach(r=>r.forEach((v,i)=>{if(typeof v==='number')sums[i]+=v}));
    document.getElementById('summary').innerHTML=
        '<div class="kpi-card"><div class="num">'+DATA.length+'</div><div class="label">记录数</div></div>'+
        '<div class="kpi-card"><div class="num">'+sums[4].toLocaleString()+'</div><div class="label">预计数量</div></div>'+
        '<div class="kpi-card"><div class="num">'+sums[6].toLocaleString()+'</div><div class="label">销售数量</div></div>'+
        '<div class="kpi-card"><div class="num">¥'+sums[8].toLocaleString()+'</div><div class="label">成交金额</div></div>';
    filter();
}
function filter(){
    const cat=document.getElementById('catFilter').value;
    const kw=document.getElementById('search').value.toLowerCase();
    render(cat||kw?DATA.filter(r=>(!cat||r[3]===cat)&&(!kw||r[2].toLowerCase().includes(kw))):DATA);
}
function render(data){
    document.getElementById('tbody').innerHTML=data.map(r=>'<tr>'+r.map((v,i)=>{
        if(i===10||i===11) return '<td style="color:'+(v>20?'#27ae60':v>5?'#f39c12':'#e74c3c')+'">'+v+'%</td>';
        return typeof v==='number'?'<td>'+v.toLocaleString()+'</td>':'<td>'+(v||'')+'</td>';
    }).join('')+'</tr>').join('');
    updateCharts(data);
}
function updateCharts(data){
    const sm={};data.forEach(r=>{sm[r[2]]=(sm[r[2]]||0)+r[6]});
    const top=Object.entries(sm).sort((a,b)=>b[1]-a[1]).slice(0,10);
    ech1({id:'chart1',title:'门店销售TOP10',x:top.map(r=>r[0].slice(0,8)),y:top.map(r=>r[1]),color:'#e67e22'});
    const cm={};data.forEach(r=>{cm[r[3]]=(cm[r[3]]||0)+r[6]});
    const pie=Object.entries(cm).filter(([k,v])=>v>0).map(([k,v])=>({name:k,value:v}));
    ech2({id:'chart2',title:'大类销售占比',data:pie});
}
function ech1(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:13}},tooltip:{trigger:'axis'},xAxis:{data:o.x,axisLabel:{rotate:30}},yAxis:{},series:[{type:'bar',data:o.y,itemStyle:{color:o.color}}]});}
function ech2(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:13}},tooltip:{},series:[{type:'pie',data:o.data,radius:['20%','60%'],center:['50%','55%'],label:{formatter:'{b}:{d}%'}}]});}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html).replace("DATAJSON", json.dumps(d["rows"]))
write_html("store-sellthru.html", html)

# ========== Q2销售排名 ==========
print("生成 q2-rank.html...")
with open(f"{outdir}/q2-rank-data.json") as f:
    d = json.load(f)
header_html = "".join(f"<th>{h}</th>" for h in d["headers"])

html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>Q2销售排名 - 26Q2</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<style>
body{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}
h2{color:#333}.summary{display:flex;gap:15px;flex-wrap:wrap;margin-bottom:20px}
.kpi-card{background:#fff;padding:15px 25px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);flex:1;min-width:150px;text-align:center}
.kpi-card .num{font-size:28px;font-weight:700;color:#2c3e50}.kpi-card .label{font-size:13px;color:#999}
.filter-bar{margin-bottom:15px;display:flex;gap:10px;flex-wrap:wrap}
.filter-bar select,.filter-bar input{padding:8px;border:1px solid #ddd;border-radius:5px}
.chart-row{display:flex;gap:15px;margin-bottom:20px}.chart-box{flex:1;background:#fff;border-radius:8px;padding:10px;box-shadow:0 2px 8px rgba(0,0,0,.1);height:300px}
.table-wrap{background:#fff;border-radius:8px;padding:15px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:auto}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:5px 8px;text-align:center;border-bottom:1px solid #eee;white-space:nowrap}
th{background:#f8f9fa;position:sticky;top:0}tr:hover{background:#f0f7ff}
</style></head><body>
<h2>26Q2 商品销售排名</h2>
<div class="summary" id="summary"></div>
<div class="filter-bar">
<select id="catFilter" onchange="filter()"><option value="">全部大类</option></select>
<select id="genFilter" onchange="filter()"><option value="">全部性别</option></select>
</div>
<div class="chart-row"><div class="chart-box" id="chart1"></div><div class="chart-box" id="chart2"></div></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
function init(){
    const cats=[...new Set(DATA.map(r=>r[1]))].filter(Boolean).sort();
    const gens=[...new Set(DATA.map(r=>r[2]))].filter(Boolean).sort();
    cats.forEach(c=>{const o=document.createElement('option');o.value=c;o.text=c;document.getElementById('catFilter').appendChild(o)});
    gens.forEach(c=>{const o=document.createElement('option');o.value=c;o.text=c;document.getElementById('genFilter').appendChild(o)});
    const sums=[0,0,0,0,0,0,0,0,0,0,0,0,0];DATA.forEach(r=>r.forEach((v,i)=>{if(typeof v==='number')sums[i]+=v}));
    document.getElementById('summary').innerHTML=
        '<div class="kpi-card"><div class="num">'+DATA.length+'</div><div class="label">商品数</div></div>'+
        '<div class="kpi-card"><div class="num">'+sums[7].toLocaleString()+'</div><div class="label">总销量</div></div>'+
        '<div class="kpi-card"><div class="num">¥'+sums[8].toLocaleString()+'</div><div class="label">吊牌额</div></div>'+
        '<div class="kpi-card"><div class="num">¥'+sums[9].toLocaleString()+'</div><div class="label">销售额</div></div>';
    filter();
}
function filter(){
    const cat=document.getElementById('catFilter').value;
    const gen=document.getElementById('genFilter').value;
    render(cat||gen?DATA.filter(r=>(!cat||r[1]===cat)&&(!gen||r[2]===gen)):DATA);
}
function render(data){
    document.getElementById('tbody').innerHTML=data.map((r,i)=>{
        let row='<tr><td style="color:#999">'+(i+1)+'</td>';
        row+=r.map((v,j)=>{
            if(j===10) return '<td style="color:'+(v>=0.85?'#27ae60':v>=0.7?'#f39c12':'#e74c3c')+'">'+(v*100).toFixed(0)+'%</td>';
            if(j===12) return '<td style="color:'+(v>20?'#27ae60':v>5?'#f39c12':'#e74c3c')+'">'+v+'%</td>';
            return typeof v==='number'&&j>=7?'<td>¥'+v.toLocaleString()+'</td>':typeof v==='number'?'<td>'+v.toLocaleString()+'</td>':'<td>'+(v||'')+'</td>';
        }).join('');
        row+='</tr>';return row;
    }).join('');
    updateCharts(data);
}
function updateCharts(data){
    const top=data.slice(0,10);
    ech1({id:'chart1',title:'TOP10销售金额',x:top.map(r=>r[0]),y:top.map(r=>r[9]),color:'#2c3e50'});
    const c={};data.forEach(r=>{c[r[1]]=(c[r[1]]||0)+r[9]});
    const pie=Object.entries(c).filter(([k,v])=>v>0).map(([k,v])=>({name:k,value:v}));
    ech2({id:'chart2',title:'大类销售金额占比',data:pie});
}
function ech1(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:13}},tooltip:{trigger:'axis'},xAxis:{data:o.x,axisLabel:{rotate:30}},yAxis:{},series:[{type:'bar',data:o.y,itemStyle:{color:o.color}}]});}
function ech2(o){var c=echarts.init(document.getElementById(o.id));c.setOption({title:{text:o.title,left:'center',textStyle:{fontSize:13}},tooltip:{},series:[{type:'pie',data:o.data,radius:['20%','60%'],center:['50%','55%'],label:{formatter:'{b}:{d}%'}}]});}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html).replace("DATAJSON", json.dumps(d["rows"]))
write_html("q2-rank.html", html)

# ========== 周趋势 ==========
print("生成 weekly-trend.html...")
with open(f"{outdir}/weekly-data.json") as f:
    d = json.load(f)
header_html = "".join(f"<th>{h}</th>" for h in d["headers"])

html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>周销售趋势 - 26Q2</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
<style>
body{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}
h2{color:#333}.chart-box{background:#fff;border-radius:8px;padding:15px;height:350px;margin-bottom:15px}
.table-wrap{background:#fff;border-radius:8px;padding:15px;overflow:auto}
table{width:100%;border-collapse:collapse;font-size:12px;white-space:nowrap}
th,td{padding:4px 8px;text-align:center;border:1px solid #eee}th{background:#f8f9fa;position:sticky;top:0}
tr:hover{background:#f0f7ff}
</style></head><body>
<h2>周销售趋势（26Q2）</h2>
<div class="chart-box" id="chart1"></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
const WKS = WKSJSON;
function init(){
    const weeks=WKS.slice(1,-1);
    const totals=weeks.map((w,i)=>DATA.reduce((a,r)=>a+(r[i+1]||0),0));
    var c=echarts.init(document.getElementById('chart1'));
    c.setOption({title:{text:'每周销售趋势',left:'center'},tooltip:{trigger:'axis'},xAxis:{data:weeks},yAxis:{},series:[{type:'line',data:totals,areaStyle:{},itemStyle:{color:'#3498db'},markLine:{data:[{type:'average',name:'均值'}]}}]});
    document.getElementById('tbody').innerHTML=DATA.map(r=>'<tr>'+r.map(v=>typeof v==='number'?'<td>'+v.toLocaleString()+'</td>':'<td>'+(v||'')+'</td>').join('')+'</tr>').join('');
}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html).replace("DATAJSON", json.dumps(d["rows"])).replace("WKSJSON", json.dumps(d["headers"]))
write_html("weekly-trend.html", html)

# ========== 第一次销售日期 ==========
print("生成 first-sale.html...")
with open(f"{outdir}/first-sale-data.json") as f:
    d = json.load(f)
header_html = "".join(f"<th>{h}</th>" for h in d["headers"])

html = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
<title>第一次销售日期 - 26Q2</title>
<style>
body{font-family:sans-serif;margin:0;padding:20px;background:#f5f5f5}
h2{color:#333}.table-wrap{background:#fff;border-radius:8px;padding:15px;overflow:auto;max-height:80vh}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:6px 10px;text-align:center;border-bottom:1px solid #eee}
th{background:#f8f9fa;position:sticky;top:0}
.filter-bar{margin-bottom:15px}input{padding:8px 12px;border:1px solid #ddd;border-radius:5px;width:300px}
</style></head><body>
<h2>第一次销售日期</h2>
<div id="summary" style="color:#666;margin-bottom:15px"></div>
<div class="filter-bar"><input id="search" placeholder="搜索货号..." oninput="filter()"></div>
<div class="table-wrap"><table><thead><tr>HEADER</tr></thead><tbody id="tbody"></tbody></table></div>
<script>
const DATA = DATAJSON;
function init(){document.getElementById('summary').innerHTML='共 '+DATA.length+' 个货号有销售记录';render(DATA);}
function render(d){document.getElementById('tbody').innerHTML=d.map(r=>'<tr><td>'+(r[0]||'')+'</td><td>'+(r[1]||'')+'</td></tr>').join('');}
function filter(){const kw=document.getElementById('search').value.toLowerCase();render(kw?DATA.filter(r=>r[0].toLowerCase().includes(kw)):DATA);}
window.addEventListener('DOMContentLoaded',init);
</script></body></html>"""

html = html.replace("HEADER", header_html).replace("DATAJSON", json.dumps(d["rows"]))
write_html("first-sale.html", html)

print("\n所有HTML生成完成!")
print("  category-sellthru.html - 品类售罄")
print("  total-stock.html - 总零售库存")
print("  store-sellthru.html - 单店售罄")
print("  q2-rank.html - Q2销售排名")
print("  weekly-trend.html - 周趋势")
print("  first-sale.html - 第一次销售日期")
