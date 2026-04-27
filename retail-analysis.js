// ========== 门店数据 ==========
const STORES=[[206,'NO ONE ELSE同德'],[204,'NO ONE ELSE顺城'],[202,'CHUU同德'],[200,'CHUU七彩云南'],[203,'CHUU金鹰'],[205,'NO ONE ELSE万象城'],[201,'CHUU万象城'],[15,'北市区和谐店'],[14,'同德广场店'],[7,'呈贡奥斯迪'],[17,'官渡环南路'],[16,'双桥福德路'],[22,'呈贡步行街'],[192,'同德2号店'],[220,'同德4号店'],[240,'昆明一店'],[349,'小板桥分店'],[361,'曲靖分店3'],[210,'会泽1店'],[301,'安宁服装店']];
const SM=Object.fromEntries(STORES);
const GROSS_RATE=0.55;
const PRODS={shoes:['WX2WHX362','WQ1WHX889'],clothes:['WX2YHT123','WX2YHT456','WX2YHT789','WX3YHT001','WX3YHT002','WX3YHT003','WX4YHT001','WX4YHT002','WX5YHT001','WX5YHT002','WX6YHT001','WX6YHT002','WX7YHT001','WX7YHT002','WX8YHT001','WX8YHT002','WX9YHT001','WX9YHT002','WX9YHT003','WX0YHT001','WX0YHT002','WX1YHT001','WX1YHT002','WX2YHT003','WX3YHT004','WX4YHT003','WX5YHT003','WX1YXT6278'],accessories:['WX1ZCM0001','WX1ZCB0002','WX2ZCM100','WX2ZCM200','WX3ZCM001','WX4ZCM001','WX5ZCM001','WX6ZCM001','WX8ZCM001','WX9ZCM001','WX0ZCM001','WX1ZCM002','WX2ZCM003','WX3ZCM002','WX4ZCM002','WX5ZCM002']};
const PL={WX1YXT6278:399,WX1ZCM0001:199,WX1ZCB0002:499,WX2WHX362:373,WQ1WHX889:3281,WX2YHT123:259,WX2YHT456:459,WX2YHT789:359,WX2ZCM100:159,WX2ZCM200:129,WX3YHT001:329,WX3YHT002:599,WX3YHT003:289,WX3ZCM001:189,WX4YHT001:899,WX4YHT002:349,WX4ZCM001:149,WX5YHT001:699,WX5YHT002:329,WX5ZCM001:259,WX6YHT001:279,WX6YHT002:319,WX6ZCM001:399,WX7YHT001:299,WX7YHT002:269,WX8YHT001:499,WX8YHT002:159,WX8ZCM001:299,WX9YHT001:389,WX9YHT002:429,WX9YHT003:199,WX9ZCM001:89,WX0YHT001:339,WX0YHT002:259,WX0ZCM001:129,WX1YHT001:799,WX1YHT002:359,WX1ZCM002:119,WX2YHT003:169,WX2ZCM003:69,WX3YHT004:459,WX3ZCM002:99,WX4YHT003:999,WX4ZCM002:159,WX5YHT003:229,WX5ZCM002:89};
const CAT_NAMES={shoes:'\u978b\u7c7b',clothes:'\u670d\u88c5',accessories:'\u914d\u9970'};
const ALL_PRODS=Object.keys(PL);
const catOf={};for(const k of Object.keys(PRODS))for(const p of PRODS[k])catOf[p]=k;
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
      d.push({id:oid++,docno:'RC'+ds.substring(2)+String(oid).padStart(6,'0'),date:parseInt(ds),storeId:sid,storeName:SM[sid],prodName:pn,cat:catOf[pn]||'clothes',qty:q,listAmt:lp*q,actualAmt:ta,cost:co,gross:ta-co,grossRate:Math.round((ta-co)/ta*100),vip:Math.random()>0.5?'VIP'+String(1000+Math.floor(Math.random()*900)):'',type:Math.random()>0.8?'\u56e2\u8d2d':'\u6b63\u5e38'});
    }
  }
  return d;
}
const AD=genData();
let FD=AD;

