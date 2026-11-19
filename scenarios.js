'use strict';
// A case fixes the controls, asks for a prediction, then opens the same model used in exploration.
const STUDY_SIMS=[];
function sim(id,ch,name,short,icon,desc,focusIds,controls,run,recall,variant){
 STUDY_SIMS.push({id,ch,name,short,icon,desc,focusIds,controls,run,recall,variant});
}
function knob(label,...options){return {label,options}}
function frame(name,value,why){return {name,value:String(value),why}}
function task(inputs,prompt,options,answer,why){return {inputs,prompt,options,answer,why}}

sim('security-goals',1,'成绩系统事件研判','机密性、完整性、可用性','flag','改变三条审计观察，判断此次事件有证据支持哪些安全影响。',['attacks'],[
 knob('读取与观察','只有获准人员读取','有人被动旁听到成绩明文','只按加密流量长度推测活动'),knob('成绩与授权版本','一致','核实存在未授权改动'),knob('合法用户访问','正常','服务中断')],
 ([reader,change,outage])=>{
  const hits=[reader===1?'机密性（正文）':reader===2?'通信活动隐私':'',change&&'完整性',outage&&'可用性'].filter(Boolean);
  return [frame('读取与观察',['获准读取','被动观察 · 明文','被动观察 · 流量分析'][reader],['这条读取记录符合授权范围。','旁听未改变通信行为，但成绩到达未获授权的读者，机密性受损。','观察长度和时间可以泄露活动模式。仅凭此项不能断定成绩正文已经泄露。'][reader]),frame('版本核对',change?'出现未授权改动':'与授权版本一致',change?'有未授权改动，属于主动行为，内容完整性受损。':'当前核对未发现成绩内容变化。'),frame('可用性探测',outage?'业务中断':'服务可访问',outage?'合法用户需要服务时无法访问，可用性受到影响。':'本次探测显示服务仍可使用。'),frame('有据可判的影响',hits.join('、')||'三项均未发现异常','分别把“谁读到”“内容有无变化”“能否访问”对应到 CIA；每一项判断都需要相应证据。')];},
 [task([1,0,0],'未授权者读到了成绩，内容和服务均正常。哪项目标已受损？',['机密性','完整性','可用性'],0,'“谁看到了”对应机密性。'),task([0,1,1],'已核实成绩被改写，合法用户又无法访问。哪两项均有证据？',['机密性、可用性','完整性、可用性','机密性、完整性'],1,'未授权改动和服务中断是两条独立观察。')],
 [task([0,0,1],'把同一组观察换到选课系统：仅发现高峰时不能提交。可直接确认什么？',['一定有成绩泄露','一定被篡改','服务可用性受影响'],2,'服务不可访问能直接支持可用性结论，是否源于主动攻击还需调查。'),task([1,1,0],'若一次读取和一次改写都已核实，而网页仍能打开，哪种控制组合匹配？',['只增加服务器容量','限制读取权限，并控制和审计写入','只备份首页图片'],1,'要分别约束未经授权的读和写。')]);

sim('cert-chain',2,'证书链核验','信任锚、有效期与服务名','network','替图书馆客户端检查证书链，找出第一项使连接停止的条件。',['certificate'],[
 knob('签发链','终点是预置信任根','终点未获信任'),knob('服务证书','处在有效期','已经过期'),knob('证书标注的服务名','library（预期目标）','mail（其他服务）')],
 ([root,date,name])=>{const ok=!root&&!date&&!name;return [
 frame('信任路径',root?'无可信锚':'可验证至学校根',root?'即使签名计算正确，也缺少预置信任依据。':'本例假设签名、CA 权限和约束均正确，并能验证到受信根。'),
 frame('时效检查',root?'未执行':date?'已过期':'时间有效','核对当前时间是否落在证书的有效期内。'),
 frame('目标身份',root||date?'未执行':name?'服务名不匹配':'library 匹配','核对证书认可的服务标识是否覆盖实际访问目标。'),
 frame('核验结论',ok?'三项通过':'停止建立此连接',ok?'在本例的三项检查中通过。完整握手还需证明持有私钥等步骤。':'按顺序看首个失败点，后续条件不能代替它。')];},
 [task([0,0,1],'链和时间均正常，访问 library 却出示 mail 的证书。停在哪里？',['根证书路径','目标服务名','核验全通过'],1,'可信 CA 也可以给另一个服务发证。'),task([1,1,0],'按图中的顺序核验，有效期和信任链都存在问题，首先遇到什么？',['没有可信锚','没有匹配的服务名','只有过期问题'],0,'按给定顺序先判断信任路径。')],
 [task([0,1,0],'图书馆更换域名之前的证书今天刚过期，域名匹配能补救吗？',['可以，名称正确就够','可以，忽略当前日期','不能，需要有效的可信凭据'],2,'有效期是独立条件。'),task([0,0,0],'三项全通过，能立即断定对端持有证书对应私钥吗？',['能，因为证书可下载','仍需握手中的持钥证明','应该把私钥发给客户端'],1,'证书绑定公钥与身份，持钥能力需用协议验证。')]);

