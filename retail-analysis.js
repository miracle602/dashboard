// ========== 门店数据 ==========
const STORES=[[206,'NO ONE ELSE同德'],[204,'NO ONE ELSE顺城'],[202,'CHUU同德'],[200,'CHUU七彩云南'],[203,'CHUU金鹰'],[205,'NO ONE ELSE万象城'],[201,'CHUU万象城'],[15,'北市区和谐店'],[14,'同德广场店'],[7,'呈贡奥斯迪'],[17,'官渡环南路'],[16,'双桥福德路'],[22,'呈贡步行街'],[192,'同德2号店'],[220,'同德4号店'],[240,'昆明一店'],[349,'小板桥分店'],[361,'曲靖分店3'],[210,'会泽1店'],[301,'安宁服装店']];
const SM=Object.fromEntries(STORES);
const GROSS_RATE=0.55;
const PRODS={shoes:['WX2WHX362','WQ1WHX889'],clothes:['WX2YHT123','WX2YHT456','WX2YHT789','WX3YHT001','WX3YHT002','WX3YHT003','WX4YHT001','WX4YHT002','WX5YHT001','WX5YHT002','WX6YHT001','WX6YHT002','WX7YHT001','WX7YHT002','WX8YHT001','WX8YHT002','WX9YHT001','WX9YHT002','WX9YHT003','WX0YHT001','WX0YHT002','WX1YHT001','WX1YHT002','WX2YHT003','WX3YHT004','WX4YHT003','WX5YHT003','WX1YXT6278'],accessories:['WX1ZCM0001','WX1ZCB0002','WX2ZCM100','WX2ZCM200','WX3ZCM001','WX4ZCM001','WX5ZCM001','WX6ZCM001','WX8ZCM001','WX9ZCM001','WX0ZCM001','WX1ZCM002','WX2ZCM003','WX3ZCM002','WX4ZCM002','WX5ZCM002']};
const PL={'WX1YXT6278':399,'WX1ZCM0001':199,'WX1ZCB0002':499,'WX2WHX362':373,'WQ1WHX889':3281,'WX2YHT123':259,'WX2YHT456':459,'WX2YHT789':359,'WX2ZCM100':159,'WX2ZCM200':129,'WX3YHT001':329,'WX3YHT002':599,'WX3YHT003':289,'WX3ZCM001':189,'WX4YHT001':899,'WX4YHT002':349,'WX4ZCM001':149,'WX5YHT001':699,'WX5YHT002':329,'WX5ZCM001':259,'WX6YHT001':279,'WX6YHT002':319,'WX6ZCM001':399,'WX7YHT001':299,'WX7YHT002':269,'WX8YHT001':499,'WX8YHT002':159,'WX8ZCM001':299,'WX9YHT001':389,'WX9YHT002':429,'WX9YHT003':199,'WX9ZCM001':89,'WX0YHT001':339,'WX0YHT002':259,'WX0ZCM001':129,'WX1YHT001':799,'WX1YHT002':359,'WX1ZCM002':119,'WX2YHT003':169,'WX2ZCM003':69,'WX3YHT004':459,'WX3ZCM002':99,'WX4YHT003':999,'WX4ZCM002':159,'WX5YHT003':229,'WX5ZCM002':89};
const CAT_NAMES={shoes:'鞋类',clothes:'服装',accessories:'配饰'};
const ALL_PRODS=Object.keys(PL);
const catOf={};for(const[k,v]of Object.entries(PRODS))for(const p of v)catOf[p]=k;
let C={};

