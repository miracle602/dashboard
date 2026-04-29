// 学习小星球 - 主逻辑
var DB = {users:{}, mistakes:{}, exams:{}};
var CURRENT_USER = null;
var REVIEW_IDX = -1;

function load(){
  try{var d=localStorage.getItem('studybook');if(d)DB=JSON.parse(d);}catch(e){}
  if(!DB.users) DB.users={};
  if(!DB.mistakes) DB.mistakes={};
  if(!DB.exams) DB.exams={};
}
function save(){localStorage.setItem('studybook',JSON.stringify(DB));}
load();

// ===== 登录 =====
function doLogin(e){
  e.preventDefault();
  var u=document.getElementById('loginUser').value.trim();
  var p=document.getElementById('loginPass').value.trim();
  var err=document.getElementById('loginError');
  if(!u||!p){err.textContent='请输入用户名和密码';err.style.display='block';return false;}
  if(!DB.users[u]){err.textContent='用户不存在哦~';err.style.display='block';return false;}
  if(DB.users[u].pass!==p){err.textContent='密码不对哦~';err.style.display='block';return false;}
  CURRENT_USER=u;
  document.getElementById('loginPage').style.display='none';
  document.getElementById('mainApp').style.display='block';
  initApp();
  return false;
}

function showRegister(){document.getElementById('registerModal').classList.add('show');document.getElementById('regError').style.display='none';}
function hideRegister(){document.getElementById('registerModal').classList.remove('show');}

function doRegister(){
  var u=document.getElementById('regUser').value.trim();
  var p=document.getElementById('regPass').value.trim();
  var p2=document.getElementById('regPass2').value.trim();
  var err=document.getElementById('regError');
  if(!u||!p){err.textContent='用户名和密码不能空哦~';err.style.display='block';return;}
  if(p!==p2){err.textContent='两次密码不一致哦~';err.style.display='block';return;}
  if(p.length<4){err.textContent='密码至少4位哦~';err.style.display='block';return;}
  if(DB.users[u]){err.textContent='用户名已经被用啦~';err.style.display='block';return;}
  DB.users[u]={pass:p,created:Date.now()};
  save();
  hideRegister();
  alert('🎉 注册成功！用新账号登录吧~');
}

function doLogout(){
  if(!confirm('确定退出吗？'))return;
  CURRENT_USER=null;
  document.getElementById('mainApp').style.display='none';
  document.getElementById('loginPage').style.display='flex';
}

function initApp(){
  var u=CURRENT_USER;
  if(!DB.mistakes[u]) DB.mistakes[u]=[];
  if(!DB.exams[u]) DB.exams[u]=[];
  save();
  var h=new Date().getHours();
  document.getElementById('greetingText').textContent='🌟 '+(h<12?'早上好哦':'下午好哦')+'，'+u+'！';
  document.getElementById('settingName').textContent=u;
  document.getElementById('avatarLetter').textContent=u.charAt(0)||'🌟';
  switchPage('home');
}

// ===== 页面切换 =====
function switchPage(id){
  ['home','mistakes','exams','report','settings','addMistake','addExam'].forEach(function(p){
    var el=document.getElementById('page'+p.charAt(0).toUpperCase()+p.slice(1));
    if(el) el.classList.remove('active');
  });
  var target=document.getElementById('page'+id.charAt(0).toUpperCase()+id.slice(1));
  if(target) target.classList.add('active');
  document.querySelectorAll('.nav .item').forEach(function(el){el.classList.remove('active');});
  var navItem=document.querySelector('.nav .item[data-page="'+id+'"]');
  if(navItem) navItem.classList.add('active');
  document.getElementById('fabBtn').style.display=(['home','mistakes','exams','report','settings'].indexOf(id)>=0)?'block':'none';
  if(id==='home') renderHome();
  if(id==='mistakes') renderMistakes();
  if(id==='exams') renderExams();
  if(id==='report') renderReport();
}

function showQuickAdd(){
  if(confirm('要添加什么？\n确定→错题  取消→考试成绩')) switchPage('addMistake');
  else switchPage('addExam');
}

// ===== 首页 =====
function renderHome(){
  var u=CURRENT_USER, ms=DB.mistakes[u]||[], ex=DB.exams[u]||[];
  var grid=document.getElementById('trendGrid');
  grid.innerHTML='';
  ['语文','数学','英语'].forEach(function(s){
    var myEx=ex.filter(function(e){return e.subject===s;}).sort(function(a,b){return a.date>b.date?-1:1;});
    if(myEx.length===0) return;
    var last=myEx[0], prev=myEx[1];
    var chg='<span class="change">刚起步</span>';
    if(prev) chg=last.score>prev.score?'<span class="change up">↑'+(last.score-prev.score)+'</span>':'<span class="change down">↓'+(prev.score-last.score)+'</span>';
    grid.innerHTML+='<div class="trend-card"><div class="subject">'+s+'</div><div class="score">'+last.score+'</div>'+chg+'</div>';
  });
  if(grid.innerHTML==='') grid.innerHTML='<div class="empty">还没有成绩，去"我的"录入吧~</div>';

  var toReview=ms.filter(function(m){return !m.mastered;});
  document.getElementById('reviewCount').textContent='（还有 '+toReview.length+' 题）';
  var list=document.getElementById('homeReviewList');
  if(toReview.length===0){list.innerHTML='<div class="card" style="text-align:center;color:#94a3b8">🎉 全部掌握啦！</div>';return;}
  list.innerHTML='';
  toReview.slice(0,5).forEach(function(m){
    var idx=ms.indexOf(m);
    var sc=m.subject==='数学'?'math':m.subject==='语文'?'chinese':'english';
    list.innerHTML+='<div class="card mistake-item" onclick="openReview('+idx+')">'+
      '<div class="mi-top"><span class="mi-subject '+sc+'">'+m.subject+'</span><span class="badge review">待复习</span></div>'+
      '<div class="mi-question">'+(m.question||'📷 图片题')+'</div></div>';
  });
}