function dhPow(base,exp){let n=1;for(let i=0;i<exp;i++)n=(n*base)%23;return n}
sim('dh-exchange',3,'DH 共享密钥计算','模运算与伙伴身份','network','在教学小数 p＝23、g＝5 下，换一方的私密指数，看两端怎样重新得到同一个数。',[],[
 knob('A 的私密指数 a','3','6','8'),knob('B 的私密指数 b','4','5','7'),knob('身份与交换值','已认证绑定','未作身份绑定')],
 ([aPick,bPick,binding])=>{const a=[3,6,8][aPick],b=[4,5,7][bPick],x=dhPow(5,a),y=dhPow(5,b);
 return [frame('A 公布 X',x,`X = 5^${a} mod 23 = ${x}。公开交换值，本例把私密指数展示给学习者。`),frame('B 公布 Y',y,`Y = 5^${b} mod 23 = ${y}。`),frame('两端各自计算',dhPow(y,a),`A 算 ${y}^${a} mod 23，B 算 ${x}^${b} mod 23；结果同为 ${dhPow(y,a)}。`),frame('伙伴身份',binding?'仍待确认':'已与交换绑定',binding?'数学结果相同，仍缺少它与预期伙伴的可信绑定。':'这里额外假定身份和公开交换值已通过可信认证。例中的小数仅用于手算。')];},
 [task([0,0,0],'p＝23、g＝5、a＝3、b＝4。A 的公开值 X 是多少？',['10','18','4'],0,'125 除以 23 余 10。'),task([0,0,0],'B 的公开值为 4。A 用自己的 a＝3 算出什么共享结果？',['10','4','18'],2,'4³＝64，模 23 余 18。')],
 [task([1,0,0],'只把 a 改为 6，b 仍为 4，双方的新共享结果是多少？',['18','2','8'],1,'B 的公开值仍为 4；4⁶ mod 23＝2。'),task([1,1,1],'双方计算相同且本轮没有身份认证，哪项结论有依据？',['数字相同就能确认伙伴','本例两端结果相同，伙伴身份另需验证','私密指数应公开核验'],1,'共享秘密的数学一致性和身份绑定是两个判断。')]);

sim('pgp-mail',4,'PGP 邮件收发','签名、封装与验签','layers','A 给 B 寄成绩文件。替发送者选两把密钥，再检查 B 能否阅读和核验来源。',['pgp'],[
 knob('签名者使用','A 的签名私钥','其他人的签名私钥','省略签名'),knob('会话密钥保护给','B 的公钥','A 的公钥'),knob('B 对 A 的验签公钥','已核实归属','尚未核实归属')],
 ([sign,wrap,trust])=>[frame('内容签名',['A 已签名','其他人签名','没有签名'][sign],'签名绑定原始内容和对应的签名密钥。'),frame('密钥封装',wrap?'只面向 A':'面向 B','正文由随机会话密钥加密，会话密钥再由所选收件人的公钥保护。'),frame('B 阅读正文',wrap?'无法取回会话密钥':'可以解密',wrap?'B 的私钥与封装使用的 A 公钥不配对。':'B 用自己的私钥解封会话密钥，然后解密正文。'),frame('B 核验 A 的来源',wrap?'尚无法验正文':sign===2?'缺少签名':sign===1?'A 公钥验签失败':trust?'公钥归属待证':'来源验证通过','完成解密后，用可信的 A 公钥核验签名；公钥归属也属于信任前提。')],
 [task([0,1,0],'A 已签名，却用 A 的公钥保护会话密钥。B 首先遇到什么？',['来源自动通过','无法解开会话密钥','压缩失效'],1,'应由预期收件人 B 的公钥保护会话密钥。'),task([2,0,0],'B 能解密却没有签名。能核验 A 对正文的签名吗？',['可以','不能，缺少签名','应使用 B 的私钥验 A 的签名'],1,'能读出正文只说明解密成功。')],
 [task([0,0,1],'验签计算返回成功，但公钥未经核实。哪项仍不确定？',['签名者是否真是预期的 A','B 是否持有自己的私钥','邮件是否可编码'],0,'数学验证和公钥的身份归属需要分别判断。'),task([1,0,0],'由另一人的私钥签名，B 使用可信的 A 公钥，正文可解。预期哪个结果？',['正文无法打开','可以认定 A 签发','可阅读，A 的验签失败'],2,'收件人密钥和签发者密钥分工独立。')]);

