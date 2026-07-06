import { useEffect, useRef, useState } from "react";
import {
  Bus, MapPin, Ticket, ClipboardCheck, Tag,
  FileBarChart, Megaphone, QrCode, UserCheck,
  Clock, CheckCircle2, LogOut, AlertTriangle,
  UserPlus, Trash2, X, Delete, Pencil,
  Download, Printer, Link, BarChart2,
  ChevronRight, Calendar, TrendingUp, Table2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import API from "../services/api";
import "./Dashboard.css";
import "./StaffCheckIn.css";

const WORK_START = { hour: 8, minute: 0 };
const SCAN_URL   = "https://cambodia-bus-express.vercel.app/staff-scan";
const QR_IMG     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(SCAN_URL)}&bgcolor=FFFFFF&color=04342C&margin=10`;

function getCambodiaDate() { return new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Phnom_Penh"}); }
function getCambodiaTime() {
  return new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Phnom_Penh",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function getArrivalStatus(t) {
  if (!t) return null;
  const [h,m] = t.split(":").map(Number);
  const diff  = h*60+m-(WORK_START.hour*60+WORK_START.minute);
  if (diff<=0)   return {level:"great",   emoji:"🎉",title:"Good Job!",        msg:"On time",                             color:"#1D9E75"};
  if (diff<=5)   return {level:"careful", emoji:"⚠️", title:"Be Careful!",      msg:`${diff}m late`,                       color:"#d97706"};
  if (diff<=30)  return {level:"warning", emoji:"😬",title:"Warning!",          msg:`${diff}m late`,                       color:"#ea580c"};
  if (diff<=120) return {level:"boss",    emoji:"👀",title:"Boss is Watching!", msg:`${diff}m late`,                       color:"#dc2626"};
  return           {level:"critical",emoji:"🆘",title:"Very Late!",         msg:`${Math.floor(diff/60)}h${diff%60}m late`,color:"#7f1d1d"};
}
function calcHours(rec) {
  if (!rec?.check_in_time||!rec?.check_out_time) return null;
  const [ih,im]=rec.check_in_time.slice(0,5).split(":").map(Number);
  const [oh,om]=rec.check_out_time.slice(0,5).split(":").map(Number);
  const mins=(oh*60+om)-(ih*60+im);
  if (mins<=0) return null;
  return `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,"0")}m`;
}

const qrUrl=(barcode,size=200)=>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(barcode)}&bgcolor=FFFFFF&color=04342C&margin=10`;

const PIN_KEYS=["1","2","3","4","5","6","7","8","9","clear","0","del"];
const EMPTY_FORM={name:"",barcode:"",role:"Staff",pin:""};

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id:"checkin",  label:"Check-In",    icon: ClipboardCheck },
  { id:"report",   label:"Staff Report",icon: BarChart2 },
];