// ===== 错题列表 =====
function renderMistakes(){
  var ms=DB.mistakes[CURRENT_USER]||[];
  var list=document.getElementById('mistakeList');
  if(ms.length===0){list.innerHTML='<div class="empty">还没有错题哦，录入一道吧~</div>';return;}
  list.innerHTML='';
  ms.forEach(function(m,i){
    var sc=m.subject==='数学'?'math':m.subject==='语文'?'chinese':'english';
    list.innerHTML+='<div class="card mistake-item" onclick="openReview('+i+')">'+
      '<div class="mi-top"><span class="mi-subject '+sc+'">'+m.subject+'</span><span class="badge '+(m.mastered?'done':'review')+'">'+(m.mastered?'已掌握':'待复习')+'</span></div>'+
      '<div class="mi-question">'+(m.question||'📷 图片题')+'</div>'+
      '<div style="font-size:11px;color:#94a3b8;margin-top:4px">❌ '+m.reason+' | '+m.date+'</div></div>';
  });
}

// ===== 考试列表 =====
function renderExams(){
  var ex=DB.exams[CURRENT_USER]||[];
  var sub=document.getElementById('examSubjectFilter').value;
  var typ=document.getElementById('examTypeFilter').value;
  var list=document.getElementById('examList');
  var filtered=ex.filter(function(e){return (sub==='all'||e.subject===sub)&&(typ==='all'||e.type===typ);})
    .sort(function(a,b){return a.date>b.date?-1:1;});
  if(filtered.length===0){list.innerHTML='<div class="empty">没有符合条件的成绩记录</div>';return;}
  list.innerHTML='';
  filtered.forEach(function(e){
    var tc='qiuz';if(e.type==='模拟考试') tc='mock';if(e.type==='期中考试') tc='midterm';if(e.type==='期末考试') tc='final';
    list.innerHTML+='<div class="card exam-item"><div class="ei-top"><div><div style="font-weight:600;font-size:14px">'+e.subject+'</div><span class="ei-type '+tc+'">'+e.type+'</span></div><div class="ei-score" style="color:'+(e.score>=90?'#10b981':e.score>=80?'#f59e0b':'#ef4444')+'">'+e.score+'</div></div>'+
      '<div style="font-size:11px;color:#94a3b8;margin-top:4px">📅 '+e.date+(e.note?' | '+e.note:'')+'</div></div>';
  });
}

// ===== 报告 =====
function renderReport(){
  var ex=DB.exams[CURRENT_USER]||[];
  var ms=DB.mistakes[CURRENT_USER]||[];
  var el=document.getElementById('reportContent');
  
  // 各科平均分
  var subs=['语文','数学','英语'];
  var html='<div class="section-title" style="font-size:14px">📊 各科平均分</div>';
  subs.forEach(function(s){
    var fex=ex.filter(function(e){return e.subject===s;});
    if(fex.length===0){html+='<div class="card r-card"><div class="r-title">'+s+'</div><div class="r-body" style="color:#94a3b8">暂无数据</div></div>';return;}
    var avg=Math.round(fex.reduce(function(a,b){return a+b.score;},0)/fex.length);
    var colors={语文:'#ff8fab',数学:'#4cc9f0',英语:'#06d6a0'};
    html+='<div class="card r-card"><div class="r-title">'+s+'（共'+fex.length+'次）</div><div class="r-body"><b>'+avg+'分</b></div><div class="r-bar"><div class="fill" style="width:'+avg+'%;background:'+colors[s]+'"></div></div></div>';
  });

  // 错题统计
  html+='<div class="section-title" style="font-size:14px;margin-top:16px">❌ 错题分析</div>';
  var mastered=ms.filter(function(m){return m.mastered;}).length;
  var total=ms.length;
  html+='<div class="card r-card"><div class="r-title">掌握进度</div><div class="r-body">已掌握 '+mastered+'/'+total+' 题（'+Math.round(mastered/total*100||0)+'%）</div><div class="r-bar"><div class="fill" style="width:'+(mastered/total*100||0)+'%;background:#10b981"></div></div></div>';

  var reasons={};
  ms.forEach(function(m){if(!reasons[m.reason]) reasons[m.reason]=0;reasons[m.reason]++;});
  if(Object.keys(reasons).length>0){
    html+='<div class="card r-card"><div class="r-title">高频错误原因</div>';
    Object.keys(reasons).sort(function(a,b){return reasons[b]-reasons[a];}).slice(0,3).forEach(function(r){
      html+='<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #f1f5f9"><span>❌ '+r+'</span><span style="font-weight:700">'+reasons[r]+'次</span></div>';
    });
    html+='</div>';
  }

  // 进步/退步
  html+='<div class="section-title" style="font-size:14px;margin-top:16px">📈 进步榜</div>';
  subs.forEach(function(s){
    var fex=ex.filter(function(e){return e.subject===s;}).sort(function(a,b){return a.date>b.date?-1:1;});
    if(fex.length<2) return;
    var best=fex.reduce(function(a,b){return a.score>b.score?a:b;});
    var worst=fex.reduce(function(a,b){return a.score<b.score?a:b;});
    var last2=fex.slice(0,2);
    html+='<div class="card r-card"><div class="r-title">'+s+'</div><div class="r-body">最高 '+best.score+'分 · 最低 '+worst.score+'分 · '+
      (last2.length===2?(last2[0].score>last2[1].score?'📈 最近在进步':'📉 最近要加把劲'):'刚起步')+'</div></div>';
  });
  
  if(ex.length===0) html='<div class="empty">录入一些成绩和错题，报告就会自动生成啦~</div>';
  el.innerHTML=html;
}

