import { useState, useCallback, useRef } from "react";

const NHTSA_DECODE  = v => "/api/nhtsa?type=decodeVin&vin=" + v;
const NHTSA_RECALL  = v => "/api/nhtsa?type=recallsByVin&vin=" + v;
const NHTSA_VEHICLE = (mk, mo, yr) => "/api/nhtsa?type=recallsByVehicle&make=" + encodeURIComponent(mk) + "&model=" + encodeURIComponent(mo) + "&year=" + yr;
const NHTSA_MODELS  = (mk, yr) => "/api/nhtsa?type=models&make=" + encodeURIComponent(mk) + "&year=" + yr;

const MAKES = ["Toyota","Honda","Ford","Chevrolet","Volkswagen","Tesla","Jeep","Ram","Nissan","Hyundai","Kia","BMW","Mercedes-Benz","Subaru","Mazda","Dodge","Lexus","Acura","Infiniti","Cadillac","GMC","Buick","Lincoln","Volvo","Other"];
const YEARS = Array.from({ length: 25 }, (_, i) => 2024 - i);
const ISSUES = [
{ id:"engine",       icon:"🔧", name:"Engine Failure",        desc:"Oil consumption, stalling, knocking, or complete failure" },
{ id:"transmission", icon:"⚙️", name:"Transmission",          desc:"Shuddering, slipping, hesitation, or failure to shift" },
{ id:"battery",      icon:"🔋", name:"Battery / EV System",   desc:"Degradation, reduced range, charging failure, or fire risk" },
{ id:"brakes",       icon:"🛑", name:"Brakes",                desc:"Failure, premature wear, or unintended engagement" },
{ id:"cooling",      icon:"🌡️", name:"Cooling System",        desc:"Overheating, coolant leaks, or head gasket failure" },
{ id:"airbag",       icon:"💨", name:"Airbag / Safety",       desc:"Recall-related airbag, sensor, or ADAS system issues" },
{ id:"rust",         icon:"🦀", name:"Rust / Corrosion",      desc:"Premature frame, body, or undercarriage corrosion" },
{ id:"electrical",   icon:"⚡", name:"Electrical",            desc:"Wiring failures, module issues, or infotainment problems" },
{ id:"oil",          icon:"🛢️", name:"Oil / Fluids",          desc:"Excessive consumption, leaks, or contamination" },
{ id:"suspension",   icon:"🚗", name:"Suspension / Steering", desc:"Pulling, vibration, premature wear, or failure" },
];
const DEALER_OUTCOMES = ["Repaired under warranty","Repaired — but issue returned","Dismissed as 'normal'","Repair refused under warranty","Quoted high out-of-pocket cost","Said they couldn't reproduce the issue","Still waiting for resolution"];
const COST_RANGES = ["$0 — covered under warranty","$1 – $500","$500 – $2,000","$2,000 – $5,000","$5,000 – $10,000","Over $10,000"];
const STEPS = [
{ id:"vehicle", num:1, label:"Your Vehicle",   sub:"Tell us what you drive" },
{ id:"issue",   num:2, label:"The Problem",    sub:"Describe what's happening" },
{ id:"history", num:3, label:"Repair History", sub:"What you've tried so far" },
{ id:"docs",    num:4, label:"Documentation",  sub:"Upload your evidence" },
{ id:"contact", num:5, label:"Your Info",      sub:"Where to send results" },
];
const FAQS_DATA = [
{ q:"Is this free to use?", a:"Yes, completely free. ClaimCheck is a consumer documentation platform. There's no charge to submit your vehicle issue or receive your results summary." },
{ q:"Does submitting mean I'm filing a lawsuit?", a:"No. Submitting creates a documented record of your vehicle defect. You remain in full control of any next steps. We present options — you decide." },
{ q:"What happens after I submit?", a:"We cross-reference your submission against known defect patterns, active NHTSA recalls, and TSBs. You'll receive a summary within 1–2 business days." },
{ q:"Do I need a lawyer to use this?", a:"No. ClaimCheck is a documentation tool. If your case qualifies for legal review, we can connect you with an independent licensed attorney at no cost — entirely your choice." },
{ q:"What vehicles do you cover?", a:"All makes and models sold in the US, with particular expertise in Toyota, Honda, Ford, GM, Volkswagen, Tesla, and Stellantis vehicles." },
{ q:"Is my information secure?", a:"All submissions are encrypted in transit and at rest. We never sell your personal information to third parties." },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --navy:#0B1120;--navy3:#1E2A3D;
  --teal:#00C2A8;--teal2:#009E8A;
  --white:#FAFBFC;--warm:#F7F6F3;
  --slate:#64748B;--muted:#94A3B8;
  --border:rgba(0,0,0,0.08);
  --serif:'Instrument Serif',Georgia,serif;
  --sans:'DM Sans',system-ui,sans-serif;
}
html{scroll-behavior:smooth;}
body{background:var(--white);font-family:var(--sans);color:var(--navy);overflow-x:hidden;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px;}
button,input,select,textarea{font-family:var(--sans);}
.app{min-height:100vh;}