sim('tls-handshake',4,'TLS 握手放行条件','协商、身份与 Finished','network','沿课件的经典 TLS 1.2 完整握手，检查什么时候能交付受保护的应用数据。',['tls'],[
 knob('密码参数','双方有共同选项','没有共同选项'),knob('服务器认证','证书和所需持钥证明均通过','服务身份核验失败'),knob('Finished 校验','双方一致','校验不一致')],
 ([alg,cert,finish])=>[frame('Hello 协商',alg?'无共同选项':'已选参数',alg?'找不到共同参数，此次握手停止。':'客户端与服务端选择参数并交换随机数。'),frame('身份与密钥',alg?'未执行':cert?'身份检查失败':'认证并派生密钥','在本例的认证密钥交换中先核验服务身份及交换材料，再从共同秘密派生方向性密钥。'),frame('Finished',alg||cert?'未执行':finish?'校验失败':'双方确认','用握手校验把先前协商的记录和已建立的密钥关联起来。'),frame('应用数据',alg||cert||finish?'不交付':'进入记录协议','普通完整握手确认后，由记录协议使用相应密钥保护应用数据。')],
 [task([1,0,0],'双方没有共同密码参数，会进行到哪一步？',['Hello 阶段停止','记录层交付数据','先忽略协商'],0,'需要协商出兼容参数。'),task([0,0,1],'证书已核验，但 Finished 不一致，应怎样处理？',['照常发送正文','终止握手','把私钥作为校验值发送'],1,'Finished 校验失败意味着本轮握手不能被依赖。')],
 [task([0,1,0],'登录页换成另一个域名的可信证书，参数兼容。客户端应依据哪一环节停止？',['压缩开关','记录长度','服务器身份核验'],2,'信任签发者还要匹配预期服务身份。'),task([0,0,0],'握手完成后，谁负责持续保护之后传送的成绩文件？',['握手的 Hello','记录协议','证书文件本身'],1,'握手建立参数，记录协议承载并保护数据。')]);

sim('access-flow',5,'BLP 与 Biba 信息流','读写方向与安全目标','filter','切换模型、主体、客体与操作，观察同一条数据流在哪个模型下允许。',['models'],[
 knob('策略模型','BLP 保密性','严格 Biba 完整性'),knob('主体级别','低','高'),knob('客体级别','高','低'),knob('访问操作','读','写')],
 ([model,s,o,op])=>{const target=1-o,from=op?s:target,to=op?target:s,ok=model?from>=to:from<=to;const name=n=>n?'高':'低';
 return [frame('访问请求',`${name(s)}级主体${op?'写':'读'}${name(target)}级客体`,'教学模型只改变级别与操作，假定其他授权已满足。'),frame('数据流向',`${name(from)} → ${name(to)}`,op?'写时数据由主体流向客体。':'读时数据由客体流向主体。'),frame('模型目标',model?'完整性':'保密性',model?'严格 Biba 阻止低完整性信息污染高完整性对象。':'BLP 阻止高密级信息流向低密级位置。'),frame('本规则判定',ok?'允许':'拒绝',from===to?'同级流动满足本例的方向约束。':`${model?'严格 Biba':'BLP'} 对该方向的${op?'写':'读'}操作${ok?'允许':'拒绝'}。`)];},
 [task([0,0,0,0],'低密级主体读高密级数据，BLP 如何判定？',['允许向下读','拒绝向上读','只取决于文件名'],1,'读会把高密信息带给低密主体。'),task([1,0,0,1],'低完整性主体写高完整性记录，严格 Biba 如何判定？',['拒绝向上写','允许向上写','与级别无关'],0,'数据从低可信处流向高可信处。')],
 [task([1,0,0,0],'把第一题换成严格 Biba：低完整性主体读高完整性客体。其他权限具备，结果如何？',['拒绝，因保密要求','一定要先下调客体','允许，高可信数据流向低级主体'],2,'严格 Biba 阻止低向高的污染。'),task([0,1,1,1],'高密级教务进程向公开公告写入内容。BLP 为何拒绝？',['数据将从高流向低','公开对象不能被读取','完整性一定变差'],0,'写入方向会把高密级信息带到低密级位置。')]);

