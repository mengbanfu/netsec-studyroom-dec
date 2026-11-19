'use strict';
const G=COURSE, allQ=[...G.chapters.flatMap(c=>c.qs),...G.exam,...FOCUS_DRILLS], qmap=Object.fromEntries(allQ.map(q=>[q.id,q]));
const KEY='netsec-studyroom-v1', dayCh=[1,2,2,3,4,4,4,5,6,7,8,9,10,11,0,0,0,0];
const icons={home:'M3 10 12 3l9 7v10H4V10 M9 20v-7h6v7',book:'M3 5q5-2 9 1 5-3 9-1v14q-5-2-9 1-4-3-9-1z M12 6v14',network:'M3 3h6v5H3z M15 3h6v5h-6z M9 16h6v5H9z M6 8v4h12V8 M12 12v4',layers:'m2 8 10-5 10 5-10 5z M3 12l9 5 9-5 M3 16l9 5 9-5',filter:'M3 5h18l-7 8v5l-4 2v-7z',activity:'M2 12h5l3-8 4 16 3-8h5',check:'M4 12l5 5L21 5',clock:'M12 3a9 9 0 1 0 .1 0 M12 7v6l4 2',practice:'M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h3',plan:'M3 6h18v15H3z M7 3v6 M17 3v6 M3 11h18',audio:'M3 15v-3a9 9 0 0 1 18 0v3 M3 13h4v7H3z M17 13h4v7h-4z',save:'M4 4h13l3 3v13H4z M8 4v6h8V4 M8 20v-6h8v6',flag:'M5 21V4q4-2 8 0t7 0v10q-4 2-7 0t-8 0',lab:'M8 3h8 M10 3v6L4 19q0 2 2 2h12q2 0 2-2L14 9V3 M7 15h10'};
const nav=[['home','home','学习首页'],['chapters','book','章节学习'],['lab','lab','互动推演'],['review','flag','错题重测'],['exam','practice','限时模拟'],['plan','plan','复习计划'],['audio','audio','录音索引'],['backup','save','进度备份']];
const short=['网络安全概述','用户认证与密钥','认证与密钥建立协议','网络安全协议','访问控制与安全模型','防火墙技术','入侵检测技术','生物认证技术','网络取证技术','无线网络安全','可信计算与隐私保护'];
const themes=['安全目标 · 主动与被动攻击','证书 · KDC · Kerberos','DH · 挑战应答 · 新鲜性','PGP · TLS · IPsec','BLP · Biba · 格','过滤链 · 状态检查 · DMZ','检测原理 · 混淆矩阵','身份验证 · FAR 与 FRR','数字证据 · 时间线','802.1X · CCMP · 四次握手','可信计算 · 差分隐私 · AI 安全'];
const cases=[
 ['校园成绩从 60 分变成 90 分。首先受损的是哪一个安全目标？',['可用性','完整性','机密性'],1,'成绩内容被未经授权地改写，核心是完整性。'],
 ['校园统一登录之后，学生如何为另一项服务换取票据？',['携带有效 TGT 向 TGS 申请','把账号口令直接交给服务','用服务端的私钥生成票据'],0,'TGT 与新的认证符支持换取对应服务票据。'],
 ['双方得到了相同的 DH 共享秘密，还需要核实什么？',['屏幕分辨率','交换值是否绑定预期伙伴','双方设备同一品牌'],1,'共享秘密的计算和对通信伙伴身份的认证是两个问题。'],
 ['两个校区的网关要隐藏原始 IP 包。哪项满足要求？',['只有 AH 的传输模式','明文转发','启用加密的 ESP 隧道模式'],2,'隧道把整个原始包封装到受保护载荷。'],
 ['高密级文件要防止流向低密级目标。哪个规则直接相关？',['BLP 不下写','Biba 不下读','仅检查文件名'],0,'把高密信息写入低密目标会造成泄露。'],
 ['发往网关自己管理服务的报文经过哪个过滤链？',['FORWARD','INPUT','OUTPUT'],1,'目标是网关自身。'],
 ['正常的选课高峰被 IDS 报警，属于哪种情况？',['漏报','真阳性','误报'],2,'实际正常却被标为异常，属于假阳性。'],
 ['冒用者被门禁放行，应计入哪个指标的分子？',['FAR','FRR','注册失败率'],0,'错误接受的分母是冒用尝试。'],
 ['两端日志时钟不同，先做哪件事更便于复核？',['覆盖原始时间','保留原时区并用共同事件估计偏差','直接删除矛盾条目'],1,'保留原件、注明校正依据，再重建时间线。'],
 ['企业无线认证尚未结束，哪类帧仍可承载接入认证？',['任意业务数据','未授权数据库流量','EAPOL'],2,'非受控端口承载认证交互，受控端口约束业务。'],
 ['只发布总人数时，想限制单个人对输出分布的影响，应考虑什么？',['差分隐私','只改列名','隐藏表名'],0,'差分隐私比较相邻数据集上的输出分布。']
];
function ico(k){return `<svg class="ico" aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[k]||icons.book}"/></svg>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function btn(t,a,v='',cl=''){return `<button type="button" class="${cl}" data-a="${a}" data-v="${esc(v)}">${t}</button>`}
function A(h,t,cl='btn'){return `<a class="${cl}" href="#${h}">${t}</a>`}
function same(a,b){return a.length===b.length&&a.every(x=>b.includes(x))}
function toggle(a,v){return a.includes(v)?a.filter(x=>x!==v):[...a,v]}
function today(d=new Date()){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function tomorrow(){const d=new Date();d.setDate(d.getDate()+1);return today(d)}
function blank(){return {version:1,last:'',drafts:{},records:{},mistakes:{},labs:{},cases:{},exam:null,archives:[]}}
function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return v&&v.version===1?Object.assign(blank(),v):blank()}catch{return blank()}}
let S=read(),audioURL='',audioAt=0,audioName='',timer,msgTimer,storageWarn=false;
const view=document.querySelector('#view');
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch{storageWarn=true;notify('当前浏览器未能保存进度，请在离开前导出备份。')}}
function notify(s){const el=document.querySelector('#toast');el.textContent=s;clearTimeout(msgTimer);msgTimer=setTimeout(()=>{el.textContent=''},3200)}
function route(){return (location.hash.slice(1)||'home').split('/')}
function go(path){if(route().join('/')!==path)location.hash=path;else draw()}
function pageTitle(t,d=''){return `<h1>${t}</h1>${d?`<p class="muted pageLead">${d}</p>`:''}`}
function dateIndex(){const d=new Date(),no=Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2026,10,19))/86400000);return Math.max(0,Math.min(17,no))}
function escLines(t){return esc(t).replace(/\n/g,'<br>')}
function getDue(){return Object.entries(S.mistakes).filter(([,m])=>m.due<=today()).map(([id])=>id)}
function baseRec(id){return S.records[id]||[]}
function labCard(l){return A('lab/'+l.id,`<span class="labLogo">${ico(l.icon)}</span><b>${l.name}</b><small>${l.short}</small>`,'chapterCard labCard')}
function art(){
 const tile=(x,y,n,id)=>`<g transform="translate(${x},${y})"><path d="M-42 0 0-22 42 0 0 22z" fill="#c5ead8"/><path d="M-42 0 0 22v${n}l-42-22z" fill="#669d92"/><path d="M42 0 0 22v${n}l42-22z" fill="#90c6af"/><path d="m-26 0 26-13 26 13L0 13z" fill="none" stroke="#44857d"/><text x="0" y="4" text-anchor="middle" fill="#20504f" font-size="12" font-family="monospace" font-weight="bold">${id}</text><path d="m13 22 16-8" stroke="#335e60" stroke-width="2"/></g>`;
 return `<div class="heroArt" aria-hidden="true"><svg viewBox="0 0 370 240"><g stroke="#65a298" fill="none" stroke-width="1.7"><path d="m32 149 77-41 83 43 89-46 M109 108V75l63-31 M192 151v35l55 27 M281 105l45 25"/><path class="flow" stroke="#ffdc84" stroke-width="3" d="m32 149 77-41 83 43 89-46"/></g>${tile(110,87,12,'C')}${tile(189,133,14,'TGS')}${tile(189,124,10,'TGS')}${tile(281,85,14,'V')}${tile(178,34,10,'AS')}<g fill="#ffe28c"><circle cx="32" cy="149" r="4"/><circle cx="247" cy="213" r="4"/><circle cx="326" cy="130" r="4"/></g></svg></div>`;
}
function home(){const i=dateIndex(),d=G.days[i],ci=dayCh[i];const target=ci?'chapter/'+ci:i===16?'exam':i===14?'design':'review';const header=ci?short[ci-1]:['方案设计训练','流程与错题回顾','全真限时模拟','考前错题复测'][i-14];const due=getDue(),num=Object.keys(S.mistakes).length;
 let block=d[1].split('；').map(v=>{const m=v.match(/^(\d+)分(?:钟)?(.*)/);return `<div class="stepItem"><span class="time">${m?m[1]+'′':'•'}</span><span>${esc(m?m[2]:v)}</span></div>`}).join('');
 return `${pageTitle('学习首页')}<div class="hero"><div class="heroText"><span class="heroTag">第 ${i+1} 天 / 18 天　·　${d[0]}</span><h2>${header}</h2><p>${esc(d[2])}</p><div class="actions">${i<16?A('focus/'+(dailyTopics(i).find(t=>correctCount(t)<t.questions.length)||dailyTopics(i)[0]).id,'先学今日考点','btn sun'):''}${A(target,'开始今日学习',i<16?'btn':'btn sun')}${S.last?A(S.last,'继续上次学习','btn'):''}</div></div>${art()}</div>${dailyFocus(i)}<div class="homeGrid"><section class="box"><div class="spread"><h2>今天的 120 分钟</h2>${A('plan','查看计划','textBtn')}</div>${block}</section><section class="box"><h2>闭卷自检</h2>${A('review',`<span class="index">${ico('flag')}</span><span><b>应重测 ${due.length} 题</b><small>错题本收录 ${num} 题</small></span>`,'linkrow')}${A('exam',`<span class="index">${ico('clock')}</span><span><b>${S.exam?.status==='running'?'继续限时模拟':'限时模拟卷'}</b><small>90 分钟 · 选择、简答与设计</small></span>`,'linkrow')}${A('chapters',`<span class="index">${ico('book')}</span><span><b>11 章随学随练</b><small>已作答 ${Object.keys(S.records).filter(x=>x.startsWith('c')).length} / 77 道章末题</small></span>`,'linkrow')}</section></div><div class="sectionHead spread"><h2>互动推演</h2>${A('lab','查看全部','textBtn')}</div><div class="labCards">${LABS.map(labCard).join('')}</div>`;
}
function chapterList(){return `${pageTitle('章节学习','每章先用一个场景串起概念，再完成 7 道闭卷题。')}<div class="cards">${G.chapters.map(c=>{const count=c.qs.filter(q=>baseRec(q.id).length).length;return A('chapter/'+c.id,`<span class="kicker">第 ${String(c.id).padStart(2,'0')} 章</span><b>${short[c.id-1]}</b><small>${themes[c.id-1]}</small><small>${c.id===3?'跨章关联练习':topicsForChapter(c.id).filter(t=>t.level!=='related').length+' 项录音考点'}</small><progress max="7" value="${count}"></progress><small>已作答 ${count} / 7</small>`,'chapterCard')}).join('')}</div><div class="actions">${A('design','两道方案设计专项训练')}</div>`}
function chTabs(c,idx,sel){return `<div class="tabs">${[['chapter/'+c.id,'情景导读','intro'],['read/'+c.id+'/'+idx,'逐节讲义','read'],['quiz/'+c.id,'章末练习','quiz']].map(([h,n,k])=>A(h,n,k===sel?'on':'')).join('')}${LABS.filter(l=>l.ch===c.id||(c.id===8&&l.id==='threshold')).map(l=>A('lab/'+l.id,'互动推演')).join('')}</div>`}
function chPage(c,part,si){const head=pageTitle(`第 ${c.id} 章　${short[c.id-1]}`,themes[c.id-1]);const pos=Math.min(c.sections.length-1,Math.max(0,Number(si)||0)),tabs=chTabs(c,pos,part==='chapter'?'intro':part);
 if(part==='read'){const sec=c.sections[pos];return `${head}${tabs}<label class="field" for="sec">本章小节</label><select id="sec" data-section="${c.id}">${c.sections.map((s,i)=>`<option value="${i}" ${i===pos?'selected':''}>${esc(s.title)}</option>`).join('')}</select><article class="article"><h2>${esc(sec.title)}</h2>${focusList('本节录音考点',topicsAt(c.id+'.'+(pos+1)))}${sec.body}</article><div class="actions">${pos?A('read/'+c.id+'/'+(pos-1),'上一节'):''}${pos+1<c.sections.length?A('read/'+c.id+'/'+(pos+1),'下一节','btn primary'):A('quiz/'+c.id,'合上讲义，做章末题','btn primary')}</div>`}
 if(part==='quiz'){return `${head}${tabs}${chapterScore(c)}${c.qs.map((q,i)=>question(q,i+1)).join('')}`}
 const [p,op,ans,why]=cases[c.id-1],pick=S.cases[c.id];return `${head}${tabs}${focusList('本章录音考点',topicsForChapter(c.id).sort((a,b)=>Number(b.level==='emphasis')-Number(a.level==='emphasis')),c.id===3?'本章用可信中心协议巩固第 2 章的录音重点。':'标签区分明确要求与复习课点名。时间均为原录音的约略位置。')}<section class="labPanel"><div class="two"><div><span class="kicker">先做一个判断</span><h2>${p}</h2>${op.map((x,i)=>`<button class="option ${pick===i?'selected':''}" data-a="case" data-v="${i}">${x}</button>`).join('')}${pick!==undefined?msg(pick===ans,why):''}</div><div class="labScene"><h3>本章学习路径</h3>${c.sections.map((s,i)=>A('read/'+c.id+'/'+i,esc(s.title),'linkrow')).join('')}</div></div></section><div class="actions">${A('read/'+c.id+'/0','开始阅读讲义','btn primary')}${A('quiz/'+c.id,'直接闭卷测试')}</div><article class="article">${c.intro}</article>`;
}
function chapterScore(c){const r=c.qs.flatMap(q=>baseRec(q.id).length?[baseRec(q.id)[0]]:[]);const sum=(p)=>r.reduce((n,v)=>n+v[p],0);return `<div class="notice"><b>首轮 ${sum('auto')+sum('self')} / 20 分</b>　客观 ${sum('auto')} 分 · 自评 ${sum('self')} 分 · 已作答 ${r.length}/7 题<br><small>首轮建议 16 分过关。订正和隔天重测另行记录。</small></div>`}
function plan(){return `${pageTitle('18 天复习计划','11 月 19 日至 12 月 6 日，每天 120 分钟。')} ${G.days.map((d,i)=>`<details class="day" ${i===dateIndex()?'open':''}><summary>第 ${i+1} 天　${d[0]}　${dayCh[i]?short[dayCh[i]-1]:['方案设计','错题回顾','模拟考试','考前复测'][i-14]}</summary><p>${esc(d[1])}</p><p><strong>闭卷验收</strong>${esc(d[2])}</p><div class="planFocus"><strong>对应录音考点</strong>${dailyTopics(i).map(t=>A('focus/'+t.id,esc(t.title),'inline')).join('')}</div>${A(dayCh[i]?'chapter/'+dayCh[i]:i===16?'exam':i===14?'design':'review','打开当天材料','btn primary')}</details>`).join('')}<div class="notice">12 月 7 日考前用 15–20 分钟口述错题和流程图。</div>`}
function design(){return `${pageTitle('方案设计专项','先独立写出参与者、密钥来源、验证步骤与失败处理，再展开参考答案。')}${focusList('老师对设计题的要求',topicsAt('design'))}${G.design.map((d,i)=>{const cut=d.body.indexOf('</p>')+4;return `<section class="article"><h2>${d.title}</h2>${d.body.slice(0,cut)}<label class="field">我的方案<textarea data-design="${i}">${esc(S.drafts['design'+i]?.text||'')}</textarea></label><details><summary>核对方案与评分点</summary>${d.body.slice(cut)}</details></section>`}).join('')}`}
function audioPage(t){return `${pageTitle('复习课录音索引','选取自己设备上的 11 月 11 日录音，就能点时间跳转。文件只在浏览器中播放。')}${focusAudioBanner(t)}<div class="box"><label class="field" for="audioFile">选择课堂录音</label><input type="file" id="audioFile" accept="audio/*,.m4a"><p class="meta">${esc(audioName||'尚未选取录音，可先看下方索引。')}</p><audio id="audioPlayer" controls ${audioURL?`src="${esc(audioURL)}"`:''}></audio></div><div class="audioCuts">${G.audio.map(([t,s,q])=>{const m=t.match(/(\d+):(\d+)/);return btn(`<time>${t}</time><span><b>${esc(s)}</b><br>${esc(q)}</span>`,'seek',Number(m[1])*60+Number(m[2]))}).join('')}</div><p class="meta">片段时间为约数。正式试卷分值、时长和最终选答规则尚未由录音确认。</p>`}
