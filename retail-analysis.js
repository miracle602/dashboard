// ========== 门店数据 ==========
var STORES=[[206,'NO ONE ELSE同德'],[204,'NO ONE ELSE顺城'],[202,'CHUU同德'],[200,'CHUU七彩云南'],[203,'CHUU金鹰'],[205,'NO ONE ELSE万象城'],[201,'CHUU万象城'],[15,'北市区和谐店'],[14,'同德广场店'],[7,'呈贡奥斯迪'],[17,'官渡环南路'],[16,'双桥福德路'],[22,'呈贡步行街'],[192,'同德2号店'],[220,'同德4号店'],[240,'昆明一店'],[349,'小板桥分店'],[361,'曲靖分店3'],[210,'会泽1店'],[301,'安宁服装店']];
var SM={};for(var i=0;i<STORES.length;i++)SM[STORES[i][0]]=STORES[i][1];

var GROSS_RATE=0.55;

// 款号-品牌映射（品牌ID: DIM_ID）
var BRAND_MAP={DIMID2:'CHUU',DIMID3:'NO ONE ELSE',DIMID4:'其他'};
// 款号-品牌(模拟)
var PROD_BRAND={};
var BRAND_PRODS={'all':[],'2':[],'3':[],'4':[]};
var ALL_PRODS=[];

// 款号-季节映射(模拟)
var PROD_SEASON={};
var SEASON_KEYS=['春夏','秋冬','春季','夏季','秋季','冬季'];

// 款号定价
var PRICE_MAP={};
var PRICES=[
  [399,'WX1YXT6278'],[199,'WX1ZCM0001'],[499,'WX1ZCB0002'],[373,'WX2WHX362'],[3281,'WQ1WHX889'],
  [259,'WX2YHT123'],[459,'WX2YHT456'],[359,'WX2YHT789'],[159,'WX2ZCM100'],[129,'WX2ZCM200'],
  [329,'WX3YHT001'],[599,'WX3YHT002'],[289,'WX3YHT003'],[189,'WX3ZCM001'],[899,'WX4YHT001'],
  [349,'WX4YHT002'],[149,'WX4ZCM001'],[699,'WX5YHT001'],[329,'WX5YHT002'],[259,'WX5ZCM001'],
  [279,'WX6YHT001'],[319,'WX6YHT002'],[399,'WX6ZCM001'],[299,'WX7YHT001'],[269,'WX7YHT002'],
  [499,'WX8YHT001'],[159,'WX8YHT002'],[299,'WX8ZCM001'],[389,'WX9YHT001'],[429,'WX9YHT002'],
  [199,'WX9YHT003'],[89,'WX9ZCM001'],[339,'WX0YHT001'],[259,'WX0YHT002'],[129,'WX0ZCM001'],
  [799,'WX1YHT001'],[359,'WX1YHT002'],[119,'WX1ZCM002'],[169,'WX2YHT003'],[69,'WX2ZCM003'],
  [459,'WX3YHT004'],[99,'WX3ZCM002'],[999,'WX4YHT003'],[159,'WX4ZCM002'],[229,'WX5YHT003'],[89,'WX5ZCM002']
];
for(var i=0;i<PRICES.length;i++){PRICE_MAP[PRICES[i][1]]=PRICES[i][0];ALL_PRODS.push(PRICES[i][1]);}

// 分配品牌和季节
var seasons=['春夏','秋冬','春夏','春夏','夏季','春夏','秋冬','春季','夏季','春季','秋季','冬季'];
for(var i=0;i<ALL_PRODS.length;i++){
  var p=ALL_PRODS[i];
  var b=i<28?'2':(i<38?'3':'4');
  PROD_BRAND[p]=b;
  var s=seasons[i%seasons.length];
  PROD_SEASON[p]=s;
  BRAND_PRODS[b].push(p);
  BRAND_PRODS['all'].push(p);
}

var CAT_NAMES={shoes:'鞋类',clothes:'服装',accessories:'配饰'};
var CAT_OF={};
var SHOES=['WX2WHX362','WQ1WHX889'];
var CLOTHES=[];var ACCS=[];
for(var i=0;i<ALL_PRODS.length;i++){
  var p=ALL_PRODS[i];
  if(SHOES.indexOf(p)>=0){CAT_OF[p]='shoes';}
  else if(p.indexOf('ZCM')>=0||p.indexOf('ZCB')>=0||p.indexOf('ZCB')>=0){CAT_OF[p]='accessories';}
  else{CAT_OF[p]='clothes';}
  if(CAT_OF[p]==='shoes')SHOES.push(p);
  else if(CAT_OF[p]==='clothes')CLOTHES.push(p);
  else ACCS.push(p);
}