function genData(){
  const d=[];let oid=10001;
  for(let dt=new Date(2025,0,1);dt<=new Date(2026,3,27);dt.setDate(dt.getDate()+1)){
    const ds=String(dt.getFullYear())+String(dt.getMonth()+1).padStart(2,'0')+String(dt.getDate()).padStart(2,'0');
    const wd=dt.getDay(),n=wd===0?3+Math.random()*5:wd===6?5+Math.random()*6:1+Math.random()*5;
    for(let i=0;i<Math.floor(n)&&oid<30000;i++){
      const sid=STORES[Math.floor(Math.random()*STORES.length)][0];
      const pi=Math.floor(Math.random()*ALL_PRODS.length);
      const pn=ALL_PRODS[pi],lp=PL[pn]||299,dr=0.6+Math.random()*0.35,ap=Math.round(lp*dr);
      const q=1+Math.floor(Math.random()*(wd===0||wd===6?4:2));
      const ta=ap*q,co=Math.round(ta*(1-GROSS_RATE));
      d.push({id:oid++,docno:'RC'+ds.substring(2)+String(oid).padStart(6,'0'),date:parseInt(ds),storeId:sid,storeName:SM[sid],prodName:pn,cat:catOf[pn]||'clothes',qty:q,listAmt:lp*q,actualAmt:ta,cost:co,gross:ta-co,grossRate:Math.round((ta-co)/ta*100),vip:Math.random()>0.5?'VIP'+String(1000+Math.floor(Math.random()*900)):'',type:Math.random()>0.8?'团购':'正常'});
    }
  }
  return d;
}
const AD=genData();
let FD=AD;

function fmt(v){return'¥'+v.toLocaleString('zh-CN')}
function gd(s){return parseInt(s.replace(/-/g,''))}

window.onload=function(){
  const sg=document.getElementById('storeCheckGroup');
  STORES.sort((a,b)=>a[1].localeCompare(b[1])).forEach(([id,n])=>{
    const l=document.createElement('label');
    l.innerHTML='<input type="checkbox" value="'+id+'" checked>'+n;
    sg.appendChild(l);
  });
  flatpickr("#startDate",{dateFormat:"Y-m-d",defaultDate:"2026-03-01"});
  flatpickr("#endDate",{dateFormat:"Y-m-d",defaultDate:"2026-04-27"});
  document.getElementById('updateTime').textContent='⏱ 更新于 2026-04-27 16:45';
  document.getElementById('footerTime').textContent='2026-04-27 16:45';
  doQuery();
};

function doQuery(){
  const sn=gd(document.getElementById('startDate').value),en=gd(document.getElementById('endDate').value);
  const cs=new Set();document.querySelectorAll('#storeCheckGroup input:checked').forEach(c=>cs.add(parseInt(c.value)));
  const cr=document.querySelector('input[name="cat"]:checked').value;
  const st=document.getElementById('searchText').value.trim();
  FD=AD.filter(r=>r.date>=sn&&r.date<=en&&(cs.size===0||cs.has(r.storeId))&&(cr==='all'||r.cat===cr)&&(!st||r.prodName.includes(st)||r.docno.includes(st)));
  renderAll();
}

function resetQuery(){
  document.getElementById('startDate').value='2026-03-01';
  document.getElementById('endDate').value='2026-04-27';
  document.getElementById('searchText').value='';
  document.querySelectorAll('#storeCheckGroup input[type=checkbox]').forEach(c=>c.checked=true);
  document.querySelector('input[name="cat"][value="all"]').checked=true;
  doQuery();
}

function renderAll(){rKPI();rTrend();rStore();rProfit();rDaily();rCat();rYoy();rStruct();rTable();}

