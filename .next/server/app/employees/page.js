(()=>{var e={};e.id=2847,e.ids=[2847],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},71017:e=>{"use strict";e.exports=require("path")},57310:e=>{"use strict";e.exports=require("url")},1160:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>m,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),a(84058),a(18221),a(35866);var s=a(23191),n=a(88716),l=a(37922),i=a.n(l),o=a(95231),r={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(r[e]=()=>o[e]);a.d(t,r);let d=["",{children:["employees",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,84058)),"E:\\STAND-EG\\src\\app\\employees\\page.tsx"]}]},{metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}]},{layout:[()=>Promise.resolve().then(a.bind(a,18221)),"E:\\STAND-EG\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"],metadata:{icon:[async e=>(await Promise.resolve().then(a.bind(a,73881))).default(e)],apple:[],openGraph:[],twitter:[],manifest:void 0}}],c=["E:\\STAND-EG\\src\\app\\employees\\page.tsx"],p="/employees/page",m={require:a,loadChunk:()=>Promise.resolve()},h=new s.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/employees/page",pathname:"/employees",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},42440:(e,t,a)=>{Promise.resolve().then(a.bind(a,96161))},96161:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>i});var s=a(10326),n=a(17577),l=a(17196);function i(){let[e,t]=(0,n.useState)([]),[a,i]=(0,n.useState)(!0),[o,r]=(0,n.useState)(""),[d,c]=(0,n.useState)(1),[p,m]=(0,n.useState)(5),[h,u]=(0,n.useState)("ج.م"),[x,g]=(0,n.useState)(!1),[y,b]=(0,n.useState)({id:"",name:"",title:"",age:"",address:"",nationalId:"",qualification:"",department:"",hireDate:new Date().toISOString().split("T")[0],contractType:"MONTHLY",baseSalary:"",canLogin:!1,role:"WORKER",username:"",password:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]}),[f,j]=(0,n.useState)(null),[v,N]=(0,n.useState)({type:"SALARY",amount:"",treasury:"MAIN",channel:"CASH",month:new Date().getMonth()+1,year:new Date().getFullYear(),note:"",skipTreasury:!1}),[S,D]=(0,n.useState)(""),[w,C]=(0,n.useState)(!1),[A,L]=(0,n.useState)(!1),[$,k]=(0,n.useState)(!1),[E,_]=(0,n.useState)(null),[T,P]=(0,n.useState)(null),[z,F]=(0,n.useState)(()=>{let e=new Date;return e.setDate(1),e.toISOString().split("T")[0]}),[I,W]=(0,n.useState)(new Date().toISOString().split("T")[0]),[O,R]=(0,n.useState)(!1),[q,Y]=(0,n.useState)(!1),[M,G]=(0,n.useState)({}),U=e=>{m("ALL"===e?"ALL":parseInt(e,10)),localStorage.setItem("erp_employees_pageSize",e),c(1)},B=async()=>{try{let e=await fetch("/api/employees"),a=await e.json();Array.isArray(a)?t(a.map(e=>({...e,phones:e.phones||[]}))):t([])}catch(e){console.error(e)}finally{i(!1)}},H=async e=>{if(e.preventDefault(),0===y.phones.length||!y.phones.some(e=>e.isPrimaryWhatsApp))return alert("يجب إضافة رقم هاتف واحد على الأقل وتحديده كواتساب أساسي");if(!w){C(!0);try{let e=!!y.id,t=await fetch("/api/employees",{method:e?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(y)});if(t.ok)g(!1),b({id:"",name:"",title:"",age:"",address:"",nationalId:"",qualification:"",department:"",hireDate:new Date().toISOString().split("T")[0],contractType:"MONTHLY",baseSalary:"",canLogin:!1,role:"WORKER",username:"",password:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]}),B();else{let e=await t.json();alert(`❌ خطأ: ${e.error}`)}}catch(e){console.error(e)}finally{C(!1)}}},J=(e,t)=>{let a=[...y.phones];a[e].phone=t,b({...y,phones:a})},K=e=>{let t=y.phones.map((t,a)=>({...t,isPrimaryWhatsApp:a===e}));b({...y,phones:t})},V=e=>{if(y.phones.length<=1)return;let t=y.phones.filter((t,a)=>a!==e);t.some(e=>e.isPrimaryWhatsApp)||(t[0].isPrimaryWhatsApp=!0),b({...y,phones:t})},Q=async e=>{if(e.preventDefault(),f&&!A){L(!0);try{let e=await fetch("/api/payroll",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({employeeId:f.id,...v})});if(e.ok)D("✅ تمت العملية بنجاح وترحيلها للخزينة"),B(),setTimeout(()=>{j(null),D("")},1500);else{let t=await e.json();D("❌ "+t.error)}}catch(e){D("❌ فشل الاتصال")}finally{L(!1)}}},X=async e=>{R(!0);try{let t=await fetch(`/api/employees/statement?employeeId=${e}&startDate=${z}&endDate=${I}`),a=await t.json();P(a)}catch(e){console.error(e)}finally{R(!1)}},Z=async(e,t)=>{if(confirm(`⚠️ حذف الموظف "${t}" نهائياً؟`))try{(await fetch(`/api/employees?id=${e}`,{method:"DELETE"})).ok&&B()}catch{}},ee=e=>{b({id:e.id,name:e.name||"",title:e.title||"",age:e.age?e.age.toString():"",address:e.address||"",nationalId:e.nationalId||"",qualification:e.qualification||"",department:e.department||"",hireDate:e.hireDate?new Date(e.hireDate).toISOString().split("T")[0]:new Date().toISOString().split("T")[0],contractType:e.contractType||"MONTHLY",baseSalary:e.baseSalary?e.baseSalary.toString():"",canLogin:e.canLogin||!1,role:e.role||"WORKER",username:e.username||"",password:"",phones:e.phones.length>0?e.phones.map(e=>({phone:e.phone,isPrimaryWhatsApp:e.isPrimaryWhatsApp})):[{phone:"",isPrimaryWhatsApp:!0}]}),g(!0)},et=(0,n.useMemo)(()=>e.filter(e=>e.name.includes(o)||e.title.includes(o)||e.employeeId.toString().includes(o)),[e,o]),ea="ALL"===p?1:Math.ceil(et.length/p),es=(0,n.useMemo)(()=>{if("ALL"===p)return et;let e=(d-1)*p;return et.slice(e,e+p)},[et,d,p]),en=async()=>{if(!E||!T)return;let e=await (0,l.Wp)(),t=e.currencySymbol||"ج.م";new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"});let a=T.payrollRecords?.map(e=>`
            <tr>
                <td>${new Date(e.date).toLocaleDateString("ar-EG")}</td>
                <td style="font-weight: bold; color: ${"SALARY"===e.type?"#166534":"BONUS"===e.type?"#1e40af":"#991b1b"}">
                    ${"SALARY"===e.type?"راتب":"ADVANCE"===e.type?"سلفة":"BONUS"===e.type?"مكافأة":"PENALTY"===e.type?"خصم":e.type}
                </td>
                <td style="text-align:center;font-weight:700">${e.amount.toLocaleString("en-US")} ${t}</td>
                <td>${e.note||"-"}</td>
            </tr>
        `).join(""),s=T.payrollRecords?.reduce((e,t)=>e+t.amount,0)||0,n=T.attendances?.reduce((e,t)=>e+(t.hoursWorked||0),0)||0,i=T.attendances?.filter(e=>"PRESENT"===e.status||"LATE"===e.status).length||0,o=`
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">إجمالي المدفوعات</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${s.toLocaleString("en-US")} ${t}</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">ساعات العمل</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${n.toFixed(1)} س</div>
                </div>
                <div style="padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: center;">
                    <div style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">أيام الحضور</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${i} يوم</div>
                </div>
            </div>

            <div style="margin-bottom: 20px; font-size: 0.9rem; color: #333; background: #eff6ff; padding: 15px; border-radius: 8px; border: 1px solid #bfdbfe;">
                <strong>بيانات الموظف:</strong> ${E.name} (${E.title}) | كود: #${E.employeeId}
                <div style="font-size: 0.8rem; margin-top: 4px; color: #666;">الفترة من ${z} إلى ${I}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${a}
                </tbody>
            </table>
        `,r=(0,l.Qf)(o,`كشف حساب موظف - ${E.name}`,e),d=document.createElement("iframe");d.style.display="none",document.body.appendChild(d),d.contentWindow?.document.open(),d.contentWindow?.document.write(r),d.contentWindow?.document.close(),d.onload=()=>{d.contentWindow?.focus(),d.contentWindow?.print(),setTimeout(()=>document.body.removeChild(d),2e3)}};return(0,s.jsxs)("div",{className:"unified-container animate-fade-in",children:[(0,s.jsxs)("header",{className:"page-header",children:[(0,s.jsxs)("div",{children:[s.jsx("h1",{className:"page-title",children:"\uD83D\uDC65 شؤون العاملين"}),(0,s.jsxs)("p",{className:"page-subtitle",children:["إدارة ",e.length," موظف وفني وكشوف حساباتهم"]})]}),(0,s.jsxs)("div",{className:"header-actions",style:{gap:"10px"},children:[s.jsx("button",{onClick:()=>{let t=e.map(e=>[e.employeeId,e.name,e.title,e.hireDate,e.baseSalary,e.department||""]),a="\uFEFFالكود,الاسم,الوظيفة,تاريخ التعيين,الراتب,القسم\n";t.forEach(e=>a+=e.map(e=>`"${e}"`).join(",")+"\n");let s=new Blob([a],{type:"text/csv;charset=utf-8;"}),n=document.createElement("a");n.href=URL.createObjectURL(s),n.download="سجل_الموظفين.csv",n.click()},className:"btn-secondary",style:{padding:"0 15px",height:"42px",fontSize:"0.9rem"},title:"تصدير بيانات الموظفين",children:"\uD83D\uDCE5 تصدير"}),q&&s.jsx("button",{onClick:()=>{b({id:"",name:"",title:"",age:"",address:"",nationalId:"",qualification:"",department:"",hireDate:new Date().toISOString().split("T")[0],contractType:"MONTHLY",baseSalary:"",canLogin:!1,role:"WORKER",username:"",password:"",phones:[{phone:"",isPrimaryWhatsApp:!0}]}),g(!0)},className:"btn-primary",style:{padding:"0 20px",height:"42px",fontWeight:800},children:"➕ موظف جديد"})]})]}),(0,s.jsxs)("div",{className:"content-centered-wrapper",style:{display:"flex",flexDirection:"column",gap:"1rem"},children:[s.jsx("div",{className:"glass-panel",children:s.jsx("input",{type:"text",className:"input-glass",placeholder:"\uD83D\uDD0D ابحث بالاسم، الوظيفة أو رقم هاتف...",value:o,onChange:e=>r(e.target.value),title:"بحث عن موظف"})}),s.jsx("div",{className:"glass-panel",children:a?s.jsx("p",{children:"⏳ جاري تحميل البيانات..."}):(0,s.jsxs)(s.Fragment,{children:[s.jsx("div",{className:"smart-table-container",children:(0,s.jsxs)("table",{className:"smart-table",children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:"الموظف / القسم"}),s.jsx("th",{className:"hide-on-tablet",children:"الوظيفة"}),s.jsx("th",{children:"الراتب الأساسي"}),s.jsx("th",{children:"الإجراءات"})]})}),s.jsx("tbody",{children:es.map(e=>{let t=e.phones?.find(e=>e.isPrimaryWhatsApp)||e.phones?.[0];return(0,s.jsxs)("tr",{className:"employee-row-transition",children:[(0,s.jsxs)("td",{"data-label":"الموظف",children:[s.jsx("div",{className:"mobile-card-title",style:{color:"var(--primary-light)",fontWeight:800},children:e.name}),s.jsx("div",{className:"emp-dept",style:{fontSize:"0.75rem",color:"#aaa",background:"rgba(255,255,255,0.06)",padding:"2px 10px",borderRadius:"20px",width:"fit-content",margin:"5px auto 5px auto",border:"1px solid rgba(255,255,255,0.05)",textAlign:"center"},children:e.department||"عام"})]}),s.jsx("td",{"data-label":"الوظيفة",style:{fontWeight:600},children:e.title}),s.jsx("td",{"data-label":"الراتب الأساسي",children:(0,s.jsxs)("div",{className:"mobile-card-balance balance-green",style:{fontSize:"1.2rem",fontWeight:900,margin:"5px 0"},children:[s.jsx("span",{children:e.baseSalary.toLocaleString("en-US")})," ",s.jsx("small",{style:{fontSize:"0.7rem",opacity:.8},children:h})]})}),s.jsx("td",{"data-label":"الإجراءات",children:(0,s.jsxs)("div",{className:"action-bar-cell mobile-card-actions",style:{gap:"8px",padding:"10px 0"},children:[s.jsx("button",{onClick:()=>{j(e),N(t=>({...t,type:"SALARY",amount:e.baseSalary.toString()}))},className:"btn-action",style:{background:"rgba(16,185,129,0.1)",color:"#10b981",border:"1px solid rgba(16,185,129,0.2)"},title:"صرف مالي",children:"\uD83D\uDCB5"}),t?.phone&&s.jsx("button",{onClick:()=>{let e=t.phone.replace(/\D/g,"");window.open(`https://wa.me/2${e}`,"_blank")},className:"btn-action btn-whatsapp",style:{background:"rgba(37,211,102,0.1)",color:"#25d366",border:"1px solid rgba(37,211,102,0.2)"},title:"واتساب",children:"\uD83D\uDCAC"}),s.jsx("button",{onClick:()=>_(e),className:"btn-action",style:{background:"rgba(59,130,246,0.1)",color:"#60a5fa",border:"1px solid rgba(59,130,246,0.2)"},title:"كشف حساب / طباعة",children:"\uD83D\uDCCA"}),q&&s.jsx("button",{onClick:()=>ee(e),className:"btn-action btn-edit",style:{background:"rgba(245,158,11,0.1)",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.2)"},title:"تعديل",children:"\uD83D\uDCDD"}),q&&s.jsx("button",{onClick:()=>Z(e.id,e.name),className:"btn-action btn-danger",style:{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)"},title:"حذف",children:"\uD83D\uDDD1️"})]})})]},e.id)})})]})}),(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",marginTop:"2rem",flexWrap:"wrap-reverse",gap:"20px",padding:"15px",background:"rgba(255,255,255,0.02)",borderRadius:"16px",border:"1px solid var(--border-color)"},children:[(0,s.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,0.2)",padding:"5px 15px",borderRadius:"20px"},children:[s.jsx("span",{style:{color:"var(--text-muted)",fontSize:"0.85rem"},children:"عدد النتائج:"}),(0,s.jsxs)("select",{value:p,onChange:e=>U(e.target.value),style:{padding:"0px",fontSize:"0.9rem",width:"auto",border:"none",background:"transparent",color:"var(--primary-color)",fontWeight:"bold",cursor:"pointer",outline:"none"},"aria-label":"Items per page",children:[s.jsx("option",{style:{color:"#000"},value:5,children:"5"}),s.jsx("option",{style:{color:"#000"},value:10,children:"10"}),s.jsx("option",{style:{color:"#000"},value:20,children:"20"}),s.jsx("option",{style:{color:"#000"},value:50,children:"50"}),s.jsx("option",{style:{color:"#000"},value:"ALL",children:"الكل"})]})]}),ea>1&&(0,s.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"15px",flex:"1 1 auto",maxWidth:"350px"},children:[s.jsx("button",{disabled:1===d,onClick:()=>c(e=>e-1),className:"btn-modern btn-secondary",style:{opacity:1===d?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"→ السابق"}),(0,s.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",minWidth:"60px",background:"rgba(227,94,53,0.1)",color:"var(--primary-color)",borderRadius:"10px",padding:"6px 12px",fontWeight:"bold",fontSize:"0.9rem",direction:"ltr",whiteSpace:"nowrap",border:"1px solid rgba(227,94,53,0.2)"},children:[d," / ",ea]}),s.jsx("button",{disabled:d===ea,onClick:()=>c(e=>e+1),className:"btn-modern btn-secondary",style:{opacity:d===ea?.3:1,padding:"8px 15px",flex:1,justifyContent:"center"},children:"التالي ←"})]})]})]})})]}),f&&s.jsx("div",{className:"modal-overlay",children:(0,s.jsxs)("div",{className:"modal-content modal-content-sm",children:[(0,s.jsxs)("div",{className:"modal-header",children:[(0,s.jsxs)("h2",{children:["\uD83D\uDCB8 تسجيل مالي: ",f.name]}),s.jsx("button",{onClick:()=>j(null),className:"btn-action btn-danger",children:"✕"})]}),S&&s.jsx("p",{children:S}),(0,s.jsxs)("form",{onSubmit:Q,className:"field-group",children:[(0,s.jsxs)("div",{className:"field-group",children:[(0,s.jsxs)("label",{className:"field-label",htmlFor:"pay_amt",children:["المبلغ (",h,")"]}),s.jsx("input",{id:"pay_amt",type:"number",className:"input-glass",value:v.amount,onChange:e=>N({...v,amount:e.target.value}),required:!0})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"pay_type",children:"نوع العملية"}),(0,s.jsxs)("select",{id:"pay_type",className:"input-glass",value:v.type,onChange:e=>N({...v,type:e.target.value}),title:"نوع العملية",children:[s.jsx("option",{value:"SALARY",children:"راتب كامل"}),s.jsx("option",{value:"ADVANCE",children:"سلفة"}),s.jsx("option",{value:"BONUS",children:"مكافأة"}),s.jsx("option",{value:"PENALTY",children:"جزاء"})]})]}),(0,s.jsxs)("div",{className:"modal-footer",children:[s.jsx("button",{type:"button",onClick:()=>j(null),className:"btn-secondary",children:"إلغاء"}),s.jsx("button",{type:"submit",className:"btn-success",children:A?"جاري...":"تأكيد العملية"})]})]})]})}),x&&s.jsx("div",{className:"modal-overlay",children:(0,s.jsxs)("div",{className:"modal-content",children:[(0,s.jsxs)("div",{className:"modal-header",children:[s.jsx("h2",{children:y.id?"\uD83D\uDCDD تعديل بيانات موظف":"➕ إضافة موظف جديد"}),s.jsx("button",{onClick:()=>g(!1),className:"btn-action btn-danger",children:"✕"})]}),(0,s.jsxs)("form",{onSubmit:H,className:"field-group",children:[(0,s.jsxs)("div",{className:"field-grid",children:[(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_name",children:"الاسم الكامل"}),s.jsx("input",{id:"emp_name",required:!0,className:"input-glass",value:y.name,onChange:e=>b({...y,name:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_title",children:"المسمى الوظيفي"}),s.jsx("input",{id:"emp_title",required:!0,className:"input-glass",value:y.title,onChange:e=>b({...y,title:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_dept",children:"القسم / الورشة"}),s.jsx("input",{id:"emp_dept",className:"input-glass",value:y.department,onChange:e=>b({...y,department:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_sal",children:"الراتب الأساسي"}),s.jsx("input",{id:"emp_sal",type:"number",required:!0,className:"input-glass",value:y.baseSalary,onChange:e=>b({...y,baseSalary:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_cont",children:"نظام المحاسبة"}),(0,s.jsxs)("select",{id:"emp_cont",className:"input-glass",value:y.contractType,onChange:e=>b({...y,contractType:e.target.value}),title:"نظام المحاسبة",children:[s.jsx("option",{value:"MONTHLY",children:"راتب شهري ثابث"}),s.jsx("option",{value:"DAILY",children:"أجر يومي / بالقطعية"})]})]}),(0,s.jsxs)("div",{className:"field-group",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"field-label",children:"\uD83D\uDCF1 أرقام الهاتف والواتساب"}),s.jsx("button",{type:"button",onClick:()=>b({...y,phones:[...y.phones,{phone:"",isPrimaryWhatsApp:!1}]}),className:"btn-secondary",children:"+ إضافة رقم"})]}),s.jsx("div",{className:"field-group",children:y.phones.map((e,t)=>(0,s.jsxs)("div",{children:[(0,s.jsxs)("div",{children:[s.jsx("input",{type:"text",className:"input-glass",value:e.phone,onChange:e=>J(t,e.target.value),placeholder:"رقم الهاتف",required:0===t,title:`رقم هاتف ${t+1}`}),(0,s.jsxs)("label",{title:"واتساب أساسي",children:[s.jsx("input",{type:"radio",checked:e.isPrimaryWhatsApp,onChange:()=>K(t)}),s.jsx("span",{children:"\uD83D\uDFE2"})]})]}),y.phones.length>1&&s.jsx("button",{type:"button",onClick:()=>V(t),className:"btn-danger",children:"\xd7"})]},t))})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_addr",children:"العنوان بالتفصيل"}),s.jsx("input",{id:"emp_addr",type:"text",className:"input-glass",value:y.address,onChange:e=>b({...y,address:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_natid",children:"الرقم القومي"}),s.jsx("input",{id:"emp_natid",type:"text",className:"input-glass",value:y.nationalId,onChange:e=>b({...y,nationalId:e.target.value})})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"emp_hdate",children:"تاريخ التعيين"}),s.jsx("input",{id:"emp_hdate",type:"date",className:"input-glass",value:y.hireDate,onChange:e=>b({...y,hireDate:e.target.value})})]})]}),(0,s.jsxs)("div",{className:"glass-panel",children:[(0,s.jsxs)("label",{children:[s.jsx("input",{type:"checkbox",checked:y.canLogin,onChange:e=>b({...y,canLogin:e.target.checked})}),"\uD83D\uDD10 منح صلاحية دخول للنظام"]}),y.canLogin&&(0,s.jsxs)("div",{className:"field-grid",children:[(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"sys_role",children:"صلاحية المستخدم"}),(0,s.jsxs)("select",{id:"sys_role",className:"input-glass",value:y.role,onChange:e=>b({...y,role:e.target.value}),title:"صلاحية المستخدم",children:[s.jsx("option",{value:"WORKER",children:"عامل (فقط شاشة الإنتاج)"}),s.jsx("option",{value:"INVENTORY",children:"أمين مخزن"}),s.jsx("option",{value:"SALES",children:"مناديب مبيعات وعملاء"}),s.jsx("option",{value:"ACCOUNTANT",children:"محاسب نظام"}),s.jsx("option",{value:"ADMIN",children:"مدير نظام كامل"})]})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"sys_user",children:"اسم المستخدم"}),s.jsx("input",{id:"sys_user",type:"text",className:"input-glass",value:y.username,onChange:e=>b({...y,username:e.target.value}),required:y.canLogin})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"sys_pass",children:"كلمة المرور"}),s.jsx("input",{id:"sys_pass",type:"password",placeholder:y.id?"اتركه فارغاً للحفاظ على الحالي":"مطلوب",className:"input-glass",value:y.password,onChange:e=>b({...y,password:e.target.value}),required:y.canLogin&&!y.id})]})]})]}),(0,s.jsxs)("div",{className:"modal-footer",children:[s.jsx("button",{type:"button",onClick:()=>g(!1),className:"btn-secondary",children:"إلغاء"}),s.jsx("button",{type:"submit",className:"btn-primary",children:w?"⏳ جاري الحفظ...":"\uD83D\uDCBE حفظ البيانات"})]})]})]})}),E&&s.jsx("div",{className:"modal-overlay",children:(0,s.jsxs)("div",{className:"modal-content",children:[(0,s.jsxs)("div",{className:"modal-header",children:[(0,s.jsxs)("h2",{children:["\uD83D\uDCCA كشف حساب: ",E.name]}),(0,s.jsxs)("div",{style:{display:"flex",gap:"8px"},children:[s.jsx("button",{onClick:en,className:"btn-modern btn-secondary",style:{padding:"6px 12px",fontSize:"0.85rem"},children:"\uD83D\uDDA8️ طباعة الكشف"}),s.jsx("button",{onClick:()=>{_(null),P(null)},className:"btn-action btn-danger",children:"✕"})]})]}),s.jsx("div",{className:"glass-panel",children:(0,s.jsxs)("div",{className:"field-grid",children:[(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"stmt_start",children:"من تاريخ"}),s.jsx("input",{id:"stmt_start",type:"date",className:"input-glass",value:z,onChange:e=>F(e.target.value)})]}),(0,s.jsxs)("div",{className:"field-group",children:[s.jsx("label",{className:"field-label",htmlFor:"stmt_end",children:"إلى تاريخ"}),s.jsx("input",{id:"stmt_end",type:"date",className:"input-glass",value:I,onChange:e=>W(e.target.value)})]}),s.jsx("div",{className:"field-group",children:s.jsx("button",{className:"btn-primary",onClick:()=>X(E.id),disabled:O,children:O?"⏳ جارٍ الجلب...":"\uD83D\uDD0D جلب البيانات"})})]})}),T?(0,s.jsxs)("div",{className:"animate-fade-in",children:[(0,s.jsxs)("div",{children:[(0,s.jsxs)("div",{className:"glass-panel",children:[s.jsx("div",{children:"إجمالي المدفوعات"}),(0,s.jsxs)("div",{children:[T.payrollRecords?.reduce((e,t)=>e+t.amount,0).toLocaleString("en-US")," ",h]})]}),(0,s.jsxs)("div",{className:"glass-panel",children:[s.jsx("div",{children:"ساعات العمل"}),(0,s.jsxs)("div",{children:[T.attendances?.reduce((e,t)=>e+(t.hoursWorked||0),0).toFixed(1)," س"]})]}),(0,s.jsxs)("div",{className:"glass-panel",children:[s.jsx("div",{children:"أيام الحضور"}),s.jsx("div",{children:T.attendances?.filter(e=>"PRESENT"===e.status||"LATE"===e.status).length})]})]}),s.jsx("div",{className:"table-responsive-wrapper",children:(0,s.jsxs)("table",{className:"table-glass high-density",children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:"التاريخ"}),s.jsx("th",{children:"العملية"}),s.jsx("th",{children:"المبلغ"}),s.jsx("th",{children:"ملاحظات"})]})}),s.jsx("tbody",{children:T.payrollRecords?.map(e=>s.jsxs("tr",{children:[s.jsx("td",{children:new Date(e.date).toLocaleDateString("ar-EG")}),s.jsx("td",{children:s.jsx("span",{children:"SALARY"===e.type?"راتب":"ADVANCE"===e.type?"سلفة":"BONUS"===e.type?"مكافأة":"PENALTY"===e.type?"خصم":e.type})}),s.jsxs("td",{children:[e.amount.toLocaleString("en-US")," ",h]}),s.jsx("td",{children:e.note||"-"})]},e.id))})]})})]}):(0,s.jsxs)("div",{children:[s.jsx("div",{children:"\uD83D\uDCCB"}),s.jsx("p",{children:'حدد المدة واضغط على "جلب البيانات" لعرض الكشف المالي والإحصائي'})]})]})})]})}},17196:(e,t,a)=>{"use strict";a.d(t,{Qf:()=>i,Wp:()=>l});let s=null,n=0;async function l(){let e=Date.now();if(s&&e-n<3e4)return s;let t={},a={},l={};try{t=JSON.parse(localStorage.getItem("erp_settings")||"{}")}catch{}try{a=JSON.parse(localStorage.getItem("erp_invoice_template")||"{}")}catch{}try{l=JSON.parse(localStorage.getItem("erp_unified_report_config")||"{}")}catch{}let i={};try{let e=await fetch("/api/settings",{cache:"no-store"});e.ok&&(i=await e.json())}catch{}let o={companyName:i.appName||l.companyName||a.companyName||t.appName||"Stand Masr",companySubtitle:i.appSubtitle||l.companySubtitle||a.companySubtitle||"",companyAddress:i.companyAddress||l.companyAddress||a.companyAddress||"",companyPhone:i.companyPhone||l.companyPhone||a.companyPhone||"",companyPhone2:i.companyPhone2||l.companyPhone2||a.companyPhone2||"",companyEmail:i.companyEmail||l.companyEmail||a.companyEmail||"",companyTax:i.companyTax||l.companyTax||a.companyTax||"",companyCommercial:i.companyCommercial||l.companyCommercial||a.companyCommercial||"",accentColor:i.primaryColor||l.accentColor||a.accentColor||t.primaryColor||"#E35E35",appLogo:i.appLogo||l.printLogoCustom||a.printLogoCustom||l.appLogo||t.appLogo||"",printLogoSize:i.printLogoSize||l.printLogoSize||a.printLogoSize||70,logoShape:i.logoShape||l.logoShape||a.logoShape||t.logoShape||"rounded",logoPosition:i.logoPosition||l.logoPosition||a.logoPosition||"right",showLogo:l.showLogo??a.showLogo??!0,footerText:i.footerText||l.footerText||a.footerText||"شكراً لتعاملكم معنا",footerAlign:i.footerAlign||l.footerAlign||"center",footerFontSize:l.footerFontSize||13,showFooter:l.showFooter??!0,sealImage:i.footerSealImage||l.sealImage||"",sealAlign:i.footerSealAlign||l.sealAlign||"right",sealSize:i.footerSealSize||l.sealSize||120,currencySymbol:i.currencySymbol||t.currencySymbol||"ج.م",whatsapp:i.whatsapp||l.whatsapp||"",facebook:i.facebook||l.facebook||"",instagram:i.instagram||l.instagram||"",website:i.website||l.website||"",youtube:i.youtube||l.youtube||"",tiktok:i.tiktok||l.tiktok||"",pinterest:i.pinterest||l.pinterest||"",socialAlign:l.socialAlign||"center",companyNameFontSize:l.companyNameFontSize||24,companySubtitleFontSize:l.companySubtitleFontSize||14,titleFontSize:l.titleFontSize||28,baseFontSize:l.fontSize||13};return s=o,n=e,o}function i(e,t,a){let{companyName:s,companySubtitle:n,companyAddress:l,companyPhone:i,companyPhone2:o,accentColor:r,appLogo:d,printLogoSize:c,logoPosition:p,showLogo:m,footerText:h,footerAlign:u,footerFontSize:x,showFooter:g,sealImage:y,sealAlign:b,sealSize:f,whatsapp:j,facebook:v,instagram:N,website:S,youtube:D,tiktok:w,pinterest:C,socialAlign:A,companyNameFontSize:L,companySubtitleFontSize:$,titleFontSize:k,baseFontSize:E}=a,_=r||"#E35E35",T=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}),P=[{val:j,icon:"\uD83D\uDCDE"},{val:v,icon:"f"},{val:N,icon:"\uD83D\uDCF8"},{val:S,icon:"\uD83C\uDF10"},{val:D,icon:"▶"},{val:w,icon:"♪"},{val:C,icon:"P"}].filter(e=>e.val);return`<!DOCTYPE html>
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
            border-bottom: 3px solid ${_};
        }
        .header-left { flex: 1; text-align: left; }
        .header-center { flex: 1; text-align: center; }
        .header-right { flex: 1; text-align: right; }

        .company-name { 
            font-size: ${L||24}px; 
            font-weight: 800; 
            color: ${_}; 
            margin-bottom: 2px;
        }
        .company-subtitle { 
            font-size: ${$||14}px; 
            color: #666; 
            margin-bottom: 8px;
        }
        .company-info { font-size: 0.8rem; color: #555; line-height: 1.4; }

        .document-title-block { text-align: center; margin: 5px 0 15px; }
        .document-title { 
            font-size: ${k||28}px; 
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
            text-align: ${u||"center"};
        }
        .footer-text { 
            font-size: ${x||13}px; 
            color: #666; 
            margin-bottom: 10px; 
        }

        .socials { 
            display: flex; 
            gap: 10px; 
            justify-content: ${"left"===A?"flex-start":"right"===A?"flex-end":"center"};
            margin-bottom: 15px;
        }
        .social-icon { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            width: 24px; 
            height: 24px; 
            background: ${_}; 
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
            ${m&&d?`<img src="${d}" class="logo-img" alt="Logo" />`:""}
        </div>
    </header>

    <div class="document-title-block">
        <h2 class="document-title">${t}</h2>
        <p class="document-date">بتاريخ: ${T}</p>
    </div>

    <main class="content">
        ${e}
    </main>

    ${g?`
    <footer class="footer">
        <div class="footer-text">${h}</div>
        
        <div class="socials">
            ${P.map(e=>`<span class="social-icon">${e.icon}</span>`).join("")}
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
</html>`}},84058:(e,t,a)=>{"use strict";a.r(t),a.d(t,{$$typeof:()=>i,__esModule:()=>l,default:()=>o});var s=a(68570);let n=(0,s.createProxy)(String.raw`E:\STAND-EG\src\app\employees\page.tsx`),{__esModule:l,$$typeof:i}=n;n.default;let o=(0,s.createProxy)(String.raw`E:\STAND-EG\src\app\employees\page.tsx#default`)},73881:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});var s=a(66621);let n=e=>[{type:"image/x-icon",sizes:"16x16",url:(0,s.fillMetadataSegment)(".",e.params,"favicon.ico")+""}]}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[8948,5266,6621,4e3],()=>a(1160));module.exports=s})();