// ========== 生成模拟数据 ==========
var C={};
var AD=[];
var FD=[];

function genData(){
  var d=[];
  var oid=10001;
  var endDate=new Date(2026,3,27);
  var startDate=new Date(2025,0,1);
  for(var dt=new Date(startDate);dt<=endDate;dt.setDate(dt.getDate()+1)){
    var Y=dt.getFullYear(),M=dt.getMonth()+1,D=dt.getDate();
    var ds=String(Y)+String(M).padStart(2,'0')+String(D).padStart(2,'0');
    var wd=dt.getDay();
    var base=wd===0?4:wd===6?6:2;
    var n=base+Math.floor(Math.random()*4);
    for(var i=0;i<Math.floor(n)&&oid<30000;i++){
      var storeIdx=Math.floor(Math.random()*STORES.length);
      var sid=STORES[storeIdx][0];
      var pi=Math.floor(Math.random()*ALL_PRODS.length);
      var pn=ALL_PRODS[pi];
      var lp=PRICE_MAP[pn]||299;
      var dr=0.55+Math.random()*0.4;
      var ap=Math.round(lp*dr);
      var q=1+Math.floor(Math.random()*(wd===0||wd===6?4:2));
      var ta=ap*q;
      var co=Math.round(ta*(1-GROSS_RATE));
      var brandId=PROD_BRAND[pn];
      var season=PROD_SEASON[pn];
      d.push({
        id:oid++,
        docno:'RC'+ds.substring(2)+String(oid).padStart(6,'0'),
        date:parseInt(ds),
        storeId:sid,
        storeName:SM[sid],
        prodName:pn,
        brand:brandId,
        season:season,
        cat:CAT_OF[pn]||'clothes',
        qty:q,
        listAmt:lp*q,
        actualAmt:ta,
        cost:co,
        gross:ta-co,
        grossRate:Math.round((ta-co)/ta*100),
        vip:Math.random()>0.5?'VIP'+String(1000+Math.floor(Math.random()*900)):'',
        type:Math.random()>0.8?'团购':'正常'
      });
    }
  }
  return d;
}

function fmt(v){return'¥'+v.toLocaleString('zh-CN')}
function gd(s){return parseInt(s.replace(/-/g,''))}

function doQuery(){
  document.getElementById('updateTime').textContent='⏱ 查询中...';
  var sn=gd(document.getElementById('startDate').value);
  var en=gd(document.getElementById('endDate').value);
  
  // 品牌
  var brand=document.getElementById('brandSelect').value;
  
  // 款号
  var styleNo=document.getElementById('styleNo').value.trim();
  
  // 年份多选
  var years=new Set();
  var yearCbs=document.querySelectorAll('#yearGroup input:checked');
  for(var i=0;i<yearCbs.length;i++)years.add(yearCbs[i].value);
  
  // 季节多选
  var seasons2=new Set();
  var seasonCbs=document.querySelectorAll('.season-cb:checked');
  for(var i=0;i<seasonCbs.length;i++)seasons2.add(seasonCbs[i].value);
  
  // 门店
  var stores=new Set();
  var storeCbs=document.querySelectorAll('#storeGroup input:checked');
  for(var i=0;i<storeCbs.length;i++)stores.add(parseInt(storeCbs[i].value));
  
  FD=AD.filter(function(r){
    if(r.date<sn||r.date>en)return false;
    if(brand!=='all'&&r.brand!==brand)return false;
    if(styleNo&&r.prodName.indexOf(styleNo)<0)return false;
    var yr=String(r.date).substring(0,4);
    if(years.size>0&&!years.has(yr))return false;
    if(seasons2.size>0&&!seasons2.has(r.season))return false;
    if(stores.size>0&&!stores.has(r.storeId))return false;
    return true;
  });
  
  document.getElementById('updateTime').textContent='⏱ '+(new Date()).toLocaleString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  renderAll();
}

