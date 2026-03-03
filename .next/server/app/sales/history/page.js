(()=>{var e={};e.id=586,e.ids=[586],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71017:e=>{"use strict";e.exports=require("path")},57310:e=>{"use strict";e.exports=require("url")},18785:(e,t,o)=>{"use strict";o.r(t),o.d(t,{GlobalError:()=>s.a,__next_app__:()=>m,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),o(41255),o(18221),o(35866);var a=o(23191),n=o(88716),i=o(37922),s=o.n(i),r=o(95231),l={};for(let e in r)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>r[e]);o.d(t,l);let d=["",{children:["sales",{children:["history",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(o.bind(o,41255)),"E:\\STAND-EG\\src\\app\\sales\\history\\page.tsx"]}]},{}]},{metadata:{icon:[async e=>(await Promise.resolve().then(o.bind(o,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(o.bind(o,18221)),"E:\\STAND-EG\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(o.t.bind(o,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(o.bind(o,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["E:\\STAND-EG\\src\\app\\sales\\history\\page.tsx"],p="/sales/history/page",m={require:o,loadChunk:()=>Promise.resolve()},h=new a.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/sales/history/page",pathname:"/sales/history",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},83573:(e,t,o)=>{Promise.resolve().then(o.bind(o,47020))},47020:(e,t,o)=>{"use strict";o.r(t),o.d(t,{default:()=>r});var a=o(10326),n=o(17577),i=o(17196);function s(){try{return JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{return{}}}function r(){let[e,t]=(0,n.useState)([]),[o,r]=(0,n.useState)(!0),[l,d]=(0,n.useState)(""),[c,p]=(0,n.useState)("client"),[m,h]=(0,n.useState)(""),[x,g]=(0,n.useState)(""),[u,b]=(0,n.useState)(1),[y,f]=(0,n.useState)(5),[v,j]=(0,n.useState)(!1),[S,w]=(0,n.useState)(null),[$,D]=(0,n.useState)(""),[C,P]=(0,n.useState)(""),[N,A]=(0,n.useState)(""),[L,k]=(0,n.useState)(!1),[z,E]=(0,n.useState)(!1),T=()=>s().currencySymbol||"ج.م",I=()=>s().appName||"Stand Masr ERP",F=()=>fetch("/api/sales").then(e=>e.json()).then(e=>{t(Array.isArray(e)?e:[]),r(!1)}).catch(()=>{t([]),r(!1)}),_=async e=>{if(confirm(`هل تريد إلغاء وحذف الفاتورة ${e.invoiceNo}؟
سيتم استعادة المخزون تلقائياً.`)){k(!0),A("");try{let t=await fetch("/api/sales",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e.id})});if(t.ok)A("✅ تم حذف الفاتورة واستعادة المخزون"),F();else{let e=await t.json();A(`❌ ${e.error||"فشل الحذف"}`)}}catch{A("❌ خطأ في الاتصال")}finally{k(!1)}}},W=async()=>{if(S){E(!0);try{let e=await fetch("/api/sales",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:S.id,status:$,note:C})});if(e.ok)A("✅ تم تحديث الفاتورة"),w(null),F();else{let t=await e.json();A(`❌ ${t.error||"فشل التحديث"}`)}}catch{A("❌ خطأ في الاتصال")}finally{E(!1)}}},R=e=>{let t=T(),o=I(),a=`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 25px; }
        .title { font-size: 24px; font-weight: bold; margin: 0; }
        .info { display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 14px; }
        th { background: #f8f8f8; font-weight: bold; }
        .total-row { background: #333; color: #fff; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">تقرير مجمع بمبيعات الفترة</h1>
        <div class="info">
            <span>التاريخ: ${new Date().toLocaleDateString("ar-EG")}</span>
            <span>بواسطة: ${o}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ</th>
                <th>العميل</th>
                <th>الإجمالي</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            ${e.map(e=>`
                <tr>
                    <td>${e.invoiceNo}</td>
                    <td>${new Date(e.createdAt).toLocaleDateString("ar-EG")}</td>
                    <td>${e.client?.name||"-"}</td>
                    <td>${(e.total||0).toLocaleString("en-US")} ${t}</td>
                    <td>${"PAID"===e.status?"مدفوع":"PARTIAL"===e.status?"جزئي":"آجل"}</td>
                </tr>
            `).join("")}
            <tr class="total-row">
                <td colspan="3">الإجمالي الكلي</td>
                <td>${e.reduce((e,t)=>e+(t.total||0),0).toLocaleString("en-US")} ${t}</td>
                <td>-</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">Stand Masr ERP — نظام الإدارة المتكامل</div>
</body>
</html>`,n=document.createElement("iframe");n.style.display="none",document.body.appendChild(n),n.contentWindow?.document.open(),n.contentWindow?.document.write(a),n.contentWindow?.document.close(),n.onload=()=>{n.contentWindow?.focus(),n.contentWindow?.print(),setTimeout(()=>document.body.removeChild(n),2e3)}},G=async e=>{let t=await (0,i.Wp)(),o=t.currencySymbol||"ج.م",a=`
            <style>
                .bill-to { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; margin-top: 20px; }
                .section-title { font-size: 14px; text-transform: uppercase; color: #777; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
                .client-name { font-size: 18px; font-weight: bold; }
                .invoice-meta { padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                .total-box { margin-top: 30px; width: 300px; margin-right: auto; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .total-row.grand { border-bottom: none; font-weight: bold; font-size: 18px; color: #000; margin-top: 10px; border-top: 2px solid ${t.accentColor}; padding-top: 10px; }
            </style>

            <div class="bill-to">
                <div class="invoice-meta">
                    <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">رقم الفاتورة: ${e.invoiceNo}</div>
                    <div>التاريخ: ${new Date(e.createdAt).toLocaleDateString("ar-EG")}</div>
                    <div style="margin-top: 5px; color: ${"PAID"===e.status?"#66bb6a":"#ffa726"}; font-weight: bold;">
                        الحالة: ${"PAID"===e.status?"مسددة بالكامل":"PARTIAL"===e.status?"مسددة جزئياً":"آجلة"}
                    </div>
                </div>
                <div>
                    <div class="section-title">إلى العميل:</div>
                    <div class="client-name">${e.client?.name||"عميل نقدي"}</div>
                    <div style="font-size: 14px; color: #666; margin-top: 4px;">كود العميل: #${e.client?.serial||"---"}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: right; width: 40%;">اسم الصنف</th>
                        <th>الكمية</th>
                        <th>سعر الوحدة</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.sales?.length?e.sales.map(e=>`
                        <tr>
                            <td style="text-align: right;">${e.product?.name||"صنف"}</td>
                            <td>${e.quantity}</td>
                            <td>${e.unitPrice.toLocaleString("en-US")}</td>
                            <td>${e.totalPrice.toLocaleString("en-US")}</td>
                        </tr>
                    `).join(""):'<tr><td colspan="4">لا توجد بنود</td></tr>'}
                </tbody>
            </table>

            <div class="total-box">
                <div class="total-row">
                    <span>الإجمالي الفرعي:</span>
                    <span>${(e.subtotal||0).toLocaleString("en-US")} ${o}</span>
                </div>
                ${e.discountPct>0?`
                <div class="total-row">
                    <span>خصم (${e.discountPct}%):</span>
                    <span style="color: #66bb6a;">-${(e.subtotal*e.discountPct/100).toLocaleString("en-US")} ${o}</span>
                </div>
                `:""}
                ${e.taxPct>0?`
                <div class="total-row">
                    <span>ضريبة المبيعات (${e.taxPct}%):</span>
                    <span>+${((e.subtotal-e.subtotal*e.discountPct/100)*e.taxPct/100).toLocaleString("en-US")} ${o}</span>
                </div>
                `:""}
                <div class="total-row grand">
                    <span>الصافي النهائي:</span>
                    <span>${(e.total||0).toLocaleString("en-US")} ${o}</span>
                </div>
            </div>
        `,n=(0,i.Qf)(a,`فاتورة مبيعات #${e.invoiceNo}`,t),s=document.createElement("iframe");s.style.display="none",document.body.appendChild(s),s.contentWindow?.document.open(),s.contentWindow?.document.write(n),s.contentWindow?.document.close(),s.onload=()=>{s.contentWindow?.focus(),s.contentWindow?.print(),setTimeout(()=>document.body.removeChild(s),2e3)}},U=e=>{f("ALL"===e?"ALL":parseInt(e,10)),localStorage.setItem("erp_salesHistory_pageSize",e),b(1)},M=(0,n.useMemo)(()=>[...new Set(e.map(e=>e.client?.name).filter(Boolean))].sort(),[e]),q=(0,n.useMemo)(()=>e.map(e=>e.invoiceNo).filter(Boolean),[e]),B=(0,n.useMemo)(()=>{if(!l.trim())return[];let e=l.toLowerCase();return("client"===c?M:q).filter(t=>t.toLowerCase().includes(e)).slice(0,8)},[l,c,M,q]),O=(0,n.useMemo)(()=>e.filter(e=>{let t=l.trim().toLowerCase(),o=!t||("invoice"===c?(e.invoiceNo||"").toLowerCase().includes(t):(e.client?.name||"").toLowerCase().includes(t)),a=new Date(e.createdAt);return o&&(!m||a>=new Date(m))&&(!x||a<=new Date(x+"T23:59:59"))}),[e,l,c,m,x]),J=O.reduce((e,t)=>e+(t.total||0),0),Y="ALL"===y?1:Math.ceil(O.length/y),H=(0,n.useMemo)(()=>{if("ALL"===y)return O;let e=(u-1)*y;return O.slice(e,e+y)},[O,u,y]),Q=(t=!1)=>{let o=t?e:O,a=T(),n=o.map(e=>`<tr>
            <td>${e.invoiceNo}</td><td>${e.client?.name||"-"}</td>
            <td>${new Date(e.createdAt).toLocaleDateString("ar-EG")}</td>
            <td>${(e.subtotal||0).toFixed(0)}</td><td>${e.discountPct||0}%</td>
            <td>${e.taxPct||0}%</td><td><b>${(e.total||0).toFixed(0)}</b></td>
            <td>${"PAID"===e.status?"مدفوع":"PARTIAL"===e.status?"جزئي":"آجل"}</td>
        </tr>`).join(""),i=o.reduce((e,t)=>e+(t.total||0),0),s=new Blob([`\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head><body>
            <table dir="rtl" border="1"><thead><tr style="background:#1565C0;color:white">
                <th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>قبل الخصم</th><th>الخصم</th><th>الضريبة</th><th>الإجمالي (${a})</th><th>الحالة</th>
            </tr></thead><tbody>${n}<tr style="background:#eee"><td colspan="6"><b>الإجمالي</b></td><td><b>${i.toFixed(0)}</b></td><td></td></tr></tbody></table>
            </body></html>`],{type:"application/vnd.ms-excel;charset=utf-8"}),r=Object.assign(document.createElement("a"),{href:URL.createObjectURL(s),download:`فواتير_${new Date().toISOString().split("T")[0]}.xls`});document.body.appendChild(r),r.click(),document.body.removeChild(r)};return(0,a.jsxs)("div",{className:"unified-container animate-fade-in",children:[(0,a.jsxs)("header",{className:"page-header",style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,a.jsxs)("div",{children:[a.jsx("h1",{className:"page-title",children:"سجل فواتير المبيعات"}),a.jsx("p",{className:"page-subtitle",children:"بحث ذكي وطباعة PDF مخصصة وتصدير Excel"})]}),(0,a.jsxs)("div",{style:{display:"flex",gap:"10px"},children:[a.jsx("button",{onClick:()=>R(O),className:"btn-modern btn-primary",style:{padding:"10px 20px",fontSize:"0.95rem"},children:"\uD83D\uDDA8️ طباعة السجل المجمع"}),a.jsx("div",{className:"header-actions",children:a.jsx("button",{onClick:()=>Q(!1),className:"btn-modern btn-secondary",style:{color:"#66bb6a",borderColor:"rgba(102, 187, 106, 0.3)"},children:"\uD83D\uDCE5 تصدير الفلتر"})})]})]}),(0,a.jsxs)("div",{className:"glass-panel",style:{marginBottom:"1.5rem",padding:"1.25rem"},children:[(0,a.jsxs)("div",{className:"sales-search-grid",children:[(0,a.jsxs)("div",{children:[a.jsx("label",{htmlFor:"searchBy",children:"البحث بـ"}),(0,a.jsxs)("select",{id:"searchBy",className:"input-glass",value:c,onChange:e=>{p(e.target.value),d("")},style:{width:"100%"},children:[a.jsx("option",{value:"client",children:"اسم العميل"}),a.jsx("option",{value:"invoice",children:"رقم الفاتورة"})]})]}),(0,a.jsxs)("div",{style:{position:"relative"},children:[a.jsx("label",{htmlFor:"searchInput",children:"client"===c?"اسم العميل":"رقم الفاتورة"}),a.jsx("input",{id:"searchInput",type:"text",className:"input-glass",value:l,onChange:e=>{d(e.target.value),j(!0)},onFocus:()=>j(!0),onBlur:()=>setTimeout(()=>j(!1),200),placeholder:"client"===c?"ابدأ بكتابة اسم العميل..":"INV-0001..",style:{width:"100%"}}),v&&B.length>0&&a.jsx("div",{style:{position:"absolute",top:"100%",right:0,left:0,background:"#1e2028",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"8px",marginTop:"4px",zIndex:100,maxHeight:"220px",overflowY:"auto"},children:B.map((e,t)=>(0,a.jsxs)("div",{onClick:()=>{d(e),j(!1)},style:{padding:"10px 14px",cursor:"pointer",fontSize:"0.9rem",borderBottom:"1px solid rgba(255,255,255,0.05)"},onMouseEnter:e=>e.currentTarget.style.background="rgba(255,255,255,0.06)",onMouseLeave:e=>e.currentTarget.style.background="transparent",children:["client"===c?"\uD83D\uDC64 ":"\uD83E\uDDFE ",e]},t))})]}),(0,a.jsxs)("div",{children:[a.jsx("label",{htmlFor:"dateFrom",children:"من تاريخ"}),a.jsx("input",{id:"dateFrom",type:"date",className:"input-glass",value:m,onChange:e=>h(e.target.value),style:{width:"100%"}})]}),(0,a.jsxs)("div",{children:[a.jsx("label",{htmlFor:"dateTo",children:"إلى تاريخ"}),a.jsx("input",{id:"dateTo",type:"date",className:"input-glass",value:x,onChange:e=>g(e.target.value),style:{width:"100%"}})]}),(l||m||x)&&a.jsx("div",{children:a.jsx("button",{onClick:()=>{d(""),h(""),g("")},className:"btn-secondary",style:{width:"100%",height:"42px",color:"#ff5252",borderColor:"rgba(255,82,82,0.3)"},children:"✕ تفريغ"})})]}),(0,a.jsxs)("div",{style:{marginTop:"12px",fontSize:"0.9rem",color:"#919398"},children:["النتائج: ",a.jsx("strong",{style:{color:"#fff"},children:O.length})," | إجمالي المبيعات بالفتره: ",(0,a.jsxs)("strong",{style:{color:"#66bb6a"},children:[J.toLocaleString("en-US")," ",T()]})]})]}),a.jsx("div",{className:"glass-panel",style:{padding:"1.25rem"},children:o?a.jsx("p",{children:"جاري التحميل..."}):(0,a.jsxs)(a.Fragment,{children:[a.jsx("div",{className:"sales-mobile-cards",children:H.map(e=>(0,a.jsxs)("div",{className:"sales-card",children:[(0,a.jsxs)("div",{className:"sales-card-header",children:[(0,a.jsxs)("div",{children:[a.jsx("span",{style:{fontWeight:"bold",color:"var(--primary-color)",fontSize:"1.05rem"},children:e.invoiceNo}),a.jsx("div",{style:{fontSize:"0.8rem",color:"#919398",marginTop:"2px"},children:new Date(e.createdAt).toLocaleDateString("ar-EG")})]}),a.jsx("span",{className:`sh-badge ${"PAID"===e.status?"paid":"PARTIAL"===e.status?"partial":"unpaid"}`,children:"PAID"===e.status?"مدفوع":"PARTIAL"===e.status?"جزئي":"آجل"})]}),(0,a.jsxs)("div",{style:{fontSize:"0.95rem"},children:["\uD83D\uDC64 ",e.client?.name||"-"]}),a.jsx("div",{className:"sales-card-grid",children:(0,a.jsxs)("div",{children:["الأساسي: ",(0,a.jsxs)("div",{className:"sales-card-val",children:[(e.subtotal||0).toFixed(0)," ",T()]})]})}),(0,a.jsxs)("div",{className:"sales-card-actions",style:{display:"flex",gap:"8px",flexWrap:"nowrap"},children:[a.jsx("button",{onClick:()=>G(e),className:"btn-modern btn-primary",style:{flex:1.5,padding:"10px"},title:"طباعة الفاتورة",children:"\uD83D\uDDA8️ طباعة"}),a.jsx("button",{onClick:()=>window.location.href=`/sales?edit=${e.id}`,className:"btn-modern btn-secondary",style:{flex:1,color:"#29b6f6",borderColor:"rgba(41, 182, 246, 0.3)",padding:"10px"},title:"تعديل",children:"✏️"}),a.jsx("button",{onClick:()=>_(e),disabled:L,className:"btn-modern btn-danger",style:{flex:.5,padding:"10px"},title:"حذف",children:"\uD83D\uDDD1"})]})]},e.id))}),a.jsx("div",{className:"sales-desktop-table",children:(0,a.jsxs)("table",{className:"table-glass responsive-cards high-density",children:[a.jsx("thead",{children:(0,a.jsxs)("tr",{children:[a.jsx("th",{children:"رقم الفاتورة"}),a.jsx("th",{children:"التاريخ"}),a.jsx("th",{children:"العميل"}),a.jsx("th",{children:"قبل الخصم"}),a.jsx("th",{children:"الخصم/ض"}),a.jsx("th",{children:"الحالة"}),a.jsx("th",{style:{textAlign:"center"},children:"الإجراءات"})]})}),(0,a.jsxs)("tbody",{children:[H.map(e=>(0,a.jsxs)("tr",{children:[a.jsx("td",{style:{fontWeight:"bold",color:"var(--primary-color)"},children:e.invoiceNo}),a.jsx("td",{style:{fontSize:"0.85rem"},children:new Date(e.createdAt).toLocaleDateString("ar-EG")}),a.jsx("td",{children:e.client?.name||"-"}),(0,a.jsxs)("td",{children:[(e.subtotal||0).toFixed(0)," ",T()]}),(0,a.jsxs)("td",{style:{fontSize:"0.83rem",color:"#919398"},children:[e.discountPct>0&&(0,a.jsxs)("span",{style:{color:"#66bb6a"},children:["خ ",e.discountPct,"% "]}),e.taxPct>0&&(0,a.jsxs)("span",{style:{color:"#ffa726"},children:["ض ",e.taxPct,"%"]}),!e.discountPct&&!e.taxPct&&"-"]}),a.jsx("td",{children:a.jsx("span",{className:`sh-badge ${"PAID"===e.status?"paid":"PARTIAL"===e.status?"partial":"unpaid"}`,children:"PAID"===e.status?"مدفوع":"PARTIAL"===e.status?"جزئي":"آجل"})}),a.jsx("td",{style:{textAlign:"center"},children:(0,a.jsxs)("div",{style:{display:"flex",gap:"6px",justifyContent:"center"},children:[a.jsx("button",{onClick:()=>G(e),className:"btn-modern btn-primary",style:{width:"38px",height:"38px",padding:0},title:"طباعة",children:"\uD83D\uDDA8️"}),a.jsx("button",{onClick:()=>window.location.href=`/sales?edit=${e.id}`,className:"btn-modern btn-secondary",style:{width:"38px",height:"38px",padding:0,color:"#29b6f6",borderColor:"rgba(41, 182, 246, 0.3)"},title:"تعديل",children:"✏️"}),a.jsx("button",{onClick:()=>_(e),disabled:L,className:"btn-modern btn-danger",style:{width:"38px",height:"38px",padding:0},title:"حذف",children:"\uD83D\uDDD1"})]})})]},e.id)),0===O.length&&!o&&a.jsx("tr",{children:a.jsx("td",{colSpan:8,style:{textAlign:"center",padding:"2rem",color:"#666"},children:"لا توجد نتائج"})})]})]})}),(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginTop:"2rem",flexWrap:"wrap-reverse",gap:"20px",padding:"15px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid var(--border-color)"},children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.2)",padding:"5px 15px",borderRadius:"20px"},children:[a.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.85rem"},children:"عدد النتائج:"}),(0,a.jsxs)("select",{value:y,onChange:e=>U(e.target.value),style:{padding:"0px",fontSize:"0.9rem",width:"auto",border:"none",background:"transparent",color:"var(--primary-color)",fontWeight:"bold",cursor:"pointer",outline:"none"},"aria-label":"Items per page",children:[a.jsx("option",{style:{color:"#000"},value:5,children:"5"}),a.jsx("option",{style:{color:"#000"},value:15,children:"15"}),a.jsx("option",{style:{color:"#000"},value:30,children:"30"}),a.jsx("option",{style:{color:"#000"},value:50,children:"50"}),a.jsx("option",{style:{color:"#000"},value:"ALL",children:"الكل"})]})]}),Y>1&&(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flex:"1 1 auto",maxWidth:"350px"},children:[a.jsx("button",{disabled:1===u,onClick:()=>b(e=>e-1),className:"btn-modern btn-secondary",style:{opacity:1===u?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"→ السابق"}),(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:"60px",background:"rgba(227,94,53,0.1)",color:"var(--primary-color)",borderRadius:"10px",padding:"6px 12px",fontWeight:"bold",fontSize:"0.9rem",direction:"ltr",whiteSpace:"nowrap",border:"1px solid rgba(227,94,53,0.2)"},children:[u," / ",Y]}),a.jsx("button",{disabled:u===Y,onClick:()=>b(e=>e+1),className:"btn-modern btn-secondary",style:{opacity:u===Y?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"التالي ←"})]})]})]})}),N&&!S&&a.jsx("div",{style:{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:N.startsWith("✅")?"rgba(102,187,106,0.9)":"rgba(255,82,82,0.9)",color:"#fff",padding:"12px 28px",borderRadius:"30px",fontWeight:"bold",zIndex:9999},children:N}),S&&a.jsx("div",{style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2e3,padding:"20px"},children:(0,a.jsxs)("div",{style:{background:"#1a1c22",border:"1px solid rgba(41,182,246,0.3)",borderRadius:"18px",padding:"2rem",width:"100%",maxWidth:"480px",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"},children:[(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"},children:[a.jsx("h3",{style:{margin:0,color:"#29b6f6"},children:"✏️ تعديل الفاتورة"}),a.jsx("button",{onClick:()=>w(null),style:{background:"transparent",border:"none",color:"#ff5252",cursor:"pointer",fontSize:"1.4rem"},children:"✕"})]}),(0,a.jsxs)("p",{style:{color:"#919398",marginBottom:"1.5rem",fontSize:"0.9rem"},children:["فاتورة: ",a.jsx("strong",{style:{color:"#fff"},children:S.invoiceNo})," — ",S.client?.name]}),N&&a.jsx("div",{style:{background:N.startsWith("✅")?"rgba(102,187,106,0.12)":"rgba(255,82,82,0.12)",color:N.startsWith("✅")?"#66bb6a":"#ff5252",padding:"10px 14px",borderRadius:"8px",marginBottom:"1rem",fontSize:"0.88rem",fontWeight:"bold"},children:N}),(0,a.jsxs)("div",{style:{display:"flex",flexDirection:"column",gap:"14px"},children:[(0,a.jsxs)("div",{children:[a.jsx("label",{children:"حالة الفاتورة"}),(0,a.jsxs)("select",{className:"input-glass",value:$,onChange:e=>D(e.target.value),children:[a.jsx("option",{value:"UNPAID",children:"⏳ آجل (غير مدفوع)"}),a.jsx("option",{value:"PARTIAL",children:"\uD83D\uDD50 جزئي (مدفوع جزء)"}),a.jsx("option",{value:"PAID",children:"✅ مدفوع بالكامل"})]})]}),(0,a.jsxs)("div",{children:[a.jsx("label",{children:"ملاحظة (اختياري)"}),a.jsx("input",{type:"text",className:"input-glass",value:C,onChange:e=>P(e.target.value),placeholder:"أي ملاحظة تتعلق بالفاتورة.."})]})]}),(0,a.jsxs)("div",{style:{display:"flex",gap:"12px",marginTop:"1.5rem",justifyContent:"flex-end"},children:[a.jsx("button",{onClick:()=>w(null),className:"btn-secondary",children:"إلغاء"}),a.jsx("button",{onClick:W,disabled:z,className:"btn-primary",children:z?"جاري الحفظ...":"\uD83D\uDCBE حفظ التعديل"})]})]})})]})}},17196:(e,t,o)=>{"use strict";o.d(t,{Qf:()=>s,Wp:()=>i});let a=null,n=0;async function i(){let e=Date.now();if(a&&e-n<3e4)return a;let t={},o={},i={};try{t=JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{}try{o=JSON.parse(localStorage.getItem("erp_invoice_template")||"{}")}catch{}try{i=JSON.parse(localStorage.getItem("erp_unified_report_config")||"{}")}catch{}let s={};try{let e=await fetch("/api/settings",{cache:"no-store"});e.ok&&(s=await e.json())}catch{}let r={companyName:s.appName||i.companyName||o.companyName||t.appName||"Stand Masr",companySubtitle:s.appSubtitle||i.companySubtitle||o.companySubtitle||"",companyAddress:s.companyAddress||i.companyAddress||o.companyAddress||"",companyPhone:s.companyPhone||i.companyPhone||o.companyPhone||"",companyPhone2:s.companyPhone2||i.companyPhone2||o.companyPhone2||"",companyEmail:s.companyEmail||i.companyEmail||o.companyEmail||"",companyTax:s.companyTax||i.companyTax||o.companyTax||"",companyCommercial:s.companyCommercial||i.companyCommercial||o.companyCommercial||"",accentColor:s.primaryColor||i.accentColor||o.accentColor||t.primaryColor||"#E35E35",appLogo:s.appLogo||i.printLogoCustom||o.printLogoCustom||i.appLogo||t.appLogo||"",printLogoSize:s.printLogoSize||i.printLogoSize||o.printLogoSize||70,logoShape:s.logoShape||i.logoShape||o.logoShape||t.logoShape||"rounded",logoPosition:s.logoPosition||i.logoPosition||o.logoPosition||"right",showLogo:i.showLogo??o.showLogo??!0,footerText:s.footerText||i.footerText||o.footerText||"شكراً لتعاملكم معنا",footerAlign:s.footerAlign||i.footerAlign||"center",footerFontSize:i.footerFontSize||13,showFooter:i.showFooter??!0,sealImage:s.footerSealImage||i.sealImage||"",sealAlign:s.footerSealAlign||i.sealAlign||"right",sealSize:s.footerSealSize||i.sealSize||120,currencySymbol:s.currencySymbol||t.currencySymbol||"ج.م",whatsapp:s.whatsapp||i.whatsapp||"",facebook:s.facebook||i.facebook||"",instagram:s.instagram||i.instagram||"",website:s.website||i.website||"",youtube:s.youtube||i.youtube||"",tiktok:s.tiktok||i.tiktok||"",pinterest:s.pinterest||i.pinterest||"",socialAlign:i.socialAlign||"center",companyNameFontSize:i.companyNameFontSize||24,companySubtitleFontSize:i.companySubtitleFontSize||14,titleFontSize:i.titleFontSize||28,baseFontSize:i.fontSize||13};return a=r,n=e,r}function s(e,t,o){let{companyName:a,companySubtitle:n,companyAddress:i,companyPhone:s,companyPhone2:r,accentColor:l,appLogo:d,printLogoSize:c,logoPosition:p,showLogo:m,footerText:h,footerAlign:x,footerFontSize:g,showFooter:u,sealImage:b,sealAlign:y,sealSize:f,whatsapp:v,facebook:j,instagram:S,website:w,youtube:$,tiktok:D,pinterest:C,socialAlign:P,companyNameFontSize:N,companySubtitleFontSize:A,titleFontSize:L,baseFontSize:k}=o,z=l||"#E35E35",E=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),T=[{val:v,icon:"\uD83D\uDCDE"},{val:j,icon:"f"},{val:S,icon:"\uD83D\uDCF8"},{val:w,icon:"\uD83C\uDF10"},{val:$,icon:"▶"},{val:D,icon:"♪"},{val:C,icon:"P"}].filter(e=>e.val);return`<!DOCTYPE html>
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
            font-size: ${k||13}px; 
            background: #fff;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
            padding-bottom: 15px; 
            border-bottom: 3px solid ${z};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${N||24}px; 
            font-weight: 800; 
            color: ${z}; 
            margin-bottom: 2px;
        }
        .company-subtitle { 
            font-size: ${A||14}px; 
            color: #666; 
            margin-bottom: 8px;
        }
        .company-info { font-size: 0.8rem; color: #555; line-height: 1.4; }

        .document-title-block { text-align: center; margin: 5px 0 15px; }
        .document-title { 
            font-size: ${L||28}px; 
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
            text-align: ${x||"center"};
        }
        .footer-text { 
            font-size: ${g||13}px; 
            color: #666; 
            margin-bottom: 10px; 
        }

        .socials { 
            display: flex; 
            gap: 10px; 
            justify-content: ${"left"===P?"flex-start":"right"===P?"flex-end":"center"};
            margin-bottom: 15px;
        }
        .social-icon { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 24px; 
            height: 24px; 
            background: ${z}; 
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
            <h1 class="company-name">${a}</h1>
            <p class="company-subtitle">${n}</p>
            <div class="company-info">
                ${i?`<div>📍 ${i}</div>`:""}
                ${s?`<div>📞 ${s}${r?` | ${r}`:""}</div>`:""}
            </div>
        </div>
        <div class="header-left">
            ${m&&d?`<img src="${d}" class="logo-img" alt="Logo" />`:""}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${t}</h2>
        <p class="document-date">بتاريخ: ${E}</p>
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
            طبع بواسطة نظام ${a} — ${new Date().toLocaleString("ar-EG")}
        </div>
    </footer>
    `:""}
</body>
</html>`}},41255:(e,t,o)=>{"use strict";o.r(t),o.d(t,{$$typeof:()=>s,__esModule:()=>i,default:()=>r});var a=o(68570);let n=(0,a.createProxy)(String.raw`E:\STAND-EG\src\app\sales\history\page.tsx`),{__esModule:i,$$typeof:s}=n;n.default;let r=(0,a.createProxy)(String.raw`E:\STAND-EG\src\app\sales\history\page.tsx#default`)},73881:(e,t,o)=>{"use strict";o.r(t),o.d(t,{default:()=>n});var a=o(66621);let n=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,a.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[8948,5266,6621,4e3],()=>o(18785));module.exports=a})();