export default function StaffCheckIn() {
  const navigate   = useNavigate();
  const barcodeRef = useRef(null);
  const [activeTab, setActiveTab] = useState("checkin");

  const [barcode,setBarcode]       = useState("");
  const [staffList,setStaffList]   = useState([]);
  const [records,setRecords]       = useState([]);
  const [allRecords,setAllRecords] = useState([]); // all dates for report
  const [loading,setLoading]       = useState(true);
  const [clock,setClock]           = useState(getCambodiaTime());
  const [copied,setCopied]         = useState(false);

  const [modal,setModal]                   = useState(null);
  const [selectedStaff,setSelectedStaff]   = useState(null);
  const [statusResult,setStatusResult]     = useState(null);
  const [actionType,setActionType]         = useState(null);
  const [pin,setPin]                       = useState("");
  const [pinError,setPinError]             = useState("");
  const [pinShake,setPinShake]             = useState(false);
  const [formStaff,setFormStaff]           = useState(EMPTY_FORM);
  const [editingId,setEditingId]           = useState(null);
  const [qrStaff,setQrStaff]              = useState(null);

  // Report state
  const [reportStaff,setReportStaff]       = useState(null); // null = all staff, else a staff obj
  const [reportDateFrom,setReportDateFrom] = useState("");
  const [reportDateTo,setReportDateTo]     = useState("");
  const [reportSearch,setReportSearch]     = useState("");
  const [exporting,setExporting]           = useState(false);

  useEffect(()=>{const t=setInterval(()=>setClock(getCambodiaTime()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{fetchAll();},[]);
  useEffect(()=>{if(!modal)setTimeout(()=>barcodeRef.current?.focus(),100);},[modal]);

  const fetchAll=async()=>{
    setLoading(true);
    try{
      const today=getCambodiaDate();
      const [s,r,ar]=await Promise.all([
        API.get("/staff/"),
        API.get("/staff-records/"),
        API.get("/staff-records/"),  // all records (no date filter)
      ]);
      setStaffList(Array.isArray(s.data)?s.data:[]);
      setRecords((Array.isArray(r.data)?r.data:[]).filter(x=>x.date===today));
      setAllRecords(Array.isArray(ar.data)?ar.data:[]);
    }catch(e){console.log(e);}
    finally{setLoading(false);}
  };

  // ── Barcode scanner ──────────────────────────────────────────
  useEffect(()=>{
    let buf="",timer=null;
    const onKey=(e)=>{
      if(modal) return;
      if(e.key==="Enter"){if(buf.length>2)handleBarcodeScanned(buf);buf="";clearTimeout(timer);}
      else if(e.key.length===1){buf+=e.key;clearTimeout(timer);timer=setTimeout(()=>{buf="";},200);}
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[modal,staffList,records]);

  const handleBarcodeScanned=(code)=>{
    const staff=staffList.find(s=>s.barcode===code.trim());
    if(!staff){setModal("notfound");return;}
    setSelectedStaff(staff);setPin("");setPinError("");
    const rec=records.find(r=>r.staff===staff.id&&r.date===getCambodiaDate());
    if(rec&&!rec.check_out_time){setActionType("checkout");}
    else if(rec?.check_out_time){setStatusResult({type:"already",record:rec});setModal("status");return;}
    else{setActionType("checkin");}
    setModal("pin");
  };

  const handleManualScan=()=>{if(barcode.trim()){handleBarcodeScanned(barcode.trim());setBarcode("");}};

  const handlePinKey=(key)=>{
    setPinError("");
    if(key==="clear"){setPin("");return;}
    if(key==="del"){setPin(p=>p.slice(0,-1));return;}
    if(pin.length>=4)return;
    setPin(p=>p+key);
  };

  const handlePinSubmit=async()=>{
    if(pin.length<4){setPinError("Please enter all 4 digits.");return;}
    if(pin!==selectedStaff.pin){
      setPinError("❌ Wrong PIN. Try again.");
      setPinShake(true);setTimeout(()=>setPinShake(false),500);setPin("");return;
    }
    if(actionType==="checkin")await doCheckIn();else await doCheckOut();
  };

  const doCheckIn=async()=>{
    try{
      const now=getCambodiaTime().slice(0,5);
      const res=await API.post("/staff-records/",{staff:selectedStaff.id,date:getCambodiaDate(),check_in_time:now});
      setStatusResult({type:"checkin",record:res.data,status:getArrivalStatus(now)});
      setModal("status");fetchAll();
    }catch(err){alert("Failed: "+JSON.stringify(err.response?.data||err.message));}
  };

  const doCheckOut=async()=>{
    try{
      const rec=records.find(r=>r.staff===selectedStaff.id&&r.date===getCambodiaDate());
      if(!rec)return;
      const now=getCambodiaTime().slice(0,5);
      const res=await API.patch(`/staff-records/${rec.id}/`,{check_out_time:now});
      setStatusResult({type:"checkout",record:res.data});setModal("status");fetchAll();
    }catch(err){alert("Failed: "+err.message);}
  };

  const openAdd=()=>{setEditingId(null);setFormStaff(EMPTY_FORM);setModal("form");};
  const openEdit=(s)=>{setEditingId(s.id);setFormStaff({name:s.name,barcode:s.barcode,role:s.role,pin:s.pin});setModal("form");};
  const handleFormSubmit=async(e)=>{
    e.preventDefault();
    if(!formStaff.name.trim()||!formStaff.barcode.trim()||formStaff.pin.length!==4){alert("Name, barcode and 4-digit PIN required.");return;}
    try{
      if(editingId)await API.put(`/staff/${editingId}/`,formStaff);
      else         await API.post("/staff/",formStaff);
      setModal(null);setFormStaff(EMPTY_FORM);setEditingId(null);fetchAll();
    }catch(err){alert("Failed: "+JSON.stringify(err.response?.data||err.message));}
  };
  const handleDelete=async(id)=>{
    if(!confirm("Delete?"))return;
    try{await API.delete(`/staff/${id}/`);fetchAll();}catch{alert("Failed.");}
  };
  const copyLink=()=>{navigator.clipboard.writeText(SCAN_URL);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const printQR=()=>{
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif}.card{border:3px solid #04342C;border-radius:16px;padding:32px 40px;text-align:center}img{width:220px;height:220px;display:block;margin:0 auto 16px}h2{color:#04342C;font-size:20px;margin:0 0 6px}p{color:#62716b;font-size:14px;margin:0}.url{font-size:10px;color:#9FB8AE;margin-top:12px;word-break:break-all}</style></head><body><div class="card"><img src="${QR_IMG}"/><h2>Cambodia Bus Express</h2><p>Scan to Check In / Out</p><div class="url">${SCAN_URL}</div></div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  const openQR=(s)=>{setQrStaff(s);setModal("qr");};
  const closeModal=()=>{setModal(null);setSelectedStaff(null);setStatusResult(null);setActionType(null);setPin("");setPinError("");setQrStaff(null);};

  const todayRecords=records.filter(r=>r.date===getCambodiaDate());

  // ── Report helpers ───────────────────────────────────────────
  const getReportRows=()=>{
    let recs = allRecords;
    if(reportStaff) recs = recs.filter(r=>r.staff===reportStaff.id);
    if(reportDateFrom) recs = recs.filter(r=>r.date>=reportDateFrom);
    if(reportDateTo)   recs = recs.filter(r=>r.date<=reportDateTo);
    return recs.map(rec=>{
      const staff=staffList.find(s=>s.id===rec.staff);
      const status=getArrivalStatus(rec.check_in_time?.slice(0,5));
      return { rec, staff, status, hours:calcHours(rec) };
    }).filter(x=>x.staff);
  };

  const getStaffStats=(staffId)=>{
    const recs=allRecords.filter(r=>r.staff===staffId&&r.check_in_time);
    const late=recs.filter(r=>{
      const s=getArrivalStatus(r.check_in_time?.slice(0,5));
      return s&&s.level!=="great";
    });
    const onTime=recs.length-late.length;
    const totalHours=recs.reduce((sum,r)=>{
      const h=calcHours(r);
      if(!h) return sum;
      const [hr,mn]=h.replace("h","").replace("m","").trim().split(" ").map(Number);
      return sum+(hr||0)*60+(mn||0);
    },0);
    return {total:recs.length,late:late.length,onTime,totalHours};
  };

  const reportRows=getReportRows();

  const handleExcelExport=()=>{
    setExporting(true);
    setTimeout(()=>{
      const wb=XLSX.utils.book_new();
      const rows=reportRows.map(({rec,staff,status,hours})=>({
        "Name":         staff?.name||"",
        "Role":         staff?.role||"",
        "Date":         rec.date,
        "Check In":     rec.check_in_time?.slice(0,5)||"—",
        "Check Out":    rec.check_out_time?.slice(0,5)||"—",
        "Hours Worked": hours||"—",
        "Status":       status?.title||"On Time",
      }));
      const ws=XLSX.utils.json_to_sheet(rows);
      ws["!cols"]=[{wch:22},{wch:14},{wch:12},{wch:12},{wch:12},{wch:14},{wch:18}];
      const range=XLSX.utils.decode_range(ws["!ref"]);
      for(let c=range.s.c;c<=range.e.c;c++){
        const a=XLSX.utils.encode_cell({r:0,c});
        if(ws[a])ws[a].s={font:{bold:true,color:{rgb:"FFFFFF"},sz:11},fill:{fgColor:{rgb:"04342C"}},alignment:{horizontal:"center"}};
      }
      for(let r=1;r<=range.e.r;r++)
        for(let c=range.s.c;c<=range.e.c;c++){
          const a=XLSX.utils.encode_cell({r,c});
          if(ws[a])ws[a].s={fill:{fgColor:{rgb:r%2===0?"F4FAF7":"FFFFFF"}},alignment:{horizontal:"left"}};
        }
      XLSX.utils.book_append_sheet(wb,ws,"Attendance");
      XLSX.writeFile(wb,`Staff_Report${reportStaff?`_${reportStaff.name}`:"_All"}.xlsx`,{bookType:"xlsx",cellStyles:true});
      setExporting(false);
    },100);
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo"><div><Bus size={32}/></div><section><h2>Cambodia Bus</h2><p>Admin Panel</p></section></div>
        <nav>
          <a onClick={()=>navigate("/admin-dashboard")}><Bus size={20}/> Dashboard</a>
          <a onClick={()=>navigate("/admin-dashboard/routes")}><MapPin size={20}/> Routes</a>
          <a onClick={()=>navigate("/admin-dashboard/bookings")}><Ticket size={20}/> Bookings</a>
          <a className="active"><ClipboardCheck size={20}/> Check-In</a>
          <a onClick={()=>navigate("/admin-dashboard/promotions")}><Tag size={20}/> Promotions</a>
          <a onClick={()=>navigate("/admin-dashboard/reports")}><FileBarChart size={20}/> Reports</a>
          <a onClick={()=>navigate("/admin-dashboard/announcements")}><Megaphone size={20}/> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main sci-main">
        {/* ── Tab bar ── */}
        <div className="sci-tab-bar">
          {TABS.map(tab=>(
            <button key={tab.id} className={`sci-tab ${activeTab===tab.id?"active":""}`}
              onClick={()=>{setActiveTab(tab.id);setReportStaff(null);}}>
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════ CHECK-IN TAB ════════════════════ */}
        {activeTab==="checkin"&&(
          <>
            <header className="admin-header" style={{marginTop:0}}>
              <div><h1>Staff Attendance</h1><p>Print QR → Staff scan → Select name → Enter PIN</p></div>
              <div className="sci-header-right">
                <div className="sci-clock">{clock}</div>
                <button className="sci-add-btn" onClick={openAdd}><UserPlus size={16}/> Add Staff</button>
              </div>
            </header>

            {/* QR Card */}
            <div className="sci-scan-card">
              <div className="sci-qr-section">
                <div className="sci-qr-left">
                  <div className="sci-scan-icon"><QrCode size={44}/></div>
                  <h2>Staff Check-In QR Code</h2>
                  <p>Print and place this QR at the entrance.<br/>Staff scan with phone to check in or out.</p>
                  <div className="sci-qr-url-row">
                    <code>{SCAN_URL}</code>
                    <button className="sci-copy-btn" onClick={copyLink}><Link size={14}/>{copied?"Copied!":"Copy"}</button>
                  </div>
                  <div className="sci-qr-btn-row">
                    <button className="sci-qr-action download" onClick={()=>{const a=document.createElement("a");a.href=QR_IMG;a.download="Staff_QR.png";a.target="_blank";a.click();}}>
                      <Download size={15}/> Download
                    </button>
                    <button className="sci-qr-action print" onClick={printQR}><Printer size={15}/> Print QR Card</button>
                  </div>
                </div>
                <div className="sci-qr-right">
                  <div className="sci-qr-print-card">
                    <img src={QR_IMG} alt="QR"/>
                    <div className="sci-qr-brand">Cambodia Bus Express</div>
                    <div className="sci-qr-brand-sub">Scan to Check In / Out</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <section className="admin-stats" style={{marginTop:20}}>
              <div><UserCheck/><span>Total Staff</span><h3>{staffList.length}</h3></div>
              <div><CheckCircle2/><span>Checked In Today</span><h3>{todayRecords.filter(r=>r.check_in_time&&!r.check_out_time).length}</h3></div>
              <div><LogOut/><span>Checked Out</span><h3>{todayRecords.filter(r=>r.check_out_time).length}</h3></div>
              <div><AlertTriangle/><span>Late Today</span><h3>{todayRecords.filter(r=>{const s=getArrivalStatus(r.check_in_time?.slice(0,5));return s&&s.level!=="great";}).length}</h3></div>
            </section>

            {/* Today attendance */}
            <section className="admin-card" style={{marginTop:20}}>
              <div className="card-title"><h2>Today's Attendance — {getCambodiaDate()}</h2><p>{loading?"Loading...":`${todayRecords.length} record(s)`}</p></div>
              <div className="route-table">
                <table>
                  <thead><tr><th>Staff</th><th>Role</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                  <tbody>
                    {staffList.map(staff=>{
                      const rec=todayRecords.find(r=>r.staff===staff.id);
                      const status=rec?getArrivalStatus(rec.check_in_time?.slice(0,5)):null;
                      return(
                        <tr key={staff.id}>
                          <td><strong>{staff.name}</strong></td>
                          <td>{staff.role}</td>
                          <td>{rec?.check_in_time?.slice(0,5)||<span className="sci-absent">—</span>}</td>
                          <td>{rec?.check_out_time?.slice(0,5)||(rec?<span className="sci-working">Working…</span>:<span className="sci-absent">—</span>)}</td>
                          <td>{status?<span className={`sci-status-badge ${status.level}`}>{status.emoji} {status.title}</span>:<span className="sci-status-badge absent">Not arrived</span>}</td>
                        </tr>
                      );
                    })}
                    {!loading&&staffList.length===0&&<tr><td colSpan="5" className="empty-table">No staff yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Staff list */}
            <section className="admin-card" style={{marginTop:20}}>
              <div className="card-title"><h2>Staff Members</h2><button className="sci-add-btn small" onClick={openAdd}><UserPlus size={14}/> Add</button></div>
              <div className="sci-staff-grid">
                {staffList.map(staff=>{
                  const stats=getStaffStats(staff.id);
                  return(
                    <div key={staff.id} className="sci-staff-card">
                      <div className="sci-staff-avatar">{staff.name[0].toUpperCase()}</div>
                      <div className="sci-staff-info" onClick={()=>{setReportStaff(staff);setActiveTab("report");}} style={{cursor:"pointer",flex:1}}>
                        <h4>{staff.name}</h4>
                        <p>{staff.role}</p>
                        <div className="sci-staff-mini-stats">
                          <span className="sci-mini-stat ok"><CheckCircle2 size={11}/>{stats.onTime} on time</span>
                          <span className="sci-mini-stat late"><AlertTriangle size={11}/>{stats.late} late</span>
                        </div>
                        <span className="sci-view-report">View full report <ChevronRight size={11}/></span>
                      </div>
                      <div className="sci-staff-actions">
                        <button className="sci-qr-btn" onClick={()=>openQR(staff)} title="QR"><QrCode size={14}/></button>
                        <button className="sci-edit-btn" onClick={()=>openEdit(staff)} title="Edit"><Pencil size={14}/></button>
                        <button className="sci-delete-btn" onClick={()=>handleDelete(staff.id)} title="Delete"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
                {!loading&&staffList.length===0&&<p className="sci-empty">No staff added yet.</p>}
              </div>
            </section>
          </>
        )}

        {/* ════════════════════ REPORT TAB ════════════════════ */}
        {activeTab==="report"&&(
          <>
            <header className="admin-header" style={{marginTop:0}}>
              <div>
                <h1>
                  {reportStaff
                    ? <><span style={{color:"#9FB8AE",fontWeight:400,fontSize:18,cursor:"pointer"}} onClick={()=>setReportStaff(null)}>All Staff</span> / {reportStaff.name}</>
                    : "Staff Report"}
                </h1>
                <p>{reportStaff?"Individual attendance history":"Full team attendance overview"}</p>
              </div>
              <div className="sci-header-right">
                <button className="mb-export-btn excel" onClick={handleExcelExport} disabled={exporting||loading}>
                  <Table2 size={15}/>{exporting?"…":"Excel"}
                </button>
              </div>
            </header>

            {/* Summary cards for selected staff */}
            {reportStaff&&(()=>{
              const stats=getStaffStats(reportStaff.id);
              const totalMins=stats.totalHours;
              const hrsStr=`${Math.floor(totalMins/60)}h ${String(totalMins%60).padStart(2,"0")}m`;
              return(
                <div className="sci-report-hero">
                  <div className="sci-report-av">{reportStaff.name[0].toUpperCase()}</div>
                  <div>
                    <h2>{reportStaff.name}</h2>
                    <p>{reportStaff.role} · {reportStaff.barcode}</p>
                  </div>
                  <div className="sci-report-summary">
                    <div className="sci-report-stat"><span>Total Days</span><strong>{stats.total}</strong></div>
                    <div className="sci-report-stat ok"><span>On Time</span><strong>{stats.onTime}</strong></div>
                    <div className="sci-report-stat late"><span>Late</span><strong>{stats.late}</strong></div>
                    <div className="sci-report-stat hours"><span>Total Hours</span><strong>{hrsStr}</strong></div>
                  </div>
                </div>
              );
            })()}

            {/* Filters */}
            <div className="sci-report-filters">
              {!reportStaff&&(
                <select className="sci-report-select"
                  value={reportStaff?.id||""}
                  onChange={e=>setReportStaff(staffList.find(s=>s.id===Number(e.target.value))||null)}>
                  <option value="">All Staff</option>
                  {staffList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
              {reportStaff&&(
                <button className="sci-back-filter" onClick={()=>setReportStaff(null)}>← All Staff</button>
              )}
              <input type="date" className="sci-report-date" value={reportDateFrom} onChange={e=>setReportDateFrom(e.target.value)} placeholder="From"/>
              <input type="date" className="sci-report-date" value={reportDateTo}   onChange={e=>setReportDateTo(e.target.value)} placeholder="To"/>
              {(reportDateFrom||reportDateTo)&&(
                <button className="sci-clear-date" onClick={()=>{setReportDateFrom("");setReportDateTo("");}}>Clear dates</button>
              )}
            </div>

            {/* Staff cards overview (when no specific staff) */}
            {!reportStaff&&(
              <div className="sci-report-staff-grid" style={{marginBottom:20}}>
                {staffList.map(staff=>{
                  const stats=getStaffStats(staff.id);
                  const latePercent=stats.total>0?Math.round((stats.late/stats.total)*100):0;
                  return(
                    <div key={staff.id} className="sci-report-staff-card"
                      onClick={()=>setReportStaff(staff)}>
                      <div className="sci-report-card-av">{staff.name[0].toUpperCase()}</div>
                      <div className="sci-report-card-info">
                        <h4>{staff.name}</h4>
                        <p>{staff.role}</p>
                        <div className="sci-report-card-bar-wrap">
                          <div className="sci-report-card-bar">
                            <div className="sci-report-card-bar-fill ok"  style={{width:`${stats.total>0?(stats.onTime/stats.total)*100:0}%`}}/>
                            <div className="sci-report-card-bar-fill late" style={{width:`${latePercent}%`}}/>
                          </div>
                          <span>{stats.total} days · {stats.late} late</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="sci-report-card-arrow"/>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Detailed records table */}
            <section className="admin-card">
              <div className="card-title">
                <h2>{reportStaff?`${reportStaff.name}'s Records`:"All Records"}</h2>
                <p>{reportRows.length} record(s)</p>
              </div>
              <div className="route-table">
                <table>
                  <thead>
                    <tr>
                      {!reportStaff&&<th>Staff</th>}
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.length===0&&!loading&&(
                      <tr><td colSpan={reportStaff?5:6} className="empty-table">No records found.</td></tr>
                    )}
                    {reportRows.map(({rec,staff,status,hours})=>(
                      <tr key={rec.id}>
                        {!reportStaff&&<td><strong>{staff?.name}</strong><br/><small>{staff?.role}</small></td>}
                        <td>{rec.date}</td>
                        <td>{rec.check_in_time?.slice(0,5)||<span className="sci-absent">—</span>}</td>
                        <td>{rec.check_out_time?.slice(0,5)||<span className="sci-working">Working</span>}</td>
                        <td>{hours||<span className="sci-absent">—</span>}</td>
                        <td>
                          {status
                            ? <span className={`sci-status-badge ${status.level}`}>{status.emoji} {status.title}</span>
                            : <span className="sci-status-badge great">🎉 On Time</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── MODALS ── */}
      {modal==="pin"&&selectedStaff&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className={`sci-modal pin-modal ${pinShake?"shake":""}`} onClick={e=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <div className="sci-modal-avatar">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2><p className="sci-modal-role">{selectedStaff.role}</p>
            <div className="sci-modal-time">{clock}</div>
            <p className="pin-label">{actionType==="checkin"?"🔐 Enter PIN to Check In":"🔐 Enter PIN to Check Out"}</p>
            <div className="pin-dots">{[0,1,2,3].map(i=><div key={i} className={`pin-dot ${i<pin.length?"filled":""}`}/>)}</div>
            {pinError&&<p className="pin-error">{pinError}</p>}
            <div className="pin-pad">
              {PIN_KEYS.map(key=>(
                <button key={key} className={`pin-btn ${key==="clear"||key==="del"?"action":""} ${key==="0"?"zero":""}`} onClick={()=>handlePinKey(key)}>
                  {key==="clear"?"Clear":key==="del"?<Delete size={16}/>:key}
                </button>
              ))}
            </div>
            <button className={`sci-confirm ${actionType==="checkin"?"checkin":"checkout"}`} onClick={handlePinSubmit} disabled={pin.length<4}>
              {actionType==="checkin"?<><CheckCircle2 size={17}/> Confirm Check-In</>:<><LogOut size={17}/> Confirm Check-Out</>}
            </button>
          </div>
        </div>
      )}

      {modal==="status"&&statusResult&&selectedStaff&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal status-modal" onClick={e=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            {statusResult.type==="checkin"&&(<>
              <div className={`sci-status-emoji ${statusResult.status.level}`}>{statusResult.status.emoji}</div>
              <h2 style={{color:statusResult.status.color}}>{statusResult.status.title}</h2>
              <p className="sci-modal-role">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="sci-status-time-box">
                <div><span>Checked In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Work Starts</span><strong>{String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")}</strong></div>
              </div>
              <p className="sci-status-msg" style={{color:statusResult.status.color}}>{statusResult.status.msg}</p>
              <button className="sci-confirm checkin" onClick={closeModal} style={{marginTop:16}}>Done</button>
            </>)}
            {statusResult.type==="checkout"&&(<>
              <div className="sci-status-emoji great">👋</div>
              <h2>See You Tomorrow!</h2><p className="sci-modal-role">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="sci-status-time-box">
                <div><span>In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Out</span><strong>{statusResult.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
              <button className="sci-confirm checkout" onClick={closeModal} style={{marginTop:16}}>Done</button>
            </>)}
            {statusResult.type==="already"&&(<>
              <div className="sci-status-emoji great">✅</div>
              <h2>Already Completed</h2><p className="sci-modal-role">{selectedStaff.name}</p>
              <div className="sci-status-time-box">
                <div><span>In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Out</span><strong>{statusResult.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
              <button className="sci-confirm checkin" onClick={closeModal} style={{marginTop:16}}>OK</button>
            </>)}
          </div>
        </div>
      )}

      {modal==="qr"&&qrStaff&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal qr-modal" onClick={e=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <h2>QR Code</h2><p className="sci-modal-role">{qrStaff.name} · {qrStaff.role}</p>
            <div className="qr-card">
              <img src={qrUrl(qrStaff.barcode,220)} alt="QR"/>
              <div className="qr-card-name">{qrStaff.name}</div>
              <div className="qr-card-role">{qrStaff.role}</div>
              <code className="qr-card-id">ID: {qrStaff.barcode}</code>
            </div>
            <div className="sci-modal-actions" style={{marginTop:16}}>
              <button className="sci-qr-action-btn download" onClick={()=>{const a=document.createElement("a");a.href=qrUrl(qrStaff.barcode,400);a.download=`QR_${qrStaff.name}.png`;a.target="_blank";a.click();}}>
                <Download size={16}/> Download
              </button>
              <button className="sci-qr-action-btn print" onClick={()=>{
                const w=window.open("","_blank");
                w.document.write(`<html><head><title>QR</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif}.card{border:3px solid #04342C;border-radius:16px;padding:32px 40px;text-align:center;max-width:300px}img{width:200px;height:200px;display:block;margin:0 auto 16px}h2{color:#04342C;font-size:22px;margin:0 0 4px}p{color:#62716b;font-size:14px;margin:0}.badge{display:inline-block;background:#04342C;color:#9FE1CB;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;margin-top:6px}.co{margin-top:20px;font-size:12px;color:#9FB8AE;border-top:1px solid #e0ece6;padding-top:14px}</style></head><body><div class="card"><img src="${qrUrl(qrStaff.barcode,200)}"/><h2>${qrStaff.name}</h2><p>${qrStaff.role}</p><div class="badge">ID: ${qrStaff.barcode}</div><div class="co">Cambodia Bus Express</div></div><script>window.onload=()=>window.print()</script></body></html>`);
                w.document.close();
              }}><Printer size={16}/> Print Card</button>
            </div>
          </div>
        </div>
      )}

      {modal==="form"&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" style={{maxWidth:420,textAlign:"left"}} onClick={e=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <h2 style={{textAlign:"center",marginBottom:4}}>{editingId?"Edit Staff":"Add Staff"}</h2>
            <p style={{textAlign:"center",color:"#62716b",fontSize:13,marginBottom:20}}>Each staff needs a unique PIN to check in.</p>
            <form className="sci-add-form" onSubmit={handleFormSubmit}>
              <label>Full Name *</label>
              <input value={formStaff.name} onChange={e=>setFormStaff({...formStaff,name:e.target.value})} placeholder="e.g. Sokha Chan"/>
              <label>Barcode / ID *</label>
              <input value={formStaff.barcode} onChange={e=>setFormStaff({...formStaff,barcode:e.target.value})} placeholder="e.g. STAFF001"/>
              <label>Role</label>
              <select value={formStaff.role} onChange={e=>setFormStaff({...formStaff,role:e.target.value})}>
                <option>Staff</option><option>Driver</option><option>Cashier</option>
                <option>Manager</option><option>Security</option><option>Cleaner</option>
              </select>
              <label>Personal PIN (4 digits) *</label>
              <input value={formStaff.pin} onChange={e=>setFormStaff({...formStaff,pin:e.target.value.replace(/\D/g,"").slice(0,4)})}
                placeholder="e.g. 1234" type="password" inputMode="numeric" maxLength={4}/>
              <div className="sci-modal-actions" style={{marginTop:20}}>
                <button type="button" className="sci-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="sci-confirm checkin">{editingId?<><Pencil size={15}/> Save</>:<><UserPlus size={15}/> Add Staff</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal==="notfound"&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={e=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <div style={{fontSize:56,marginBottom:12}}>❓</div>
            <h2>Not Found</h2><p className="sci-modal-role">Barcode not registered.</p>
            <div className="sci-modal-actions" style={{marginTop:20}}>
              <button className="sci-cancel" onClick={closeModal}>Cancel</button>
              <button className="sci-confirm checkin" onClick={openAdd}><UserPlus size={16}/> Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}