function toggleAllSeason(sel){
  var cbs=document.querySelectorAll('.season-cb');
  for(var i=0;i<cbs.length;i++)cbs[i].checked=sel;
  doQuery();
}

function toggleAllStores(sel){
  var cbs=document.querySelectorAll('#storeGroup input[type=checkbox]');
  for(var i=0;i<cbs.length;i++)cbs[i].checked=sel;
  doQuery();
}

function resetQuery(){
  document.getElementById('startDate').value='2026-01-01';
  document.getElementById('endDate').value='2026-04-27';
  document.getElementById('brandSelect').value='all';
  document.getElementById('styleNo').value='';
  var ycbs=document.querySelectorAll('#yearGroup input[type=checkbox]');
  for(var i=0;i<ycbs.length;i++)ycbs[i].checked=(ycbs[i].value==='2026'||ycbs[i].value==='2025');
  var scbs=document.querySelectorAll('.season-cb');
  for(var i=0;i<scbs.length;i++)scbs[i].checked=false;
  var scbs2=document.querySelectorAll('#storeGroup input[type=checkbox]');
  for(var i=0;i<scbs2.length;i++)scbs2[i].checked=true;
  doQuery();
}

function renderAll(){rKPI();rTrend();rStore();rProfit();rDaily();rCat();rYoy();rStruct();rTable();}

// ========== KPI ==========
function rKPI(){
  var g=document.getElementById('kpiGrid');
  if(!FD.length){g.innerHTML='<div class="kpi-card"><div class="label">暂无</div><div class="val">—</div></div>'.repeat(6);return;}
  var a=0,la=0,c=0,q=0,ss={},vs={};
  for(var i=0;i<FD.length;i++){var r=FD[i];a+=r.actualAmt;la+=r.listAmt;c+=r.cost;q+=r.qty;ss[r.storeId]=1;if(r.vip)vs[r.vip]=1;}
  var sc=Object.keys(ss).length,vc=Object.keys(vs).length;
  var gr=a>0?((a-c)/a*100).toFixed(1):0;
  var sy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  var ssAmt=0;
  for(var i=0;i<AD.length;i++){var r=AD[i];if(r.date>=gd(sy+document.getElementById('startDate').value.substring(4))&&r.date<=gd(sy+document.getElementById('endDate').value.substring(4)))ssAmt+=r.actualAmt;}
  var yoy=ssAmt>0?((a-ssAmt)/ssAmt*100).toFixed(1):0;
  var cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  var pm=cm===1?12:cm-1,py=cm===1?cy-1:cy;
  var pmAmt=0;
  for(var i=0;i<AD.length;i++){var r=AD[i];if(r.date>=gd(py+'-'+String(pm).padStart(2,'0')+'-01')&&r.date<gd(document.getElementById('startDate').value))pmAmt+=r.actualAmt;}
  var mom=pmAmt>0?((a-pmAmt)/pmAmt*100).toFixed(1):0;
  g.innerHTML='<div class="kpi-card"><div class="label">💰 成交金额</div><div class="val">'+fmt(a)+'</div><div class="subrow"><span class="'+(yoy>=0?'up':'down')+'">同'+(yoy>=0?'↑':'↓')+Math.abs(yoy)+'%</span><span class="'+(mom>=0?'up':'down')+'">环'+(mom>=0?'↑':'↓')+Math.abs(mom)+'%</span></div></div><div class="kpi-card"><div class="label">📊 毛利率</div><div class="val">'+gr+'%</div><div class="subrow"><span class="info">毛利'+fmt(a-c)+'</span><span class="info">成本'+fmt(c)+'</span></div></div><div class="kpi-card"><div class="label">📦 总销量</div><div class="val">'+q.toLocaleString()+'</div><div class="subrow"><span class="info">'+FD.length+'笔订单</span></div></div><div class="kpi-card"><div class="label">🏬 活跃门店</div><div class="val">'+sc+'</div><div class="subrow"><span class="info">'+vc+'位会员</span></div></div><div class="kpi-card"><div class="label">📈 客单价</div><div class="val">¥'+(FD.length>0?(a/FD.length).toFixed(0):0)+'</div><div class="subrow"><span class="info">折扣率'+(a/la*100).toFixed(0)+'%</span></div></div><div class="kpi-card"><div class="label">🔄 同比/环比</div><div class="val'+(yoy>=0?' up':' down')+'" style="font-size:18px">同'+(yoy>=0?'↑':'↓')+Math.abs(yoy)+'%</div><div class="subrow"><span class="'+(mom>=0?'up':'down')+'">环'+(mom>=0?'↑':'↓')+Math.abs(mom)+'%</span><span class="info">同期¥'+(ssAmt/10000).toFixed(1)+'万</span></div></div>';
}