/* NAV */
.nav{height:62px;background:rgba(250,251,252,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 28px;}
.nav-brand{display:flex;align-items:center;gap:10px;cursor:pointer;}
.nav-mark{width:34px;height:34px;border-radius:9px;background:var(--navy);display:flex;align-items:center;justify-content:center;}
.nav-name{font-size:16px;font-weight:700;color:var(--navy);letter-spacing:-0.3px;}
.nav-tag{font-size:11px;color:var(--teal2);font-weight:600;margin-left:1px;}
.nav-links{display:flex;gap:4px;}
.nav-link{background:transparent;border:none;color:var(--slate);font-size:14px;font-weight:500;padding:8px 14px;border-radius:9px;cursor:pointer;transition:all 0.15s;}
.nav-link:hover{color:var(--navy);background:rgba(0,0,0,0.04);}
.nav-cta{background:var(--navy);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;}
.nav-cta:hover{background:var(--navy3);box-shadow:0 4px 20px rgba(11,17,32,0.25);}

/* HERO */
.hero{background:var(--navy);padding:88px 28px 80px;text-align:center;position:relative;overflow:hidden;}
.hero-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(0,194,168,0.15) 0%,transparent 70%);}
.hero-grid{position:absolute;inset:0;pointer-events:none;opacity:0.04;background-image:linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px);background-size:48px 48px;}
.hero-eye{display:inline-flex;align-items:center;gap:8px;background:rgba(0,194,168,0.12);border:1px solid rgba(0,194,168,0.25);border-radius:100px;padding:6px 16px;font-size:12px;font-weight:600;color:var(--teal);letter-spacing:0.5px;margin-bottom:28px;position:relative;}
.eye-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
.hero-h1{font-family:var(--serif);font-size:clamp(38px,6vw,76px);font-weight:400;line-height:1.05;letter-spacing:-1px;color:#fff;margin-bottom:22px;max-width:760px;margin-left:auto;margin-right:auto;position:relative;}
.hero-em{font-style:italic;color:var(--teal);}
.hero-sub{font-size:17px;color:rgba(255,255,255,0.55);max-width:500px;margin:0 auto 44px;line-height:1.75;position:relative;}
.hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:52px;position:relative;}
.btn-primary{background:var(--teal);color:var(--navy);border:none;border-radius:12px;padding:14px 26px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:8px;}
.btn-primary:hover{background:var(--teal2);transform:translateY(-1px);box-shadow:0 8px 28px rgba(0,194,168,0.4);}
.btn-ghost{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:14px 26px;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;}
.btn-ghost:hover{background:rgba(255,255,255,0.12);}
.hero-proof{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;position:relative;}
.proof-item{display:flex;align-items:center;gap:7px;font-size:13px;color:rgba(255,255,255,0.45);}
.proof-check{color:var(--teal);font-size:12px;}

