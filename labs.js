const LABS=[
 {id:'kerberos',ch:2,name:'Kerberos 票据交换',short:'票据与认证符',icon:'network',desc:'跟随一名学生，从首次登录走到图书馆借阅。'},
 {id:'ipsec',ch:4,name:'IPsec 报文拆解',short:'认证与加密范围',icon:'layers',desc:'切换封装方式，逐个标出受保护的字段。'},
 {id:'firewall',ch:6,name:'防火墙规则推演',short:'首次匹配与方向',icon:'filter',desc:'移动规则，判断校园网关会放行哪一种连接。'},
 {id:'threshold',ch:7,name:'检测与认证阈值',short:'误报、漏报与阈值',icon:'activity',desc:'移动阈值，观察同一批样本如何改变判定结果。'}
];
const K=[
 ['C','AS','申请 TGT','第一次登录校园账号，客户端先向谁说明自己要取得授票资格？',['向 AS 提交身份及请求信息','向图书馆提交服务票据','向 TGS 索取图书馆的长期密钥'],0,'AS 负责初始认证。客户端先请求获得 TGT，口令不会直接作为服务票据发送。'],
 ['AS','C','取得 TGT','AS 的回复中，学生电脑和 TGS 分别能打开哪一部分？',['C 能用公开信息打开所有字段','C 得到会话密钥，TGT 由 TGS 的长期密钥保护','图书馆负责解开 TGT'],1,'客户端长期密钥保护给客户端的材料。C 保存 TGT 并获得 C–TGS 会话密钥，TGT 的内部留给 TGS 读取。'],
 ['C','TGS','换取服务票据','学生要访问图书馆，C 给 TGS 的请求应带什么？',['用户名和服务端私钥','只带复印的 TGT','服务名、TGT 和用 C–TGS 会话密钥保护的新认证符'],2,'TGT 让 TGS 得到相应会话密钥。认证符还能证明发送方能使用该密钥，并支持新鲜性检查。'],
 ['TGS','C','接收服务票据','TGS 认证通过后，哪项应当交给客户端？',['C–V 会话密钥及用 V 长期密钥保护的服务票据','V 的长期密钥明文','AS 的密码数据库'],0,'给客户端的部分以 C–TGS 会话密钥保护。只有服务 V 能用自己的长期密钥读取服务票据。'],
 ['C','V','登录图书馆','图书馆服务 V 收到什么，才能检查这次请求？',['仅有 TGT','服务票据及新的 C–V 认证符','只有学生姓名'],1,'V 从票据解出 C–V 会话密钥，核对服务、身份、有效期，再检验认证符和重复请求。'],
 ['V','C','确认服务身份','在课件的双向认证示例中，C 怎样确认对端也持有 C–V 密钥？',['核对网页图标','再次发送口令','验证 V 用会话密钥保护的、与本轮相关的回应'],2,'V 的可选响应与本轮认证符关联。课件采用时间戳加一，实际协议字段应按对应版本解释。']
];
const VAR={
 kerberos:['换成打印服务，学生已有有效 TGT。下一次应向谁要哪种票据？',['AS，重新领取相同 TGT','TGS，领取面向打印服务的票据','图书馆，领取打印机的私钥'],1,'更换目标服务仍可复用有效 TGT，但服务票据应绑定新目标。'],
 ipsec:['网关间要求隐藏原始源地址，同时让公网路由器能转发。哪项适合？',['启用加密的 ESP 隧道模式','AH 传输模式','ESP 传输模式加密外层 IP 头'],0,'隧道把原 IP 包放入加密载荷，路由器仍能读取新的外层 IP 头。'],
 firewall:['把目标改为网关本机的 HTTPS 管理页，该请求进入哪条过滤链？',['FORWARD','OUTPUT','INPUT'],2,'目的地是网关自身，所以检查 INPUT 链；穿过网关才看 FORWARD。'],
 threshold:['另一套门禁以“距离 ≤ 阈值”为通过。收紧允许距离，误接受率和误拒绝率怎样变化？',['误接受率不增，误拒绝率不减','两者必然同时下降','误接受率不减，误拒绝率不增'],0,'收紧通过条件会减少接受数。本题分数方向已改变，先判断哪些样本跨过边界。']
};
function labState(id){return S.labs[id] ||= {}}
function labPage(id){
 const lab=LABS.find(x=>x.id===id);if(!lab)return labCatalogue();
 const st=labState(id);const mode=st.mode||'guided';
 const body=SIM_BY_ID.has(id)?renderSimulation(lab,st,mode):mode==='variant'?oldVariant(lab,st):id==='kerberos'?kerb(st):id==='ipsec'?ipsec(st):id==='firewall'?firewall(st):metrics(st);
 return `${pageTitle(lab.name,lab.desc)}<div class="tabs">${[['guided','分步推演'],['recall','闭卷挑战'],['variant','换个场景']].map(([v,t])=>btn(t,'labmode',v,mode===v?'selected':'')).join('')}${SIM_BY_ID.has(id)?A('lab','全部推演'):A('chapter/'+lab.ch,'回看章节')}</div><section class="labPanel">${body}</section>`;
}

