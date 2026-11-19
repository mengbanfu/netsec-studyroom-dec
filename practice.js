const isJudge=q=>q.type==='判断';
const rubric=q=>isJudge(q)?[{weight:1,label:'我的理由指出了解析中的关键条件'}]:(RUBRICS[q.id]||[]);
function emptyDraft(){return {choices:[],text:'',checks:[],stage:'edit'}}
function draft(q,exam=false){const store=exam?S.exam.answers:S.drafts;return store[q.id] ||= emptyDraft()}
function objective(q,d){if(!q.options.length)return 0;const selected=d.choices.slice().sort().join('');return selected===q.key?(isJudge(q)?1:q.pts):0}
function selfscore(q,d){return rubric(q).reduce((s,pt,i)=>s+(d.checks.includes(i)?pt.weight:0),0)}
function markWrong(q){S.mistakes[q.id] ||= {due:tomorrow(),last:'',corrected:false}}
function complete(q,d,forceExam=false){
 const auto=objective(q,d),self=selfscore(q,d),score=auto+self,previous=baseRec(q.id),stamp=today(),mist=S.mistakes[q.id];
 const retest=!!mist&&stamp>=mist.due;const entry={date:stamp,auto,self,score,mode:forceExam?'模拟':retest?'隔天重测':previous.length?'订正':'首轮'};
 (S.records[q.id]||=[]).push(entry);d.stage='done';
 if(score<q.pts){markWrong(q);Object.assign(S.mistakes[q.id],{corrected:false,due:tomorrow(),last:stamp})}
 else if(mist){if(retest)delete S.mistakes[q.id];else Object.assign(mist,{corrected:true,last:stamp})}
}
function opts(q,d,prefix,locked){const multi=q.type==='多选';return q.options.map((s,i)=>{const k='ABCD'[i];return `<label class="option"><input type="${multi?'checkbox':'radio'}" name="${prefix}${q.id}" data-choice="${q.id}" value="${k}" ${d.choices.includes(k)?'checked':''} ${locked?'disabled':''}><span>${isJudge(q)?'':`<b>${k}.</b> `}${esc(s)}</span></label>`}).join('')}
function question(q,n,examMode=false){
 const d=draft(q,examMode),exDone=examMode&&S.exam.status==='done',running=examMode&&!exDone;
 const lock=running?false:(d.stage!=='edit'||exDone),show=!running&&(d.stage==='grade'||d.stage==='done'||exDone);
 const pts=rubric(q),record=baseRec(q.id),source=q.id.startsWith('e')?'模拟卷':'第 '+q.id.match(/c(\d+)/)[1]+' 章';
 const note=q.type==='多选'?' · 全部选对计分':'';
 const input=(isJudge(q)||!q.options.length)?`<label class="field" for="w-${q.id}">${isJudge(q)?'判断依据':'我的作答'}</label><textarea id="w-${q.id}" data-write="${q.id}" ${lock?'readonly':''} placeholder="先用自己的话写下理由或步骤">${esc(d.text)}</textarea>`:'';
 const refs=show?`<div class="answerBox"><b>${q.key?'参考答案　'+(isJudge(q)?'错误':q.key):'参考答案与得分依据'}</b><div class="written">${esc(q.ref)}</div></div>`:'';
 const criteria=show&&pts.length?`<div><b>逐项自评</b><small>　勾选自己原答案已写出的要点</small>${pts.map((r,i)=>`<label class="rubric"><input type="checkbox" data-rubric="${q.id}" value="${i}" ${d.checks.includes(i)?'checked':''} ${d.stage==='done'?'disabled':''}> ${esc(r.label)}（${r.weight} 分）</label>`).join('')}</div>`:'';
 const score=d.stage==='done'&&show?`<div class="tip"><b>本次 ${objective(q,d)+selfscore(q,d)} / ${q.pts} 分</b>　客观 ${objective(q,d)} · 自评 ${selfscore(q,d)}${!examMode&&record.length?`<br><small>首次 ${record[0].score} 分 · 最近${record.at(-1).mode} ${record.at(-1).score} 分</small>`:''}</div>`:'';
 let actions='';
 if(!running){
  if(!lock)actions=btn('提交作答','qsubmit',q.id,'primary');
  if(show&&d.stage!=='done'&&pts.length)actions=btn('保存自评分','grade',q.id,'primary');
  if(!examMode&&d.stage==='done')actions+=btn('重新闭卷作答','redo',q.id);
  if(!examMode||exDone)actions+=btn(S.mistakes[q.id]?'已加入错题本':'标记没把握','flag',q.id,'mini');
 }
 return `<section class="question" id="item-${q.id}"><span class="qLabel">${source} · 第 ${n} 题 · ${q.type} · ${q.pts} 分${note}</span><h3>${esc(q.body)}</h3>${opts(q,d,examMode?'exam':'study',lock)}${input}${refs}${criteria}${score}<div class="actions">${actions}</div></section>`;
}
function freshExam(){const start=Date.now();return {status:'running',start,end:start+90*60000,answers:{},submitted:0}}
function finishExam(){
 const ex=S.exam;if(!ex||ex.status!=='running')return;ex.status='done';ex.submitted=Date.now();
 for(const q of G.exam){const d=draft(q,true);if(!rubric(q).length||!d.text.trim())complete(q,d,true);else d.stage='grade'}save()
}
function expire(){if(S.exam?.status==='running'&&Date.now()>=S.exam.end){finishExam();return true}return false}
function timeLeft(){const s=Math.max(0,Math.ceil((S.exam.end-Date.now())/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function examSums(ex){const out=[0,0,0];G.exam.forEach((q,i)=>{const d=ex.answers[q.id];if(d?.stage==='done')out[i<12?0:i<18?1:2]+=objective(q,d)+selfscore(q,d)});return out}
function examPage(){const ex=S.exam;const head=pageTitle('限时模拟卷','自编训练卷 · 90 分钟 · 100 分。正式考试的时长和分值以老师通知为准。');
 if(!ex)return `${head}<div class="box"><h2>给自己留一段完整的时间</h2><p>12 道选择（24 分）、6 道简答（36 分）、2 道设计（40 分）。开始后持续计时，刷新或暂时离开都可恢复草稿。到时自动交卷。</p>${btn('开始 90 分钟模拟','examstart','','primary')}</div>`;
 const running=ex.status==='running',scores=examSums(ex),pending=G.exam.filter(q=>draft(q,true).stage==='grade').length;
 return `${head}<div class="toolbar"><div class="spread">${running?`<span>剩余时间　<strong class="clock" id="clock">${timeLeft()}</strong></span>${btn('交卷并查看解析','handin','','primary')}`:`<b>${pending?'已确认':'总分'} ${scores.reduce((a,b)=>a+b,0)} / 100 分</b><span>选择 ${scores[0]}/24 · 简答 ${scores[1]}/36 · 设计 ${scores[2]}/40</span>`}</div>${running?'':`<small>${pending?'还有 '+pending+' 道主观题待逐项自评。':'评分已完成。'}</small>`}</div><div class="actions examLinks">${G.exam.map((q,i)=>btn(String(i+1),'scroll',q.id,'mini')).join('')}</div>${G.exam.map((q,i)=>question(q,i+1,true)).join('')}${running?btn('交卷并查看解析','handin','','primary'):btn('保留本次记录，重新模拟','restart')}${S.archives.length?`<details class="day"><summary>历史模拟（${S.archives.length} 次）</summary>${S.archives.map(e=>`<p>${today(new Date(e.submitted))} · ${examSums(e).join(' + ')} 分</p>`).join('')}</details>`:''}`;
}
function reviewPage(id){
 if(id&&qmap[id]){const q=qmap[id];return `${pageTitle('错题重测')}<p>${A('review','返回错题本','textBtn')}</p>${question(q,q.id.match(/\d+$/)[0])}`}
 const list=Object.entries(S.mistakes).sort((a,b)=>a[1].due.localeCompare(b[1].due));
 return `${pageTitle('错题重测','答错或标记没把握的题会出现在这里。当日订正后保留题目，隔天闭卷得满分后移出。')}<div class="box"><h2>今天应重测 ${getDue().length} 题</h2>${list.length?list.map(([id,m])=>{const q=qmap[id],a=baseRec(id);return `<div class="record"><div class="spread"><b>${id.startsWith('e')?'模拟卷':'第 '+id.match(/c(\d+)/)[1]+' 章'} · ${q.type}</b><span class="pill">${m.due<=today()?'今日应重测':m.corrected?'已订正 · 待隔天重测':'计划 '+m.due}</span></div><p>${esc(q.body)}</p><small>${a.length?'首次 '+a[0].score+' / '+q.pts+' 分　最近'+a.at(-1).mode+' '+a.at(-1).score+' 分':'已标记，尚无评分'}</small><div class="actions">${btn('闭卷重做','reviewQ',id,'primary')}</div></div>`}).join(''):'<p>错题本还是空的。做完一道题，系统会把失分题放到这里；你也可以主动标记。</p>'+A('chapters','去做章末题','btn primary')}</div>`;
}
function backupPage(){return `${pageTitle('进度备份','进度保存在当前设备的浏览器内。换设备前导出文件，再在新设备导入。')}<div class="box"><h2>我的学习记录</h2><p>包含章节位置、作答草稿、错题、互动推演和模拟卷记录。${storageWarn?'当前浏览器未能写入本地存储，请及时导出。':''}</p><div class="actions">${btn('导出进度文件','export','','primary')}<label class="btn">导入进度文件<input style="max-width:165px" type="file" id="import" accept=".json,application/json"></label></div><p class="meta">导入前会提示确认替换。录音保留在你选取文件的设备上。</p></div>`}
function normalize(raw){
 const bad=()=>{throw Error('格式或数据不完整')},obj=x=>x&&typeof x==='object'&&!Array.isArray(x),int=(n,l,h)=>Number.isInteger(n)&&n>=l&&n<=h,str=(s,n=50000)=>typeof s==='string'&&s.length<=n,date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s);
 if(!obj(raw)||raw.version!==1||!['drafts','records','mistakes','labs','cases'].every(k=>obj(raw[k]))||!Array.isArray(raw.archives))bad();
 const res=blank(),has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function getDraft(d,q){if(!obj(d)||!str(d.text)||!['edit','grade','done'].includes(d.stage)||!Array.isArray(d.choices)||!Array.isArray(d.checks)||!d.choices.every(k=>q.options.length&&'ABCD'.indexOf(k)>=0&&String(k).length===1)||!d.checks.every(i=>int(i,0,rubric(q).length-1))||(!q.type.includes('多')&&d.choices.length>1))bad();return {text:d.text,stage:d.stage,choices:[...new Set(d.choices)],checks:[...new Set(d.checks)]}}
 for(const [id,d] of Object.entries(raw.drafts)){if(/^design[01]$/.test(id)){if(!str(d.text))bad();res.drafts[id]={text:d.text};continue}if(!has(qmap,id))bad();res.drafts[id]=getDraft(d,qmap[id])}
 for(const [id,arr] of Object.entries(raw.records)){if(!has(qmap,id)||!Array.isArray(arr)||!arr.length||!arr.every(r=>obj(r)&&date(r.date)&&['模拟','隔天重测','订正','首轮'].includes(r.mode)&&int(r.auto,0,qmap[id].pts)&&int(r.self,0,qmap[id].pts)&&r.auto+r.self===r.score&&int(r.score,0,qmap[id].pts)))bad();res.records[id]=arr}
 for(const [id,m] of Object.entries(raw.mistakes)){if(!has(qmap,id)||!obj(m)||!date(m.due)||typeof m.corrected!=='boolean')bad();res.mistakes[id]={due:m.due,last:m.last&&date(m.last)?m.last:'',corrected:m.corrected}}
 for(const [k,v] of Object.entries(raw.cases)){if(!/^(?:[1-9]|1[01])$/.test(k)||!int(v,0,2))bad();res.cases[k]=v}
 for(const [id,s] of Object.entries(raw.labs)){if(!LABS.some(l=>l.id===id)||!obj(s))bad();const t={};for(const [k,v] of Object.entries(s)){
 const opts={mode:['guided','recall','variant'],proto:['AH','ESP'],wrap:['传输','隧道'],kind:['enc','auth'],metric:['ids','bio']};
 if(has(opts,k)&&opts[k].includes(v))t[k]=v;
 else if(k==='written'&&str(v)||k==='guess'&&str(v,8))t[k]=v;
 else if(['kChecked','pkDone','mDone','reverse'].includes(k)&&typeof v==='boolean')t[k]=v;
 else if(['step','traffic','fpick','v','thresh'].includes(k)&&int(v,0,{step:5,traffic:3,fpick:3,v:2,thresh:100}[k]))t[k]=v;
 else if(['order','sel'].includes(k)&&Array.isArray(v)&&v.every(n=>int(n,0,k==='order'?5:4))&&new Set(v).size===v.length)t[k]=v;
 else if(k==='picks'&&obj(v)&&Object.entries(v).every(([i,n])=>/^[0-5]$/.test(i)&&int(n,0,2)))t[k]=v;
 else bad()}res.labs[id]=t}
 function getExam(e){if(!obj(e)||!['done','running'].includes(e.status)||!Number.isSafeInteger(e.start)||e.start<=0||e.end!==e.start+90*60000||!obj(e.answers)||!Number.isSafeInteger(e.submitted))bad();const a={};for(const [k,d] of Object.entries(e.answers)){if(!/^e(?:[1-9]|1\d|20)$/.test(k))bad();a[k]=getDraft(d,qmap[k])}return {status:e.status,start:e.start,end:e.end,submitted:e.submitted,answers:a}}
 if(raw.exam)res.exam=getExam(raw.exam);res.archives=raw.archives.map(getExam);
 if(typeof raw.last==='string'&&/^(?:(chapter|quiz)\/(?:[1-9]|1[01])|read\/(?:[1-9]|1[01])\/\d+|lab\/(kerberos|ipsec|firewall|threshold)|exam|design)$/.test(raw.last))res.last=raw.last;
 return res;
}
function draw(){clearInterval(timer);expire();const [p,id,sub]=route();const active=['chapter','read','quiz','design'].includes(p)?'chapters':p;document.querySelector('#nav').innerHTML=nav.map(([k,ic,t])=>`<a href="#${k}" ${active===k?'class="active" aria-current="page"':''}>${ico(ic)}${t}</a>`).join('');document.querySelector('#crumb').textContent='研习室　/　'+(nav.find(n=>n[0]===active)?.[2]||'学习首页');
 if(['chapter','read','quiz','design','exam'].includes(p)||(p==='lab'&&id)){S.last=route().join('/');save()}
 const c=G.chapters[Number(id)-1];let s;
 switch(p){case 'chapter':case 'read':case 'quiz':s=c?chPage(c,p,sub):chapterList();break;case 'chapters':s=chapterList();break;case 'lab':s=labPage(id);break;case 'plan':s=plan();break;case 'audio':s=audioPage();break;case 'exam':s=examPage();break;case 'backup':s=backupPage();break;case 'review':s=reviewPage(id);break;case 'design':s=design();break;default:s=home()}
 view.innerHTML=s;view.querySelectorAll('table').forEach(t=>{const wrap=document.createElement('div');wrap.className='tableWrap';t.replaceWith(wrap);wrap.append(t)});const audio=document.querySelector('#audioPlayer');if(audioURL&&audio){audio.onloadedmetadata=()=>{audio.currentTime=audioAt};audio.ontimeupdate=()=>audioAt=audio.currentTime}
 if(S.exam?.status==='running')timer=setInterval(()=>{if(expire()){draw();notify('模拟时间已到，已保存并交卷。');return}const clock=document.querySelector('#clock');if(clock)clock.textContent=timeLeft()},500);
}
function redrawQuestion(id){const el=document.getElementById('item-'+id);if(!el){draw();return}const top=el.getBoundingClientRect().top;draw();const next=document.getElementById('item-'+id);if(next)window.scrollBy({top:next.getBoundingClientRect().top-top,behavior:'instant'})}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;const [p,id]=route();if(expire()){draw();notify('时间已到，已交卷。');return}
 if(p==='lab'&&id&&labAct(a,v))return;
 const ex=p==='exam',q=qmap[v];
 if(a==='case'){S.cases[id]=Number(v);save();draw();return}
 if(a==='scroll'){document.getElementById('item-'+v)?.scrollIntoView();return}
 if(a==='seek'){if(!audioURL){notify('请先选择设备上的课堂录音。');document.querySelector('#audioFile').focus();return}const player=document.querySelector('#audioPlayer');audioAt=Number(v);player.currentTime=audioAt;player.play().catch(()=>notify('请点击播放器的播放按钮。'));return}
 if(a==='examstart'||a==='restart'){if(a==='restart'){if(!confirm('保留本次模拟记录，开启新一轮 90 分钟模拟？'))return;S.archives.push(S.exam)}S.exam=freshExam();save();draw();window.scrollTo(0,0);return}
 if(a==='handin'){const skipped=G.exam.filter(q=>{const d=draft(q,true);return !d.choices.length&&!d.text.trim()}).length;if(!confirm(`还有 ${skipped} 道未作答。确认交卷并结束计时？`))return;finishExam();draw();window.scrollTo(0,0);return}
 if(a==='export'){const blob=new Blob([JSON.stringify(S)],{type:'application/json'}),url=URL.createObjectURL(blob),el=document.createElement('a');el.href=url;el.download='网络安全复习进度-'+today()+'.json';el.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}
 if(!q)return;
 if(a==='flag'){markWrong(q);save();redrawQuestion(v);return}
 if(a==='reviewQ'){const old=S.drafts[v];if(!old||old.stage!=='edit')S.drafts[v]=emptyDraft();save();go('review/'+v);return}
 if(a==='redo'){S.drafts[v]=emptyDraft();save();redrawQuestion(v);return}
 const d=draft(q,ex);
 if(a==='qsubmit'){if(q.options.length&&!d.choices.length||rubric(q).length&&!d.text.trim()){notify('请先完成选择与所需的书面回答。暂时不会时可写下卡住的地方。');return}if(rubric(q).length)d.stage='grade';else complete(q,d);save();redrawQuestion(v);return}
 if(a==='grade'){if(d.stage!=='done')complete(q,d,ex);save();redrawQuestion(v)}
});
document.addEventListener('input',e=>{const t=e.target;if(expire()){draw();return}
 if(t.dataset.write){draft(qmap[t.dataset.write],route()[0]==='exam').text=t.value;save()}
 if(t.dataset.labtext){labState(t.dataset.labtext).written=t.value;save()}
 if(t.dataset.design!==undefined){S.drafts['design'+t.dataset.design]={text:t.value};save()}
 if(t.id==='threshold')document.querySelector('#thrLabel').textContent=t.value
});
document.addEventListener('change',async e=>{const t=e.target;if(expire()){draw();return}
 if(t.dataset.choice){const q=qmap[t.dataset.choice],d=draft(q,route()[0]==='exam');d.choices=q.type==='多选'?toggle(d.choices,t.value):[t.value];save();return}
 if(t.dataset.rubric){const d=draft(qmap[t.dataset.rubric],route()[0]==='exam');d.checks=toggle(d.checks,Number(t.value));save();return}
 if(t.dataset.section){go('read/'+t.dataset.section+'/'+t.value);return}
 if(t.dataset.setting){labAct(t.dataset.setting,t.value);return}
 if(t.id==='audioFile'&&t.files[0]){if(audioURL)URL.revokeObjectURL(audioURL);audioURL=URL.createObjectURL(t.files[0]);audioAt=0;audioName=t.files[0].name;draw();return}
 if(t.id==='import'&&t.files[0]){try{const f=t.files[0];if(f.size>15e6)throw Error();const next=normalize(JSON.parse(await f.text()));if(confirm('用此文件替换本机学习记录？现有记录可先导出。')){S=next;save();draw();notify('已导入学习记录。')}}catch{notify('导入失败，文件内容或版本不符。现有记录已保留。')}t.value=''}
});
window.addEventListener('hashchange',()=>{draw();window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main').focus({preventScroll:true})});
window.addEventListener('storage',e=>{if(e.key===KEY){S=read();draw()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&expire())draw()});
draw();
