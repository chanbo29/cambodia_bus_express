import { useEffect, useRef, useState } from "react";
import {
  Bus, MapPin, Ticket, ClipboardCheck, Tag,
  FileBarChart, Megaphone, QrCode, UserCheck,
  Clock, CheckCircle2, LogOut, AlertTriangle,
  UserPlus, Trash2, X, Delete, Pencil,
  Download, Printer, Link,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import "./StaffCheckIn.css";

const WORK_START = { hour: 21, minute: 0 };
const SCAN_URL   = "https://cambodia-bus-express.vercel.app/staff-scan";
const QR_IMG     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(SCAN_URL)}&bgcolor=FFFFFF&color=04342C&margin=10`;

function getCambodiaDate() { return new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Phnom_Penh"}); }
function getCambodiaTime() { return new Date().toLocaleTimeString("en-US",{timeZone:"Asia/Phnom_Penh",hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
function getArrivalStatus(t) {
  if (!t) return null;
  const [h,m] = t.split(":").map(Number);
  const diff  = h*60+m-(WORK_START.hour*60+WORK_START.minute);
  if (diff<=0)   return {level:"great",   emoji:"🎉",title:"Good Job!",       msg:"You arrived on time! Keep it up!",          color:"#1D9E75"};
  if (diff<=5)   return {level:"careful", emoji:"⚠️", title:"Be Careful!",     msg:`${diff} min late. Try to be on time.`,      color:"#d97706"};
  if (diff<=30)  return {level:"warning", emoji:"😬",title:"Warning!",         msg:`${diff} mins late. Being noted.`,           color:"#ea580c"};
  if (diff<=120) return {level:"boss",    emoji:"👀",title:"Boss is Watching!",msg:`${diff} mins late! See supervisor.`,        color:"#dc2626"};
  return           {level:"critical",emoji:"🆘",title:"Very Late!",        msg:`${Math.floor(diff/60)}h ${diff%60}m late!`, color:"#7f1d1d"};
}

const PIN_KEYS   = ["1","2","3","4","5","6","7","8","9","clear","0","del"];
const EMPTY_FORM = { name:"", barcode:"", role:"Staff", pin:"" };

export default function StaffCheckIn() {
  const navigate   = useNavigate();
  const barcodeRef = useRef(null);
  const [barcode, setBarcode]       = useState("");
  const [staffList, setStaffList]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [clock, setClock]           = useState(getCambodiaTime());
  const [copied, setCopied]         = useState(false);

  const [modal, setModal]               = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [statusResult, setStatusResult]   = useState(null);
  const [actionType, setActionType]       = useState(null);
  const [pin, setPin]                     = useState("");
  const [pinError, setPinError]           = useState("");
  const [pinShake, setPinShake]           = useState(false);
  const [formStaff, setFormStaff]         = useState(EMPTY_FORM);
  const [editingId, setEditingId]         = useState(null);

  useEffect(() => { const t = setInterval(() => setClock(getCambodiaTime()),1000); return ()=>clearInterval(t); },[]);
  useEffect(() => { fetchAll(); },[]);
  useEffect(() => { if (!modal) setTimeout(()=>barcodeRef.current?.focus(),100); },[modal]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s,r] = await Promise.all([API.get("/staff/"),API.get("/staff-records/")]);
      setStaffList(Array.isArray(s.data)?s.data:[]);
      setRecords(Array.isArray(r.data)?r.data:[]);
    } catch(e){console.log(e);}
    finally{setLoading(false);}
  };

  useEffect(() => {
    let buf="",timer=null;
    const onKey = (e) => {
      if (modal) return;
      if (e.key==="Enter"){ if(buf.length>2) handleBarcodeScanned(buf); buf=""; clearTimeout(timer); }
      else if (e.key.length===1){ buf+=e.key; clearTimeout(timer); timer=setTimeout(()=>{buf="";},200); }
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[modal,staffList,records]);

  const handleBarcodeScanned = (code) => {
    const staff = staffList.find((s)=>s.barcode===code.trim());
    if (!staff){setModal("notfound");return;}
    setSelectedStaff(staff); setPin(""); setPinError("");
    const rec = records.find((r)=>r.staff===staff.id&&r.date===getCambodiaDate());
    if (rec&&!rec.check_out_time){setActionType("checkout");}
    else if (rec?.check_out_time){setStatusResult({type:"already",record:rec});setModal("status");return;}
    else{setActionType("checkin");}
    setModal("pin");
  };

  const handleManualScan = () => { if(barcode.trim()){handleBarcodeScanned(barcode.trim());setBarcode("");} };

  const handlePinKey = (key) => {
    setPinError("");
    if (key==="clear"){setPin("");return;}
    if (key==="del"){setPin((p)=>p.slice(0,-1));return;}
    if (pin.length>=4) return;
    setPin((p)=>p+key);
  };

  const handlePinSubmit = async () => {
    if (pin.length<4){setPinError("Please enter all 4 digits.");return;}
    if (pin!==selectedStaff.pin){
      setPinError("❌ Wrong PIN. Try again.");
      setPinShake(true); setTimeout(()=>setPinShake(false),500); setPin(""); return;
    }
    if (actionType==="checkin") await doCheckIn();
    else await doCheckOut();
  };

  const doCheckIn = async () => {
    try {
      const now = getCambodiaTime().slice(0,5);
      const res = await API.post("/staff-records/",{staff:selectedStaff.id,date:getCambodiaDate(),check_in_time:now});
      setStatusResult({type:"checkin",record:res.data,status:getArrivalStatus(now)});
      setModal("status"); fetchAll();
    } catch(err){alert("Failed: "+JSON.stringify(err.response?.data||err.message));}
  };

  const doCheckOut = async () => {
    try {
      const rec = records.find((r)=>r.staff===selectedStaff.id&&r.date===getCambodiaDate());
      if (!rec) return;
      const now = getCambodiaTime().slice(0,5);
      const res = await API.patch(`/staff-records/${rec.id}/`,{check_out_time:now});
      setStatusResult({type:"checkout",record:res.data}); setModal("status"); fetchAll();
    } catch(err){alert("Failed: "+err.message);}
  };

  const openAdd = () => { setEditingId(null); setFormStaff(EMPTY_FORM); setModal("form"); };
  const openEdit = (s) => { setEditingId(s.id); setFormStaff({name:s.name,barcode:s.barcode,role:s.role,pin:s.pin}); setModal("form"); };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formStaff.name.trim()||!formStaff.barcode.trim()||formStaff.pin.length!==4){alert("Name, barcode and 4-digit PIN required.");return;}
    try {
      if (editingId) await API.put(`/staff/${editingId}/`,formStaff);
      else           await API.post("/staff/",formStaff);
      setModal(null); setFormStaff(EMPTY_FORM); setEditingId(null); fetchAll();
    } catch(err){alert("Failed: "+JSON.stringify(err.response?.data||err.message));}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try{await API.delete(`/staff/${id}/`);fetchAll();}catch{alert("Failed.");}
  };

  const copyLink = () => {
    navigator.clipboard.writeText(SCAN_URL);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const printQR = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Staff Check-In QR</title><style>
      body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#fff}
      .card{border:3px solid #04342C;border-radius:16px;padding:32px 40px;text-align:center}
      img{width:220px;height:220px;display:block;margin:0 auto 16px}
      h2{color:#04342C;font-size:20px;margin:0 0 6px}p{color:#62716b;font-size:14px;margin:0}
      .url{font-size:10px;color:#9FB8AE;margin-top:12px;word-break:break-all}
    </style></head><body>
      <div class="card"><img src="${QR_IMG}" alt="QR"/>
        <h2>Cambodia Bus Express</h2><p>Scan to Check In / Out</p>
        <div class="url">${SCAN_URL}</div>
      </div><script>window.onload=()=>window.print()</script>
    </body></html>`);
    w.document.close();
  };

  const closeModal = () => { setModal(null);setSelectedStaff(null);setStatusResult(null);setActionType(null);setPin("");setPinError(""); };
  const todayRecords = records.filter((r)=>r.date===getCambodiaDate());

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo"><div><Bus size={32}/></div><section><h2>Cambodia Bus</h2><p>Admin Panel</p></section></div>
        <nav>
          <a onClick={()=>navigate("/admin-dashboard")}><Bus size={20}/> Dashboard</a>
          <a onClick={()=>navigate("/admin-dashboard/routes")}><MapPin size={20}/> Routes</a>
          <a onClick={()=>navigate("/admin-dashboard/bookings")}><Ticket size={20}/> Bookings</a>
          <a className="active"><ClipboardCheck size={20}/> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/staff-report")}>
            <FileBarChart size={20}/> Staff Report
          </a>
          <a onClick={()=>navigate("/admin-dashboard/promotions")}><Tag size={20}/> Promotions</a>
          <a onClick={()=>navigate("/admin-dashboard/reports")}><FileBarChart size={20}/> Reports</a>
          <a onClick={()=>navigate("/admin-dashboard/announcements")}><Megaphone size={20}/> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main sci-main">
        <header className="admin-header">
          <div><h1>Staff Attendance</h1><p>Print QR → Staff scan → Select name → Enter PIN → Done.</p></div>
          <div className="sci-header-right">
            <div className="sci-clock">{clock}</div>
            <button className="sci-add-btn" onClick={openAdd}><UserPlus size={16}/> Add Staff</button>
          </div>
        </header>

        {/* ── QR Card ── */}
        <div className="sci-scan-card">
          <div className="sci-qr-section">
            <div className="sci-qr-left">
              <div className="sci-scan-icon"><QrCode size={44}/></div>
              <h2>Staff Check-In QR Code</h2>
              <p>Print and place this QR at the entrance.<br/>Staff scan with their phone to check in or out.</p>
              <div className="sci-qr-url-row">
                <code>{SCAN_URL}</code>
                <button className="sci-copy-btn" onClick={copyLink}>
                  <Link size={14}/> {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="sci-scan-hint">🔐 PIN required after selecting name · prevents proxy check-in</p>
              <div className="sci-qr-btn-row">
                <button className="sci-qr-action download" onClick={()=>{const a=document.createElement("a");a.href=QR_IMG;a.download="Staff_QR.png";a.target="_blank";a.click();}}>
                  <Download size={15}/> Download
                </button>
                <button className="sci-qr-action print" onClick={printQR}>
                  <Printer size={15}/> Print QR Card
                </button>
              </div>
            </div>
            <div className="sci-qr-right">
              <div className="sci-qr-print-card">
                <img src={QR_IMG} alt="Staff Check-In QR Code"/>
                <div className="sci-qr-brand">Cambodia Bus Express</div>
                <div className="sci-qr-brand-sub">Scan to Check In / Out</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <section className="admin-stats" style={{marginTop:20}}>
          <div><UserCheck/><span>Total Staff</span><h3>{staffList.length}</h3></div>
          <div><CheckCircle2/><span>Checked In Today</span><h3>{todayRecords.filter((r)=>r.check_in_time&&!r.check_out_time).length}</h3></div>
          <div><LogOut/><span>Checked Out</span><h3>{todayRecords.filter((r)=>r.check_out_time).length}</h3></div>
          <div><AlertTriangle/><span>Late Today</span><h3>{todayRecords.filter((r)=>{const s=getArrivalStatus(r.check_in_time?.slice(0,5));return s&&s.level!=="great";}).length}</h3></div>
        </section>

        {/* Attendance table */}
        <section className="admin-card" style={{marginTop:20}}>
          <div className="card-title">
            <h2>Today's Attendance — {getCambodiaDate()}</h2>
            <p>{loading?"Loading...":`${todayRecords.length} record(s)`}</p>
          </div>
          <div className="route-table">
            <table>
              <thead><tr><th>Staff</th><th>Role</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
              <tbody>
                {staffList.map((staff)=>{
                  const rec=todayRecords.find((r)=>r.staff===staff.id);
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
            {staffList.map((staff)=>(
              <div key={staff.id} className="sci-staff-card">
                <div className="sci-staff-avatar">{staff.name[0].toUpperCase()}</div>
                <div className="sci-staff-info">
                  <h4>{staff.name}</h4><p>{staff.role}</p>
                  <code>{staff.barcode}</code>
                  <span className="sci-pin-badge">PIN: ••••</span>
                </div>
                <div className="sci-staff-actions">
                  <button className="sci-edit-btn" onClick={()=>openEdit(staff)} title="Edit"><Pencil size={14}/></button>
                  <button className="sci-delete-btn" onClick={()=>handleDelete(staff.id)} title="Delete"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {!loading&&staffList.length===0&&<p className="sci-empty">No staff added yet.</p>}
          </div>
        </section>
      </main>

      {/* ── ADD/EDIT MODAL ── */}
      {modal==="form"&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" style={{maxWidth:420,textAlign:"left"}} onClick={(e)=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <h2 style={{textAlign:"center",marginBottom:4}}>{editingId?"Edit Staff":"Add Staff"}</h2>
            <p style={{textAlign:"center",color:"#62716b",fontSize:13,marginBottom:20}}>Each staff needs a unique PIN to check in.</p>
            <form className="sci-add-form" onSubmit={handleFormSubmit}>
              <label>Full Name *</label>
              <input value={formStaff.name} onChange={(e)=>setFormStaff({...formStaff,name:e.target.value})} placeholder="e.g. Sokha Chan"/>
              <label>Barcode / ID *</label>
              <input value={formStaff.barcode} onChange={(e)=>setFormStaff({...formStaff,barcode:e.target.value})} placeholder="e.g. STAFF001"/>
              <label>Role</label>
              <select value={formStaff.role} onChange={(e)=>setFormStaff({...formStaff,role:e.target.value})}>
                <option>Staff</option><option>Driver</option><option>Cashier</option>
                <option>Manager</option><option>Security</option><option>Cleaner</option>
              </select>
              <label>Personal PIN (4 digits) *</label>
              <input value={formStaff.pin} onChange={(e)=>setFormStaff({...formStaff,pin:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="e.g. 1234" type="password" inputMode="numeric" maxLength={4}/>
              <p style={{fontSize:12,color:"#9FB8AE",marginTop:6}}>🔐 Staff must remember this PIN to check in.</p>
              <div className="sci-modal-actions" style={{marginTop:20}}>
                <button type="button" className="sci-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="sci-confirm checkin">{editingId?<><Pencil size={15}/> Save</>:<><UserPlus size={15}/> Add Staff</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PIN MODAL ── */}
      {modal==="pin"&&selectedStaff&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className={`sci-modal pin-modal ${pinShake?"shake":""}`} onClick={(e)=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <div className="sci-modal-avatar">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="sci-modal-role">{selectedStaff.role}</p>
            <div className="sci-modal-time">{clock}</div>
            <p className="pin-label">{actionType==="checkin"?"🔐 Enter PIN to Check In":"🔐 Enter PIN to Check Out"}</p>
            <div className="pin-dots">{[0,1,2,3].map((i)=><div key={i} className={`pin-dot ${i<pin.length?"filled":""}`}/>)}</div>
            {pinError&&<p className="pin-error">{pinError}</p>}
            <div className="pin-pad">
              {PIN_KEYS.map((key)=>(
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

      {/* ── STATUS MODAL ── */}
      {modal==="status"&&statusResult&&selectedStaff&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal status-modal" onClick={(e)=>e.stopPropagation()}>
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
              <h2>See You Tomorrow!</h2>
              <p className="sci-modal-role">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="sci-status-time-box">
                <div><span>Checked In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Checked Out</span><strong>{statusResult.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
              <button className="sci-confirm checkout" onClick={closeModal} style={{marginTop:16}}>Done</button>
            </>)}
            {statusResult.type==="already"&&(<>
              <div className="sci-status-emoji great">✅</div>
              <h2>Already Completed</h2>
              <p className="sci-modal-role">{selectedStaff.name} already checked in and out today.</p>
              <div className="sci-status-time-box">
                <div><span>In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Out</span><strong>{statusResult.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
              <button className="sci-confirm checkin" onClick={closeModal} style={{marginTop:16}}>OK</button>
            </>)}
          </div>
        </div>
      )}

      {/* ── NOT FOUND ── */}
      {modal==="notfound"&&(
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={(e)=>e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18}/></button>
            <div style={{fontSize:56,marginBottom:12}}>❓</div>
            <h2>Not Found</h2>
            <p className="sci-modal-role">Barcode not registered.</p>
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