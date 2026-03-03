(()=>{var e={};e.id=2849,e.ids=[2849],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71017:e=>{"use strict";e.exports=require("path")},57310:e=>{"use strict";e.exports=require("url")},15442:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>m,originalPathname:()=>p,pages:()=>d,routeModule:()=>h,tree:()=>c}),a(97559),a(18221),a(35866);var n=a(23191),l=a(88716),s=a(37922),i=a.n(s),o=a(95231),r={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(r[e]=()=>o[e]);a.d(t,r);let c=["",{children:["clients",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,97559)),"E:\\STAND-EG\\src\\app\\clients\\page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,18221)),"E:\\STAND-EG\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],d=["E:\\STAND-EG\\src\\app\\clients\\page.tsx"],p="/clients/page",m={require:a,loadChunk:()=>Promise.resolve()},h=new n.AppPageRouteModule({definition:{kind:l.x.APP_PAGE,page:"/clients/page",pathname:"/clients",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},26745:(e,t,a)=>{Promise.resolve().then(a.bind(a,86768))},39730:(e,t,a)=>{"use strict";a.d(t,{Z:()=>n});let n=(0,a(25578).Z)("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]])},44389:(e,t,a)=>{"use strict";a.d(t,{Z:()=>n});let n=(0,a(25578).Z)("pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]])},98091:(e,t,a)=>{"use strict";a.d(t,{Z:()=>n});let n=(0,a(25578).Z)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]])},86768:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>x});var n=a(10326),l=a(17577),s=a(17196),i=a(16671);let o=(0,a(25578).Z)("ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);var r=a(39730),c=a(44389),d=a(26754),p=a(98091),m=a(60962);let h=()=>{try{return JSON.parse(localStorage.getItem("erp_settings")||"{}").currencySymbol||"ج.م"}catch{return"ج.م"}};function x(){let[e,t]=(0,l.useState)([]),[a,x]=(0,l.useState)(!0),[u,g]=(0,l.useState)(!1),[y,f]=(0,l.useState)(""),[b,v]=(0,l.useState)(1),[j,N]=(0,l.useState)(5),[S,w]=(0,l.useState)({name:"",storeName:"",address:"",email:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]}),[D,C]=(0,l.useState)(null),[$,A]=(0,l.useState)(null),[k,P]=(0,l.useState)(""),[z,E]=(0,l.useState)("CASH"),[L,W]=(0,l.useState)("MAIN"),[F,T]=(0,l.useState)(""),[_,I]=(0,l.useState)(""),[M,O]=(0,l.useState)(""),[q,G]=(0,l.useState)(!1),[U,Z]=(0,l.useState)(""),[R,B]=(0,l.useState)(null),[H,J]=(0,l.useState)(null),V=e=>{N("ALL"===e?"ALL":parseInt(e,10)),localStorage.setItem("erp_clients_pageSize",e),v(1)},K=async()=>{try{let e=await fetch("/api/clients"),a=await e.json();t(a.map(e=>({...e,phones:e.phones||[],invoices:e.invoices||[]})))}catch(e){console.error(e)}finally{x(!1)}},Q=async e=>{if(e.preventDefault(),0===S.phones.length||!S.phones.some(e=>e.isPrimaryWhatsApp))return alert("يجب إضافة رقم هاتف واحد على الأقل وتحديده كرقم واتساب أساسي");try{let e=D?{...S,id:D.id}:S,t=await fetch("/api/clients",{method:D?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(t.ok)w({name:"",storeName:"",address:"",email:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]}),C(null),K();else{let e=await t.json();alert(`❌ خطأ: ${e.error||"فشل الحفظ"}`)}}catch(e){console.error(e)}},Y=async e=>{if(confirm(`⚠️ هل أنت متأكد من حذف العميل "${e.name}"؟
لا يمكن التراجع عن هذا الإجراء.`))try{let t=await fetch(`/api/clients?id=${e.id}`,{method:"DELETE"});if(t.ok)K();else{let e=await t.json();alert(`❌ فشل الحذف: ${e.error}`)}}catch(e){console.error(e)}},X=e=>{C(e),w({name:e.name,storeName:e.storeName||"",address:e.address||"",email:e.email||"",phones:e.phones.length>0?e.phones.map(e=>({phone:e.phone,isPrimaryWhatsApp:e.isPrimaryWhatsApp})):[{phone:"",isPrimaryWhatsApp:!0}]}),window.scrollTo({top:0,behavior:"smooth"})},ee=(e,t)=>{let a=[...S.phones];a[e].phone=t,w({...S,phones:a})},et=e=>{let t=S.phones.map((t,a)=>({...t,isPrimaryWhatsApp:a===e}));w({...S,phones:t})},ea=e=>{if(S.phones.length<=1)return;let t=S.phones.filter((t,a)=>a!==e);t.some(e=>e.isPrimaryWhatsApp)||(t[0].isPrimaryWhatsApp=!0),w({...S,phones:t})},en=(0,l.useMemo)(()=>e.filter(e=>e.name.includes(y)||e.storeName&&e.storeName.includes(y)||e.phones.some(e=>e.phone.includes(y))||`C-${e.serial}`.includes(y)),[e,y]),el="ALL"===j?1:Math.ceil(en.length/j),es=(0,l.useMemo)(()=>{if("ALL"===j)return en;let e=(b-1)*j;return en.slice(e,e+j)},[en,b,j]),ei=async e=>{let t=e.target.files?.[0];if(!t)return;let a=new FileReader;a.onload=async t=>{try{let e=(t.target?.result).split(/\r?\n/);if(e.length<2)return;let a=[],n=e=>{let t=[],a="",n=!1;for(let l=0;l<e.length;l++){let s=e[l];'"'===s?n=!n:","!==s||n?a+=s:(t.push(a.trim()),a="")}return t.push(a.trim()),t};for(let t=1;t<e.length;t++){let l=e[t].trim();if(!l)continue;let s=n(l);s.length>=2&&s[1]&&a.push({name:s[1],storeName:s[2]||"",address:s[3]||"",phones:[{phone:s[4]||"",isPrimaryWhatsApp:!0},...s[5]?[{phone:s[5],isPrimaryWhatsApp:!1}]:[]],email:s[6]||""})}if(a.length>0){if(!confirm(`سيتم إضافة ${a.length} عميل جديد إلى النظام. هل تود الاستمرار؟`))return;x(!0);let e=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)});if(e.ok)alert(`✅ تم استيراد ${a.length} عميل بنجاح`),K();else{let t=await e.json();alert(`❌ فشل الاستيراد: ${t.error||"خطأ غير معروف"}`)}}}catch(e){alert("❌ حدث خطأ في معالجة الملف، تأكد من أن الملف بصيغة CSV صحيحة")}finally{x(!1),e.target&&(e.target.value="")}},a.readAsText(t,"UTF-8")},eo=e=>{A(e),P(e.balanceDue>0?e.balanceDue.toFixed(0):""),E("CASH"),W("MAIN"),I(""),T(""),O(""),Z("")},er=async e=>{if(e.preventDefault(),!$)return;let t=parseFloat(k);if(!t||t<=0)return alert("أدخل مبلغاً صحيحاً");G(!0),Z("");try{let e=$.invoices.find(e=>e.id===F),a=await fetch("/api/clients/pay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId:$.id,amount:t,channel:z,treasuryType:L,bankName:"BANK"===z?_:null,invoiceId:F||null,invoiceRef:e?.invoiceNo||null,note:M})});if(a.ok)Z(`✅ تم تسجيل تحصيل ${t} ${h()} من ${$.name} وترحيله للخزينة`),await K(),setTimeout(()=>{A(null),Z("")},2500);else{let e=await a.json();Z(`❌ ${e.error||"حدث خطأ"}`)}}catch(e){Z("❌ خطأ في الاتصال بالخادم")}finally{G(!1)}},ec=async e=>{let t=await (0,s.Wp)(),a=t.currencySymbol||"ج.م";new Date().toLocaleDateString("ar-EG");let n=`
            <style>
                .client-header { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; margin-top: 10px; }
                .info-card { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                .info-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 4px; }
                .info-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
            </style>

            <div class="client-header">
                <div class="info-card">
                    <div class="info-label">بيانات العميل</div>
                    <div class="info-value">${e.name}</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">كود العميل: #C-${e.serial} ${e.storeName?`| ${e.storeName}`:""}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">الموقف المالي الحالي</div>
                    <div class="info-value" style="color: ${e.balanceDue>0?"#991b1b":"#166534"};">
                        ${e.balanceDue.toLocaleString("en-US")} ${a}
                        <span style="font-size: 0.7rem; font-weight: bold; margin-right: 5px;">${e.balanceDue>0?"(مدين)":"(دائن)"}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="padding: 15px; background: #f1f5f9; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">إجمالي المبيعات</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b;">${(e.totalInvoices||0).toLocaleString("en-US")} ${a}</div>
                </div>
                <div style="padding: 15px; background: #f1f5f9; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 4px;">إجمالي المتحصلات</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: #166534;">${(e.totalPayments||0).toLocaleString("en-US")} ${a}</div>
                </div>
            </div>

            <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 15px; color: #1e293b; border-right: 4px solid ${t.accentColor||"#E35E35"}; padding-right: 12px;">📄 سجل فواتير المبيعات</h3>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: right;">رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th style="text-align: center;">المبلغ الإجمالي</th>
                        <th style="text-align: center;">حالة السداد</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.invoices?.length?e.invoices.map(e=>`
                        <tr>
                            <td style="text-align: right; font-weight: bold;">#${e.invoiceNo}</td>
                            <td>${new Date(e.createdAt).toLocaleDateString("ar-EG")}</td>
                            <td style="text-align: center; font-weight: 700;">${(e.total||0).toLocaleString("en-US")} ${a}</td>
                            <td style="text-align: center;">
                                <span style="padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; background: ${"PAID"===e.status?"#dcfce7":"#fee2e2"}; color: ${"PAID"===e.status?"#166534":"#991b1b"}">
                                    ${"PAID"===e.status?"مسددة بالكامل":"PARTIAL"===e.status?"مسددة جزئياً":"آجلة"}
                                </span>
                            </td>
                        </tr>
                    `).join(""):'<tr><td colspan="4">لا توجد فواتير مسجلة في كشف الحساب</td></tr>'}
                </tbody>
            </table>
        `,l=(0,s.Qf)(n,`كشف حساب عميل مفصل - ${e.name}`,t),i=document.createElement("iframe");i.style.display="none",document.body.appendChild(i),i.contentWindow?.document.open(),i.contentWindow?.document.write(l),i.contentWindow?.document.close(),i.onload=()=>{i.contentWindow?.focus(),i.contentWindow?.print(),setTimeout(()=>document.body.removeChild(i),2e3)}},ed=h(),ep=e.reduce((e,t)=>e+t.balanceDue,0);return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("div",{className:"unified-container animate-fade-in",children:[(0,n.jsxs)("header",{className:"page-header",children:[(0,n.jsxs)("div",{children:[n.jsx("h1",{className:"page-title",children:"\uD83D\uDC65 إدارة العملاء والتحصيلات"}),(0,n.jsxs)("p",{className:"page-subtitle",children:["متابعة أرصدة ",n.jsx("strong",{style:{color:"var(--text-primary)"},children:e.length})," عميل | إجمالي المستحقات:"," ",(0,n.jsxs)("span",{style:{color:ep>0?"var(--primary-color)":"#66bb6a",fontWeight:800},children:[u?ep.toLocaleString("en-US"):"0"," ",u?h():"ج.م"]})]})]}),(0,n.jsxs)("div",{className:"header-actions",children:[n.jsx("button",{onClick:()=>{let t=e.map(e=>[e.serial,e.name,e.storeName||"",e.address||"",e.phones.map(e=>e.phone+(e.isPrimaryWhatsApp?" (WA)":"")).join(" | "),e.email||"",e.totalInvoices,e.totalPayments,e.balanceDue]),a="\uFEFF";a+="المسلسل,اسم العميل,اسم النشاط/المحل,العنوان,رقم الهاتف 1,رقم الهاتف 2,البريد الإلكتروني,إجمالي المبيعات,إجمالي التحصيلات,الرصيد المتبقي\n",t.forEach(e=>{let t=e.map(e=>{let t=String(e).replace(/"/g,'""');return`"${t}"`});a+=t.join(",")+"\n"});let n=new Blob([a],{type:"text/csv;charset=utf-8;"}),l=URL.createObjectURL(n),s=document.createElement("a");s.setAttribute("href",l),s.setAttribute("download",`قاعدة_بيانات_العملاء_${new Date().toLocaleDateString("ar-EG").replace(/\//g,"-")}.csv`),document.body.appendChild(s),s.click(),document.body.removeChild(s)},className:"btn-modern btn-secondary",title:"تصدير للبيانات",children:"\uD83D\uDCE5 تصدير"}),(0,n.jsxs)("label",{className:"btn-modern btn-secondary",style:{cursor:"pointer"},children:["\uD83D\uDCE4 استيراد",n.jsx("input",{type:"file",accept:".csv",onChange:ei,style:{display:"none"}})]})]})]}),(0,n.jsxs)("div",{className:"reports-grid",style:{alignItems:"start"},children:[(0,n.jsxs)("div",{className:"glass-panel",style:{position:"sticky",top:"24px"},children:[n.jsx("h4",{className:"settings-section-label",children:D?"\uD83D\uDCDD تعديل بيانات العميل":"✨ تسجيل عميل جديد"}),(0,n.jsxs)("form",{onSubmit:Q,style:{display:"flex",flexDirection:"column",gap:"12px"},children:[(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"client-name",children:"الاسم الكامل *"}),n.jsx("input",{id:"client-name",type:"text",className:"input-glass",value:S.name,onChange:e=>w({...S,name:e.target.value}),required:!0,placeholder:"اسم العميل"})]}),(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"client-store",children:"اسم المتجر / الشركة"}),n.jsx("input",{id:"client-store",type:"text",className:"input-glass",value:S.storeName,onChange:e=>w({...S,storeName:e.target.value}),placeholder:"اختياري"})]}),(0,n.jsxs)("div",{children:[(0,n.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"},children:[n.jsx("label",{className:"field-label",style:{marginBottom:0},children:"\uD83D\uDCF1 أرقام الهاتف"}),n.jsx("button",{type:"button",onClick:()=>w({...S,phones:[...S.phones,{phone:"",isPrimaryWhatsApp:!1}]}),className:"btn-modern btn-secondary btn-sm",style:{padding:"2px 8px",fontSize:"0.7rem"},children:"+ إضافة"})]}),n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:S.phones.map((e,t)=>(0,n.jsxs)("div",{style:{display:"flex",gap:"6px",alignItems:"center"},children:[(0,n.jsxs)("div",{style:{flex:1,position:"relative"},children:[n.jsx("input",{type:"text",className:"input-glass",value:e.phone,onChange:e=>ee(t,e.target.value),placeholder:"رقم الهاتف",style:{paddingLeft:"35px"},required:0===t,"aria-label":`رقم هاتف ${t+1}`}),(0,n.jsxs)("label",{title:"تعيين كواتساب",style:{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",cursor:"pointer",margin:0,display:"flex"},children:[n.jsx("input",{type:"radio",name:"primaryWA",checked:e.isPrimaryWhatsApp,onChange:()=>et(t),style:{display:"none"}}),n.jsx("span",{style:{fontSize:"1.1rem",filter:e.isPrimaryWhatsApp?"none":"grayscale(1)",opacity:e.isPrimaryWhatsApp?1:.3,transition:"all 0.2s"},children:"\uD83D\uDFE2"})]})]}),S.phones.length>1&&n.jsx("button",{type:"button",onClick:()=>ea(t),className:"btn-danger",style:{width:"32px",height:"32px"},children:"\xd7"})]},t))})]}),(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"client-address",children:"العنوان"}),n.jsx("textarea",{id:"client-address",className:"input-glass",rows:2,value:S.address,onChange:e=>w({...S,address:e.target.value}),placeholder:"المدينة، الحي...",style:{resize:"none"}})]}),(0,n.jsxs)("div",{style:{display:"flex",gap:"8px",marginTop:"10px"},children:[n.jsx("button",{type:"submit",className:"btn-modern btn-primary",style:{flex:2},children:D?"\uD83D\uDCBE حفظ التعديلات":"➕ إضافة العميل"}),D&&n.jsx("button",{type:"button",onClick:()=>{C(null),w({name:"",storeName:"",address:"",email:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]})},className:"btn-modern btn-secondary",style:{flex:1},children:"إلغاء"})]})]})]}),(0,n.jsxs)("div",{style:{minWidth:0,display:"flex",flexDirection:"column",gap:"1rem"},children:[n.jsx("div",{className:"glass-panel",style:{padding:"1rem"},children:n.jsx("input",{type:"text",className:"input-glass",placeholder:"\uD83D\uDD0D ابحث بالاسم، المتجر أو الرقم المسلسل...",value:y,onChange:e=>f(e.target.value),style:{width:"100%"},"aria-label":"بحث عن عميل"})}),n.jsx("div",{className:"glass-panel",style:{padding:"1.5rem"},children:a?n.jsx("p",{style:{textAlign:"center",color:"#555",padding:"3rem"},children:"⏳ جاري تحميل البيانات..."}):(0,n.jsxs)(n.Fragment,{children:[n.jsx("div",{className:"smart-table-container",children:(0,n.jsxs)("table",{className:"smart-table",children:[n.jsx("thead",{children:(0,n.jsxs)("tr",{children:[n.jsx("th",{className:"hide-on-tablet text-center",style:{width:"60px"},children:"#"}),n.jsx("th",{children:"العميل والنشاط"}),n.jsx("th",{className:"text-center",style:{width:"150px"},children:"الرصيد المتبقي"}),n.jsx("th",{className:"hide-on-tablet text-center",style:{width:"160px"},children:"الهاتف الأساسي"}),n.jsx("th",{className:"text-left",style:{width:"120px"},children:"الإجراءات"})]})}),n.jsx("tbody",{children:es.map(e=>{let t=e.phones.find(e=>e.isPrimaryWhatsApp)||e.phones[0];return(0,n.jsxs)("tr",{children:[(0,n.jsxs)("td",{className:"hide-on-tablet text-center","data-label":"المسلسل",children:["C-",e.serial]}),n.jsx("td",{"data-label":"العميل",style:{minWidth:"200px"},children:(0,n.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"4px"},children:[n.jsx("div",{className:"mobile-card-title text-ellipsis",title:e.name,children:e.name}),e.storeName&&(0,n.jsxs)("div",{className:"text-muted text-sm text-ellipsis",title:e.storeName,children:["\uD83C\uDFE2 ",e.storeName]})]})}),n.jsx("td",{"data-label":"الرصيد",className:"text-center",children:(0,n.jsxs)("div",{className:e.balanceDue>0?"mobile-card-balance balance-red":"mobile-card-balance balance-green",children:[e.balanceDue.toLocaleString("en-US")," ",n.jsx("span",{className:"text-sm font-normal",children:ed})]})}),n.jsx("td",{className:"hide-on-tablet text-center","data-label":"الهاتف",children:(0,n.jsxs)("div",{className:"flex-group",children:[n.jsx("span",{className:"text-sm",children:t?.phone}),e.phones.length>1&&(0,n.jsxs)("span",{className:"phone-tag",title:`${e.phones.length} أرقام`,children:["+",e.phones.length-1]})]})}),n.jsx("td",{"data-label":"الإجراءات",className:"text-left",children:(0,n.jsxs)("div",{className:"action-bar-cell mobile-card-actions",style:{position:"relative"},children:[(0,n.jsxs)("button",{onClick:()=>eo(e),className:"btn-modern btn-primary btn-sm",title:"تحصيل مبلغ",style:{padding:"0 8px"},children:[n.jsx(i.Z,{size:16})," تحصيل"]}),n.jsx("button",{onClick:()=>B(e),className:"btn-modern btn-secondary btn-sm",title:"المزيد من الإجراءات",style:{padding:"0 8px"},children:n.jsx(o,{size:18})})]})})]},e.id)})})]})}),(0,n.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginTop:"2rem",flexWrap:"wrap-reverse",gap:"20px",padding:"15px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid var(--border-color)"},children:[(0,n.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.2)",padding:"5px 15px",borderRadius:"20px"},children:[n.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.85rem"},children:"عدد النتائج:"}),(0,n.jsxs)("select",{value:j,onChange:e=>V(e.target.value),style:{padding:"0px",fontSize:"0.9rem",width:"auto",border:"none",background:"transparent",color:"var(--primary-color)",fontWeight:"bold",cursor:"pointer",outline:"none"},"aria-label":"Items per page",children:[n.jsx("option",{style:{color:"#000"},value:5,children:"5"}),n.jsx("option",{style:{color:"#000"},value:10,children:"10"}),n.jsx("option",{style:{color:"#000"},value:20,children:"20"}),n.jsx("option",{style:{color:"#000"},value:50,children:"50"}),n.jsx("option",{style:{color:"#000"},value:"ALL",children:"الكل"})]})]}),el>1&&(0,n.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flex:"1 1 auto",maxWidth:"350px"},children:[n.jsx("button",{disabled:1===b,onClick:()=>v(e=>e-1),className:"btn-modern btn-secondary",style:{opacity:1===b?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"→ السابق"}),(0,n.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:"60px",background:"rgba(227,94,53,0.1)",color:"var(--primary-color)",borderRadius:"10px",padding:"6px 12px",fontWeight:"bold",fontSize:"0.9rem",direction:"ltr",whiteSpace:"nowrap",border:"1px solid rgba(227,94,53,0.2)"},children:[b," / ",el]}),n.jsx("button",{disabled:b===el,onClick:()=>v(e=>e+1),className:"btn-modern btn-secondary",style:{opacity:b===el?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"التالي ←"})]})]})]})})]})]})]}),$&&u&&(0,m.createPortal)(n.jsx("div",{className:"modal-overlay",children:(0,n.jsxs)("div",{className:"modal-content",children:[(0,n.jsxs)("div",{className:"modal-header",children:[(0,n.jsxs)("h2",{className:"modal-title",children:["تسجيل مالي: ",$.name]}),n.jsx("button",{onClick:()=>A(null),className:"close-btn",title:"إغلاق",children:"✕"})]}),U&&n.jsx("div",{style:{background:"rgba(102,187,106,0.1)",color:"#66bb6a",padding:"10px",borderRadius:"8px",marginBottom:"1rem"},children:U}),n.jsx("form",{onSubmit:er,className:"modal-body custom-scroll",children:(0,n.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"15px"},children:[(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"p-amt",children:"المبلغ المطلوب"}),n.jsx("input",{id:"p-amt",type:"number",className:"input-glass",value:k,onChange:e=>P(e.target.value),required:!0,style:{fontSize:"1.4rem",fontWeight:800,color:"#29b6f6"}})]}),(0,n.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},children:[(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"p-chan",children:"قناة الدفع"}),(0,n.jsxs)("select",{id:"p-chan",className:"input-glass",value:z,onChange:e=>{E(e.target.value),W("CASH"===e.target.value?"MAIN":"BANK"===e.target.value?"BANK":"VODAFONE_CASH")},children:[n.jsx("option",{value:"CASH",children:"كاش"}),n.jsx("option",{value:"BANK",children:"بنك"}),n.jsx("option",{value:"VODAFONE",children:"فودافون كاش"})]})]}),(0,n.jsxs)("div",{children:[n.jsx("label",{className:"field-label",htmlFor:"p-tres",children:"الخزينة"}),(0,n.jsxs)("select",{id:"p-tres",className:"input-glass",value:L,onChange:e=>W(e.target.value),children:[n.jsx("option",{value:"MAIN",children:"الرئيسية"}),n.jsx("option",{value:"BANK",children:"البنكي"}),n.jsx("option",{value:"VODAFONE_CASH",children:"فودافون"})]})]})]}),n.jsx("button",{type:"submit",disabled:q,className:"btn-modern btn-primary",style:{height:"50px",width:"100%"},children:q?"جاري الحفظ...":"تأكيد العملية"})]})})]})}),document.body),R&&u&&(0,m.createPortal)(n.jsx("div",{className:"modal-overlay",onClick:()=>B(null),children:(0,n.jsxs)("div",{className:"modal-content",onClick:e=>e.stopPropagation(),style:{padding:"2rem",display:"flex",flexDirection:"column",gap:"8px"},children:[(0,n.jsxs)("div",{className:"modal-header",children:[(0,n.jsxs)("h2",{className:"modal-title",style:{margin:0},children:["إجراءات العميل: ",n.jsx("span",{style:{color:"var(--primary-color)",marginRight:"10px"},children:R.name})]}),n.jsx("button",{onClick:()=>B(null),className:"close-btn",title:"إغلاق",children:"✕"})]}),n.jsx("div",{className:"modal-body custom-scroll",style:{display:"flex",flexDirection:"column",gap:"8px"},children:(()=>{let e=R.phones.find(e=>e.isPrimaryWhatsApp)||R.phones[0];return(0,n.jsxs)(n.Fragment,{children:[e?.phone&&(0,n.jsxs)("button",{onClick:()=>{window.open(`https://wa.me/${e.phone.replace(/\D/g,"")}`,"_blank"),B(null)},className:"btn-modern btn-secondary",style:{justifyContent:"flex-start",padding:"16px"},children:[n.jsx(r.Z,{size:20,style:{color:"#4caf50"}})," تواصل عبر الواتساب ",n.jsx("span",{style:{marginLeft:"auto",opacity:.5},children:e.phone})]}),(0,n.jsxs)("button",{onClick:()=>{X(R),B(null)},className:"btn-modern btn-secondary",style:{justifyContent:"flex-start",padding:"16px"},children:[n.jsx(c.Z,{size:20,style:{color:"#ffa726"}})," تعديل بيانات العميل"]}),(0,n.jsxs)("button",{onClick:()=>{ec(R),B(null)},className:"btn-modern btn-secondary",style:{justifyContent:"flex-start",padding:"16px"},children:[n.jsx(d.Z,{size:20,style:{color:"#29b6f6"}})," طباعة كشف حساب تفصيلي"]}),n.jsx("div",{style:{height:"1px",background:"var(--border-color)",margin:"8px 0"}}),(0,n.jsxs)("button",{onClick:()=>{Y(R),B(null)},className:"btn-modern bg-white/5 hover:bg-red-500/10",style:{justifyContent:"flex-start",padding:"16px",color:"#ff5252",border:"1px solid rgba(255,82,82,0.2)"},children:[n.jsx(p.Z,{size:20})," حذف العميل نهائياً"]})]})})()})]})}),document.body)]})}},17196:(e,t,a)=>{"use strict";a.d(t,{Qf:()=>i,Wp:()=>s});let n=null,l=0;async function s(){let e=Date.now();if(n&&e-l<3e4)return n;let t={},a={},s={};try{t=JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{}try{a=JSON.parse(localStorage.getItem("erp_invoice_template")||"{}")}catch{}try{s=JSON.parse(localStorage.getItem("erp_unified_report_config")||"{}")}catch{}let i={};try{let e=await fetch("/api/settings",{cache:"no-store"});e.ok&&(i=await e.json())}catch{}let o={companyName:i.appName||s.companyName||a.companyName||t.appName||"Stand Masr",companySubtitle:i.appSubtitle||s.companySubtitle||a.companySubtitle||"",companyAddress:i.companyAddress||s.companyAddress||a.companyAddress||"",companyPhone:i.companyPhone||s.companyPhone||a.companyPhone||"",companyPhone2:i.companyPhone2||s.companyPhone2||a.companyPhone2||"",companyEmail:i.companyEmail||s.companyEmail||a.companyEmail||"",companyTax:i.companyTax||s.companyTax||a.companyTax||"",companyCommercial:i.companyCommercial||s.companyCommercial||a.companyCommercial||"",accentColor:i.primaryColor||s.accentColor||a.accentColor||t.primaryColor||"#E35E35",appLogo:i.appLogo||s.printLogoCustom||a.printLogoCustom||s.appLogo||t.appLogo||"",printLogoSize:i.printLogoSize||s.printLogoSize||a.printLogoSize||70,logoShape:i.logoShape||s.logoShape||a.logoShape||t.logoShape||"rounded",logoPosition:i.logoPosition||s.logoPosition||a.logoPosition||"right",showLogo:s.showLogo??a.showLogo??!0,footerText:i.footerText||s.footerText||a.footerText||"شكراً لتعاملكم معنا",footerAlign:i.footerAlign||s.footerAlign||"center",footerFontSize:s.footerFontSize||13,showFooter:s.showFooter??!0,sealImage:i.footerSealImage||s.sealImage||"",sealAlign:i.footerSealAlign||s.sealAlign||"right",sealSize:i.footerSealSize||s.sealSize||120,currencySymbol:i.currencySymbol||t.currencySymbol||"ج.م",whatsapp:i.whatsapp||s.whatsapp||"",facebook:i.facebook||s.facebook||"",instagram:i.instagram||s.instagram||"",website:i.website||s.website||"",youtube:i.youtube||s.youtube||"",tiktok:i.tiktok||s.tiktok||"",pinterest:i.pinterest||s.pinterest||"",socialAlign:s.socialAlign||"center",companyNameFontSize:s.companyNameFontSize||24,companySubtitleFontSize:s.companySubtitleFontSize||14,titleFontSize:s.titleFontSize||28,baseFontSize:s.fontSize||13};return n=o,l=e,o}function i(e,t,a){let{companyName:n,companySubtitle:l,companyAddress:s,companyPhone:i,companyPhone2:o,accentColor:r,appLogo:c,printLogoSize:d,logoPosition:p,showLogo:m,footerText:h,footerAlign:x,footerFontSize:u,showFooter:g,sealImage:y,sealAlign:f,sealSize:b,whatsapp:v,facebook:j,instagram:N,website:S,youtube:w,tiktok:D,pinterest:C,socialAlign:$,companyNameFontSize:A,companySubtitleFontSize:k,titleFontSize:P,baseFontSize:z}=a,E=r||"#E35E35",L=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),W=[{val:v,icon:"\uD83D\uDCDE"},{val:j,icon:"f"},{val:N,icon:"\uD83D\uDCF8"},{val:S,icon:"\uD83C\uDF10"},{val:w,icon:"▶"},{val:D,icon:"♪"},{val:C,icon:"P"}].filter(e=>e.val);return`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8"/>
    <title>${t}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            direction: rtl; 
            color: #111; 
            padding: 30px; 
            font-size: ${z||13}px; 
            background: #fff;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 3px solid ${E};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${A||24}px; 
            font-weight: 800; 
            color: ${E}; 
            margin-bottom: 2px;
        }
        .company-subtitle { 
            font-size: ${k||14}px; 
            color: #666; 
            margin-bottom: 8px;
        }
        .company-info { font-size: 0.8rem; color: #555; line-height: 1.4; }

        .document-title-block { text-align: center; margin: 5px 0 15px; }
        .document-title { 
            font-size: ${P||28}px; 
            margin-bottom: 4px; 
            color: #1e293b;
            font-weight: 800;
        }
        .document-date { font-size: 0.85rem; color: #888; }

        .logo-img { 
            max-width: ${d||70}px; 
            max-height: ${d||70}px; 
            object-fit: contain; 
        }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: auto; }
        th { background: #1e293b; color: #fff; padding: 12px 10px; text-align: right; border: 1px solid #1e293b; }
        td { padding: 10px; border: 1px solid #eee; }
        tr:nth-child(even) td { background: #f9f9f9; }

        .footer { 
            margin-top: 40px; 
            border-top: 1px solid #eee; 
            padding-top: 15px; 
            text-align: ${x||"center"};
        }
        .footer-text { 
            font-size: ${u||13}px; 
            color: #666; 
            margin-bottom: 10px; 
        }

        .socials { 
            display: flex; 
            gap: 10px; 
            justify-content: ${"left"===$?"flex-start":"right"===$?"flex-end":"center"};
            margin-bottom: 15px;
        }
        .social-icon { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 24px; 
            height: 24px; 
            background: ${E}; 
            color: #fff; 
            border-radius: 4px; 
            font-size: 0.75rem;
            font-weight: bold;
        }

        .seal-container { 
            text-align: ${f||"right"}; 
            margin-top: 15px; 
        }
        .seal-img { 
            max-width: ${b||120}px; 
            max-height: ${b||120}px; 
            object-fit: contain; 
        }

        .print-only-footer { font-size: 0.7rem; color: #999; margin-top: 20px; text-align: center; }

        @media print { 
            body { padding: 0; } 
            @page { margin: 15mm; } 
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-right">
            <h1 class="company-name">${n}</h1>
            <p class="company-subtitle">${l}</p>
            <div class="company-info">
                ${s?`<div>📍 ${s}</div>`:""}
                ${i?`<div>📞 ${i}${o?` | ${o}`:""}</div>`:""}
            </div>
        </div>
        <div class="header-left">
            ${m&&c?`<img src="${c}" class="logo-img" alt="Logo" />`:""}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${t}</h2>
        <p class="document-date">بتاريخ: ${L}</p>
    </div>

    <main class="content">
        ${e}
    </main>

    ${g?`
    <footer class="footer">
        <div class="footer-text">${h}</div>
        
        <div class="socials">
            ${W.map(e=>`<span class="social-icon">${e.icon}</span>`).join("")}
        </div>

        ${y?`
        <div class="seal-container">
            <img src="${y}" class="seal-img" alt="Seal" />
        </div>`:""}

        <div class="print-only-footer">
            طبع بواسطة نظام ${n} — ${new Date().toLocaleString("ar-EG")}
        </div>
    </footer>
    `:""}
</body>
</html>`}},97559:(e,t,a)=>{"use strict";a.r(t),a.d(t,{$$typeof:()=>i,__esModule:()=>s,default:()=>o});var n=a(68570);let l=(0,n.createProxy)(String.raw`E:\STAND-EG\src\app\clients\page.tsx`),{__esModule:s,$$typeof:i}=l;l.default;let o=(0,n.createProxy)(String.raw`E:\STAND-EG\src\app\clients\page.tsx#default`)},73881:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>l});var n=a(66621);let l=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,n.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),n=t.X(0,[8948,5266,6621,4e3],()=>a(15442));module.exports=n})();