// ========== KPI ==========
function rKPI(){
  const g=document.getElementById('kpiGrid');
  if(!FD.length){g.innerHTML='<div class="kpi-card"><div class="label">暂无</div><div class="val">—</div></div>'.repeat(6);return;}
  let a=0,la=0,c=0,q=0;const ss=new Set(),vs=new Set();
  for(const r of FD){a+=r.actualAmt;la+=r.listAmt;c+=r.cost;q+=r.qty;ss.add(r.storeId);if(r.vip)vs.add(r.vip);}
  const gr=a>0?((a-c)/a*100).toFixed(1):0;
  const sy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const ssd=AD.filter(r=>r.date>=gd(sy+document.getElementById('startDate').value.substring(4))&&r.date<=gd(sy+document.getElementById('endDate').value.substring(4)));
  const sa=ssd.reduce((s,r)=>s+r.actualAmt,0);
  const yoy=sa>0?((a-sa)/sa*100).toFixed(1):0;
  const cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  const pm=cm===1?12:cm-1,py=cm===1?cy-1:cy;
  const pd=AD.filter(r=>r.date>=gd(py+'-'+String(pm).padStart(2,'0')+'-01')&&r.date<gd(document.getElementById('startDate').value));
  const pa=pd.reduce((s,r)=>s+r.actualAmt,0);
  const mom=pa>0?((a-pa)/pa*100).toFixed(1):0;
  g.innerHTML='<div class="kpi-card"><div class="label">💰 成交金额</div><div class="val">'+fmt(a)+'</div><div class="subrow"><span class="'+(yoy>=0?'up':'down')+'">同'+(yoy>=0?'↑':'↓')+Math.abs(yoy)+'%</span><span class="'+(mom>=0?'up':'down')+'">环'+(mom>=0?'↑':'↓')+Math.abs(mom)+'%</span></div></div><div class="kpi-card"><div class="label">📊 毛利率</div><div class="val">'+gr+'%</div><div class="subrow"><span class="info">毛利'+fmt(a-c)+'</span><span class="info">成本'+fmt(c)+'</span></div></div><div class="kpi-card"><div class="label">📦 总销量</div><div class="val">'+q.toLocaleString()+'</div><div class="subrow"><span class="info">'+FD.length+'笔订单</span></div></div><div class="kpi-card"><div class="label">🏬 活跃门店</div><div class="val">'+ss.size+'</div><div class="subrow"><span class="info">'+vs.size+'位会员</span></div></div><div class="kpi-card"><div class="label">📈 客单价</div><div class="val">¥'+(FD.length>0?(a/FD.length).toFixed(0):0)+'</div><div class="subrow"><span class="info">折扣'+(a/la*100).toFixed(0)+'%</span></div></div><div class="kpi-card"><div class="label">🔄 同比/环比</div><div class="val'+(yoy>=0?' up':' down')+'" style="font-size:18px">同'+(yoy>=0?'↑':'↓')+Math.abs(yoy)+'%</div><div class="subrow"><span class="'+(mom>=0?'up':'down')+'">环'+(mom>=0?'↑':'↓')+Math.abs(mom)+'%</span><span class="info">同期¥'+(sa/10000).toFixed(1)+'万</span></div></div>';
}