/* MAKES */
.makes{background:var(--warm);border-bottom:1px solid var(--border);padding:14px 28px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;}
.makes-label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:1.2px;margin-right:6px;}
.make-pill{font-size:12px;font-weight:600;color:var(--slate);background:#fff;border:1px solid var(--border);border-radius:6px;padding:4px 12px;}
.make-pill.hl{border-color:rgba(0,194,168,0.4);color:var(--teal2);background:rgba(0,194,168,0.07);}

/* SECTIONS */
.section{padding:88px 28px;}
.section.alt{background:var(--warm);}
.section.dark{background:var(--navy);}
.inner{max-width:1060px;margin:0 auto;}
.sec-label{font-size:11px;font-weight:700;color:var(--teal2);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;}
.sec-label.lt{color:rgba(0,194,168,0.6);}
.sec-h{font-family:var(--serif);font-size:clamp(30px,4vw,50px);font-weight:400;line-height:1.1;letter-spacing:-0.5px;margin-bottom:14px;}
.sec-h.lt{color:#fff;}
.sec-sub{font-size:16px;color:var(--slate);line-height:1.75;max-width:520px;margin-bottom:52px;}
.sec-sub.lt{color:rgba(255,255,255,0.5);}

/* HOW IT WORKS */
.steps-row{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.step-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:28px;transition:all 0.2s;}
.step-card:hover{border-color:rgba(0,194,168,0.3);box-shadow:0 4px 24px rgba(0,0,0,0.06);transform:translateY(-2px);}
.step-n{width:36px;height:36px;border-radius:10px;background:var(--navy);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:18px;}
.step-icon{font-size:26px;margin-bottom:12px;}
.step-title{font-family:var(--serif);font-size:20px;font-weight:400;margin-bottom:8px;}
.step-desc{font-size:13px;color:var(--slate);line-height:1.7;}

/* ISSUES */
.issues-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.issue-card{background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:18px;cursor:pointer;transition:all 0.15s;}
.issue-card:hover{border-color:rgba(0,194,168,0.4);transform:translateY(-1px);}
.issue-card.sel{border-color:var(--teal);background:rgba(0,194,168,0.05);}
.ic-icon{font-size:24px;margin-bottom:8px;}
.ic-name{font-size:13px;font-weight:700;margin-bottom:4px;}
.ic-desc{font-size:11px;color:var(--slate);line-height:1.5;}

/* TRUST */
.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.trust-stat{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:28px 20px;text-align:center;}
.ts-n{font-family:var(--serif);font-size:42px;color:var(--teal);letter-spacing:-1px;line-height:1;margin-bottom:6px;}
.ts-l{font-size:12px;color:rgba(255,255,255,0.45);line-height:1.5;}

/* TESTIMONIALS */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.testi{background:var(--warm);border:1px solid var(--border);border-radius:14px;padding:26px;}
.testi-quote{font-size:14px;color:var(--slate);line-height:1.75;margin-bottom:18px;font-style:italic;}
.testi-name{font-size:14px;font-weight:700;}
.testi-detail{font-size:12px;color:var(--muted);margin-top:3px;}

/* FAQ */
.faqs{max-width:660px;margin:0 auto;}
.faq{border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;transition:border-color 0.15s;}
.faq:hover{border-color:#CBD5E1;}
.faq-q{width:100%;background:transparent;border:none;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-size:14px;font-weight:600;color:var(--navy);text-align:left;gap:12px;}
.faq-q:hover{background:var(--warm);}
.faq-chev{font-size:11px;color:var(--muted);transition:transform 0.2s;flex-shrink:0;}
.faq-chev.open{transform:rotate(180deg);}
.faq-a{padding:0 20px 16px;font-size:13px;color:var(--slate);line-height:1.8;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(11,17,32,0.75);backdrop-filter:blur(10px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:ov 0.2s ease;}
@keyframes ov{from{opacity:0;}to{opacity:1;}}
.modal{background:#fff;border-radius:22px;max-width:580px;width:100%;max-height:90vh;overflow-y:auto;position:relative;animation:mo 0.28s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 12px 48px rgba(0,0,0,0.1);}
@keyframes mo{from{opacity:0;transform:scale(0.94) translateY(16px);}to{opacity:1;transform:scale(1) translateY(0);}}
.modal::-webkit-scrollbar{display:none;}
.m-close{position:absolute;top:14px;right:14px;z-index:10;background:rgba(0,0,0,0.06);border:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:var(--slate);transition:all 0.15s;}
.m-close:hover{background:rgba(0,0,0,0.12);color:var(--navy);}
.m-progress{padding:22px 26px 0;}
.mp-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.mp-label{font-size:12px;font-weight:600;color:var(--slate);}
.mp-pct{font-size:12px;font-weight:700;color:var(--teal2);}
.mp-track{height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden;}
.mp-fill{height:100%;background:linear-gradient(90deg,var(--teal),var(--teal2));border-radius:99px;transition:width 0.4s ease;}
.s-tabs{display:flex;gap:4px;margin-top:10px;}
.s-tab{flex:1;height:3px;background:#E2E8F0;border-radius:99px;transition:background 0.3s;}
.s-tab.done{background:var(--teal);}
.s-tab.cur{background:rgba(0,194,168,0.4);}
.m-body{padding:24px 26px 26px;}
.m-tag{display:inline-block;background:rgba(0,194,168,0.1);border:1px solid rgba(0,194,168,0.2);color:var(--teal2);font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:0.5px;margin-bottom:10px;}
.m-h{font-family:var(--serif);font-size:24px;font-weight:400;line-height:1.2;margin-bottom:5px;letter-spacing:-0.3px;}
.m-sub{font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:20px;}
.field{margin-bottom:16px;}
.f-label{font-size:12px;font-weight:600;color:var(--navy3);margin-bottom:6px;display:flex;align-items:center;gap:6px;}
.f-opt{font-weight:400;color:var(--muted);font-size:11px;}
.f-input,.f-select,.f-ta{width:100%;background:var(--warm);border:1.5px solid #E2E8F0;border-radius:10px;color:var(--navy);font-size:14px;padding:11px 14px;outline:none;transition:all 0.15s;}
.f-input:focus,.f-select:focus,.f-ta:focus{border-color:var(--teal);background:#fff;box-shadow:0 0 0 3px rgba(0,194,168,0.1);}
.f-ta{resize:none;line-height:1.6;min-height:88px;}
.f-hint{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.5;}
.f-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.chips{display:flex;flex-wrap:wrap;gap:7px;}
.chip{background:var(--warm);border:1.5px solid #E2E8F0;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:500;color:var(--navy);cursor:pointer;transition:all 0.15s;}
.chip:hover{border-color:#CBD5E1;}
.chip.on{background:rgba(0,194,168,0.08);border-color:var(--teal);color:var(--teal2);font-weight:700;}
.upload-zone{border:2px dashed #CBD5E1;border-radius:10px;padding:28px;text-align:center;background:var(--warm);cursor:pointer;transition:all 0.2s;margin-bottom:10px;}
.upload-zone:hover,.upload-zone.drag{border-color:var(--teal);background:rgba(0,194,168,0.04);}
.uz-icon{font-size:28px;margin-bottom:8px;}
.uz-title{font-size:14px;font-weight:700;margin-bottom:3px;}
.uz-sub{font-size:12px;color:var(--slate);}
.uz-tags{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:10px;}
.uz-tag{background:#fff;border:1px solid var(--border);border-radius:5px;font-size:10px;font-weight:600;color:var(--slate);padding:2px 8px;}
.uploaded{display:flex;align-items:center;gap:10px;background:rgba(0,194,168,0.07);border:1px solid rgba(0,194,168,0.22);border-radius:9px;padding:10px 14px;margin-bottom:7px;}
.uf-name{font-size:12px;font-weight:600;flex:1;color:var(--navy);}
.uf-ok{color:var(--teal);font-size:14px;font-weight:700;}
.m-nav{display:flex;gap:10px;margin-top:22px;padding-top:18px;border-top:1px solid #F1F5F9;}
.btn-next{flex:1;background:var(--navy);color:#fff;border:none;border-radius:11px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.btn-next:hover{background:var(--navy3);}
.btn-next:disabled{opacity:0.3;cursor:not-allowed;}
.btn-back{background:var(--warm);border:1.5px solid #E2E8F0;color:var(--slate);border-radius:11px;padding:13px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.15s;}
.btn-back:hover{border-color:#CBD5E1;color:var(--navy);}
.trust-badge{display:flex;align-items:flex-start;gap:9px;background:var(--warm);border-radius:9px;padding:11px 14px;margin-top:12px;}
.tb-text{font-size:12px;color:var(--slate);line-height:1.55;}
.recall-item{border-left:3px solid;border-radius:0 9px 9px 0;background:var(--warm);padding:12px 14px;margin-bottom:8px;}
.ri-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;}
.ri-badge{font-size:9px;font-weight:800;padding:2px 7px;border-radius:100px;letter-spacing:1px;}
.ri-summary{font-size:12px;color:var(--slate);line-height:1.6;}
.scan-wrap{text-align:center;padding:36px 20px;}
.scan-car{font-size:52px;animation:scan 1s ease-in-out infinite alternate;display:inline-block;margin-bottom:14px;}
@keyframes scan{from{transform:translateX(-16px);}to{transform:translateX(16px);}}
.scan-title{font-size:18px;font-weight:700;margin-bottom:5px;}
.scan-sub{font-size:13px;color:var(--slate);margin-bottom:20px;}
.scan-track{width:260px;height:3px;background:#E2E8F0;border-radius:99px;overflow:hidden;margin:0 auto 16px;}
.scan-bar{height:100%;background:linear-gradient(90deg,var(--teal),var(--teal2));border-radius:99px;transition:width 0.5s ease;}
.scan-steps{display:flex;flex-direction:column;gap:6px;max-width:300px;margin:0 auto;text-align:left;}
.ss{display:flex;align-items:center;gap:8px;font-size:12px;}
.ss.done{color:var(--teal2);}
.ss.act{color:var(--navy);}
.ss.wait{color:#CBD5E1;}
.ss-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.ss-spin{width:12px;height:12px;border:2px solid var(--teal);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg);}}
.success{text-align:center;padding:36px 24px;}
.s-icon{font-size:52px;margin-bottom:14px;}
.s-h{font-family:var(--serif);font-size:28px;margin-bottom:8px;}
.s-sub{font-size:14px;color:var(--slate);line-height:1.7;margin-bottom:22px;max-width:380px;margin-left:auto;margin-right:auto;}
.s-next{background:var(--warm);border-radius:12px;padding:16px;text-align:left;}
.sn-title{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;}
.sn-item{display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--navy);margin-bottom:7px;line-height:1.5;}
.sn-dot{width:6px;height:6px;border-radius:50%;background:var(--teal);flex-shrink:0;margin-top:4px;}
.disc{background:var(--warm);border-top:1px solid var(--border);padding:28px;text-align:center;}
.disc p{font-size:11px;color:var(--muted);line-height:1.8;max-width:680px;margin:0 auto;}
.footer{background:var(--navy);padding:44px 28px;}
.footer-inner{max-width:1060px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;}
.footer-brand{font-family:var(--serif);font-size:18px;color:#fff;}
.footer-links{display:flex;gap:20px;}
.footer-link{font-size:12px;color:rgba(255,255,255,0.35);cursor:pointer;transition:color 0.15s;}
.footer-link:hover{color:rgba(255,255,255,0.7);}
.footer-copy{font-size:11px;color:rgba(255,255,255,0.25);}
@media(max-width:768px){
  .steps-row,.testi-grid{grid-template-columns:1fr;}
  .issues-grid{grid-template-columns:repeat(2,1fr);}
  .trust-grid{grid-template-columns:repeat(2,1fr);}
  .f-row{grid-template-columns:1fr;}
  .nav-links{display:none;}
  .hero{padding:64px 20px 60px;}
  .section{padding:60px 20px;}
}
`;

function FaqItem({ q, a }) {
const [open, setOpen] = useState(false);
return (
<div className="faq">
<button className="faq-q" onClick={() => setOpen(o => !o)}>
{q}<span className={"faq-chev" + (open ? " open" : "")}>▼</span>
      </button>
{open && <div className="faq-a">{a}</div>}
    </div>
);
}

export default function App() {
const [showModal, setShowModal]   = useState(false);
const [stepIdx, setStepIdx]       = useState(0);
const [done, setDone]             = useState(false);
const [selIssues, setSelIssues]   = useState([]);
const [heroIssues, setHeroIssues] = useState([]);
const [files, setFiles]           = useState([]);
const [drag, setDrag]             = useState(false);
const [scanning, setScanning]     = useState(false);
const [scanStep, setScanStep]     = useState(0);
const [scanPct, setScanPct]       = useState(0);
const [recalls, setRecalls]       = useState(null);
const [vinInfo, setVinInfo]       = useState(null);
const [vinError, setVinError]     = useState(null);
const [models, setModels]         = useState([]);
const fileRef = useRef();

const [form, setForm] = useState({
year:"", make:"", model:"", mileage:"", vin:"", state:"",
issueDesc:"", started:"", frequency:"",
dealerVisits:"", visitCount:"", outcome:"", cost:"", dealerNotes:"",
name:"", email:"", phone:"",
});
const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
const toggleIssue = id => setSelIssues(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
const toggleHero  = id => setHeroIssues(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

const fetchModels = useCallback(async (make, year) => {
if (!make || !year) return;
try {
const r = await fetch(NHTSA_MODELS(make, year));
const d = await r.json();
setModels((d.Results || []).map(m => m.Model_Name).sort());
} catch { setModels([]); }
}, []);

const SCAN_STEPS = ["Connecting to NHTSA database...","Decoding VIN...","Fetching recall records...","Matching defect patterns...","Analyzing results..."];

const runVinScan = async () => {
if (!form.vin || form.vin.length !== 17) return;
setScanning(true); setScanStep(0); setScanPct(0);
setRecalls(null); setVinInfo(null); setVinError(null);
try {
setScanStep(1); setScanPct(20);
const vd = await (await fetch(NHTSA_DECODE(form.vin))).json();
const get = n => (vd.Results || []).find(r => r.Variable === n)?.Value || "";
const info = { year: get("Model Year"), make: get("Make"), model: get("Model"), trim: get("Trim") };
if (!info.make || info.make === "Not Applicable") throw new Error("VIN not recognized. Please check and try again.");
setVinInfo(info);
if (!form.year) setF("year", info.year);
if (!form.make) setF("make", info.make);
if (!form.model) setF("model", info.model);
setScanStep(2); setScanPct(40);
const rd = await (await fetch(NHTSA_RECALL(form.vin))).json();
let recallList = rd.results || [];
setScanStep(3); setScanPct(60);
if (info.make && info.model && info.year) {
try {
const rd2 = await (await fetch(NHTSA_VEHICLE(info.make, info.model, info.year))).json();
const existing = new Set(recallList.map(r => r.NHTSACampaignNumber));
(rd2.results || []).forEach(r => { if (!existing.has(r.NHTSACampaignNumber)) recallList.push(r); });
} catch {}
}
setScanStep(4); setScanPct(80);
await new Promise(r => setTimeout(r, 500));
setScanStep(5); setScanPct(100);
await new Promise(r => setTimeout(r, 300));
setRecalls(recallList);
} catch (e) {
setVinError(e.message || "Failed to connect to NHTSA. Check VIN and try again.");
}
setScanning(false);
};

const recallSev = r => {
const t = (r.Consequence || "").toLowerCase();
if (t.includes("death") || t.includes("fatal") || t.includes("fire")) return { label:"CRITICAL", color:"#ef4444" };
if (t.includes("injur") || t.includes("crash")) return { label:"HIGH", color:"#f97316" };
return { label:"MODERATE", color:"#f59e0b" };
};

const openModal = () => { setShowModal(true); setStepIdx(0); setDone(false); };
const canNext = () => {
if (stepIdx === 0) return form.year && form.make && form.model;
if (stepIdx === 4) return form.name && form.email;
return true;
};

const step = STEPS[stepIdx];
const pct  = Math.round((stepIdx / (STEPS.length - 1)) * 100);
const fakeFile = () => {
const names = ["repair_invoice.pdf","dealer_estimate.pdf","warranty_denial.jpg","engine_photos.zip","service_record.pdf"];
setFiles(f => [...f, names[Math.floor(Math.random() * names.length)]]);
};

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

return (
<div className="app">
<style>{CSS}</style>

<nav className="nav">
<div className="nav-brand">
<div className="nav-mark">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
<path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
<span className="nav-name">ClaimCheck</span>
<span className="nav-tag"> Vehicle</span>
        </div>
<div className="nav-links">
{["How It Works","Vehicle Issues","FAQ"].map(l => (
<button key={l} className="nav-link">{l}</button>
))}
        </div>
<button className="nav-cta" onClick={openModal}>Document My Issue →</button>
      </nav>

<section className="hero">
<div className="hero-glow"/>
<div className="hero-grid"/>
<div className="hero-eye"><span className="eye-dot"/> Consumer Vehicle Advocacy Platform</div>
<h1 className="hero-h1">Your car has a problem.<br/><span className="hero-em">You deserve answers.</span></h1>
<p className="hero-sub">ClaimCheck helps vehicle owners document recurring defects, organize repair evidence, and understand their options — simply and clearly.</p>
<div className="hero-actions">
<button className="btn-primary" onClick={openModal}>
            Start My Documentation
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
<button className="btn-ghost">See How It Works</button>
        </div>
<div className="hero-proof">
{["Free to use — always","No obligation to file","Your data stays private","Results in 1–2 business days"].map(t => (
<div key={t} className="proof-item"><span className="proof-check">✓</span> {t}</div>
))}
        </div>
      </section>

<div className="makes">
<span className="makes-label">We cover</span>
{["Toyota","Honda","Ford","Chevrolet","Volkswagen","Tesla","Jeep","Ram","Nissan","Hyundai","BMW","Subaru"].map(m => (
<div key={m} className={"make-pill" + (["Toyota","Honda"].includes(m) ? " hl" : "")}>{m}</div>
))}
<div className="make-pill" style={{color:"var(--muted)"}}>+ All Makes</div>
      </div>

<section className="section">
<div className="inner">
<div className="sec-label">How it works</div>
<h2 className="sec-h">Three steps to clarity.</h2>
<p className="sec-sub">No legal jargon. No pressure. Just a clear path to understanding your situation.</p>
<div className="steps-row">
{[
{n:"01",icon:"📋",title:"Document your issue",desc:"Tell us about your vehicle and the problem you're experiencing. Takes about 5 minutes. We guide you through every step."},
{n:"02",icon:"🔍",title:"We review and match",desc:"We cross-reference your submission with known defect patterns, active NHTSA recalls, TSBs, and available options for your vehicle."},
{n:"03",icon:"🛤️",title:"Understand your options",desc:"We send you a clear summary — from manufacturer escalation to warranty programs to legal review. You decide what's right for you."},
].map((s, i) => (
<div key={i} className="step-card">
<div className="step-n">{s.n}</div>
<div className="step-icon">{s.icon}</div>
<div className="step-title">{s.title}</div>
<div className="step-desc">{s.desc}</div>
              </div>
))}
          </div>
        </div>
      </section>

<section className="section alt">
<div className="inner">
<div className="sec-label">Common vehicle defects</div>
<h2 className="sec-h">Recognize your issue?</h2>
<p className="sec-sub">Select the issue affecting your vehicle. We'll match it against known defect patterns instantly.</p>
<div className="issues-grid">
{ISSUES.map(iss => (
<div key={iss.id} className={"issue-card" + (heroIssues.includes(iss.id) ? " sel" : "")} onClick={() => toggleHero(iss.id)}>
<div className="ic-icon">{iss.icon}</div>
<div className="ic-name">{iss.name}</div>
<div className="ic-desc">{iss.desc}</div>
              </div>
))}
          </div>
{heroIssues.length > 0 && (
<div style={{marginTop:24,textAlign:"center"}}>
<button className="btn-primary" style={{margin:"0 auto"}} onClick={() => { setSelIssues(heroIssues); openModal(); }}>
                Document My {ISSUES.find(i => i.id === heroIssues[0])?.name} Issue →
              </button>
            </div>
)}
        </div>
      </section>

<section className="section dark">
<div className="inner">
<div className="sec-label lt">By the numbers</div>
<h2 className="sec-h lt">Helping owners get answers.</h2>
<p className="sec-sub lt">ClaimCheck has helped thousands of vehicle owners document their issues and understand their options.</p>
<div className="trust-grid">
{[{n:"47K+",l:"Defect reports\ndocumented"},{n:"$2.3B",l:"In potential\nreimbursement identified"},{n:"340+",l:"Unique defect\npatterns tracked"},{n:"91%",l:"Owners received\na clear next step"}].map((t, i) => (
<div key={i} className="trust-stat">
<div className="ts-n">{t.n}</div>
<div className="ts-l" style={{whiteSpace:"pre-line"}}>{t.l}</div>
              </div>
))}
          </div>
        </div>
      </section>

<section className="section">
<div className="inner">
<div className="sec-label">Owner stories</div>
<h2 className="sec-h">Real people. Real outcomes.</h2>
<p className="sec-sub">We don't promise outcomes. We give people a fair shot at understanding what they may be entitled to.</p>
<div className="testi-grid">
{[
{q:"I'd been dealing with my Toyota's oil consumption for three years. ClaimCheck helped me document everything properly. Ended up getting a full engine replacement covered.",name:"Marcus T.",detail:"2019 Toyota Camry · Texas"},
{q:"Didn't feel like a lawsuit site at all. It felt like a really organized way to finally get my repair history together. The process was clear and fast.",name:"Jennifer K.",detail:"2018 Honda CR-V · Ohio"},
{q:"My dealership kept dismissing my transmission concerns. Having everything documented made a huge difference when I escalated to the manufacturer directly.",name:"David R.",detail:"2020 Ford Explorer · Florida"},
].map((t, i) => (
<div key={i} className="testi">
<div className="testi-quote">"{t.q}"</div>
<div className="testi-name">{t.name}</div>
<div className="testi-detail">{t.detail}</div>
              </div>
))}
          </div>
        </div>
      </section>

<section className="section alt">
<div className="inner" style={{textAlign:"center"}}>
<div className="sec-label">FAQ</div>
<h2 className="sec-h">Questions we hear a lot.</h2>
<p className="sec-sub" style={{margin:"0 auto 44px"}}>Honest answers about what ClaimCheck is — and what it isn't.</p>
<div className="faqs">
{FAQS_DATA.map((f, i) => <FaqItem key={i} {...f}/>)}
          </div>
        </div>
      </section>

<section className="section dark" style={{padding:"72px 28px",textAlign:"center"}}>
<div style={{maxWidth:520,margin:"0 auto"}}>
<h2 style={{fontFamily:"var(--serif)",fontSize:"clamp(30px,4vw,48px)",color:"#fff",marginBottom:12,letterSpacing:"-0.5px"}}>Ready to document your issue?</h2>
<p style={{fontSize:15,color:"rgba(255,255,255,0.5)",lineHeight:1.75,marginBottom:32}}>Takes 5 minutes. Free to use. No commitment required.</p>
<button className="btn-primary" style={{margin:"0 auto"}} onClick={openModal}>Start My Documentation →</button>
        </div>
      </section>

<div className="disc">
<p>ClaimCheck is a consumer documentation and advocacy platform, not a law firm. We do not provide legal advice. Connecting with our platform does not create an attorney-client relationship. Any legal options presented are provided by independent licensed attorneys. Outcomes are not guaranteed. Vehicle defect patterns and recall information are sourced from NHTSA, manufacturer TSBs, and consumer reports. All data encrypted and never sold to third parties.</p>
      </div>

<footer className="footer">
<div className="footer-inner">
<div className="footer-brand">ClaimCheck Vehicle</div>
<div className="footer-links">
{["Privacy","Terms","Contact","For Attorneys"].map(l => (
<span key={l} className="footer-link">{l}</span>
))}
          </div>
<div className="footer-copy">© 2025 ClaimCheck. All rights reserved.</div>
        </div>
      </footer>

{showModal && !done && (
<div className="overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
<div className="modal">
<button className="m-close" onClick={() => setShowModal(false)}>✕</button>

{scanning ? (
<div className="scan-wrap">
<div className="scan-car">🚗</div>
<div className="scan-title">Scanning NHTSA Database...</div>
<div className="scan-sub">Pulling live federal recall records for your VIN</div>
<div className="scan-track"><div className="scan-bar" style={{width:scanPct+"%"}}/></div>
<div className="scan-steps">
{SCAN_STEPS.map((s, i) => (
<div key={i} className={"ss"+(i<scanStep-1?" done":i===scanStep-1?" act":" wait")}>
{i<scanStep-1?<div className="ss-dot" style={{background:"var(--teal)"}}/>:i===scanStep-1?<div className="ss-spin"/>:<div className="ss-dot" style={{background:"#CBD5E1"}}/>}
{s}
                    </div>
))}
                </div>
              </div>
) : (
<>
<div className="m-progress">
<div className="mp-top">
<span className="mp-label">Step {stepIdx+1} of {STEPS.length} — {step.label}</span>
<span className="mp-pct">{pct}%</span>
                  </div>
<div className="mp-track"><div className="mp-fill" style={{width:pct+"%"}}/></div>
<div className="s-tabs">
{STEPS.map((s, i) => <div key={i} className={"s-tab"+(i<stepIdx?" done":i===stepIdx?" cur":"")}/>)}
                  </div>
                </div>

<div className="m-body">
{stepIdx===0 && (
<>
<div className="m-tag">Vehicle Info</div>
<div className="m-h">Tell us about your vehicle.</div>
<div className="m-sub">We'll use this to match against known defect patterns and NHTSA recall data.</div>
<div className="f-row">
<div className="field">
<label className="f-label">Year</label>
<select className="f-select" value={form.year} onChange={e => { setF("year",e.target.value); if(form.make) fetchModels(form.make,e.target.value); }}>
<option value="">Select year</option>
{YEARS.map(y => <option key={y}>{y}</option>)}
                          </select>
                        </div>
<div className="field">
<label className="f-label">Make</label>
<select className="f-select" value={form.make} onChange={e => { setF("make",e.target.value); setF("model",""); if(form.year) fetchModels(e.target.value,form.year); }}>
<option value="">Select make</option>
{MAKES.map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
<div className="f-row">
<div className="field">
<label className="f-label">Model</label>
{models.length>0 ? (
<select className="f-select" value={form.model} onChange={e => setF("model",e.target.value)}>
<option value="">Select model</option>
{models.map(m => <option key={m}>{m}</option>)}
                            </select>
) : (
<input className="f-input" placeholder="e.g. Camry, CR-V, F-150" value={form.model} onChange={e => setF("model",e.target.value)}/>
)}
                        </div>
<div className="field">
<label className="f-label">Current Mileage</label>
<input className="f-input" placeholder="e.g. 68,000" value={form.mileage} onChange={e => setF("mileage",e.target.value)}/>
                        </div>
                      </div>
<div className="field">
<label className="f-label">VIN <span className="f-opt">(optional — pulls live NHTSA recall data)</span></label>
<div style={{display:"flex",gap:8}}>
<input className="f-input" placeholder="17-character VIN from door jamb or dashboard" value={form.vin} maxLength={17} onChange={e => { setF("vin",e.target.value.replace(/[^A-Za-z0-9]/g,"").toUpperCase()); setRecalls(null); setVinInfo(null); }} style={{flex:1}}/>
{form.vin.length===17 && (
<button onClick={runVinScan} style={{background:"var(--teal)",color:"var(--navy)",border:"none",borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Scan →</button>
)}
                        </div>
<div className="f-hint">{form.vin.length>0 ? form.vin.length+"/17 characters" : "Found on dashboard (driver side), door jamb sticker, or insurance card."}</div>
{vinError && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,padding:"10px 13px",fontSize:13,color:"#dc2626",marginTop:8}}>{vinError}</div>}
{vinInfo && <div style={{background:"rgba(0,194,168,0.07)",border:"1px solid rgba(0,194,168,0.2)",borderRadius:9,padding:"10px 13px",fontSize:13,marginTop:8}}><strong>✓ VIN Decoded:</strong> {vinInfo.year} {vinInfo.make} {vinInfo.model} {vinInfo.trim}</div>}
{recalls!==null && (
<div style={{marginTop:12}}>
{recalls.length===0 ? (
<div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"var(--slate)",textAlign:"center"}}>✅ No open NHTSA recalls found for this vehicle.</div>
) : (
<>
<div style={{fontSize:11,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>⚠️ {recalls.length} Open NHTSA Recall{recalls.length!==1?"s":""} Found</div>
{recalls.slice(0,3).map((r,i) => {
const sev = recallSev(r);
return (
<div key={i} className="recall-item" style={{borderLeftColor:sev.color}}>
<div className="ri-top">
<span className="ri-badge" style={{background:sev.color+"20",color:sev.color,border:"1px solid "+sev.color+"44"}}>{sev.label}</span>
{r.Component && <span style={{fontSize:11,fontWeight:600,color:"var(--slate)"}}>{r.Component.split(":")[0]}</span>}
                                      </div>
<div className="ri-summary">{r.Summary ? r.Summary.substring(0,160)+(r.Summary.length>160?"...":"") : "See NHTSA for full details."}</div>
                                    </div>
);
})}
{recalls.length>3 && <div style={{fontSize:12,color:"var(--slate)",marginTop:6}}>+ {recalls.length-3} more recall{recalls.length-3!==1?"s":""} documented in your report.</div>}
                              </>
)}
                          </div>
)}
                      </div>
<div className="field">
<label className="f-label">Your State</label>
<select className="f-select" value={form.state} onChange={e => setF("state",e.target.value)}>
<option value="">Select state</option>
{US_STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
<div className="trust-badge">
<span style={{fontSize:15,flexShrink:0}}>🔒</span>
<span className="tb-text">Your information is encrypted and never sold to third parties. This creates a private documentation record for your use only.</span>
                      </div>
                    </>
)}

{stepIdx===1 && (
<>
<div className="m-tag">The Problem</div>
<div className="m-h">What's been happening?</div>
<div className="m-sub">Select all that apply, then describe the issue in your own words.</div>
<div className="field">
<label className="f-label">Issue type <span className="f-opt">(select all that apply)</span></label>
<div className="chips">
{ISSUES.map(iss => (
<div key={iss.id} className={"chip"+(selIssues.includes(iss.id)?" on":"")} onClick={() => toggleIssue(iss.id)}>{iss.icon} {iss.name}</div>
))}
                        </div>
                      </div>
<div className="field">
<label className="f-label">Describe the issue in your own words</label>
<textarea className="f-ta" placeholder="Be as specific as possible — symptoms, when they started, frequency, conditions, and what the dealership told you..." value={form.issueDesc} onChange={e => setF("issueDesc",e.target.value)}/>
<div className="f-hint">The more detail you include, the better we can match your issue to known defect patterns.</div>
                      </div>
<div className="f-row">
<div className="field">
<label className="f-label">When did this start?</label>
<select className="f-select" value={form.started} onChange={e => setF("started",e.target.value)}>
<option value="">Select timeframe</option>
{["Under warranty","Just after warranty expired","Within the first year","1–2 years ago","2–3 years ago","More than 3 years ago"].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
<div className="field">
<label className="f-label">How often does it occur?</label>
<select className="f-select" value={form.frequency} onChange={e => setF("frequency",e.target.value)}>
<option value="">Select frequency</option>
{["Every time I drive","Several times a week","Once a week","Occasionally","Intermittent / unpredictable"].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
)}

{stepIdx===2 && (
<>
<div className="m-tag">Repair History</div>
<div className="m-h">What have you tried so far?</div>
<div className="m-sub">This helps us understand what documentation you have and what may strengthen your case.</div>
<div className="field">
<label className="f-label">Have you visited a dealership or mechanic?</label>
<div className="chips">
{["Yes — dealership","Yes — independent shop","Both","Not yet"].map(o => (
<div key={o} className={"chip"+(form.dealerVisits===o?" on":"")} onClick={() => setF("dealerVisits",o)}>{o}</div>
))}
                        </div>
                      </div>
{form.dealerVisits && form.dealerVisits!=="Not yet" && (
<>
<div className="field">
<label className="f-label">How many times have you taken it in for this issue?</label>
<div className="chips">
{["1 time","2–3 times","4–5 times","More than 5 times"].map(o => (
<div key={o} className={"chip"+(form.visitCount===o?" on":"")} onClick={() => setF("visitCount",o)}>{o}</div>
))}
                            </div>
                          </div>
<div className="field">
<label className="f-label">What was the outcome?</label>
<div className="chips">
{DEALER_OUTCOMES.map(o => (
<div key={o} className={"chip"+(form.outcome===o?" on":"")} style={{fontSize:12}} onClick={() => setF("outcome",o)}>{o}</div>
))}
                            </div>
                          </div>
                        </>
)}
<div className="field">
<label className="f-label">Out-of-pocket repair costs so far</label>
<div className="chips">
{COST_RANGES.map(o => (
<div key={o} className={"chip"+(form.cost===o?" on":"")} style={{fontSize:12}} onClick={() => setF("cost",o)}>{o}</div>
))}
                        </div>
                      </div>
<div className="field">
<label className="f-label">Anything the dealer or manufacturer told you? <span className="f-opt">optional</span></label>
<textarea className="f-ta" style={{minHeight:70}} placeholder="e.g. Service advisor said oil consumption was within spec..." value={form.dealerNotes} onChange={e => setF("dealerNotes",e.target.value)}/>
                      </div>
                    </>
)}

{stepIdx===3 && (
<>
<div className="m-tag">Documentation</div>
<div className="m-h">Upload your evidence.</div>
<div className="m-sub">Upload whatever you have. Even partial documentation helps — we'll tell you what else may be useful.</div>
<div className={"upload-zone"+(drag?" drag":"")} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);fakeFile();}} onClick={()=>fileRef.current?.click()}>
<div className="uz-icon">📎</div>
<div className="uz-title">Drop files here or click to browse</div>
<div className="uz-sub">PDF, JPG, PNG, ZIP up to 25MB each</div>
<div className="uz-tags">
{["Repair invoices","Service records","Dealer estimates","Warranty denials","Defect photos","TSB notices"].map(t => <span key={t} className="uz-tag">{t}</span>)}
                        </div>
                      </div>
<input ref={fileRef} type="file" multiple style={{display:"none"}} onChange={fakeFile}/>
{files.map((f,i) => (
<div key={i} className="uploaded">
<span style={{fontSize:16}}>📄</span>
<span className="uf-name">{f}</span>
<span className="uf-ok">✓</span>
                        </div>
))}
{files.length>0 && <div className="chip" style={{marginTop:8,fontSize:12,cursor:"pointer",display:"inline-flex"}} onClick={fakeFile}>+ Add another file</div>}
<div className="trust-badge" style={{marginTop:12}}>
<span style={{fontSize:15,flexShrink:0}}>💡</span>
<span className="tb-text">Don't have all your documents? No problem — submit now and add files later. Getting your case on record is what matters most.</span>
                      </div>
                    </>
)}

{stepIdx===4 && (
<>
<div className="m-tag">Almost done</div>
<div className="m-h">Where should we send your results?</div>
<div className="m-sub">We'll review your submission and send a personalized summary within 1–2 business days.</div>
<div className="field">
<label className="f-label">Full Name</label>
<input className="f-input" placeholder="Your name" value={form.name} onChange={e => setF("name",e.target.value)}/>
                      </div>
<div className="field">
<label className="f-label">Email Address</label>
<input className="f-input" type="email" placeholder="you@email.com" value={form.email} onChange={e => setF("email",e.target.value)}/>
<div className="f-hint">We'll send your documentation summary and any recall findings here. No spam, ever.</div>
                      </div>
<div className="field">
<label className="f-label">Phone Number <span className="f-opt">optional — for a callback if needed</span></label>
<input className="f-input" type="tel" placeholder="(555) 000-0000" value={form.phone} onChange={e => setF("phone",e.target.value)}/>
                      </div>
<div style={{background:"var(--warm)",borderRadius:10,padding:"13px 15px",fontSize:12,color:"var(--slate)",lineHeight:1.7,marginTop:8}}>
                        By submitting, you agree to our Privacy Policy and Terms of Service. You are not retaining legal counsel. If your case qualifies for legal review, you may be contacted by an independent licensed attorney — optional and at no cost.
                      </div>
                    </>
)}

<div className="m-nav">
{stepIdx>0 && <button className="btn-back" onClick={() => setStepIdx(s => s-1)}>← Back</button>}
<button className="btn-next" disabled={!canNext()} onClick={() => { if(stepIdx===STEPS.length-1){setShowModal(false);setDone(true);}else setStepIdx(s => s+1); }}>
{stepIdx===STEPS.length-1 ? "Submit My Documentation" : "Continue →"}
                    </button>
                  </div>
                </div>
              </>
)}
          </div>
        </div>
)}

{done && (
<div className="overlay" onClick={() => setDone(false)}>
<div className="modal" onClick={e => e.stopPropagation()}>
<button className="m-close" onClick={() => setDone(false)}>✕</button>
<div className="success">
<div className="s-icon">✅</div>
<div className="s-h">Your documentation is submitted.</div>
<div className="s-sub">
                We're reviewing your {form.year} {form.make} {form.model} case now.
{recalls && recalls.length>0 && " We found "+recalls.length+" open NHTSA recall"+(recalls.length!==1?"s":"")+" on your vehicle — included in your report."}
{" "}Expect your summary within 1–2 business days.
              </div>
<div className="s-next">
<div className="sn-title">What happens next</div>
{["We cross-reference your issue with known defect patterns and NHTSA recall data","We check for active TSBs, warranty extensions, and legal options specific to your state","You receive a clear summary of findings and available options — no pressure, no obligation"].map((s,i) => (
<div key={i} className="sn-item"><div className="sn-dot"/><span>{s}</span></div>
))}
              </div>
<button className="btn-next" style={{marginTop:18}} onClick={() => setDone(false)}>Done</button>
            </div>
          </div>
        </div>
)}
    </div>
);
}