// ========== 月度趋势 ==========
function rTrend(){
  if(C.trend)C.trend.destroy();
  var ctx=document.getElementById('trendChart').getContext('2d');
  var md={},sd2={},pd2={};
  for(var i=0;i<FD.length;i++){var m=String(FD[i].date).substring(0,6);md[m]=(md[m]||0)+FD[i].actualAmt;}
  var yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  var yyS=AD.filter(function(r){return r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,''))});
  for(var i=0;i<yyS.length;i++){var m=String(yyS[i].date).substring(0,6);sd2[m]=(sd2[m]||0)+yyS[i].actualAmt;}
  var cm=parseInt(document.getElementById('startDate').value.substring(5,7)),cy=parseInt(document.getElementById('startDate').value.substring(0,4));
  var _pm=cm===1?12:cm-1,_py=cm===1?cy-1:cy;
  var pDat=AD.filter(function(r){return r.date>=parseInt(String(_py)+String(_pm).padStart(2,'0')+'01')&&r.date<parseInt(document.getElementById('startDate').value.replace(/-/g,''))});
  for(var i=0;i<pDat.length;i++){var m=String(pDat[i].date).substring(0,6);pd2[m]=(pd2[m]||0)+pDat[i].actualAmt;}
  var ms=Object.keys(md).concat(Object.keys(sd2)).concat(Object.keys(pd2));
  var ms2=[];for(var i=0;i<ms.length;i++){if(ms2.indexOf(ms[i])===-1)ms2.push(ms[i])}
  ms2.sort();
  C.trend=new Chart(ctx,{type:'bar',data:{labels:ms2.map(function(m){return m.substring(0,4)+'.'+m.substring(4,6)}),datasets:[{label:'本期',data:ms2.map(function(m){return Math.round((md[m]||0)/10000*10)/10}),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.5},{label:'同比(去年)',data:ms2.map(function(m){return Math.round((sd2[m]||0)/10000*10)/10}),backgroundColor:'#94a3b8',borderRadius:3,barPercentage:.5},{label:'环比(上月)',data:ms2.map(function(m){return Math.round((pd2[m]||0)/10000*10)/10}),backgroundColor:'rgba(46,196,182,.6)',borderRadius:3,barPercentage:.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v*10000).toLocaleString()}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

// ========== 门店排行 ==========
function rStore(){
  if(C.store)C.store.destroy();
  var ctx=document.getElementById('storeChart').getContext('2d');
  var sd3={};for(var i=0;i<FD.length;i++)sd3[FD[i].storeName]=(sd3[FD[i].storeName]||0)+FD[i].actualAmt;
  var s=Object.entries(sd3).sort(function(a,b){return b[1]-a[1]}).slice(0,15);
  var colors=['#4361ee','#3a86ff','#8338ec','#ff006e','#fb5607','#ff9f1c','#06d6a0','#118ab2','#7209b7','#f72585','#4cc9f0','#4895ef','#560bad','#a2d2ff','#bde0fe'];
  C.store=new Chart(ctx,{type:'bar',data:{labels:s.map(function(n){return n[0].length>8?n[0].substring(0,8)+'…':n[0]}),datasets:[{label:'成交金额',data:s.map(function(v){return Math.round(v[1])}),backgroundColor:s.map(function(_,i){return colors[i%colors.length]}),borderRadius:3,barPercentage:.7}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return'¥'+ctx.raw.toLocaleString('zh-CN')}}}},scales:{x:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{color:'rgba(0,0,0,.04)'}},y:{grid:{display:false},ticks:{font:{size:9}}}}}});
}