sim('evidence-clock',9,'三端日志时间线','时钟校准与证据关联','clock','核对一笔成绩修改的客户端、应用和数据库记录，判断证据能支持多强的结论。',['forensics','evidence'],[
 knob('数据库时钟校准','共同事件证实快 2 分钟','时钟偏差未知'),knob('数据库事务关联字段','请求号 R17','请求号 R81','没有请求号'),knob('写入结果','提交成功','事务回滚')],
 ([clock,ref,rolled])=>[frame('客户端与应用','10:00:20 · R17','浏览器记录提交，应用也记录收到请求 R17。提交请求本身不能证明数据库写入成功。'),frame('对齐数据库时间',clock?'10:02:22 · 偏差未知':'原 10:02:22 → 对齐 10:00:22',clock?'保留原始时间；缺少共同事件校准，不能把两分钟差直接解释为处理延迟。':'独立共同事件证明数据库快两分钟。在副本上减去 120 秒，原始时间照常保留。'),frame('比对请求号',['与 R17 一致','R81 与 R17 不同','仅可按其他线索比对'][ref],'本例假设请求号是可信记录中的唯一关联标识。相近时间本身不能建立唯一关联。'),frame('可支持的结论',ref?'未证实是 R17 的写入':rolled?'R17 已回滚':'R17 已提交',ref?'需要补充证据，不能把这条事务直接归给 R17。':`请求号将事务关联至 R17，事务状态表明${rolled?'回滚':'提交成功'}。${clock?'实际时延仍不确定。':'校正后约相差两秒。'}账号与自然人的归属仍需其他证据。`)],
 [task([0,0,0],'数据库比应用快 120 秒，原始时间 10:02:22。换算到应用时间是多少？',['10:04:22','10:00:22','10:02:22'],1,'从数据库时间减去已确认的正偏差。'),task([0,1,0],'校正后时间只差两秒，但事务的请求号是 R81。能否证明 R17 写入成功？',['可以，两秒足够接近','可以，只看成功状态','当前证据不足'],2,'相近的时间不能覆盖唯一请求号的矛盾。')],
 [task([1,0,1],'请求号相同，事务回滚，时钟差未知。哪项结论仍成立？',['R17 已永久写入','R17 关联到一笔回滚事务，时延未定','数据库时钟正好快两分钟'],1,'事务状态与请求号可支持关联，未知偏差使精确时延不可靠。'),task([0,2,0],'若网络侧只观察到连接、数据库没有请求号，可以单凭连接断定实际操作者吗？',['不可以，还需要身份与业务侧证据','可以，只需 IP','可以，只需连接时长'],0,'连接、账号、自然人的身份是不同层次的结论。')]);

const wifiSuites=[
 ['WEP','RC4 与共享密钥、IV','CRC-32 / ICV','CRC 提供差错检查，缺少有密钥的强消息认证。'],
 ['TKIP','RC4 与逐包密钥混合','Michael MIC','过渡方案增强逐包密钥与完整性处理，仍受历史设计限制。'],
 ['CCMP','AES-CTR','CBC-MAC','CCMP 以 CTR 加密，CBC-MAC 验证规定内容，分组号参与新鲜性处理。']
];
sim('wifi-boundary',10,'无线链路保护边界','WEP、TKIP、CCMP 与 HTTPS','layers','选择无线方案和应用保护，沿终端、接入点、教务服务逐段查看数据受谁保护。',['wireless','layers'],[
 knob('无线数据方案','WEP','TKIP','CCMP'),knob('访问教务页面','经正确验证的 HTTPS','普通 HTTP')],
 ([suite,tls])=>{const [name,enc,mic,detail]=wifiSuites[suite];return [frame('STA 到 AP',name,`所选 ${name} 在无线链路上处理数据帧。`),frame('保密机制',enc,'这一项回答如何加密无线数据。'),frame('完整性机制',mic,detail),frame('AP 之后',tls?'本例缺少端到端保护':'TLS 持续到教务服务端',tls?'本例假设无其他保护。无线帧保护到 AP 结束，HTTP 本身不提供加密。':'在假定 TLS 端点位于浏览器和教务服务端时，无线链路结束后 TLS 仍保护在途数据。')];},
 [task([0,1],'WEP 的完整性字段依赖什么？',['CBC-MAC','CRC-32','Michael MIC'],1,'WEP 的 ICV 基于 CRC-32。'),task([2,1],'CCMP 下哪对机制分别提供保密和认证？',['CTR 与 CBC-MAC','RC4 与 CRC-32','802.1X 与 SSID'],0,'两者都使用 AES 构造，承担不同职责。')],
 [task([1,0],'旧硬件以 TKIP 接入，并经 HTTPS 登录教务。哪项是无线链路的完整性机制？',['TLS Finished','CRC 足以提供强认证','Michael MIC'],2,'区分无线帧处理与应用层连接上的 TLS。'),task([2,1],'CCMP 正常，但访问页面用 HTTP，离开 AP 后这份成绩单受什么保护？',['CCMP 继续到教务服务器','题设中没有额外端到端加密','SSID 自动代替 TLS'],1,'无线链路的终点是 AP，普通 HTTP 不能延伸这段保护。')]);