function fmt(v){return'\u00a5'+v.toLocaleString('zh-CN')}
function gd(s){return parseInt(s.replace(/-/g,''))}

function doQuery(){
  document.getElementById('updateTime').textContent='\u23f1 \u66f4\u65b0\u4e2d...';
  const sn=gd(document.getElementById('startDate').value),en=gd(document.getElementById('endDate').value);
  const cs=new Set();document.querySelectorAll('#storeCheckGroup input:checked').forEach(c=>cs.add(parseInt(c.value)));
  const cr=document.querySelector('input[name="cat"]:checked').value;
  const st=document.getElementById('searchText').value.trim();
  FD=AD.filter(function(r){
    if(r.date<sn||r.date>en)return false;
    if(cs.size>0&&!cs.has(r.storeId))return false;
    if(cr!=='all'&&r.cat!==cr)return false;
    if(st&&!r.prodName.includes(st)&&!r.docno.includes(st))return false;
    return true;
  });
  document.getElementById('updateTime').textContent='\u23f1 \u66f4\u65b0\u4e8e 17:09';
  renderAll();
}

function renderAll(){rKPI();rTrend();rStore();rProfit();rDaily();rCat();rYoy();rStruct();rTable();}

function rKPI(){
  const g=document.getElementById('kpiGrid');
  if(!FD.length){g.innerHTML='<div class="kpi-card"><div class="label">\u6682\u65e0</div><div class="val">\u2014</div></div>'.repeat(6);return;}
  let a=0,la=0,c=0,q=0;const ss=new Set(),vs=new Set();
  for(let i=0;i<FD.length;i++){const r=FD[i];a+=r.actualAmt;la+=r.listAmt;c+=r.cost;q+=r.qty;ss.add(r.storeId);if(r.vip)vs.add(r.vip);}
  const gr=a>0?((a-c)/a*100).toFixed(1):0;
  const sy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const ssd=AD.filter(function(r){return r.date>=gd(sy+document.getElementById('startDate').value.substring(4))&&r.date<=gd(sy+document.getElementById('endDate').value.substring(4))});
  let sa=0;for(let i=0;i<ssd.length;i++)sa+=ssd[i].actualAmt;
  const yoy=sa>0?((a-sa)/sa*100).toFixed(1):0;
  const cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  const pm=cm===1?12:cm-1,py=cm===1?cy-1:cy;
  const pd=AD.filter(function(r){return r.date>=gd(py+'-'+String(pm).padStart(2,'0')+'-01')&&r.date<gd(document.getElementById('startDate').value)});
  let pa=0;for(let i=0;i<pd.length;i++)pa+=pd[i].actualAmt;
  const mom=pa>0?((a-pa)/pa*100).toFixed(1):0;
  g.innerHTML='<div class="kpi-card"><div class="label">\U0001f4b0 \u6210\u4ea4\u91d1\u989d</div><div class="val">'+fmt(a)+'</div><div class="subrow"><span class="'+(yoy>=0?'up':'down')+'">\u540c'+(yoy>=0?'\u2191':'\u2193')+Math.abs(yoy)+'%</span><span class="'+(mom>=0?'up':'down')+'">\u73af'+(mom>=0?'\u2191':'\u2193')+Math.abs(mom)+'%</span></div></div><div class="kpi-card"><div class="label">\U0001f4ca \u6bdb\u5229\u7387</div><div class="val">'+gr+'%</div><div class="subrow"><span class="info">\u6bdb\u5229'+fmt(a-c)+'</span><span class="info">\u6210\u672c'+fmt(c)+'</span></div></div><div class="kpi-card"><div class="label">\U0001f4e6 \u603b\u9500\u91cf</div><div class="val">'+q.toLocaleString()+'</div><div class="subrow"><span class="info">'+FD.length+'\u7b14\u8ba2\u5355</span></div></div><div class="kpi-card"><div class="label">\U0001f3ec \u6d3b\u8dc3\u95e8\u5e97</div><div class="val">'+ss.size+'</div><div class="subrow"><span class="info">'+vs.size+'\u4f4d\u4f1a\u5458</span></div></div><div class="kpi-card"><div class="label">\U0001f4c8 \u5ba2\u5355\u4ef7</div><div class="val">\u00a5'+(FD.length>0?(a/FD.length).toFixed(0):0)+'</div><div class="subrow"><span class="info">\u6298\u6263'+(a/la*100).toFixed(0)+'%</span></div></div><div class="kpi-card"><div class="label">\U0001f504 \u540c\u6bd4/\u73af\u6bd4</div><div class="val'+(yoy>=0?' up':' down')+'" style="font-size:18px">\u540c'+(yoy>=0?'\u2191':'\u2193')+Math.abs(yoy)+'%</div><div class="subrow"><span class="'+(mom>=0?'up':'down')+'">\u73af'+(mom>=0?'\u2191':'\u2193')+Math.abs(mom)+'%</span><span class="info">\u540c\u671f\u00a5'+(sa/10000).toFixed(1)+'\u4e07</span></div></div>';
}