// ========== 毛利率 ==========
function rProfit(){
  if(C.profit)C.profit.destroy();
  var ctx=document.getElementById('profitChart').getContext('2d');
  var sd4={},sc4={};
  for(var i=0;i<FD.length;i++){sd4[FD[i].storeName]=(sd4[FD[i].storeName]||0)+FD[i].actualAmt;sc4[FD[i].storeName]=(sc4[FD[i].storeName]||0)+FD[i].cost;}
  var s=Object.entries(sd4).sort(function(a,b){return b[1]-a[1]}).slice(0,12);
  C.profit=new Chart(ctx,{type:'bar',data:{labels:s.map(function(n){return n[0].length>6?n[0].substring(0,6)+'…':n[0]}),datasets:[{label:'毛利率%',data:s.map(function(n){var t=sd4[n[0]],c2=sc4[n[0]];return t>0?Math.round((t-c2)/t*100):0}),backgroundColor:'#4361ee',borderRadius:3,barPercentage:.7,yAxisID:'y'},{label:'毛利额',data:s.map(function(n){return Math.round((sd4[n[0]]||0)-(sc4[n[0]]||0))}),backgroundColor:'rgba(46,196,182,.5)',borderRadius:3,barPercentage:.7,yAxisID:'y1'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9},boxWidth:10,padding:6}}},scales:{y:{beginAtZero:true,max:100,ticks:{callback:function(v){return v+'%'}},grid:{color:'rgba(0,0,0,.04)'}},y1:{position:'right',beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{display:false}},x:{grid:{display:false},ticks:{font:{size:8}}}}}});
}

// ========== 每日趋势 ==========
function rDaily(){
  if(C.daily)C.daily.destroy();
  var ctx=document.getElementById('dailyChart').getContext('2d');
  var dd={},sd5={};
  for(var i=0;i<FD.length;i++)dd[FD[i].date]=(dd[FD[i].date]||0)+FD[i].actualAmt;
  var yy=parseInt(document.getElementById('startDate').value.substring(0,4))-1;
  var yyD=AD.filter(function(r){return r.date>=parseInt(yy+document.getElementById('startDate').value.substring(4).replace(/-/g,''))&&r.date<=parseInt(yy+document.getElementById('endDate').value.substring(4).replace(/-/g,''))});
  for(var i=0;i<yyD.length;i++)sd5[yyD[i].date]=(sd5[yyD[i].date]||0)+yyD[i].actualAmt;
  var ds=Object.keys(dd).concat(Object.keys(sd5));
  var ds2=[];for(var i=0;i<ds.length;i++){if(ds2.indexOf(ds[i])===-1)ds2.push(ds[i])}
  ds2.sort();
  C.daily=new Chart(ctx,{type:'line',data:{labels:ds2.map(function(d){return String(d).substring(4,6)+'/'+String(d).substring(6,8)}),datasets:[{label:'本期',data:ds2.map(function(d){return Math.round((dd[d]||0)/10000*10)/10}),borderColor:'#4361ee',backgroundColor:'rgba(67,97,238,.08)',fill:true,tension:.4,pointRadius:2,pointBackgroundColor:'#4361ee',borderWidth:2},{label:'同比',data:ds2.map(function(d){return Math.round((sd5[d]||0)/10000*10)/10}),borderColor:'#e2e8f0',backgroundColor:'transparent',fill:false,tension:.4,pointRadius:1,borderWidth:1.5,borderDash:[4,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+(ctx.raw*10000).toLocaleString()}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v*10000).toLocaleString()}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:8},maxTicksLimit:15}}}}});
}

// ========== 品类占比 ==========
function rCat(){
  if(C.cat)C.cat.destroy();
  var ctx=document.getElementById('catChart').getContext('2d');
  var cd={};
  for(var i=0;i<FD.length;i++)cd[FD[i].cat]=(cd[FD[i].cat]||0)+FD[i].actualAmt;
  var s=Object.entries(cd).sort(function(a,b){return b[1]-a[1]});
  var cCol={shoes:'#3a86ff',clothes:'#4361ee',accessories:'#06d6a0'};
  C.cat=new Chart(ctx,{type:'doughnut',data:{labels:s.map(function(k){return CAT_NAMES[k[0]]||k[0]}),datasets:[{data:s.map(function(v){return Math.round(v[1])}),backgroundColor:s.map(function(k){return cCol[k[0]]||'#4361ee'}),borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.label+': ¥'+(ctx.raw/10000).toFixed(2)+'万'}}}},cutout:'55%'}});
}

