(()=>{var e={};e.id=9597,e.ids=[9597],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71017:e=>{"use strict";e.exports=require("path")},57310:e=>{"use strict";e.exports=require("url")},83460:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>m,originalPathname:()=>d,pages:()=>p,routeModule:()=>h,tree:()=>c}),a(93395),a(18221),a(35866);var s=a(23191),n=a(88716),l=a(37922),i=a.n(l),o=a(95231),r={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(r[e]=()=>o[e]);a.d(t,r);let c=["",{children:["suppliers",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,93395)),"E:\\STAND-EG\\src\\app\\suppliers\\page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,18221)),"E:\\STAND-EG\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],p=["E:\\STAND-EG\\src\\app\\suppliers\\page.tsx"],d="/suppliers/page",m={require:a,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/suppliers/page",pathname:"/suppliers",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},81071:(e,t,a)=>{Promise.resolve().then(a.bind(a,73567))},39730:(e,t,a)=>{"use strict";a.d(t,{Z:()=>s});let s=(0,a(25578).Z)("message-circle",[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}]])},44389:(e,t,a)=>{"use strict";a.d(t,{Z:()=>s});let s=(0,a(25578).Z)("pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]])},88307:(e,t,a)=>{"use strict";a.d(t,{Z:()=>s});let s=(0,a(25578).Z)("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]])},98091:(e,t,a)=>{"use strict";a.d(t,{Z:()=>s});let s=(0,a(25578).Z)("trash-2",[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]])},73567:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>d});var s=a(10326),n=a(17577);a(17196);var l=a(88307),i=a(16671),o=a(44389),r=a(39730),c=a(98091);let p=(0,a(25578).Z)("plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);function d(){let[e,t]=(0,n.useState)([]),[a,d]=(0,n.useState)(!0),[m,h]=(0,n.useState)(!1),[x,u]=(0,n.useState)(!1),[g,y]=(0,n.useState)({name:"",type:"MATERIAL",address:"",balance:0,phones:[{phone:"",isPrimaryWhatsApp:!0}]}),[b,f]=(0,n.useState)(null),[j,v]=(0,n.useState)([]),[N,S]=(0,n.useState)(null),[A,k]=(0,n.useState)(0),[w,C]=(0,n.useState)("CASH"),[P,z]=(0,n.useState)(""),$=e=>{O("ALL"===e?"ALL":parseInt(e,10)),localStorage.setItem("erp_suppliers_pageSize",e),R(1)},E=async()=>{d(!0);try{let e=await fetch("/api/suppliers"),a=await e.json();t(Array.isArray(a)?a.map(e=>({...e,phones:e.phones||[]})):[])}catch(e){console.error(e)}d(!1)},L=async e=>{if(e.preventDefault(),0===g.phones.length||!g.phones.some(e=>e.isPrimaryWhatsApp))return alert("يجب إضافة رقم هاتف واحد على الأقل وتحديده كرقم واتساب أساسي");let t=b?{...g,id:b}:g,a=await fetch("/api/suppliers",{method:b?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(a.ok)u(!1),f(null),y({name:"",type:"MATERIAL",address:"",balance:0,phones:[{phone:"",isPrimaryWhatsApp:!0}]}),E();else{let e=await a.json();alert(`❌ خطأ: ${e.error}`)}},D=e=>{f(e.id),y({name:e.name,type:e.type,address:e.address||"",balance:e.balance,phones:e.phones.length>0?e.phones.map(e=>({phone:e.phone,isPrimaryWhatsApp:e.isPrimaryWhatsApp})):[{phone:"",isPrimaryWhatsApp:!0}]}),u(!0)},T=(e,t)=>{let a=[...g.phones];a[e].phone=t,y({...g,phones:a})},F=e=>{let t=g.phones.map((t,a)=>({...t,isPrimaryWhatsApp:a===e}));y({...g,phones:t})},_=e=>{if(g.phones.length<=1)return;let t=g.phones.filter((t,a)=>a!==e);t.some(e=>e.isPrimaryWhatsApp)||(t[0].isPrimaryWhatsApp=!0),y({...g,phones:t})},I=async(e,t)=>{confirm(`هل أنت متأكد من حذف المورد: ${t}؟`)&&(await fetch(`/api/suppliers?id=${e}`,{method:"DELETE"}),E())},M=async e=>{if(e.preventDefault(),N)try{await fetch("/api/suppliers/payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({supplierId:N.id,amount:A,method:w,treasuryId:P})}),S(null),E(),alert("تم تسجيل الدفعة بنجاح")}catch(e){alert("حدث خطأ")}},[W,Z]=(0,n.useState)(""),[q,R]=(0,n.useState)(1),[G,O]=(0,n.useState)(5),U=e.filter(e=>e.name.includes(W)||e.type&&e.type.includes(W)||e.phones.some(e=>e.phone.includes(W))||e.serial&&`S-${e.serial}`.includes(W)),J="ALL"===G?1:Math.ceil(U.length/G),H="ALL"===G?U:U.slice((q-1)*G,q*G),V=e.reduce((e,t)=>e+t.balance,0);return(0,s.jsxs)("div",{className:"unified-container animate-fade-in",children:[(0,s.jsxs)("header",{className:"page-header",children:[(0,s.jsxs)("div",{children:[s.jsx("h1",{className:"page-title",children:"\uD83C\uDFE2 إدارة الموردين"}),(0,s.jsxs)("p",{className:"page-subtitle",children:["إجمالي المستحقات:"," ",(0,s.jsxs)("span",{style:{color:V>0?"#ff5252":"#66bb6a",fontWeight:"bold"},children:[m?V.toLocaleString("en-US"):"0"," ج.م"]})]})]}),s.jsx("div",{className:"header-actions",children:s.jsx("button",{onClick:()=>{f(null),y({name:"",type:"MATERIAL",address:"",balance:0,phones:[{phone:"",isPrimaryWhatsApp:!0}]}),u(!0)},className:"btn-modern btn-primary",children:"➕ مورد جديد"})})]}),(0,s.jsxs)("div",{className:"content-centered-wrapper",children:[(0,s.jsxs)("div",{className:"glass-panel",style:{padding:"1rem",marginBottom:"1.5rem"},children:[(0,s.jsxs)("div",{style:{position:"relative"},children:[s.jsx(l.Z,{style:{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"},size:20}),s.jsx("input",{type:"text",className:"input-glass",placeholder:"ابحث بالاسم، النشاط، رقم الهاتف أو الكود (S-1)...",value:W,onChange:e=>{Z(e.target.value),R(1)},"aria-label":"بحث عن مورد",style:{width:"100%",paddingRight:"45px",height:"52px"}})]}),(0,s.jsxs)("div",{style:{marginTop:"10px",fontSize:"0.85rem",color:"#919398"},children:["تم العثور على: ",s.jsx("strong",{style:{color:"#fff"},children:U.length})," مورد"]})]}),s.jsx("div",{className:"glass-panel",children:a?s.jsx("p",{children:"⏳ جاري تحميل البيانات..."}):(0,s.jsxs)(s.Fragment,{children:[s.jsx("div",{className:"smart-table-container",children:(0,s.jsxs)("table",{className:"smart-table",children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{className:"hide-on-tablet",style:{width:"80px"},children:"الكود"}),s.jsx("th",{children:"المورد / النشاط"}),s.jsx("th",{className:"text-center",children:"الرصيد المستحق"}),s.jsx("th",{className:"hide-on-tablet text-center",children:"الهاتف الأساسي"}),s.jsx("th",{className:"text-left",children:"الإجراءات"})]})}),s.jsx("tbody",{children:H.map(e=>{let t=e.phones.find(e=>e.isPrimaryWhatsApp)||e.phones[0];return(0,s.jsxs)("tr",{children:[(0,s.jsxs)("td",{className:"hide-on-tablet",style:{fontWeight:600,color:"var(--primary-color)"},children:["S-",e.serial||"---"]}),(0,s.jsxs)("td",{children:[s.jsx("div",{className:"mobile-card-title",children:e.name}),s.jsx("div",{className:`type-badge ${e.type} hide-on-tablet`,children:"PAINT"===e.type?"\uD83C\uDFA8 دهانات":"ALUMINUM"===e.type?"⚙️ ألومنيوم":"MATERIAL"===e.type?"\uD83D\uDCE6 خامات":"⚒️ خارجي"})]}),s.jsx("td",{"data-label":"الرصيد",className:"text-center",children:(0,s.jsxs)("div",{className:e.balance>0?"mobile-card-balance balance-red":"mobile-card-balance balance-green",children:[e.balance.toLocaleString("en-US")," ",s.jsx("span",{style:{fontSize:"0.8rem",fontWeight:"normal"},children:"ج.م"})]})}),s.jsx("td",{className:"hide-on-tablet","data-label":"الهاتف",children:(0,s.jsxs)("div",{children:[s.jsx("span",{children:t?.phone}),e.phones.length>1&&(0,s.jsxs)("span",{className:"phone-tag",children:["+",e.phones.length-1]})]})}),s.jsx("td",{"data-label":"الإجراءات",children:(0,s.jsxs)("div",{className:"action-bar-cell mobile-card-actions",children:[s.jsx("button",{onClick:()=>S(e),className:"btn-action",title:"سداد مالي",children:s.jsx(i.Z,{size:20})}),s.jsx("button",{onClick:()=>D(e),className:"btn-action btn-edit",title:"تعديل",children:s.jsx(o.Z,{size:20})}),t?.phone&&s.jsx("button",{onClick:()=>{let e=t.phone.replace(/\D/g,"");window.open(`https://wa.me/${e}`,"_blank")},className:"btn-action btn-whatsapp",title:"واتساب",children:s.jsx(r.Z,{size:20})}),s.jsx("button",{onClick:()=>I(e.id,e.name),className:"btn-action btn-danger",title:"حذف",children:s.jsx(c.Z,{size:20})})]})})]},e.id)})})]})}),(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginTop:"2rem",flexWrap:"wrap-reverse",gap:"20px",padding:"15px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid var(--border-color)"},children:[(0,s.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.2)",padding:"5px 15px",borderRadius:"20px"},children:[s.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.85rem"},children:"عدد النتائج:"}),(0,s.jsxs)("select",{value:G,onChange:e=>$(e.target.value),style:{padding:"0px",fontSize:"0.9rem",width:"auto",border:"none",background:"transparent",color:"var(--primary-color)",fontWeight:"bold",cursor:"pointer",outline:"none"},"aria-label":"Items per page",children:[s.jsx("option",{style:{color:"#000"},value:5,children:"5"}),s.jsx("option",{style:{color:"#000"},value:10,children:"10"}),s.jsx("option",{style:{color:"#000"},value:20,children:"20"}),s.jsx("option",{style:{color:"#000"},value:50,children:"50"}),s.jsx("option",{style:{color:"#000"},value:"ALL",children:"الكل"})]})]}),J>1&&(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flex:"1 1 auto",maxWidth:"350px"},children:[s.jsx("button",{disabled:1===q,onClick:()=>R(e=>e-1),className:"btn-modern btn-secondary",style:{opacity:1===q?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"→ السابق"}),(0,s.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:"60px",background:"rgba(227,94,53,0.1)",color:"var(--primary-color)",borderRadius:"10px",padding:"6px 12px",fontWeight:"bold",fontSize:"0.9rem",direction:"ltr",whiteSpace:"nowrap",border:"1px solid rgba(227,94,53,0.2)"},children:[q," / ",J]}),s.jsx("button",{disabled:q===J,onClick:()=>R(e=>e+1),className:"btn-modern btn-secondary",style:{opacity:q===J?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"التالي ←"})]})]})]})})]}),x&&s.jsx("div",{className:"modal-overlay",children:(0,s.jsxs)("div",{className:"modal-content",children:[(0,s.jsxs)("div",{className:"modal-header",children:[(0,s.jsxs)("h2",{className:"modal-title",children:[b?s.jsx(o.Z,{size:20,className:"text-orange-400"}):s.jsx(p,{size:20,className:"text-blue-400"}),b?"تعديل بيانات المورد":"إضافة مورد جديد"]}),s.jsx("button",{onClick:()=>u(!1),className:"close-btn",title:"إغلاق",children:"✕"})]}),(0,s.jsxs)("form",{onSubmit:L,className:"modal-body custom-scroll",children:[(0,s.jsxs)("div",{className:"mb-3",children:[s.jsx("label",{className:"field-label",htmlFor:"sup-name",children:"اسم المورد / المصنع"}),s.jsx("input",{id:"sup-name",type:"text",className:"input-glass",value:g.name,onChange:e=>y({...g,name:e.target.value}),required:!0,placeholder:"مثال: شركة الهدى للألومنيوم"})]}),(0,s.jsxs)("div",{className:"flex-between mb-3",children:[(0,s.jsxs)("div",{style:{flex:1},children:[s.jsx("label",{className:"field-label",htmlFor:"sup-type",children:"نوع النشاط"}),(0,s.jsxs)("select",{id:"sup-type",className:"input-glass",value:g.type,onChange:e=>y({...g,type:e.target.value}),children:[s.jsx("option",{value:"MATERIAL",children:"خامات عامة وحديد"}),s.jsx("option",{value:"PAINT",children:"مصنع دهان الكتروستاتيك"}),s.jsx("option",{value:"ALUMINUM",children:"ألومنيوم وقطاعات"}),s.jsx("option",{value:"EXTERNAL",children:"تشغيل خارجي للغير"})]})]}),(0,s.jsxs)("div",{style:{flex:1},children:[s.jsx("label",{className:"field-label",htmlFor:"sup-balance",children:"الرصيد الافتتاحي (ج.م)"}),s.jsx("input",{id:"sup-balance",type:"number",className:"input-glass",value:g.balance,onChange:e=>y({...g,balance:parseFloat(e.target.value)})})]})]}),(0,s.jsxs)("div",{className:"mb-3",children:[s.jsx("label",{className:"field-label",children:"عنوان المورد"}),s.jsx("input",{type:"text",className:"input-glass",value:g.address,onChange:e=>y({...g,address:e.target.value}),placeholder:"العنوان بالتفصيل..."})]}),(0,s.jsxs)("div",{className:"flex-column mb-3",children:[(0,s.jsxs)("div",{className:"flex-between",children:[s.jsx("label",{className:"field-label",style:{margin:0},children:"\uD83D\uDCF1 أرقام الهاتف"}),s.jsx("button",{type:"button",onClick:()=>y({...g,phones:[...g.phones,{phone:"",isPrimaryWhatsApp:!1}]}),title:"إضافة رقم إضافي",style:{background:"var(--primary-color)",color:"#fff",border:"none",borderRadius:"4px",padding:"2px 8px",fontSize:"0.8rem",cursor:"pointer"},children:"+ إضافة رقم"})]}),s.jsx("div",{className:"flex-column",children:g.phones.map((e,t)=>(0,s.jsxs)("div",{className:"flex-group",children:[(0,s.jsxs)("div",{style:{flex:1,position:"relative"},children:[s.jsx("input",{type:"text",className:"input-glass",value:e.phone,onChange:e=>T(t,e.target.value),placeholder:"رقم الهاتف",required:0===t,style:{paddingRight:"35px"}}),s.jsx("div",{style:{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)"},children:s.jsx("input",{type:"radio",name:"primary-wa",checked:e.isPrimaryWhatsApp,onChange:()=>F(t),style:{cursor:"pointer"},title:"تحديد كواتساب أساسي"})})]}),g.phones.length>1&&s.jsx("button",{type:"button",onClick:()=>_(t),title:"حذف",style:{background:"#fff",border:"1px solid #ccc",color:"#000",borderRadius:"4px",padding:"10px",cursor:"pointer"},children:s.jsx(c.Z,{size:16})})]},t))})]}),(0,s.jsxs)("div",{className:"modal-actions",children:[s.jsx("button",{type:"button",onClick:()=>u(!1),className:"btn-modern btn-secondary flex-1",children:"إلغاء"}),s.jsx("button",{type:"submit",className:"btn-modern btn-primary flex-1",children:"حفظ البيانات"})]})]})]})}),N&&s.jsx("div",{className:"modal-overlay",children:(0,s.jsxs)("div",{className:"modal-content",children:[(0,s.jsxs)("div",{className:"modal-header",children:[(0,s.jsxs)("h2",{className:"modal-title",children:[s.jsx(i.Z,{size:20,className:"text-green-400"}),"تسجيل دفعة: ",N.name]}),s.jsx("button",{onClick:()=>S(null),className:"close-btn",title:"إغلاق",children:"✕"})]}),(0,s.jsxs)("form",{onSubmit:M,className:"modal-body custom-scroll",children:[(0,s.jsxs)("div",{className:"mb-3",children:[s.jsx("label",{className:"field-label",htmlFor:"pay-amt",children:"المبلغ المدفوع (ج.م)"}),s.jsx("input",{id:"pay-amt",type:"number",className:"input-glass",value:A||"",onChange:e=>k(parseFloat(e.target.value)),required:!0,autoFocus:!0})]}),(0,s.jsxs)("div",{className:"mb-3",children:[s.jsx("label",{className:"field-label",htmlFor:"pay-method",children:"طريقة الدفع"}),(0,s.jsxs)("select",{id:"pay-method",className:"input-glass",value:w,onChange:e=>C(e.target.value),children:[s.jsx("option",{value:"CASH",children:"نقدي (كاش)"}),s.jsx("option",{value:"BANK",children:"تحويل بنكي"}),s.jsx("option",{value:"VODAFONE",children:"فودافون كاش"})]})]}),(0,s.jsxs)("div",{className:"mb-3",children:[s.jsx("label",{className:"field-label",htmlFor:"pay-tres",children:"سحب من خزينة"}),s.jsx("select",{id:"pay-tres",className:"input-glass",value:P,onChange:e=>z(e.target.value),children:j.map(e=>s.jsx("option",{value:e.id,children:e.name},e.id))})]}),(0,s.jsxs)("div",{className:"modal-actions",children:[s.jsx("button",{type:"button",onClick:()=>S(null),className:"btn-modern btn-secondary flex-1",children:"إلغاء"}),s.jsx("button",{type:"submit",className:"btn-modern btn-success flex-1",style:{background:"linear-gradient(135deg, #66bb6a 0%, #43a047 100%)",border:"none",color:"white"},children:"تأكيد الدفع"})]})]})]})})]})}},17196:(e,t,a)=>{"use strict";a.d(t,{Qf:()=>i,Wp:()=>l});let s=null,n=0;async function l(){let e=Date.now();if(s&&e-n<3e4)return s;let t={},a={},l={};try{t=JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{}try{a=JSON.parse(localStorage.getItem("erp_invoice_template")||"{}")}catch{}try{l=JSON.parse(localStorage.getItem("erp_unified_report_config")||"{}")}catch{}let i={};try{let e=await fetch("/api/settings",{cache:"no-store"});e.ok&&(i=await e.json())}catch{}let o={companyName:i.appName||l.companyName||a.companyName||t.appName||"Stand Masr",companySubtitle:i.appSubtitle||l.companySubtitle||a.companySubtitle||"",companyAddress:i.companyAddress||l.companyAddress||a.companyAddress||"",companyPhone:i.companyPhone||l.companyPhone||a.companyPhone||"",companyPhone2:i.companyPhone2||l.companyPhone2||a.companyPhone2||"",companyEmail:i.companyEmail||l.companyEmail||a.companyEmail||"",companyTax:i.companyTax||l.companyTax||a.companyTax||"",companyCommercial:i.companyCommercial||l.companyCommercial||a.companyCommercial||"",accentColor:i.primaryColor||l.accentColor||a.accentColor||t.primaryColor||"#E35E35",appLogo:i.appLogo||l.printLogoCustom||a.printLogoCustom||l.appLogo||t.appLogo||"",printLogoSize:i.printLogoSize||l.printLogoSize||a.printLogoSize||70,logoShape:i.logoShape||l.logoShape||a.logoShape||t.logoShape||"rounded",logoPosition:i.logoPosition||l.logoPosition||a.logoPosition||"right",showLogo:l.showLogo??a.showLogo??!0,footerText:i.footerText||l.footerText||a.footerText||"شكراً لتعاملكم معنا",footerAlign:i.footerAlign||l.footerAlign||"center",footerFontSize:l.footerFontSize||13,showFooter:l.showFooter??!0,sealImage:i.footerSealImage||l.sealImage||"",sealAlign:i.footerSealAlign||l.sealAlign||"right",sealSize:i.footerSealSize||l.sealSize||120,currencySymbol:i.currencySymbol||t.currencySymbol||"ج.م",whatsapp:i.whatsapp||l.whatsapp||"",facebook:i.facebook||l.facebook||"",instagram:i.instagram||l.instagram||"",website:i.website||l.website||"",youtube:i.youtube||l.youtube||"",tiktok:i.tiktok||l.tiktok||"",pinterest:i.pinterest||l.pinterest||"",socialAlign:l.socialAlign||"center",companyNameFontSize:l.companyNameFontSize||24,companySubtitleFontSize:l.companySubtitleFontSize||14,titleFontSize:l.titleFontSize||28,baseFontSize:l.fontSize||13};return s=o,n=e,o}function i(e,t,a){let{companyName:s,companySubtitle:n,companyAddress:l,companyPhone:i,companyPhone2:o,accentColor:r,appLogo:c,printLogoSize:p,logoPosition:d,showLogo:m,footerText:h,footerAlign:x,footerFontSize:u,showFooter:g,sealImage:y,sealAlign:b,sealSize:f,whatsapp:j,facebook:v,instagram:N,website:S,youtube:A,tiktok:k,pinterest:w,socialAlign:C,companyNameFontSize:P,companySubtitleFontSize:z,titleFontSize:$,baseFontSize:E}=a,L=r||"#E35E35",D=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),T=[{val:j,icon:"\uD83D\uDCDE"},{val:v,icon:"f"},{val:N,icon:"\uD83D\uDCF8"},{val:S,icon:"\uD83C\uDF10"},{val:A,icon:"▶"},{val:k,icon:"♪"},{val:w,icon:"P"}].filter(e=>e.val);return`<!DOCTYPE html>
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
            font-size: ${E||13}px; 
            background: #fff;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 3px solid ${L};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${P||24}px; 
            font-weight: 800; 
            color: ${L}; 
            margin-bottom: 2px;
        }
        .company-subtitle { 
            font-size: ${z||14}px; 
            color: #666; 
            margin-bottom: 8px;
        }
        .company-info { font-size: 0.8rem; color: #555; line-height: 1.4; }

        .document-title-block { text-align: center; margin: 5px 0 15px; }
        .document-title { 
            font-size: ${$||28}px; 
            margin-bottom: 4px; 
            color: #1e293b;
            font-weight: 800;
        }
        .document-date { font-size: 0.85rem; color: #888; }

        .logo-img { 
            max-width: ${p||70}px; 
            max-height: ${p||70}px; 
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
            justify-content: ${"left"===C?"flex-start":"right"===C?"flex-end":"center"};
            margin-bottom: 15px;
        }
        .social-icon { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 24px; 
            height: 24px; 
            background: ${L}; 
            color: #fff; 
            border-radius: 4px; 
            font-size: 0.75rem;
            font-weight: bold;
        }

        .seal-container { 
            text-align: ${b||"right"}; 
            margin-top: 15px; 
        }
        .seal-img { 
            max-width: ${f||120}px; 
            max-height: ${f||120}px; 
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
            <h1 class="company-name">${s}</h1>
            <p class="company-subtitle">${n}</p>
            <div class="company-info">
                ${l?`<div>📍 ${l}</div>`:""}
                ${i?`<div>📞 ${i}${o?` | ${o}`:""}</div>`:""}
            </div>
        </div>
        <div class="header-left">
            ${m&&c?`<img src="${c}" class="logo-img" alt="Logo" />`:""}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${t}</h2>
        <p class="document-date">بتاريخ: ${D}</p>
    </div>

    <main class="content">
        ${e}
    </main>

    ${g?`
    <footer class="footer">
        <div class="footer-text">${h}</div>
        
        <div class="socials">
            ${T.map(e=>`<span class="social-icon">${e.icon}</span>`).join("")}
        </div>

        ${y?`
        <div class="seal-container">
            <img src="${y}" class="seal-img" alt="Seal" />
        </div>`:""}

        <div class="print-only-footer">
            طبع بواسطة نظام ${s} — ${new Date().toLocaleString("ar-EG")}
        </div>
    </footer>
    `:""}
</body>
</html>`}},93395:(e,t,a)=>{"use strict";a.r(t),a.d(t,{$$typeof:()=>i,__esModule:()=>l,default:()=>o});var s=a(68570);let n=(0,s.createProxy)(String.raw`E:\STAND-EG\src\app\suppliers\page.tsx`),{__esModule:l,$$typeof:i}=n;n.default;let o=(0,s.createProxy)(String.raw`E:\STAND-EG\src\app\suppliers\page.tsx#default`)},73881:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});var s=a(66621);let n=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,s.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[8948,5266,6621,4e3],()=>a(83460));module.exports=s})();