function rTrend(){
  if(!C.trend)C.trend=null;if(C.trend)C.trend.destroy();
  const ctx=document.getElementById('trendChart').getContext('2d');
  const md={},sd={},pd={};
  for(let i=0;i<FD.length;i++){const m=String(FD[i].date).substring(0,6);md[m]=(md[m]||0)+FD[i].actualAmt;}
  const yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const yyS=AD.filter(function(r){return r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,''))});
  for(let i=0;i<yyS.length;i++){const m=String(yyS[i].date).substring(0,6);sd[m]=(sd[m]||0)+yyS[i].actualAmt;}
  const cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  const _pm=cm===1?12:cm-1,_py=cm===1?cy-1:cy;
  const pDat=AD.filter(function(r){return r.date>=parseInt(String(_py)+String(_pm).padStart(2,'0')+'01')&&r.date<parseInt(document.getElementById('startDate').value.replace(/-/g,''))});
  for(let i=0;i<pDat.length;i++){const m=String(pDat[i].date).substring(0,6);pd[m]=(pd[m]||0)+pDat[i].actualAmt;}
  const ms=Object.keys(md).concat(Object.keys(sd)).concat(Object.keys(pd));
  const ms2=[];for(let i=0;i<ms.length;i++){if(ms2.indexOf(ms[i])===-1)ms2.push(ms[i])}
  ms2.sort();
  C.trend=new Chart(ctx,{type:'bar',data:{labels:ms2.map(function(m){return m.substring(0,4)+'.'+m.substring(4,6)}),datasets:[{label:'\u672c\u671f',data:ms2.map(function(m){return Math.round((md[m]||0)/10000*10)/10}),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.5},{label:'\u540c\u6bd4(\u53bb\u5e74)',data:ms2.map(function(m){return Math.round((sd[m]||0)/10000*10)/10}),backgroundColor:'#94a3b8',borderRadius:3,barPercentage:.5},{label:'\u73af\u6bd4(\u4e0a\u6708)',data:ms2.map(function(m){return Math.round((pd[m]||0)/10000*10)/10}),backgroundColor:'rgba(46,196,182,.6)',borderRadius:3,barPercentage:.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v*10000).toLocaleString()}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

function rStore(){
  if(C.store)C.store.destroy();
  const ctx=document.getElementById('storeChart').getContext('2d');
  const sd={};for(let i=0;i<FD.length;i++)sd[FD[i].storeName]=(sd[FD[i].storeName]||0)+FD[i].actualAmt;
  const s=Object.entries(sd).sort(function(a,b){return b[1]-a[1]}).slice(0,15);
  const colors=['#4361ee','#3a86ff','#8338ec','#ff006e','#fb5607','#ff9f1c','#06d6a0','#118ab2','#7209b7','#f72585','#4cc9f0','#4895ef','#560bad','#a2d2ff','#bde0fe'];
  C.store=new Chart(ctx,{type:'bar',data:{labels:s.map(function(n){return n[0].length>8?n[0].substring(0,8)+'…':n[0]}),datasets:[{label:'\u6210\u4ea4\u91d1\u989d',data:s.map(function(v){return Math.round(v[1])}),backgroundColor:s.map(function(_,i){return colors[i%colors.length]}),borderRadius:3,barPercentage:.7}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return'¥'+ctx.raw.toLocaleString('zh-CN')}}}},scales:{x:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{color:'rgba(0,0,0,.04)'}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

function rProfit(){
  if(C.profit)C.profit.destroy();
  const ctx=document.getElementById('profitChart').getContext('2d');
  const sd={},sc={};for(let i=0;i<FD.length;i++){sd[FD[i].storeName]=(sd[FD[i].storeName]||0)+FD[i].actualAmt;sc[FD[i].storeName]=(sc[FD[i].storeName]||0)+FD[i].cost;}
  const s=Object.entries(sd).sort(function(a,b){return b[1]-a[1]}).slice(0,12);
  C.profit=new Chart(ctx,{type:'bar',data:{labels:s.map(function(n){return n[0].length>6?n[0].substring(0,6)+'…':n[0]}),datasets:[{label:'\u6bdb\u5229\u7387%',data:s.map(function(n){var t=sd[n[0]],c2=sc[n[0]];return t>0?Math.round((t-c2)/t*100):0}),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.7,yAxisID:'y'},{label:'\u6bdb\u5229\u989d',data:s.map(function(n){return Math.round((sd[n[0]]||0)-(sc[n[0]]||0))}),backgroundColor:'rgba(46,196,182,.5)',borderRadius:3,barPercentage:.7,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9},boxWidth:10,padding:6}}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:function(v){return v+'%'}},grid:{color:'rgba(0,0,0,.04)'}},y1:{position:'right',beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{display:false}},x:{grid:{display:false},ticks:{font:{size:8}}}}}});
}

function rDaily(){
  if(C.daily)C.daily.destroy();
  const ctx=document.getElementById('dailyChart').getContext('2d');
  const dd={},sd2={};for(let i=0;i<FD.length;i++)dd[FD[i].date]=(dd[FD[i].date]||0)+FD[i].actualAmt;
  const yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  const yyD=AD.filter(function(r){return r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,''))});
  for(let i=0;i<yyD.length;i++)sd2[yyD[i].date]=(sd2[yyD[i].date]||0)+yyD[i].actualAmt;
  const ds=Object.keys(dd).concat(Object.keys(sd2));
  const ds2=[];for(let i=0;i<ds.length;i++){if(ds2.indexOf(ds[i])===-1)ds2.push(ds[i])}
  ds2.sort();
  C.daily=new Chart(ctx,{type:'line',data:{labels:ds2.map(function(d){return String(d).substring(4,6)+'/'+String(d).substring(6,8)}),datasets:[{label:'\u672c\u671f',data:ds2.map(function(d){return Math.round((dd[d]||0)/10000*10)/10}),borderColor:'#4361ee',backgroundColor:'rgba(67,97,238,.08)',fill:true,tension:.4,pointRadius:2,pointBackgroundColor:'#4361ee',borderWidth:2},{label:'\u540c\u6bd4',data:ds2.map(function(d){return Math.round((sd2[d]||0)/10000*10)/10}),borderColor:'#e2e8f0',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:1,borderWidth:1.5,borderDash:[4,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v*10000).toLocaleString()}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:8},maxTicksLimit:15}}}}});
}