const epsilons=[1,.5,.25],caps=[1,2,4];
sim('privacy-budget',11,'差分隐私噪声尺度','贡献上限、ε 与统计误差','activity','准备发布一周入馆总人次。改变每人贡献上限与隐私预算，观察噪声分布的变化。',['dp'],[
 knob('每位学生最多贡献','1 次','2 次','4 次'),knob('隐私预算 ε','1','0.5','0.25')],
 ([cap,eps])=>{const d=caps[cap],e=epsilons[eps],b=d/e;return [frame('相邻数据集','增删一位学生','本例相邻关系按人定义。该学生的所有入馆记录随同增删，并先执行每人贡献上限。'),frame('总数敏感度',d,`增删一人对总人次最多改变 ${d}，所以 Δf = ${d}。`),frame('拉普拉斯尺度',b,`b = Δf / ε = ${d} / ${e} = ${b}。`),frame('发布误差',`平均绝对噪声 ${b} 人次`,'对零中心拉普拉斯噪声，期望绝对值等于尺度 b。某一次发布的实际误差可以更大或更小。')];},
 [task([0,2],'一人最多贡献 1 次，ε＝0.25，噪声尺度是多少？',['0.25','1','4'],2,'Δf／ε＝1／0.25＝4。'),task([2,0],'改为一人最多贡献 4 次，ε＝1。按人增删时敏感度是多少？',['1','4','0.25'],1,'邻接单位是一位学生，其所有允许的记录都可能改变。')],
 [task([1,1],'现在一人最多 2 次，ε＝0.5，尺度变成多少？',['4','2','1'],0,'2／0.5＝4。'),task([0,1],'同一上限下将 ε 从 1 调至 0.5。哪项正确？',['噪声尺度减半','每个结果一定偏离两人次','约束更紧，噪声尺度加倍'],2,'尺度描述随机分布，并不指定某次的确定误差。')]);

sim('batch-receipt',4,'成绩文件批次验收','身份、分块与重复入库','practice','充当 B 校区的接收服务，改变提交条件，决定拒收、暂存、返回回执还是入库。',['design-method'],[
 knob('提交者','身份可信且具备提交权限','已认证但没有提交权限'),knob('批次内容','分块齐全且可信清单核验通过','缺少一个分块','重算摘要与可信清单不符'),knob('批次登记','此前未登记','同一提交者、批次号及摘要已登记','相同批次号已登记为其他内容')],
 ([auth,parts,seen])=>{const blocked=auth||parts;const result=auth?'拒绝提交':parts===1?'暂存待补，不入库':parts===2?'拒收并复核':seen===1?'返回已有回执':seen===2?'拒绝冲突并复核':'原子入库一次';
 return [frame('身份与授权',auth?'授权失败':'可提交','假定身份经认证。B 还需检查该服务是否具备业务提交权限。'),frame('整批核验',auth?'未执行':['清单与内容相符','分块未齐','摘要不一致'][parts],'清单经认证，绑定批次号、分块序号、长度和摘要。以完整业务批次为验收单位。'),frame('去重与冲突',blocked?'未进入登记步骤':['新批次','已存在同一批次','已有不同内容'][seen],'只有整批验证通过才核对既有登记。匹配提交者和同批内容后，重试可安全复用回执。'),frame('接收结果',result,'只有新且合规的完整批次一次提交。将批次登记和业务写入作为原子操作，避免并发重试重复入库。')];},
 [task([0,1,0],'身份与权限均已验证，但还缺一块。此时 B 应怎么做？',['先确认整批入库','暂存或请求补齐，整批尚未入库','视为已完成重试'],1,'身份验证不能替代内容完整性检查。'),task([0,0,1],'网络超时后 A 重发完全相同的已登记批次，B 应怎么做？',['追加一份文件','撤销已有数据','返回已有回执'],2,'用提交者、批次号和内容核对重试。')],
 [task([1,0,0],'某个已认证的服务提交了完整批次，却无档案提交权限。先做什么？',['拒绝提交','先写入再补权限','只核对哈希'],0,'身份和业务授权分别检查。'),task([0,0,2],'同批次号出现不同内容，即使新内容本身完整，应该怎样处理？',['直接覆盖旧结果','拒绝冲突并复核','无条件返回成功回执'],1,'重复投递和内容冲突有不同的预期结果。')]);