// ===== 录入错题 =====
function previewPhoto(e){
  var file=e.target.files[0];
  if(!file) return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var p=document.getElementById('photoPreview');
    p.innerHTML='<img src="'+ev.target.result+'" style="max-height:120px;border-radius:10px;margin-top:6px">';
  };
  reader.readAsDataURL(file);
}

function addMistake(){
  var q=document.getElementById('amQuestion').value.trim();
  var a=document.getElementById('amAnswer').value.trim();
  var sub=document.getElementById('amSubject').value;
  var reason=document.getElementById('amReason').value;
  var photo='';
  var img=document.querySelector('#photoPreview img');
  if(img) photo=img.src;
  
  if(!q&&!photo&&!a){alert('至少要填题目或拍照哦~');return;}
  var ms=DB.mistakes[CURRENT_USER]||[];
  ms.unshift({
    subject:sub, question:q||'📷', answer:a, reason:reason,
    photo:photo, date:new Date().toLocaleDateString('zh-CN'),
    mastered:false, reviewCount:0, lastReview:null
  });
  DB.mistakes[CURRENT_USER]=ms;
  save();
  document.getElementById('amQuestion').value='';
  document.getElementById('amAnswer').value='';
  document.getElementById('amPhoto').value='';
  document.getElementById('photoPreview').innerHTML='';
  switchPage('mistakes');
}

// ===== 录入成绩 =====
function addExam(){
  var score=parseInt(document.getElementById('aeScore').value);
  if(isNaN(score)||score<0||score>100){alert('请输入0-100之间的分数哦~');return;}
  var sub=document.getElementById('aeSubject').value;
  var typ=document.getElementById('aeType').value;
  var date=document.getElementById('aeDate').value||new Date().toISOString().slice(0,10);
  var note=document.getElementById('aeNote').value.trim();
  var ex=DB.exams[CURRENT_USER]||[];
  ex.push({subject:sub, type:typ, score:score, date:date, note:note});
  DB.exams[CURRENT_USER]=ex;
  save();
  document.getElementById('aeScore').value='';
  document.getElementById('aeNote').value='';
  switchPage('exams');
}

// ===== 复习弹窗 =====
function openReview(idx){
  REVIEW_IDX=idx;
  var ms=DB.mistakes[CURRENT_USER];
  var m=ms[idx];
  document.getElementById('reviewQuestion').textContent=m.question||'📷 图片题';
  document.getElementById('reviewInput').value='';
  document.getElementById('reviewResult').style.display='none';
  document.getElementById('reviewOverlay').classList.add('show');
  setTimeout(function(){document.getElementById('reviewInput').focus();},200);
}

function markReview(done){
  var ms=DB.mistakes[CURRENT_USER];
  if(REVIEW_IDX>=0&&REVIEW_IDX<ms.length){
    if(done) ms[REVIEW_IDX].mastered=true;
    if(!ms[REVIEW_IDX].reviewCount) ms[REVIEW_IDX].reviewCount=0;
    ms[REVIEW_IDX].reviewCount++;
    ms[REVIEW_IDX].lastReview=Date.now();
    save();
  }
  document.getElementById('reviewOverlay').classList.remove('show');
  renderHome(); renderMistakes();
  REVIEW_IDX=-1;
}
function reviewCorrect(){markReview(true);}
function reviewWrong(){markReview(false);}

// 考试过滤变更
document.addEventListener('DOMContentLoaded',function(){
  ['examSubjectFilter','examTypeFilter'].forEach(function(id){
    document.getElementById(id).addEventListener('change',renderExams);
  });
});