function rCat(){
  if(C.cat)C.cat.destroy();
  const ctx=document.getElementById('catChart').getContext('2d');
  const cd={};for(let i=0;i<FD.length;i++)cd[FD[i].cat]=(cd[FD[i].cat]||0)+FD[i].actualAmt;
  const s=Object.entries(cd).sort(function(a,b){return b[1]-a[1]});
  const cCol={shoes:'#3a86ff',clothes:'#4361ee',accessories:'#06d6a0'};
  C.cat=new Chart(ctx,{type:'doughnut',data:{labels:s.map(function(k){return CAT_NAMES[k[0]]||k[0]}),datasets:[{data:s.map(function(v){return Math.round(v[1])}),backgroundColor:s.map(function(k){return cCol[k[0]]||'#4361ee'}),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.label+': ¥'+(ctx.raw/10000).toFixed(2)+'万'}}}},cutout:'55%'}});
}

function rYoy(){
  if(C.yoy)C.yoy.destroy();
  const ctx=document.getElementById('yoyChart').getContext('2d');
  const current=[];const yearAgo=[];
  const months=['03','04'];
  for(let mi=0;mi<months.length;mi++){
    const m=months[mi];
    const y=parseInt('2026'+m+'01'),ye=parseInt('2026'+m+'31');
    let cur=0;for(let i=0;i<AD.length;i++){const r=AD[i];if(r.date>=y&&r.date<=ye)cur+=r.actualAmt}
    current.push(Math.round(cur));
    const ly=parseInt('2025'+m+'01'),lye=parseInt('2025'+m+'31');
    let last=0;for(let i=0;i<AD.length;i++){const r=AD[i];if(r.date>=ly&&r.date<=lye)last+=r.actualAmt}
    yearAgo.push(Math.round(last));
  }
  C.yoy=new Chart(ctx,{type:'bar',data:{labels:['3月','4月'],datasets:[{label:'本期(2026)',data:current,backgroundColor:'#4361ee',borderRadius:4,barPercentage:.6},{label:'同比(2025)',data:yearAgo,backgroundColor:'#94a3b8',borderRadius:4,barPercentage:.6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+ctx.raw.toLocaleString('zh-CN')}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
}

function rStruct(){
  if(C.struct)C.struct.destroy();
  const ctx=document.getElementById('structChart').getContext('2d');
  const td={};for(let i=0;i<FD.length;i++)td[FD[i].type]=(td[FD[i].type]||0)+FD[i].actualAmt;
  const s=Object.entries(td).sort(function(a,b){return b[1]-a[1]});
  C.struct=new Chart(ctx,{type:'pie',data:{labels:s.map(function(k){return k[0]}),datasets:[{data:s.map(function(v){return Math.round(v[1])}),backgroundColor:['#4361ee','#06d6a0','#ff9f1c','#e71d36'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.label+': ¥'+(ctx.raw/10000).toFixed(2)+'万 ('+(ctx.parsed/(ctx.dataset.data.reduce(function(a,b){return a+b},0))*100).toFixed(1)+'%)'}}}}}});
}

function rTable(){
  const tbody=document.getElementById('tableBody');
  if(!FD.length){tbody.innerHTML='<tr><td colspan="11" class="text-center" style="color:#94a3b8;padding:30px">暂无数据</td></tr>';return;}
  var d=FD;d.sort(function(a,b){return b.date-a.date});
  d=d.slice(0,50);
  var html='';
  for(var i=0;i<d.length;i++){
    var r=d[i];
    var dt=String(r.date).substring(0,4)+'-'+String(r.date).substring(4,6)+'-'+String(r.date).substring(6,8);
    html+='<tr><td style="font-family:monospace;font-size:10px">'+r.docno+'</td><td>'+dt+'</td><td><span class="badge blue">'+r.storeName+'</span></td><td class="text-right">'+fmt(r.listAmt)+'</td><td class="text-right">'+fmt(r.actualAmt)+'</td><td class="text-right">'+fmt(r.cost)+'</td><td class="text-right">'+fmt(r.gross)+'</td><td class="text-center"><span class="badge '+(r.grossRate>=55?'green':'red')+'">'+r.grossRate+'%</span></td><td class="text-right">'+r.qty+'</td><td style="font-family:monospace;font-size:10px">'+r.prodName+'</td><td>'+(r.vip||'—')+'</td></tr>';
  }
  tbody.innerHTML=html;
}

window.addEventListener('DOMContentLoaded',function(){
  var sg=document.getElementById('storeCheckGroup');
  var storesSorted=STORES.slice();storesSorted.sort(function(a,b){return a[1].localeCompare(b[1])});
  for(var i=0;i<storesSorted.length;i++){
    var l=document.createElement('label');
    l.innerHTML='<input type="checkbox" value="'+storesSorted[i][0]+'" checked>'+storesSorted[i][1];
    sg.appendChild(l);
  }
  doQuery();
});