const SIM_BY_ID=new Map(STUDY_SIMS.map(s=>[s.id,s]));
LABS.push(...STUDY_SIMS);
function labsForFocus(t){return LABS.filter(l=>l.id===t.lab||l.focusIds?.includes(t.id))}
function labCatalogue(){
 const sets=[
  ['身份、密钥与传输',['cert-chain','kerberos','dh-exchange','pgp-mail','tls-handshake','ipsec','wifi-boundary']],
  ['权限、检测与调查',['security-goals','access-flow','firewall','threshold','evidence-clock']],
  ['隐私与方案设计',['privacy-budget','batch-receipt']]
 ];
 return `${pageTitle('互动推演','先改变一个条件，看哪一步发生变化；再隐藏结果，闭卷作一次预测。')}${sets.map(([title,ids])=>`<section class="catalogueGroup"><h2>${title}</h2><div class="labCards">${ids.map(id=>labCard(LABS.find(l=>l.id===id))).join('')}</div></section>`).join('')}`;
}
function homeLabs(day){const chapter=dayCh[day];const priority=dailyTopics(day).flatMap(labsForFocus);
 const fallback=LABS.filter(l=>l.ch===chapter||l.ch===7&&chapter===8);
 return [...new Set([...priority,...fallback,...LABS])].slice(0,4);
}
function simKnobs(sim,st){return sim.controls.map((_,i)=>st.knobs?.[i]??0)}
function simStateValid(sim,s){
 if(!s||typeof s!=='object'||Array.isArray(s))return false;
 const idx=(n,upper)=>Number.isInteger(n)&&n>=0&&n<upper;
 return Object.entries(s).every(([k,v])=>{
  if(k==='mode')return ['guided','recall','variant'].includes(v);
  if(k==='stage')return idx(v,4);
  if(k==='knobs')return Array.isArray(v)&&v.length===sim.controls.length&&v.every((n,i)=>idx(n,sim.controls[i].options.length));
  if(k==='recallAt'||k==='variantAt')return idx(v,sim[k==='recallAt'?'recall':'variant'].length);
  if(k==='answers')return v&&typeof v==='object'&&!Array.isArray(v)&&Object.entries(v).every(([key,n])=>{
   const m=/^(recall|variant)-(\d+)$/.exec(key),t=m&&sim[m[1]][Number(m[2])];
   return t&&idx(n,t.options.length);
  });
  return false;
 });
}
function focusPracticeLinks(sim){
 const related=FOCUS_TOPICS.filter(t=>sim.focusIds.includes(t.id));
 const sec=sim.id==='dh-exchange'?'read/3/1':'chapter/'+sim.ch;
 return `<div class="simFurther">${A(sec,'回看'+(sim.id==='dh-exchange'?'讲义 3.2':'第 '+sim.ch+' 章'),'textBtn')}${related.map(t=>A('focus/'+t.id+'/practice','练习 · '+esc(t.title),'textBtn')).join('')}${sim.id==='dh-exchange'?A('quiz/3','章末练习 · 第 7 题计算','textBtn'):''}</div>`;
}
function simVisual(sim,p,rows){
 if(sim.id==='privacy-budget'){
  const scale=caps[p[0]]/epsilons[p[1]];
  const bars=Array.from({length:33},(_,i)=>{
   const x=i-16,h=Math.exp(-Math.abs(x)/scale)/scale;
   return `<i style="height:${Math.max(1,90*h)}%"></i>`;
  }).join('');
  return `<figure class="simFigure"><figcaption>发布噪声的概率密度 <small>相同坐标尺度</small></figcaption><div aria-hidden="true" class="simHist">${bars}</div><div class="simAxis"><span>−16</span><span>0 人次</span><span>+16</span></div><small>尺度 b = ${scale}，在此区间内呈现的密度随条件变化。</small></figure>`;
 }
 if(sim.id==='dh-exchange')return `<div class="simStrip"><b>A</b><span>公开 X = ${rows[0].value}　⇄　公开 Y = ${rows[1].value}</span><b>B</b></div>`;
 if(sim.id==='access-flow')return `<div class="simStrip"><b>${p[3]?'主体':'客体'}</b><span>${rows[1].value} · ${p[3]?'写入':'读取'}</span><b>${p[3]?'客体':'主体'}</b></div>`;
 if(sim.id==='wifi-boundary')return `<div class="simStrip"><b>终端</b><span>— ${wifiSuites[p[0]][0]} —</span><b>AP</b><span>— ${p[1]?'HTTP':'HTTPS 仍在保护'} —</span><b>教务服务</b></div>`;
 if(sim.id==='evidence-clock')return `<div class="simStrip"><b>应用</b><span>10:00:20</span><b>数据库原始</b><span>10:02:22</span></div>`;
 return '';
}
function simTrace(sim,values,at){
 const rows=sim.run(values),f=rows[at];
 return `<section class="simTrace"><h3>推演结果</h3>${simVisual(sim,values,rows)}<div class="simSteps">${rows.map((r,i)=>`<button type="button" data-a="simstage" data-v="${i}" aria-pressed="${at===i}"><span>${i+1}. ${esc(r.name)}</span><strong>${esc(r.value)}</strong></button>`).join('')}</div><div class="simDetail" aria-live="polite"><b>${esc(f.name)}</b><p>${esc(f.why)}</p></div><div class="actions"><button data-a="simstage" data-v="${at-1}" ${at===0?'disabled':''}>上一步</button><button data-a="simstage" data-v="${at+1}" ${at===rows.length-1?'disabled':''}>下一步</button></div></section>`;
}
function simExplore(sim,st){
 const values=simKnobs(sim,st);
 return `<div class="simGrid"><section><h3>设置场景</h3>${sim.controls.map((c,i)=>`<label class="simKnob">${esc(c.label)}<select data-sim-knob="${i}">${c.options.map((o,n)=>`<option value="${n}" ${values[i]===n?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`).join('')}<div class="actions">${btn('恢复初始条件','simreset','','mini')}${btn('试试闭卷预测','labmode','recall','primary')}</div></section>${simTrace(sim,values,st.stage??0)}</div>`;
}
function simChallenge(sim,st,mode){
 const tasks=sim[mode],i=st[mode+'At']??0,t=tasks[i],key=mode+'-'+i,answer=st.answers?.[key],marked=Number.isInteger(answer),correct=answer===t.answer;
 const passed=tasks.filter((v,j)=>st.answers?.[mode+'-'+j]===v.answer).length;
 const conditions=sim.controls.map((c,j)=>`<div><dt>${esc(c.label)}</dt><dd>${esc(c.options[t.inputs[j]])}</dd></div>`).join('');
 return `<div class="simQuest"><div class="spread"><h2>${mode==='recall'?'闭卷预测':'换个场景'}</h2><span class="meta">当前 ${i+1} / ${tasks.length} · 当前选对 ${passed} 题（含订正）</span></div><dl class="simFacts">${conditions}</dl><h3>${esc(t.prompt)}</h3><div class="simAnswers">${t.options.map((o,n)=>btn(esc(o),'simpredict',n,answer===n?'selected':'')).join('')}</div>${marked?msg(correct,t.why)+(correct?'':simCoach(sim,t,mode,i,answer)):''}<div class="actions">${i?btn('上一题','simcase',i-1):''}${i+1<tasks.length?btn('下一题','simcase',i+1):mode==='recall'?btn('进入变式','labmode','variant','primary'):''}${marked?btn('遮住答案重做','simretry','','mini'):''}</div></div>${marked?simTrace(sim,t.inputs,st.stage??0):''}`;
}
function renderSimulation(sim,st,mode){return `${mode==='guided'?simExplore(sim,st):simChallenge(sim,st,mode)}${focusPracticeLinks(sim)}`}
function applySimEvent(sim,st,a,v){
 const mode=st.mode||'guided',i=st[mode+'At']??0;
 switch(a){
 case 'labmode':st.mode=v;st.stage=0;break;
 case 'simstage':st.stage=Number(v);break;
 case 'simreset':st.knobs=sim.controls.map(()=>0);st.stage=0;break;
 case 'simcase':st[mode+'At']=Number(v);st.stage=0;break;
 case 'simpredict':(st.answers||={})[mode+'-'+i]=Number(v);st.stage=0;break;
 case 'simretry':delete st.answers[mode+'-'+i];st.stage=0;break;
 default:return false;
 }save();draw();return true;
}
document.addEventListener('change',e=>{
 const el=e.target;if(el.dataset.simKnob===undefined)return;
 const [,id]=route(),sim=SIM_BY_ID.get(id);if(!sim)return;
 const st=labState(id),k=Number(el.dataset.simKnob),values=simKnobs(sim,st);values[k]=Number(el.value);st.knobs=values;
 save();draw();document.querySelector(`[data-sim-knob="${k}"]`)?.focus({preventScroll:true});
});

const EXTRA_VARIANTS={
 kerberos:[
 ['图书馆收到有效票据和认证符，但在允许时间窗内已处理过完全相同的认证符，应怎样做？',['每次都无条件接受','只核对图标','根据重放缓存拒绝重复请求'],2,'时间窗限制可接受时间；窗口内还要结合重放缓存处理重复。'],
 ['服务票据只签发给打印服务，学生把它交给图书馆。图书馆应怎样处理？',['拒绝，票据绑定目标服务及相应密钥','接受任意 TGS 签发的票据','让学生提供长期服务密钥'],0,'服务票据及其密钥与服务身份有关。']],
 ipsec:[
 ['课件按“单方向、单协议”定义 SA。双向通信且每个方向同时用 AH 与 ESP，至少几条 SA？',['2','4','1'],1,'两个方向，每个方向两种协议，共四个安全关联。'],
 ['抗重放窗口大小为 8，最高已认证序号为 100。序号 99 尚未收过，且本次认证通过。应怎样处理？',['一定拒绝，因乱序','把窗口平移到 99','接收并把 99 标为已收到'],2,'99 位于 93–100 内，尚未收到且认证通过，最高序号保持 100。']],
 firewall:[
 ['外网 Web 请求终点改为 DMZ 的 Web 主机，并穿过这台网关。网关按哪条链过滤？',['INPUT','FORWARD','OUTPUT'],1,'报文经过网关继续转发到 DMZ。'],
 ['返回包的目的端口是客户端临时端口。采用状态检查时，哪种证据最能支持放行？',['它使用一个高端口','它声称来自互联网','它与此前获准的连接状态匹配'],2,'还要按策略核对方向和关联状态，端口本身不足。']],
 threshold:[
 ['100 次真实入侵检出 80 次，900 次正常访问中 18 次误报。告警精确率约是多少？',['81.6%','80%','2%'],0,'全部告警数为 80＋18，精确率 = 80/98 ≈ 81.6%。'],
 ['门禁今天有 200 次本人尝试，6 次被拒；另有 100 次冒用尝试，1 次通过。FRR 与 FAR 分别为多少？',['6% 与 0.5%','3% 与 1%','1% 与 3%'],1,'FRR = 6/200，FAR = 1/100。两个分母按身份真值分别统计。']]
};
function oldVariant(lab,st){
 const cases=[VAR[lab.id],...EXTRA_VARIANTS[lab.id]],i=st.variantCase??0;
 const [prompt,options,answer,why]=cases[i],pick=i===0?st.v:st.variantPicks?.[i];
 return `<div class="spread"><h2>把原理用到新情景</h2><small>变式 ${i+1} / ${cases.length}</small></div><p>${esc(prompt)}</p>${options.map((x,j)=>btn(esc(x),'variant',j,pick===j?'selected':'')).join(' ')}${Number.isInteger(pick)?msg(pick===answer,why)+(pick===answer?'':comparisonCoach(options,pick,answer,variantSteps[lab.id][i],variantSections[lab.id][i],lab.id==='ipsec'&&i===1?specificFaq.c4q4:undefined)):''}<div class="actions">${i?btn('上一题','variantcase',i-1):''}${i+1<cases.length?btn('下一题','variantcase',i+1):''}</div>`;
}
