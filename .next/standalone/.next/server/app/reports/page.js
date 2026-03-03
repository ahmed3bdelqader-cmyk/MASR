(()=>{var e={};e.id=882,e.ids=[882],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71017:e=>{"use strict";e.exports=require("path")},57310:e=>{"use strict";e.exports=require("url")},67806:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),a(74174),a(18221),a(35866);var r=a(23191),l=a(88716),o=a(37922),n=a.n(o),i=a(95231),s={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(s[e]=()=>i[e]);a.d(t,s);let d=["",{children:["reports",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,74174)),"E:\\STAND-EG\\src\\app\\reports\\page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,18221)),"E:\\STAND-EG\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["E:\\STAND-EG\\src\\app\\reports\\page.tsx"],p="/reports/page",x={require:a,loadChunk:()=>Promise.resolve()},h=new r.AppPageRouteModule({definition:{kind:l.x.APP_PAGE,page:"/reports/page",pathname:"/reports",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},34826:(e,t,a)=>{Promise.resolve().then(a.bind(a,248))},248:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>s});var r=a(10326),l=a(17577),o=a(90434),n=a(17196);let i=[{key:"sales",label:"تقرير المبيعات",icon:"\uD83E\uDDFE",color:"#E35E35",desc:"إجمالي الفواتير والمدفوعات والمتأخرة"},{key:"purchases",label:"تقرير المشتريات",icon:"\uD83D\uDCE6",color:"#29b6f6",desc:"فواتير التوريد والموردين والمبالغ"},{key:"treasury",label:"تقرير الخزينة",icon:"\uD83C\uDFE6",color:"#66bb6a",desc:"حركات الخزينة والأرصدة"},{key:"inventory",label:"تقرير المخزن",icon:"\uD83D\uDCCA",color:"#ffa726",desc:"جرد المواد والمنتجات والقيمة الكلية"},{key:"jobs",label:"تقرير التصنيع",icon:"\uD83C\uDFED",color:"#ab47bc",desc:"أوامر التصنيع والأرباح والتكاليف"},{key:"clients",label:"تقرير العملاء",icon:"\uD83D\uDC65",color:"#26c6da",desc:"أرصدة وديون وسجل تحصيلات العملاء"},{key:"attendance",label:"تقرير الحضور والإنصراف",icon:"\uD83D\uDCC5",color:"#ff7043",desc:"سجل حضور الموظفين والغياب والمكافآت"},{key:"salaries",label:"تقرير رواتب الموظفين",icon:"\uD83D\uDCB8",color:"#ec407a",desc:"كشف المرتبات والخصومات والسلف"}];function s(){let[e,t]=(0,l.useState)([]),[a,s]=(0,l.useState)([]),[d,c]=(0,l.useState)([]),[p,x]=(0,l.useState)([]),[h,m]=(0,l.useState)([]),[g,u]=(0,l.useState)([]),[b,y]=(0,l.useState)([]),[f,j]=(0,l.useState)([]),[v,S]=(0,l.useState)("sales"),[$,A]=(0,l.useState)(!0),[D,E]=(0,l.useState)(""),[C,P]=(0,l.useState)(""),[k,N]=(0,l.useState)({image:"",align:"right",size:"120"}),[L,w]=(0,l.useState)(1),[z,T]=(0,l.useState)(5),I=(()=>{try{return JSON.parse(localStorage.getItem("erp_settings")||"{}").currencySymbol||"ج.م"}catch{return"ج.م"}})();(()=>{try{return JSON.parse(localStorage.getItem("erp_settings")||"{}").appName||"Stand Masr ERP"}catch{return"Stand Masr ERP"}})();let F=e=>{T("ALL"===e?"ALL":parseInt(e,10)),localStorage.setItem("erp_reports_pageSize",e),w(1)},R=(e,t="date")=>D||C?e.filter(e=>{let a=new Date(e[t]||e.createdAt);return!(D&&a<new Date(D)||C&&a>new Date(C+"T23:59:59"))}):e,W=e=>{let t="ALL"===z?1:Math.ceil(e.length/z)||1,a=L>t?t:L;return{paginated:"ALL"===z?e:e.slice((a-1)*z,a*z),totalPages:t,validPage:a}},_=({totalPages:e,validPage:t})=>e?(0,r.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginTop:"2rem",flexWrap:"wrap-reverse",gap:"20px",padding:"15px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid var(--border-color)"},children:[(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.2)",padding:"5px 15px",borderRadius:"20px"},children:[r.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.85rem"},children:"عدد النتائج:"}),(0,r.jsxs)("select",{value:z,onChange:e=>F(e.target.value),style:{padding:"0px",fontSize:"0.9rem",width:"auto",border:"none",background:"transparent",color:"var(--primary-color)",fontWeight:"bold",cursor:"pointer",outline:"none"},"aria-label":"Items per page",children:[r.jsx("option",{style:{color:"#000"},value:5,children:"5"}),r.jsx("option",{style:{color:"#000"},value:10,children:"10"}),r.jsx("option",{style:{color:"#000"},value:20,children:"20"}),r.jsx("option",{style:{color:"#000"},value:50,children:"50"}),r.jsx("option",{style:{color:"#000"},value:100,children:"100"}),r.jsx("option",{style:{color:"#000"},value:"ALL",children:"الكل"})]})]}),e>1&&(0,r.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flex:"1 1 auto",maxWidth:"350px"},children:[r.jsx("button",{disabled:1===t,onClick:()=>w(e=>e-1),className:"btn-modern btn-secondary",style:{opacity:1===t?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"→ السابق"}),(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:"60px",background:"rgba(227,94,53,0.1)",color:"var(--primary-color)",borderRadius:"10px",padding:"6px 12px",fontWeight:"bold",fontSize:"0.9rem",direction:"ltr",whiteSpace:"nowrap",border:"1px solid rgba(227,94,53,0.2)"},children:[t," / ",e]}),r.jsx("button",{disabled:t===e,onClick:()=>w(e=>e+1),className:"btn-modern btn-secondary",style:{opacity:t===e?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"التالي ←"})]})]}):null,G=()=>{let t=R(e,"createdAt");return{total:t.reduce((e,t)=>e+(t.total||0),0),count:t.length,paid:t.filter(e=>"PAID"===e.status).length,unpaid:t.filter(e=>"UNPAID"===e.status||"PARTIAL"===e.status).reduce((e,t)=>e+(t.total||0),0)}},U=()=>{let e=p.filter(e=>"MANUFACTURED_PRICING"!==e.category);return{count:e.length,value:e.reduce((e,t)=>e+t.stock*(t.lastPurchasedPrice||0),0),low:e.filter(e=>e.stock<=5).length}},M=()=>{let e=R(h,"createdAt");return{count:e.length,totalCost:e.reduce((e,t)=>e+(t.totalMaterialCost||0)+(t.totalOperatingCost||0),0),totalProfit:e.reduce((e,t)=>e+(t.netProfit||0),0)}},O=()=>{let e=R(b,"dateStr");return{present:e.filter(e=>"PRESENT"===e.status).length,late:e.filter(e=>"LATE"===e.status).length,absent:e.filter(e=>"ABSENT"===e.status).length,sick:e.filter(e=>"SICK"===e.status).length,count:e.length}},B=()=>{let e=R(f,"date");return{totalSpent:e.reduce((e,t)=>e+(t.amount||0),0),count:e.length,advances:e.filter(e=>"ADVANCE"===e.type).reduce((e,t)=>e+(t.amount||0),0),bonuses:e.filter(e=>"BONUS"===e.type).reduce((e,t)=>e+(t.amount||0),0)}},q=async()=>{let t=i.find(e=>e.key===v),r=await (0,n.Wp)(),l=[],o="",s="";if("sales"===v){let t=R(e,"createdAt"),a=G();l=["#","رقم الفاتورة","العميل","التاريخ","الإجمالي","الحالة"],o=t.map((e,t)=>`
                <tr>
                    <td>${t+1}</td>
                    <td>${e.invoiceNo}</td>
                    <td>${e.client?.name||"-"}</td>
                    <td>${new Date(e.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td>${e.total?.toLocaleString("en-US")} ${I}</td>
                    <td>${"PAID"===e.status?"مدفوعة":"غير مدفوعة"}</td>
                </tr>
            `).join(""),s=`<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>الإجمالي: ${a.total.toLocaleString("en-US")} ${I}</strong> | فواتير: ${a.count}
            </div>`}else if("inventory"===v){let e=p.filter(e=>"MANUFACTURED_PRICING"!==e.category),t=U();l=["#","الصنف","النوع","الكمية","الوحدة","سعر الوحدة","القيمة"],o=e.map((e,t)=>`
                <tr>
                    <td>${t+1}</td>
                    <td>${e.name}</td>
                    <td>${"MATERIAL"===e.type?"خامة":"منتج"}</td>
                    <td>${e.stock}</td>
                    <td>${e.unit}</td>
                    <td>${e.lastPurchasedPrice?.toLocaleString("en-US")} ${I}</td>
                    <td>${(e.stock*(e.lastPurchasedPrice||0)).toLocaleString("en-US")} ${I}</td>
                </tr>
            `).join(""),s=`<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>إجمالي القيمة: ${t.value.toLocaleString("en-US")} ${I}</strong> | أصناف: ${t.count}
            </div>`}else if("jobs"===v){let e=R(h,"createdAt"),t=M();l=["#","اسم الشغلانة","الحالة","تكلفة الخامات","تكلفة التشغيل","صافي الربح"],o=e.map(e=>`
                <tr>
                    <td>${e.serialNo}</td>
                    <td>${e.name}</td>
                    <td>${"COMPLETED"===e.status?"مكتملة":"جارية"}</td>
                    <td>${e.totalMaterialCost?.toLocaleString("en-US")} ${I}</td>
                    <td>${e.totalOperatingCost?.toLocaleString("en-US")} ${I}</td>
                    <td>${(e.netProfit||0).toLocaleString("en-US")} ${I}</td>
                </tr>
            `).join(""),s=`<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>صافي الأرباح: ${t.totalProfit.toLocaleString("en-US")} ${I}</strong> | التكاليف: ${t.totalCost.toLocaleString("en-US")} ${I}
            </div>`}else if("clients"===v)l=["#","الاسم","المتجر","التليفون","العنوان"],o=g.map((e,t)=>`
                <tr>
                    <td>${e.serial||t+1}</td>
                    <td>${e.name}</td>
                    <td>${e.storeName||"-"}</td>
                    <td>${e.phone1||"-"}</td>
                    <td>${e.address||"-"}</td>
                </tr>
            `).join("");else if("purchases"===v)l=["#","رقم الفاتورة","المورد","التاريخ","الإجمالي"],o=R(a,"date").map((e,t)=>`
                <tr>
                    <td>${t+1}</td>
                    <td>${e.invoiceNo}</td>
                    <td>${e.supplier||"-"}</td>
                    <td>${new Date(e.date||e.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td>${e.totalAmount?.toLocaleString("en-US")} ${I}</td>
                </tr>
            `).join("");else if("attendance"===v)l=["#","الموظف","التاريخ","الحالة","الحضور","الانصراف"],o=R(b,"dateStr").map((e,t)=>`
                <tr>
                    <td>${t+1}</td>
                    <td>${e.employeeName}</td>
                    <td>${e.dateStr}</td>
                    <td>${"PRESENT"===e.status?"حاضر":"ABSENT"===e.status?"غائب":"تأخير"}</td>
                    <td>${e.checkIn?new Date(e.checkIn).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"-"}</td>
                    <td>${e.checkOut?new Date(e.checkOut).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"-"}</td>
                </tr>
            `).join("");else if("salaries"===v){let e=R(f,"date"),t=B();l=["#","الموظف","النوع","المبلغ","التاريخ","ملاحظات"],o=e.map((e,t)=>`
                <tr>
                    <td>${t+1}</td>
                    <td>${e.employeeName}</td>
                    <td>${"SALARY"===e.type?"راتب":"ADVANCE"===e.type?"سلفة":"مكافأة"}</td>
                    <td>${e.amount.toLocaleString("en-US")} ${I}</td>
                    <td>${new Date(e.date).toLocaleDateString("ar-EG")}</td>
                    <td>${e.note||"-"}</td>
                </tr>
            `).join(""),s=`<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <strong>إجمالي المنصرف: ${t.totalSpent.toLocaleString("en-US")} ${I}</strong>
            </div>`}let d=`
            <table>
                <thead>
                    <tr>${l.map(e=>`<th>${e}</th>`).join("")}</tr>
                </thead>
                <tbody>${o}</tbody>
            </table>
            ${s}
        `,c=(0,n.Qf)(d,t.label,r),x=document.createElement("iframe");x.style.display="none",document.body.appendChild(x),x.contentWindow?.document.open(),x.contentWindow?.document.write(c),x.contentWindow?.document.close(),x.onload=()=>{x.contentWindow?.focus(),x.contentWindow?.print(),setTimeout(()=>document.body.removeChild(x),2e3)}},Y=i.find(e=>e.key===v);return(0,r.jsxs)("div",{className:"animate-fade-in",children:[(0,r.jsxs)("header",{style:{marginBottom:"1.5rem",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px"},children:[(0,r.jsxs)("div",{children:[r.jsx("h1",{children:"\uD83D\uDCCA التقارير المفصلة"}),r.jsx("p",{children:"تقارير شاملة قابلة للحفظ والطباعة PDF لكل أقسام النظام"})]}),(0,r.jsxs)("div",{style:{display:"flex",gap:"8px"},children:[r.jsx(o.default,{href:"/reports/designer",className:"btn-modern btn-secondary",style:{padding:"8px 16px",borderRadius:"8px",textDecoration:"none",fontWeight:700,fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"6px"},children:"\uD83C\uDFA8 مصمم التقارير"}),r.jsx("button",{onClick:q,className:"btn-modern btn-primary",style:{padding:"8px 16px",borderRadius:"8px",fontWeight:700,fontSize:"0.85rem"},children:"\uD83D\uDDA8️ طباعة التقرير"})]})]}),(0,r.jsxs)("div",{className:"glass-panel",style:{padding:"1rem 1.5rem",marginBottom:"1.5rem",display:"flex",gap:"16px",alignItems:"center",flexWrap:"wrap"},children:[r.jsx("span",{id:"date_filter_label",style:{color:"#919398",fontWeight:600,fontSize:"0.9rem"},children:"\uD83D\uDCC5 تصفية بالتاريخ:"}),(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[r.jsx("label",{htmlFor:"date_from",style:{fontSize:"0.85rem",color:"#888"},children:"من"}),r.jsx("input",{id:"date_from",type:"date",className:"input-glass",value:D,onChange:e=>E(e.target.value),style:{padding:"6px 10px"},title:"تاريخ البداية"})]}),(0,r.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[r.jsx("label",{htmlFor:"date_to",style:{fontSize:"0.85rem",color:"#888"},children:"إلى"}),r.jsx("input",{id:"date_to",type:"date",className:"input-glass",value:C,onChange:e=>P(e.target.value),style:{padding:"6px 10px"},title:"تاريخ النهاية"})]}),(D||C)&&r.jsx("button",{onClick:()=>{E(""),P("")},style:{padding:"6px 12px",background:"rgba(227,94,53,0.1)",border:"1px solid rgba(227,94,53,0.3)",color:"#E35E35",borderRadius:"8px",cursor:"pointer",fontFamily:"inherit"},title:"مسح الفلترة",children:"✕ مسح الفلتر"})]}),(0,r.jsxs)("div",{className:"reports-grid",style:{alignItems:"start"},children:[(0,r.jsxs)("div",{className:"glass-panel report-sidebar-menu",style:{position:"sticky",top:"20px",maxHeight:"calc(100dvh - 40px)",overflowY:"auto"},children:[r.jsx("h4",{style:{margin:"0 0 10px",color:"#919398",fontSize:"0.8rem",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"},children:"اختر التقرير"}),r.jsx("div",{className:"report-sidebar-list",style:{display:"flex",gap:"4px"},children:i.map(e=>(0,r.jsxs)("button",{onClick:()=>S(e.key),style:{display:"flex",alignItems:"center",gap:"6px",padding:"6px 10px",borderRadius:"6px",border:`1px solid ${v===e.key?e.color+"44":"transparent"}`,background:v===e.key?`${e.color}15`:"transparent",color:v===e.key?e.color:"#aaa",cursor:"pointer",fontFamily:"inherit",fontWeight:v===e.key?700:400,textAlign:"right",width:"100%",transition:"all 0.2s"},children:[r.jsx("span",{style:{fontSize:"0.95rem"},children:e.icon}),r.jsx("span",{style:{fontSize:"0.8rem",whiteSpace:"nowrap"},children:e.label})]},e.key))})]}),(0,r.jsxs)("div",{className:"glass-panel",style:{padding:"1.5rem"},children:[(0,r.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"},children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("h3",{style:{margin:0,color:Y.color},children:[Y.icon," ",Y.label]}),r.jsx("p",{style:{margin:"4px 0 0",color:"#888",fontSize:"0.85rem"},children:Y.desc})]}),!$&&r.jsx("button",{onClick:q,className:"btn-modern btn-secondary",style:{padding:"6px 15px",fontSize:"0.85rem"},children:"\uD83D\uDDA8️ طباعة القسم"})]}),$?r.jsx("div",{style:{textAlign:"center",padding:"3rem",color:"#666"},children:"⏳ جاري تحميل البيانات..."}):(0,r.jsxs)(r.Fragment,{children:["sales"===v&&(()=>{let t=G(),a=R(e,"createdAt");return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"إجمالي المبيعات",value:t.total.toFixed(0)+" "+I,color:"#E35E35"},{label:"عدد الفواتير",value:t.count,color:"#29b6f6"},{label:"فواتير مدفوعة",value:t.paid,color:"#66bb6a"},{label:"رصيد غير محصّل",value:t.unpaid.toFixed(0)+" "+I,color:"#ffa726"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"رقم الفاتورة"}),r.jsx("th",{children:"العميل"}),r.jsx("th",{children:"التاريخ"}),r.jsx("th",{children:"الإجمالي"}),r.jsx("th",{children:"الحالة"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:t,validPage:l}=W(a);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888",fontSize:"0.78rem"},children:(l-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"رقم الفاتورة",style:{fontWeight:700},children:e.invoiceNo}),r.jsx("td",{"data-label":"العميل",children:e.client?.name||"-"}),r.jsx("td",{"data-label":"التاريخ",style:{color:"#888",fontSize:"0.82rem"},children:new Date(e.createdAt).toLocaleDateString("ar-EG")}),(0,r.jsxs)("td",{"data-label":"الإجمالي",style:{fontWeight:700,color:"var(--primary-color)"},children:[e.total?.toFixed(0)," ",I]}),r.jsx("td",{"data-label":"الحالة",children:r.jsx("span",{style:{padding:"1px 8px",borderRadius:"6px",fontSize:"0.7rem",fontWeight:700,background:"PAID"===e.status?"#66bb6a22":"#ffa72622",color:"PAID"===e.status?"#66bb6a":"#ffa726"},children:"PAID"===e.status?"مدفوعة":"PARTIAL"===e.status?"جزئي":"غير مدفوعة"})})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:t}=W(a);return r.jsx(_,{totalPages:e,validPage:t})})()]})})(),"inventory"===v&&(()=>{let e=U(),t=p.filter(e=>"MANUFACTURED_PRICING"!==e.category);return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"إجمالي الأصناف",value:e.count,color:"#ffa726"},{label:"القيمة الكلية",value:e.value.toFixed(0)+" "+I,color:"#29b6f6"},{label:"أصناف منخفضة",value:e.low,color:"#E35E35"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"الصنف"}),r.jsx("th",{children:"النوع"}),r.jsx("th",{children:"الكمية"}),r.jsx("th",{children:"الوحدة"}),r.jsx("th",{children:"سعر الوحدة"}),r.jsx("th",{children:"القيمة"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:a,validPage:l}=W(t);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{style:{background:e.stock<=5?"rgba(227,94,53,0.04)":"transparent"},children:[r.jsx("td",{"data-label":"#",style:{color:"#888",fontSize:"0.78rem"},children:(l-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"الصنف",style:{fontWeight:700},children:e.name}),r.jsx("td",{"data-label":"النوع",children:r.jsx("span",{style:{padding:"1px 6px",borderRadius:"6px",fontSize:"0.7rem",background:"MATERIAL"===e.type?"#29b6f622":"#66bb6a22",color:"MATERIAL"===e.type?"#29b6f6":"#66bb6a"},children:"MATERIAL"===e.type?"خامة":"منتج"})}),(0,r.jsxs)("td",{"data-label":"الكمية",style:{fontWeight:700,color:e.stock<=5?"#E35E35":"#66bb6a"},children:[e.stock.toFixed(0),e.stock<=5&&" ⚠️"]}),r.jsx("td",{"data-label":"الوحدة",style:{color:"#888"},children:e.unit}),(0,r.jsxs)("td",{"data-label":"سعر الوحدة",style:{color:"var(--primary-color)"},children:[e.lastPurchasedPrice?.toFixed(0)," ",I]}),(0,r.jsxs)("td",{"data-label":"القيمة",style:{fontWeight:700,color:"#29b6f6"},children:[(e.stock*(e.lastPurchasedPrice||0)).toFixed(0)," ",I]})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:a}=W(t);return r.jsx(_,{totalPages:e,validPage:a})})()]})})(),"jobs"===v&&(()=>{let e=M(),t=R(h,"createdAt");return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"إجمالي الأوامر",value:e.count,color:"#ab47bc"},{label:"إجمالي التكاليف",value:e.totalCost.toFixed(0)+" "+I,color:"#29b6f6"},{label:"إجمالي الأرباح",value:e.totalProfit.toFixed(0)+" "+I,color:"#66bb6a"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"اسم الشغلانة"}),r.jsx("th",{children:"الحالة"}),r.jsx("th",{children:"تكلفة الخامات"}),r.jsx("th",{children:"تكلفة التشغيل"}),r.jsx("th",{children:"صافي الربح"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:a,validPage:l}=W(t);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888"},children:e.serialNo}),r.jsx("td",{"data-label":"اسم الشغلانة",style:{fontWeight:700},children:e.name}),r.jsx("td",{"data-label":"الحالة",children:r.jsx("span",{style:{padding:"1px 8px",borderRadius:"6px",fontSize:"0.7rem",background:"COMPLETED"===e.status?"#66bb6a22":"#ffa72622",color:"COMPLETED"===e.status?"#66bb6a":"#ffa726"},children:"COMPLETED"===e.status?"مكتملة":"جارية"})}),(0,r.jsxs)("td",{"data-label":"تكلفة الخامات",style:{color:"#29b6f6"},children:[e.totalMaterialCost?.toFixed(0)," ",I]}),(0,r.jsxs)("td",{"data-label":"تكلفة التشغيل",style:{color:"#ffa726"},children:[e.totalOperatingCost?.toFixed(0)," ",I]}),(0,r.jsxs)("td",{"data-label":"صافي الربح",style:{color:"#66bb6a",fontWeight:700},children:[(e.netProfit||0).toFixed(0)," ",I]})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:a}=W(t);return r.jsx(_,{totalPages:e,validPage:a})})()]})})(),"clients"===v&&(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{style:{padding:"12px",background:"#26c6da11",border:"1px solid #26c6da33",borderRadius:"10px",marginBottom:"1.5rem",textAlign:"center"},children:[r.jsx("div",{style:{fontSize:"1.5rem",fontWeight:800,color:"#26c6da"},children:g.length}),r.jsx("div",{style:{fontSize:"0.82rem",color:"#888"},children:"إجمالي العملاء المسجلين"})]}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"اسم العميل"}),r.jsx("th",{children:"اسم المتجر"}),r.jsx("th",{children:"التليفون"}),r.jsx("th",{children:"العنوان"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:t,validPage:a}=W(g);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888"},children:e.serial||(a-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"اسم العميل",style:{fontWeight:700},children:e.name}),r.jsx("td",{"data-label":"اسم المتجر",style:{color:"#888"},children:e.storeName||"-"}),r.jsx("td",{"data-label":"التليفون",children:e.phone1||"-"}),r.jsx("td",{"data-label":"العنوان",style:{color:"#888",fontSize:"0.82rem"},children:e.address||"-"})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:t}=W(g);return r.jsx(_,{totalPages:e,validPage:t})})()]}),"purchases"===v&&(()=>{let e=R(a,"date"),t=e.reduce((e,t)=>e+(t.totalAmount||0),0);return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"إجمالي المشتريات",value:t.toFixed(0)+" "+I,color:"#29b6f6"},{label:"عدد الفواتير",value:e.length,color:"#ffa726"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"رقم الفاتورة"}),r.jsx("th",{children:"المورد"}),r.jsx("th",{children:"التاريخ"}),r.jsx("th",{children:"الإجمالي"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:t,totalPages:a,validPage:l}=W(e);return r.jsx(r.Fragment,{children:t.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888"},children:(l-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"رقم الفاتورة",style:{fontWeight:700},children:e.invoiceNo}),r.jsx("td",{"data-label":"المورد",children:e.supplier||"-"}),r.jsx("td",{"data-label":"التاريخ",style:{color:"#888"},children:new Date(e.date||e.createdAt).toLocaleDateString("ar-EG")}),(0,r.jsxs)("td",{"data-label":"الإجمالي",style:{color:"#29b6f6",fontWeight:700},children:[e.totalAmount?.toFixed(0)," ",I]})]},e.id))})})()})]})}),(()=>{let{totalPages:t,validPage:a}=W(e);return r.jsx(_,{totalPages:t,validPage:a})})()]})})(),"attendance"===v&&(()=>{let e=O(),t=R(b,"dateStr");return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"حاضر",value:e.present,color:"#66bb6a"},{label:"تأخير",value:e.late,color:"#ffa726"},{label:"غائب",value:e.absent,color:"#e53935"},{label:"إجمالي السجلات",value:e.count,color:"#29b6f6"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"الموظف"}),r.jsx("th",{children:"التاريخ"}),r.jsx("th",{children:"الحالة"}),r.jsx("th",{children:"الحضور"}),r.jsx("th",{children:"الانصراف"}),r.jsx("th",{children:"ملاحظات"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:a,validPage:l}=W(t);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888"},children:(l-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"الموظف",style:{fontWeight:700},children:e.employeeName}),r.jsx("td",{"data-label":"التاريخ",style:{color:"#888"},children:e.dateStr}),r.jsx("td",{"data-label":"الحالة",children:r.jsx("span",{style:{padding:"1px 8px",borderRadius:"6px",fontSize:"0.7rem",background:"PRESENT"===e.status?"#66bb6a22":"ABSENT"===e.status?"#e5393522":"#ffa72622",color:"PRESENT"===e.status?"#66bb6a":"ABSENT"===e.status?"#e53935":"#ffa726"},children:"PRESENT"===e.status?"حاضر":"ABSENT"===e.status?"غائب":"LATE"===e.status?"تأخير":"SICK"===e.status?"مرضي":e.status})}),r.jsx("td",{"data-label":"الحضور",children:e.checkIn?new Date(e.checkIn).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"-"}),r.jsx("td",{"data-label":"الانصراف",children:e.checkOut?new Date(e.checkOut).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}):"-"}),r.jsx("td",{"data-label":"ملاحظات",style:{fontSize:"0.75rem",color:"#888"},children:e.note||"-"})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:a}=W(t);return r.jsx(_,{totalPages:e,validPage:a})})()]})})(),"salaries"===v&&(()=>{let e=B(),t=R(f,"date");return(0,r.jsxs)("div",{children:[r.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"1.5rem"},children:[{label:"إجمالي المبالغ",value:e.totalSpent.toFixed(0)+" "+I,color:"#ec407a"},{label:"السلف",value:e.advances.toFixed(0)+" "+I,color:"#ab47bc"},{label:"المكافآت",value:e.bonuses.toFixed(0)+" "+I,color:"#66bb6a"},{label:"إجمالي الحركات",value:e.count,color:"#29b6f6"}].map((e,t)=>(0,r.jsxs)("div",{style:{padding:"10px 12px",background:`${e.color}11`,border:`1px solid ${e.color}22`,borderRadius:"8px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},children:[r.jsx("div",{style:{fontSize:"1.05rem",fontWeight:800,color:e.color},children:e.value}),r.jsx("div",{style:{fontSize:"0.72rem",color:"#888",marginTop:"2px"},children:e.label})]},t))}),r.jsx("div",{className:"table-wrapper",children:(0,r.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{children:"#"}),r.jsx("th",{children:"الموظف"}),r.jsx("th",{children:"النوع"}),r.jsx("th",{children:"المبلغ"}),r.jsx("th",{children:"التاريخ"}),r.jsx("th",{children:"الشهر/السنة"}),r.jsx("th",{children:"ملاحظات"})]})}),r.jsx("tbody",{children:(()=>{let{paginated:e,totalPages:a,validPage:l}=W(t);return r.jsx(r.Fragment,{children:e.map((e,t)=>(0,r.jsxs)("tr",{children:[r.jsx("td",{"data-label":"#",style:{color:"#888"},children:(l-1)*("ALL"===z?0:z)+t+1}),r.jsx("td",{"data-label":"الموظف",style:{fontWeight:700},children:e.employeeName}),r.jsx("td",{"data-label":"النوع",children:r.jsx("span",{style:{padding:"1px 8px",borderRadius:"6px",fontSize:"0.7rem",background:"SALARY"===e.type?"#66bb6a22":"ADVANCE"===e.type?"#ffa72622":"#29b6f622",color:"SALARY"===e.type?"#66bb6a":"ADVANCE"===e.type?"#ffa726":"#29b6f6"},children:"SALARY"===e.type?"راتب":"ADVANCE"===e.type?"سلفة":"BONUS"===e.type?"مكافأة":"PENALTY"===e.type?"خصم":e.type})}),(0,r.jsxs)("td",{"data-label":"المبلغ",style:{fontWeight:700,color:"var(--primary-color)"},children:[e.amount?.toFixed(0)," ",I]}),r.jsx("td",{"data-label":"التاريخ",style:{color:"#888",fontSize:"0.82rem"},children:new Date(e.date).toLocaleDateString("ar-EG")}),(0,r.jsxs)("td",{"data-label":"الشهر/السنة",style:{color:"#888"},children:[e.month,"/",e.year]}),r.jsx("td",{"data-label":"ملاحظات",style:{fontSize:"0.75rem",color:"#888"},children:e.note||"-"})]},e.id))})})()})]})}),(()=>{let{totalPages:e,validPage:a}=W(t);return r.jsx(_,{totalPages:e,validPage:a})})()]})})(),"treasury"===v&&(0,r.jsxs)("div",{style:{textAlign:"center",padding:"3rem",color:"#666"},children:[r.jsx("div",{style:{fontSize:"3rem"},children:"\uD83C\uDFE6"}),r.jsx("p",{children:"تقرير الخزينة التفصيلي قيد التطوير"}),r.jsx(o.default,{href:"/treasury",style:{color:"var(--primary-color)",textDecoration:"none",fontWeight:700},children:"انتقل لصفحة الخزينة ←"})]})]})]})]})]})}},17196:(e,t,a)=>{"use strict";a.d(t,{Qf:()=>n,Wp:()=>o});let r=null,l=0;async function o(){let e=Date.now();if(r&&e-l<3e4)return r;let t={},a={},o={};try{t=JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{}try{a=JSON.parse(localStorage.getItem("erp_invoice_template")||"{}")}catch{}try{o=JSON.parse(localStorage.getItem("erp_unified_report_config")||"{}")}catch{}let n={};try{let e=await fetch("/api/settings",{cache:"no-store"});e.ok&&(n=await e.json())}catch{}let i={companyName:n.appName||o.companyName||a.companyName||t.appName||"Stand Masr",companySubtitle:n.appSubtitle||o.companySubtitle||a.companySubtitle||"",companyAddress:n.companyAddress||o.companyAddress||a.companyAddress||"",companyPhone:n.companyPhone||o.companyPhone||a.companyPhone||"",companyPhone2:n.companyPhone2||o.companyPhone2||a.companyPhone2||"",companyEmail:n.companyEmail||o.companyEmail||a.companyEmail||"",companyTax:n.companyTax||o.companyTax||a.companyTax||"",companyCommercial:n.companyCommercial||o.companyCommercial||a.companyCommercial||"",accentColor:n.primaryColor||o.accentColor||a.accentColor||t.primaryColor||"#E35E35",appLogo:n.appLogo||o.printLogoCustom||a.printLogoCustom||o.appLogo||t.appLogo||"",printLogoSize:n.printLogoSize||o.printLogoSize||a.printLogoSize||70,logoShape:n.logoShape||o.logoShape||a.logoShape||t.logoShape||"rounded",logoPosition:n.logoPosition||o.logoPosition||a.logoPosition||"right",showLogo:o.showLogo??a.showLogo??!0,footerText:n.footerText||o.footerText||a.footerText||"شكراً لتعاملكم معنا",footerAlign:n.footerAlign||o.footerAlign||"center",footerFontSize:o.footerFontSize||13,showFooter:o.showFooter??!0,sealImage:n.footerSealImage||o.sealImage||"",sealAlign:n.footerSealAlign||o.sealAlign||"right",sealSize:n.footerSealSize||o.sealSize||120,currencySymbol:n.currencySymbol||t.currencySymbol||"ج.م",whatsapp:n.whatsapp||o.whatsapp||"",facebook:n.facebook||o.facebook||"",instagram:n.instagram||o.instagram||"",website:n.website||o.website||"",youtube:n.youtube||o.youtube||"",tiktok:n.tiktok||o.tiktok||"",pinterest:n.pinterest||o.pinterest||"",socialAlign:o.socialAlign||"center",companyNameFontSize:o.companyNameFontSize||24,companySubtitleFontSize:o.companySubtitleFontSize||14,titleFontSize:o.titleFontSize||28,baseFontSize:o.fontSize||13};return r=i,l=e,i}function n(e,t,a){let{companyName:r,companySubtitle:l,companyAddress:o,companyPhone:n,companyPhone2:i,accentColor:s,appLogo:d,printLogoSize:c,logoPosition:p,showLogo:x,footerText:h,footerAlign:m,footerFontSize:g,showFooter:u,sealImage:b,sealAlign:y,sealSize:f,whatsapp:j,facebook:v,instagram:S,website:$,youtube:A,tiktok:D,pinterest:E,socialAlign:C,companyNameFontSize:P,companySubtitleFontSize:k,titleFontSize:N,baseFontSize:L}=a,w=s||"#E35E35",z=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),T=[{val:j,icon:"\uD83D\uDCDE"},{val:v,icon:"f"},{val:S,icon:"\uD83D\uDCF8"},{val:$,icon:"\uD83C\uDF10"},{val:A,icon:"▶"},{val:D,icon:"♪"},{val:E,icon:"P"}].filter(e=>e.val);return`<!DOCTYPE html>
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
            font-size: ${L||13}px; 
            background: #fff;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 3px solid ${w};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${P||24}px; 
            font-weight: 800; 
            color: ${w}; 
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
            font-size: ${N||28}px; 
            margin-bottom: 4px; 
            color: #1e293b;
            font-weight: 800;
        }
        .document-date { font-size: 0.85rem; color: #888; }

        .logo-img { 
            max-width: ${c||70}px; 
            max-height: ${c||70}px; 
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
            text-align: ${m||"center"};
        }
        .footer-text { 
            font-size: ${g||13}px; 
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
            background: ${w}; 
            color: #fff; 
            border-radius: 4px; 
            font-size: 0.75rem;
            font-weight: bold;
        }

        .seal-container { 
            text-align: ${y||"right"}; 
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
            <h1 class="company-name">${r}</h1>
            <p class="company-subtitle">${l}</p>
            <div class="company-info">
                ${o?`<div>📍 ${o}</div>`:""}
                ${n?`<div>📞 ${n}${i?` | ${i}`:""}</div>`:""}
            </div>
        </div>
        <div class="header-left">
            ${x&&d?`<img src="${d}" class="logo-img" alt="Logo" />`:""}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${t}</h2>
        <p class="document-date">بتاريخ: ${z}</p>
    </div>

    <main class="content">
        ${e}
    </main>

    ${u?`
    <footer class="footer">
        <div class="footer-text">${h}</div>
        
        <div class="socials">
            ${T.map(e=>`<span class="social-icon">${e.icon}</span>`).join("")}
        </div>

        ${b?`
        <div class="seal-container">
            <img src="${b}" class="seal-img" alt="Seal" />
        </div>`:""}

        <div class="print-only-footer">
            طبع بواسطة نظام ${r} — ${new Date().toLocaleString("ar-EG")}
        </div>
    </footer>
    `:""}
</body>
</html>`}},74174:(e,t,a)=>{"use strict";a.r(t),a.d(t,{$$typeof:()=>n,__esModule:()=>o,default:()=>i});var r=a(68570);let l=(0,r.createProxy)(String.raw`E:\STAND-EG\src\app\reports\page.tsx`),{__esModule:o,$$typeof:n}=l;l.default;let i=(0,r.createProxy)(String.raw`E:\STAND-EG\src\app\reports\page.tsx#default`)},73881:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>l});var r=a(66621);let l=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,r.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[8948,5266,6621,4e3],()=>a(67806));module.exports=r})();