// ========== 同环比 ==========
function rYoy(){
  if(C.yoy)C.yoy.destroy();
  var ctx=document.getElementById('yoyChart').getContext('2d');
  var current=[];var yearAgo=[];
  var months=['01','02','03','04'];
  for(var mi=0;mi<months.length;mi++){
    var m=months[mi];
    var y=parseInt('2026'+m+'01'),ye=parseInt('2026'+m+'31');
    var cur=0;for(var i=0;i<AD.length;i++){var r=AD[i];if(r.date>=y&&r.date<=ye)cur+=r.actualAmt;}
    current.push(Math.round(cur));
    var ly=parseInt('2025'+m+'01'),lye=parseInt('2025'+m+'31');
    var last=0;for(var i=0;i<AD.length;i++){var r=AD[i];if(r.date>=ly&&r.date<=lye)last+=r.actualAmt;}
    yearAgo.push(Math.round(last));
  }
  C.yoy=new Chart(ctx,{type:'bar',data:{labels:['1月','2月','3月','4月'],datasets:[{label:'本期(2026)',data:current,backgroundColor:'#4361ee',borderRadius:4,barPercentage:.6},{label:'同比(2025)',data:yearAgo,backgroundColor:'#94a3b8',borderRadius:4,barPercentage:.6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+': ¥'+ctx.raw.toLocaleString('zh-CN')}}}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return'¥'+(v/10000).toFixed(1)+'万'}},grid:{color:'rgba(0,0,0,.04)'}},x:{grid:{display:false},ticks:{font:{size:11}}}}}});
}

// ========== 结构 ==========
function rStruct(){
  if(C.struct)C.struct.destroy();
  var ctx=document.getElementById('structChart').getContext('2d');
  var td={};
  for(var i=0;i<FD.length;i++)td[FD[i].type]=(td[FD[i].type]||0)+FD[i].actualAmt;
  var s=Object.entries(td).sort(function(a,b){return b[1]-a[1]});
  C.struct=new Chart(ctx,{type:'pie',data:{labels:s.map(function(k){return k[0]}),datasets:[{data:s.map(function(v){return Math.round(v[1])}),backgroundColor:['#4361ee','#06d6a0','#ff9f1c','#e71d36'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}},tooltip:{callbacks:{label:function(ctx){var total=ctx.dataset.data.reduce(function(a,b){return a+b},0);return ctx.label+': ¥'+(ctx.raw/10000).toFixed(2)+'万 ('+(ctx.parsed/total*100).toFixed(1)+'%)'}}}}}});
}

// ========== 表格 ==========
function rTable(){
  var tbody=document.getElementById('tableBody');
  if(!FD.length){tbody.innerHTML='<tr><td colspan="11" class="text-center" style="color:#94a3b8;padding:30px">暂无数据</td></tr>';return;}
  var d=FD.slice();
  d.sort(function(a,b){return b.id-a.id});
  d=d.slice(0,50);
  var html='';
  for(var i=0;i<d.length;i++){
    var r=d[i];
    var dt=String(r.date).substring(0,4)+'-'+String(r.date).substring(4,6)+'-'+String(r.date).substring(6,8);
    html+='<tr><td style="font-family:monospace;font-size:10px">'+r.docno+'</td><td>'+dt+'</td><td><span class="badge blue">'+r.storeName+'</span></td><td class="text-right">'+fmt(r.listAmt)+'</td><td class="text-right">'+fmt(r.actualAmt)+'</td><td class="text-right">'+fmt(r.cost)+'</td><td class="text-right">'+fmt(r.gross)+'</td><td class="text-center"><span class="badge '+(r.grossRate>=55?'green':'red')+'">'+r.grossRate+'%</span></td><td class="text-right">'+r.qty+'</td><td style="font-family:monospace;font-size:10px">'+r.prodName+'</td><td>'+(r.vip||'—')+'</td></tr>';
  }
  tbody.innerHTML=html;
}

// 初始化
window.addEventListener('DOMContentLoaded',function(){
  // 门店多选
  var sg=document.getElementById('storeGroup');
  var storesSorted=STORES.slice();
  storesSorted.sort(function(a,b){return a[1].localeCompare(b[1])});
  for(var i=0;i<storesSorted.length;i++){
    var l=document.createElement('label');
    l.innerHTML='<input type="checkbox" value="'+storesSorted[i][0]+'" checked>'+storesSorted[i][1];
    sg.appendChild(l);
  }
  // 生成数据
  AD=genData();
  FD=AD;
  document.getElementById('footerTime').textContent=(new Date()).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  doQuery();
});