// ========== 月度趋势 ==========
function rTrend(){
  const ctx=document.getElementById('trendChart').getContext('2d');
  if(C.trend)C.trend.destroy();
  const md={},sd={},pd={};
  for(const r of FD){const m=String(r.date).substring(0,6);md[m]=(md[m]||0)+r.actualAmt;}
  const yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const yyS=AD.filter(r=>r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,'')));
  for(const r of yyS){const m=String(r.date).substring(0,6);sd[m]=(sd[m]||0)+r.actualAmt;}
  const cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  const _pm=cm===1?12:cm-1,_py=cm===1?cy-1:cy;
  const pDat=AD.filter(r=>r.date>=parseInt(String(_py)+String(_pm).padStart(2,'0')+'01')&&r.date<parseInt(document.getElementById('startDate').value.replace(/-/g,'')));
  for(const r of pDat){const m=String(r.date).substring(0,6);pd[m]=(pd[m]||0)+r.actualAmt;}
  const ms=[...new Set([...Object.keys(md),...Object.keys(sd),...Object.keys(pd)])].sort();
  C.trend=new Chart(ctx,{type:'bar',data:{labels:ms.map(m=>m.substring(0,4)+'.'+m.substring(4,6)),datasets:[{label:'本期',data:ms.map(m=>Math.round((md[m]||0)/10000*10)/10),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.5},{label:'同比(去年)',data:ms.map(m=>Math.round((sd[m]||0)/10000*10)/10),backgroundColor:'#94a3b8',borderRadius:3,barPercentage:.5},{label:'环比(上月)',data:ms.map(m=>Math.round((pd[m]||0)/10000*10)/10),backgroundColor:'rgba(46,196,182,.6)',borderRadius:3,barPercentage:.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'¥'+(v*10000).toLocaleString()},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

// ========== 门店排行 ==========
function rStore(){
  const ctx=document.getElementById('storeChart').getContext('2d');
  if(C.store)C.store.destroy();
  const sd={};
  for(const r of FD)sd[r.storeName]=(sd[r.storeName]||0)+r.actualAmt;
  const s=Object.entries(sd).sort((a,b)=>b[1]-a[1]).slice(0,15);
  const colors=['#4361ee','#3a86ff','#8338ec','#ff006e','#fb5607','#ff9f1c','#06d6a0','#118ab2','#7209b7','#f72585','#4cc9f0','#4895ef','#560bad','#a2d2ff','#bde0fe'];
  C.store=new Chart(ctx,{type:'bar',data:{labels:s.map(([n])=>n.length>8?n.substring(0,8)+'…':n),datasets:[{label:'成交金额',data:s.map(([,v])=>Math.round(v)),backgroundColor:s.map((_,i)=>colors[i%colors.length]),borderRadius:3,barPercentage:.7}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>'¥'+ctx.raw.toLocaleString('zh-CN')}}},scales:{x:{beginAtZero:true,ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'},grid:{color:'rgba(0,0,0,.04)'}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

// ========== 毛利率 ==========
function rProfit(){
  const ctx=document.getElementById('profitChart').getContext('2d');
  if(C.profit)C.profit.destroy();
  const sd={},sc={};
  for(const r of FD){sd[r.storeName]=(sd[r.storeName]||0)+r.actualAmt;sc[r.storeName]=(sc[r.storeName]||0)+r.cost;}
  const s=Object.entries(sd).sort((a,b)=>b[1]-a[1]).slice(0,12);
  C.profit=new Chart(ctx,{type:'bar',data:{labels:s.map(([n])=>n.length>6?n.substring(0,6)+'…':n),datasets:[{label:'毛利率%',data:s.map(([n])=>{const t=sd[n],c=sc[n];return t>0?Math.round((t-c)/t*100):0}),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.7,yAxisID:'y'},{label:'毛利额',data:s.map(([n])=>Math.round((sd[n]||0)-(sc[n]||0))),backgroundColor:'rgba(46,196,182,.5)',borderRadius:3,barPercentage:.7,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9},boxWidth:10,padding:6}}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(0,0,0,.04)'}},y1:{position:'right',beginAtZero:true,ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'},grid:{display:false}},x:{grid:{display:false},ticks:{font:{size:8}}}}}});
}

// ========== 每日趋势 ==========
function rDaily(){
  const ctx=document.getElementById('dailyChart').getContext('2d');
  if(C.daily)C.daily.destroy();
  const dd={},sd={};
  for(const r of FD)dd[r.date]=(dd[r.date]||0)+r.actualAmt;
  const yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const yyD=AD.filter(r=>r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,'')));
  for(const r of yyD)sd[r.date]=(sd[r.date]||0)+r.actualAmt;
  const ds=[...new Set([...Object.keys(dd),...Object.keys(sd)])].sort();
  C.daily=new Chart(ctx,{type:'line',data:{labels:ds.map(d=>String(d).substring(4,6)+'/'+String(d).substring(6,8)),datasets:[{label:'本期',data:ds.map(d=>Math.round((dd[d]||0)/10000*10)/10),borderColor:'#4361ee',backgroundColor:'rgba(67,97,238,.08)',fill:true,tension:.4,pointRadius:2,pointBackgroundColor:'#4361ee',borderWidth:2},{label:'同比',data:ds.map(d=>Math.round((sd[d]||0)/10000*10)/10),borderColor:'#e2e8f0',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:1,borderWidth:1.5,borderDash:[4,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'¥'+(v*10000).toLocaleString()},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:8},maxTicksLimit:15}}}}});
}