function msg(ok,why){return `<div role="status" class="notice ${ok?'':'warn'}"><b>${ok?'判断正确':'再想一步'}</b><br>${esc(why)}</div>`}
function kerb(st){
 if(st.mode==='recall'){
  const order=st.order||[];return `<h2>不用提示，还原六次交换</h2><p>按发送顺序点击消息，再用一句话解释认证符的作用。</p><div class="seq">${[4,0,3,5,2,1].map(i=>`<button data-a="kadd" data-v="${i}" ${order.includes(i)?'disabled':''}>${K[i][0]} → ${K[i][1]} · ${K[i][2]}</button>`).join('')}</div><div class="notice">${order.map(i=>K[i][2]).join(' → ')||'尚未选择消息'}</div>${btn('退回一步','kundo')}${btn('清空顺序','kclear')}<label class="field" for="kw">服务票据有效，为什么还需要认证符？</label><textarea id="kw" data-labtext="kerberos" placeholder="写下你的判断依据">${esc(st.written||'')}</textarea>${btn('核对流程和解释','kcheck','','primary')}${st.kChecked?msg(order.every((n,i)=>n===i)&&order.length===6,'顺序：申请 TGT → 取得 TGT → 换取服务票据 → 接收服务票据 → 登录图书馆 → 确认服务身份。自查：认证符需要相应会话密钥，并配合时间与重复检查证明本轮请求的新鲜性。'):''}`;
 }
 const step=st.step||0;const [a,b,title,q,o,ans,why]=K[step];const pick=(st.picks||{})[step];
 return `<div class="two"><div class="labScene"><span class="kicker">校园图书馆 · 六次交换</span><h2>${pick===ans ? a+" → "+b : "预测这一次交换"}</h2><div class="roles">${['C','AS','TGS','V'].map((r,i)=>`<div class="role ${pick===ans&&(r===a||r===b)?'live':''}"><b>${r}</b><br>${['学生电脑','认证服务器','票据服务器','图书馆'][i]}</div>`).join('')}</div><p class="labText" style="margin:18px 0 0">第 ${step+1} 步 / 6 · ${pick===ans?title:"先选出符合协议的做法"}</p><progress max="6" value="${step+1}"></progress></div><div><h3>${q}</h3>${o.map((x,i)=>`<button class="option ${pick===i?'selected':''}" data-a="kpick" data-v="${i}">${x}</button>`).join('')}${pick!==undefined?msg(ans===pick,why):''}<div class="actions"><button data-a="kback" ${step===0?'disabled':''}>上一步</button><button class="primary" data-a="knext" ${ans!==pick?'disabled':''}>${step===5?'进入闭卷挑战':'下一步'}</button></div></div></div>`;
}
function packetConfig(st){
 const ah=st.proto==='AH', tunnel=st.wrap==='隧道';const labels=ah?[tunnel?'外 IP 头的固定字段':'原 IP 头的固定字段','可变 IP 字段','AH 规定字段',tunnel?'整个原 IP 包':'上层段']: [tunnel?'外 IP 头':'原 IP 头','ESP 头',tunnel?'整个原 IP 包':'上层段','ESP 尾','认证标签'];
 const enc=ah?[]:[2,3],auth=ah?[0,2,3]:[1,2,3];return {labels,enc,auth};
}
function ipsec(st){const recall=st.mode==='recall',proto=st.proto||'ESP',wrap=st.wrap||'传输';const {labels,enc,auth}=packetConfig(st);const kind=st.kind||'enc';const target=kind==='enc'?enc:auth;
 return `<h2>${recall?'在空白报文上标范围':'观察报文封装'}</h2><div class="actions">${['AH','ESP'].map(v=>btn(v,'proto',v,proto===v?'selected':'')).join('')}${['传输','隧道'].map(v=>btn(v+'模式','wrap',v,wrap===v?'selected':'')).join('')}</div><p class="meta">本例 ESP 同时启用加密与完整性保护；AH 的可变字段按规范处理。</p><div class="tabs">${btn('加密范围','kind','enc',kind==='enc'?'selected':'')}${btn('完整性校验输入','kind','auth',kind==='auth'?'selected':'')}</div><div class="labScene"><div class="packet">${labels.map((x,i)=>`<button data-a="pkt" data-v="${i}" aria-pressed="${(st.sel||[]).includes(i)}" class="pkt ${(recall?(st.sel||[]):target).includes(i)?'selected':''}">${x}</button>`).join('')}</div></div>${recall?`<p>点击选择全部相符字段；若范围为空，保持全部未选即可。</p>${btn('核对所选字段','pktCheck','','primary')}${st.pkDone?msg(same(st.sel||[],target),'该组合应选：'+(target.map(i=>labels[i]).join('、')||'无字段')+'。'):''}`:`<p class="tip">当前范围：${target.map(i=>labels[i]).join('、')||'无，AH 不加密内容'}。${kind==='auth'?'AH 对规定字段做规范化；ESP 的外部 IP 头和认证标签自身不计入此处的 ESP 校验输入。':'隧道可把原 IP 头放入被封装的载荷，外侧路由所需的 IP 头仍可读取。'}</p>${btn('隐藏提示，自己选一遍','labmode','recall','primary')}`}`;
}
const rules=['拒绝 10.0.0.8 向外的新连接','允许内网向外的新 HTTPS 连接','允许已获准连接的返回流量','默认拒绝'];
const traffic=['10.0.0.8 → 外网 · 新 HTTPS','10.0.0.9 → 外网 · 新 HTTPS','外网 → 10.0.0.9 · 已获准连接的返回包','外网 → 内网 · 未关联的新连接'];
function firewall(st){const t=st.traffic||0,ids=st.reverse?[1,0,2,3]:[0,1,2,3];const hit=ids.find(r=>r===0?t===0:r===1?t<=1:r===2?t===2:true);const reveal=st.mode!=='recall'||st.fpick!==undefined;
return `<h2>哪一条规则先命中？</h2><label class="field" for="traf">待检查的转发报文</label><select id="traf" data-setting="traffic">${traffic.map((x,i)=>`<option value="${i}" ${t===i?'selected':''}>${x}</option>`).join('')}</select> ${btn('交换前两条规则','reverse')}<div class="two" style="margin-top:14px"><div class="labScene">${ids.map((r,i)=>`<span class="rule ${reveal&&r===hit?'hit':''}">${i+1}. ${rules[r]}</span>`).join('')}</div><div><p>从上往下检查，首次命中的终止性规则决定结果。</p>${st.mode==='recall'?ids.map((r,i)=>btn('命中第 '+(i+1)+' 条','fpick',r,st.fpick===r?'selected':'')).join(' '):''}${reveal?msg(st.mode!=='recall'||st.fpick===hit,'第 '+(ids.indexOf(hit)+1)+' 条先匹配。'+rules[hit]+'。'+(t===0?'注意特定地址也属于内网，放宽规则提前会改变结果。':'')):''}</div></div>`}
const positive=[48,55,68,72,75,78,82,87,90,96],negative=[12,20,29,34,39,40,46,52,62,74];
function counts(t){const a=positive.filter(x=>x>=t).length,b=negative.filter(x=>x>=t).length;return {a,b,miss:10-a}}
function metrics(st){const bio=st.metric==='bio',t=st.thresh??60,r=counts(t),recall=st.mode==='recall';
return `<h2>${bio?'门禁相似度':'入侵检测分数'}</h2><div class="tabs">${btn('入侵检测','metric','ids',!bio?'selected':'')}${btn('生物认证','metric','bio',bio?'selected':'')}</div><div class="two"><div class="labScene"><label for="threshold">${bio?'相似度 ≥ 阈值时接受':'分数 ≥ 阈值时告警'} · <strong id="thrLabel">${t}</strong></label><input id="threshold" type="range" min="0" max="100" value="${t}" data-setting="threshold"><p class="meta">${bio?'本人尝试':'入侵事件'} 10 次：${positive.join('、')}<br>${bio?'冒用尝试':'正常事件'} 10 次：${negative.join('、')}</p></div><div>${recall?`<p>当前样本中，${bio?'冒用者被接受':'正常事件引发告警'}的比例是多少？</p><label>输入百分数 <input type="number" id="metricGuess" min="0" max="100" value="${esc(st.guess??'')}"> %</label><div class="actions">${btn('核对计算','mcheck','','primary')}</div>`:'<p>先预测提高阈值后的两种错误，再拖动滑块验证。</p>'}${!recall||st.mDone?`<div class="notice">${bio?'FAR 误接受率':'FPR 误报率'}：${r.b}/10 = ${r.b*10}%<div class="bar"><i style="width:${r.b*10}%"></i></div>${bio?'FRR 误拒绝率':'FNR 漏报率'}：${r.miss}/10 = ${r.miss*10}%<div class="bar alt"><i style="width:${r.miss*10}%"></i></div></div>`:''}${recall&&st.mDone?msg(Number(st.guess)===r.b*10,'分母是这 10 次'+(bio?'冒用尝试。':'真实正常访问。')):''}</div></div>`}
function labAct(a,v){const id=route()[1],st=labState(id);if(SIM_BY_ID.has(id))return applySimEvent(SIM_BY_ID.get(id),st,a,v);switch(a){
case 'labmode':st.mode=v;break;case 'variantcase':st.variantCase=Number(v);break;case 'variant':if(st.variantCase)(st.variantPicks||={})[st.variantCase]=Number(v);else st.v=Number(v);break;case 'kpick':(st.picks||={})[st.step||0]=Number(v);break;
case 'knext':if((st.step||0)===5)st.mode='recall';else st.step=(st.step||0)+1;break;case 'kback':st.step=Math.max(0,(st.step||0)-1);break;
case 'kadd':(st.order||=[]).push(Number(v));st.kChecked=false;break;case 'kundo':(st.order||=[]).pop();st.kChecked=false;break;case 'kclear':st.order=[];st.kChecked=false;break;
case 'kcheck':if((st.order||[]).length!==6||!st.written?.trim()){notify('请先排好六步，写下自己的解释。');return true}st.kChecked=true;break;
case 'proto':case 'wrap':case 'kind':st[a]=v;st.sel=[];st.pkDone=false;break;case 'pkt':if(st.mode!=='recall'){notify('切换到闭卷挑战后可自己标注范围。');return true}st.sel=toggle(st.sel||[],Number(v));st.pkDone=false;break;case 'pktCheck':st.pkDone=true;break;
case 'traffic':st.traffic=Number(v);delete st.fpick;break;case 'reverse':st.reverse=!st.reverse;delete st.fpick;break;case 'fpick':st.fpick=Number(v);break;
case 'metric':st.metric=v;st.mDone=false;break;case 'threshold':st.thresh=Number(v);st.mDone=false;break;case 'mcheck':{const input=document.querySelector('#metricGuess');if(!input.value||!input.checkValidity()){notify('请输入 0 至 100 之间的百分数。');return true}st.guess=input.value;st.mDone=true;break}default:return false;}save();draw();return true}