// ========== 品类销售 ==========
function rCat(){
  const ctx=document.getElementById('catChart').getContext('2d');
  if(C.cat)C.cat.destroy();
  const cd={};
  for(const r of FD)cd[r.cat]=(cd[r.cat]||0)+r.actualAmt;
  const s=Object.entries(cd).sort((a,b)=>b[1]-a[1]);
  const cCol={'shoes':'#3a86ff','clothes':'#4361ee','accessories':'#06d6a0'};
  C.cat=new Chart(ctx,{type:'doughnut',data:{labels:s.map(([k])=>CAT_NAMES[k]||k),datasets:[{data:s.map(([,v])=>Math.round(v)),backgroundColor:s.map(([k])=>cCol[k]||'#4361ee'),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>CAT_NAMES[ctx.label.split('(')[0]]+': ¥'+(ctx.raw/10000).toFixed(2)+'万'}}},cutout:'55%'}});
}

// ========== 同环比 ==========
function rYoy(){
  const ctx=document.getElementById('yoyChart').getContext('2d');
  if(C.yoy)C.yoy.destroy();
  const sy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const cm=parseInt(document.getElementById('endDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  const pm=cm===1?12:cm-1,py=cm===1?cy-1:cy;

  const months=['03','04'];const current=[],yearAgo=[],prev=[];
  for(const m of months){
    const y=parseInt('2026'+m+'01'),ye=parseInt('2026'+m+'31');
    const cur=AD.filter(r=>r.date>=y&&r.date<=ye).reduce((s,r)=>s+r.actualAmt,0);
    current.push(Math.round(cur));
    const ly=parseInt('2025'+m+'01'),lye=parseInt('2025'+m+'31');
    const last=AD.filter(r=>r.date>=ly&&r.date<=lye).reduce((s,r)=>s+r.actualAmt,0);
    yearAgo.push(Math.round(last));
  }

  C.yoy=new Chart(ctx,{type:'bar',data:{labels:['3月','4月'],datasets:[{label:'本期(2026)',data:current,backgroundColor:'#4361ee',borderRadius:4,barPercentage:.6},{label:'同比(2025)',data:yearAgo,backgroundColor:'#94a3b8',borderRadius:4,barPercentage:.6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.dataset.label+': ¥'+ctx.raw.toLocaleString('zh-CN')}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'¥'+(v/10000).toFixed(1)+'万'},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
}

// ========== 销售结构 ==========
function rStruct(){
  const ctx=document.getElementById('structChart').getContext('2d');
  if(C.struct)C.struct.destroy();
  const td={};
  for(const r of FD)td[r.type]=(td[r.type]||0)+r.actualAmt;
  const s=Object.entries(td).sort((a,b)=>b[1]-a[1]);
  C.struct=new Chart(ctx,{type:'pie',data:{labels:s.map(([k])=>k),datasets:[{data:s.map(([,v])=>Math.round(v)),backgroundColor:['#4361ee','#06d6a0','#ff9f1c','#e71d36'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>ctx.label+': ¥'+(ctx.raw/10000).toFixed(2)+'万 ('+(ctx.parsed/(ctx.dataset.data.reduce((a,b)=>a+b,0))*100).toFixed(1)+'%)'}}}});
}

// ========== 表格 ==========
function rTable(){
  const tbody=document.getElementById('tableBody');
  if(!FD.length){tbody.innerHTML='<tr><td colspan="11" class="text-center" style="color:#94a3b8;padding:30px">暂无数据</td></tr>';return;}
  const d=FD.slice(-50).reverse();
  tbody.innerHTML=d.map(r=>{
    const dt=String(r.date).substring(0,4)+'-'+String(r.date).substring(4,6)+'-'+String(r.date).substring(6,8);
    return '<tr><td style="font-family:monospace;font-size:10px">'+r.docno+'</td><td>'+dt+'</td><td><span class="badge blue">'+r.storeName+'</span></td><td class="text-right">'+fmt(r.listAmt)+'</td><td class="text-right">'+fmt(r.actualAmt)+'</td><td class="text-right">'+fmt(r.cost)+'</td><td class="text-right">'+fmt(r.gross)+'</td><td class="text-center"><span class="badge '+(r.grossRate>=55?'green':'red')+'">'+r.grossRate+'%</span></td><td class="text-right">'+r.qty+'</td><td style="font-family:monospace;font-size:10px">'+r.prodName+'</td><td>'+(r.vip||'—')+'</td></tr>';
  }).join('');
}

setInterval(()=>{doQuery();},10*60*1000);