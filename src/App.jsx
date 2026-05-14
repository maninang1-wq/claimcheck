import { useState, useCallback } from "react";

// ─── CATEGORY REGISTRY ────────────────────────────────────────────────────────
// To add a new vertical: add an entry here + a data file below.
// The app renders everything dynamically from this registry.
const CATEGORIES = [
  { id: "all",     label: "All Claims",       icon: "⚖️",  color: "#f97316", desc: "Every open settlement" },
  { id: "tech",    label: "Tech & Privacy",   icon: "💻",  color: "#6366f1", desc: "Data breaches, privacy violations, consumer fraud" },
  { id: "auto",    label: "Automotive",       icon: "🚗",  color: "#dc2626", desc: "Recalls, defects, emissions fraud" },
  { id: "food",    label: "Food & CPG",       icon: "🛒",  color: "#22c55e", desc: "False advertising, contamination, slack fill" },
  { id: "pharma",  label: "Pharma & Medical", icon: "💊",  color: "#ec4899", desc: "Defective devices, drug side effects, opioids" },
  { id: "housing", label: "Housing & Finance",icon: "🏠",  color: "#f59e0b", desc: "Predatory lending, hidden fees, fraud" },
];

// ─── TECH SETTLEMENTS ─────────────────────────────────────────────────────────
const TECH_SUITS = [
  { id:"t1", cat:"tech", company:"Meta (Facebook)", icon:"👤", payout:397, ps:"$397", deadline:"Aug 1, 2025", urgent:true,
    desc:"Facebook collected facial recognition data without consent from Illinois users 2011–2022.",
    detail:"The $650M settlement covers Illinois residents tagged in photos on Facebook.",
    firm:"Edelson PC", firmPPL:350,
    qs:[{id:"state",text:"Did you live in Illinois between 2011–2022?",req:true},{id:"acct",text:"Did you have a Facebook account?",req:true},{id:"photo",text:"Were you tagged in photos?",req:true}] },
  { id:"t2", cat:"tech", company:"Google", icon:"🔍", payout:250, ps:"$250", deadline:"Oct 15, 2025", urgent:false,
    desc:"Google tracked users' location even after they turned off Location History.",
    detail:"Android and Google Maps users with a Google account between 2014–2023 are covered.",
    firm:"Lieff Cabraser", firmPPL:280,
    qs:[{id:"acct",text:"Did you have a Google account between 2014–2023?",req:true},{id:"android",text:"Did you use Android or Google Maps?",req:true}] },
  { id:"t3", cat:"tech", company:"TikTok", icon:"🎵", payout:167, ps:"$167", deadline:"Jul 30, 2025", urgent:true,
    desc:"TikTok collected biometric data and violated children's privacy laws (COPPA).",
    detail:"TikTok harvested facial geometry and voice prints without consent.",
    firm:"Robbins Geller", firmPPL:250,
    qs:[{id:"used",text:"Did you use TikTok between 2019–2023?",req:true}] },
  { id:"t4", cat:"tech", company:"T-Mobile", icon:"📱", payout:25000, ps:"$25,000", deadline:"Jan 10, 2026", urgent:false,
    desc:"T-Mobile's 2021 breach exposed names, SSNs, and addresses of 76M+ customers.",
    detail:"Customers and applicants before August 2021 may claim up to $25,000.",
    firm:"Keller Postman", firmPPL:425,
    qs:[{id:"cust",text:"Were you a T-Mobile customer before August 2021?",req:true},{id:"notif",text:"Did you get a breach notification?",req:false}] },
  { id:"t5", cat:"tech", company:"Amazon", icon:"📦", payout:100, ps:"$100", deadline:"Sep 5, 2025", urgent:false,
    desc:"Amazon enrolled users in Prime without clear consent and hid the cancel button.",
    detail:"The FTC found Amazon used dark patterns to trap users in Prime subscriptions.",
    firm:"Hagens Berman", firmPPL:200,
    qs:[{id:"prime",text:"Were you enrolled in Amazon Prime between 2018–2023?",req:true},{id:"charge",text:"Did you have unexpected charges or difficulty canceling?",req:true}] },
  { id:"t6", cat:"tech", company:"Apple", icon:"💻", payout:395, ps:"$395", deadline:"Nov 20, 2025", urgent:false,
    desc:"Apple knowingly sold MacBooks with defective butterfly keyboards that failed prematurely.",
    detail:"MacBook Pro and Air 2015–2019 are covered. More if you paid out of pocket for repair.",
    firm:"Girard Sharp", firmPPL:275,
    qs:[{id:"model",text:"Did you own a MacBook Pro or Air (2015–2019)?",req:true},{id:"keys",text:"Did your keyboard malfunction?",req:true}] },
  { id:"t7", cat:"tech", company:"Equifax", icon:"🏦", payout:20000, ps:"$20,000", deadline:"Jan 22, 2026", urgent:true,
    desc:"Equifax exposed SSNs, birth dates, and financial data of 147 million Americans in 2017.",
    detail:"Claim up to 10 hours lost at $25/hr plus reimbursement for fraud expenses.",
    firm:"Alston & Bird", firmPPL:380,
    qs:[{id:"notif",text:"Were you notified of the 2017 Equifax breach?",req:true}] },
  { id:"t8", cat:"tech", company:"Zoom", icon:"📹", payout:85, ps:"$85", deadline:"Dec 1, 2025", urgent:false,
    desc:"Zoom secretly shared user data with Facebook and LinkedIn without consent.",
    detail:"Registered users from March 2013–July 2021 are covered.",
    firm:"Cotchett Pitre", firmPPL:150,
    qs:[{id:"used",text:"Did you use Zoom between March 2013 and July 2021?",req:true},{id:"acct",text:"Did you have a registered Zoom account?",req:true}] },
];

// ─── AUTO SETTLEMENTS ─────────────────────────────────────────────────────────
const AUTO_SUITS = [
  { id:"a1", cat:"auto", company:"Takata / Multiple OEMs", icon:"💥", payout:5000, ps:"$1,500–$9,000", deadline:"Ongoing", urgent:false,
    makes:["Honda","Acura","Toyota","Mazda","Subaru","Ford","BMW","Nissan","Chrysler"],
    desc:"Defective Takata airbag inflators can rupture and send metal shrapnel into the cabin — 27 US deaths confirmed.",
    detail:"The largest auto recall in history. 67M vehicles affected. If your vehicle had an open recall you may be entitled to significant compensation beyond the free repair.",
    firm:"Motley Rice", firmPPL:600,
    vinKeywords:["takata","air bag","airbag","inflator"],
    qs:[{id:"recall",text:"Did your vehicle have an open Takata airbag recall?",req:true},{id:"injury",text:"Did you or a passenger experience injury from airbag deployment?",req:false}] },
  { id:"a2", cat:"auto", company:"Volkswagen / Audi", icon:"🌿", payout:7500, ps:"$5,100–$10,000", deadline:"Ongoing", urgent:false,
    makes:["Volkswagen","Audi","Porsche"],
    desc:"VW installed defeat devices to cheat EPA emissions tests on TDI diesel vehicles, deceiving customers about performance and resale value.",
    detail:"The $14.7B Dieselgate settlement still has active claims for owners who experienced diminished resale value.",
    firm:"Lieff Cabraser", firmPPL:750,
    vinKeywords:["emission","diesel","tdi","defeat device"],
    qs:[{id:"tdi",text:"Did you own a VW, Audi, or Porsche TDI diesel (2009–2016)?",req:true},{id:"sold",text:"Did you sell at a loss after the scandal broke?",req:false}] },
  { id:"a3", cat:"auto", company:"Ford", icon:"🔧", payout:4000, ps:"$2,325–$6,000", deadline:"Dec 31, 2025", urgent:true,
    makes:["Ford"],
    desc:"Ford's PowerShift dual-clutch transmission in Focus and Fiesta was fundamentally defective — Ford trained dealers to manage expectations instead of fixing it.",
    detail:"Owners experienced shuddering, hesitation, and complete transmission failure. Ford knew before launch.",
    firm:"Hagens Berman", firmPPL:450,
    vinKeywords:["powershift","transmission","dual clutch","focus","fiesta","shudder"],
    qs:[{id:"own",text:"Did you own a Ford Focus (2012–2016) or Fiesta (2011–2016)?",req:true},{id:"trans",text:"Did your transmission shudder, hesitate, or fail?",req:true}] },
  { id:"a4", cat:"auto", company:"General Motors", icon:"⚡", payout:15000, ps:"$300–$1,000,000", deadline:"Ongoing", urgent:false,
    makes:["Chevrolet","Pontiac","Saturn","GMC","Buick"],
    desc:"GM knew for over a decade that faulty ignition switches could cut engine power and disable airbags mid-drive. At least 124 deaths linked.",
    detail:"Personal injury and wrongful death claims are still being processed. Cobalt, Ion, G5, HHR, Solstice, Sky.",
    firm:"Napoli Shkolnik", firmPPL:800,
    vinKeywords:["ignition","switch","stall","cobalt","ion","g5"],
    qs:[{id:"own",text:"Did you own a Chevrolet Cobalt, Saturn Ion, Pontiac G5, or similar (2003–2014)?",req:true},{id:"injury",text:"Did you experience injury related to this defect?",req:false}] },
  { id:"a5", cat:"auto", company:"Honda / Acura", icon:"🛢️", payout:2500, ps:"$1,500–$4,000", deadline:"Aug 30, 2025", urgent:true,
    makes:["Honda","Acura"],
    desc:"Honda's 1.5L turbo allows gasoline to contaminate engine oil in cold weather, dramatically accelerating engine wear.",
    detail:"Honda blamed driving habits before acknowledging the defect in court. CR-V, Civic, Accord, Acura ILX/TLX.",
    firm:"Girard Sharp", firmPPL:400,
    vinKeywords:["oil dilution","gasoline","1.5","turbo","cr-v","civic"],
    qs:[{id:"own",text:"Did you own a Honda CR-V, Civic, Accord, or Acura with a 1.5T (2016–2021)?",req:true},{id:"smell",text:"Did you notice a gasoline smell from the oil or rising oil level?",req:false}] },
  { id:"a6", cat:"auto", company:"Tesla", icon:"⚡", payout:5000, ps:"$500–$15,000", deadline:"Mar 15, 2026", urgent:false,
    makes:["Tesla"],
    desc:"Tesla marketed Full Self-Driving capability that regulators found is neither full nor self-driving — customers paid up to $15,000 for features that weren't delivered.",
    detail:"Multiple class actions allege consumer fraud. Covers all Tesla owners 2016–2024, especially FSD purchasers.",
    firm:"Cotchett Pitre", firmPPL:700,
    vinKeywords:["autopilot","full self driving","fsd","phantom braking"],
    qs:[{id:"own",text:"Did you purchase a Tesla between 2016–2024?",req:true},{id:"fsd",text:"Did you pay for Full Self-Driving (FSD)?",req:false}] },
  { id:"a7", cat:"auto", company:"Chrysler / Jeep / Ram", icon:"🐏", payout:4500, ps:"$2,000–$8,500", deadline:"Ongoing", urgent:false,
    makes:["Dodge","Jeep","Ram","Chrysler"],
    desc:"FCA's 5.7L and 6.4L HEMI V8 engines suffer premature lifter and camshaft failure. The characteristic tick often precedes complete engine failure costing $4,000+.",
    detail:"Ram 1500/2500, Dodge Durango, Jeep Grand Cherokee. FCA knew about the defect before launch.",
    firm:"Keller Postman", firmPPL:500,
    vinKeywords:["hemi","lifter","camshaft","tick","5.7","6.4"],
    qs:[{id:"own",text:"Did you own a Ram 1500, Dodge Durango, or Jeep Grand Cherokee with a HEMI (2019–2024)?",req:true},{id:"tick",text:"Did you experience persistent engine ticking or knocking?",req:false}] },
  { id:"a8", cat:"auto", company:"Subaru", icon:"🔩", payout:2000, ps:"$1,200–$3,500", deadline:"Ongoing", urgent:false,
    makes:["Subaru"],
    desc:"Subaru's FB20/FB25 engines burn through a quart of oil every 1,000 miles. Subaru called it 'normal' before quietly extending warranties and settling a class action.",
    detail:"Outback, Legacy, Forester, Impreza 2011–2015. Owners who paid for repairs may be reimbursed.",
    firm:"Robbins Geller", firmPPL:350,
    vinKeywords:["oil consumption","burning oil","outback","legacy","forester"],
    qs:[{id:"own",text:"Did you own a Subaru Outback, Legacy, Forester, or Impreza (2011–2015)?",req:true},{id:"oil",text:"Did your vehicle consume more than 1 quart per 1,200 miles?",req:false}] },
];

// ─── FOOD & CPG SETTLEMENTS ───────────────────────────────────────────────────
const FOOD_SUITS = [
  { id:"f1", cat:"food", company:"Red Bull", icon:"🐂", payout:15, ps:"$15", deadline:"Ongoing", urgent:false,
    desc:"Red Bull falsely advertised its drinks 'give you wings' and improve performance beyond caffeine alone.",
    detail:"Red Bull settled a $13M class action over deceptive 'enhanced performance' marketing. Any US customer who bought Red Bull between 2002–2014 may claim $15 cash or $25 in product vouchers — no receipt required.",
    firm:"Hagens Berman", firmPPL:80,
    qs:[{id:"bought",text:"Did you buy Red Bull in the US between 2002 and 2014?",req:true}] },
  { id:"f2", cat:"food", company:"Snapple", icon:"🍹", payout:50, ps:"$50", deadline:"Ongoing", urgent:false,
    desc:"Snapple falsely labeled products 'All Natural' while containing high-fructose corn syrup and artificial ingredients.",
    detail:"Snapple's 'All Natural' labeling was found to be deceptive under consumer protection law. Buyers of any Snapple product labeled All Natural between 2007–2014 may qualify.",
    firm:"Robbins Geller", firmPPL:100,
    qs:[{id:"bought",text:"Did you buy Snapple products labeled 'All Natural' between 2007–2014?",req:true}] },
  { id:"f3", cat:"food", company:"Subway", icon:"🥖", payout:35, ps:"$35", deadline:"Ongoing", urgent:false,
    desc:"Subway's 'Footlong' subs were found to measure less than 12 inches, violating consumer expectations.",
    detail:"A class action found Subway's footlong bread consistently measured 11 to 11.5 inches. Customers who purchased footlong subs between 2009–2016 may have a claim.",
    firm:"Lieff Cabraser", firmPPL:75,
    qs:[{id:"bought",text:"Did you purchase Subway Footlong sandwiches between 2009 and 2016?",req:true},{id:"short",text:"Did you ever notice your footlong was shorter than 12 inches?",req:false}] },
  { id:"f4", cat:"food", company:"Cheez-It / Kellogg's", icon:"🧀", payout:45, ps:"$45", deadline:"Oct 1, 2025", urgent:false,
    desc:"Kellogg's overstated serving sizes and used deceptive packaging on Cheez-It and other snack products.",
    detail:"Slack fill lawsuits target products where the container is significantly larger than the actual contents. Kellogg's settled allegations that its snack packaging was misleading about quantity.",
    firm:"Girard Sharp", firmPPL:90,
    qs:[{id:"bought",text:"Did you buy Cheez-It or other Kellogg's snacks between 2018–2023?",req:true}] },
  { id:"f5", cat:"food", company:"Nutella / Ferrero", icon:"🫙", payout:20, ps:"$20", deadline:"Ongoing", urgent:false,
    desc:"Ferrero marketed Nutella as a 'nutritious' part of a healthy breakfast despite being high in sugar and fat.",
    detail:"A $3.05M settlement found Nutella's advertising was misleading about health benefits. Any US customer who bought Nutella between 2008–2012 may claim without a receipt.",
    firm:"Cotchett Pitre", firmPPL:70,
    qs:[{id:"bought",text:"Did you buy Nutella in the US between January 2008 and February 2012?",req:true}] },
  { id:"f6", cat:"food", company:"Naked Juice / PepsiCo", icon:"🥤", payout:75, ps:"$75", deadline:"Ongoing", urgent:false,
    desc:"PepsiCo falsely labeled Naked Juice products as '100% Juice' and 'Non-GMO' when they contained synthetic additives and GMO ingredients.",
    detail:"PepsiCo paid $9M to settle claims that Naked Juice's 'All Natural' and 'Non-GMO' labels were deceptive. Customers who bought Naked Juice between 2007–2013 may qualify.",
    firm:"Hagens Berman", firmPPL:110,
    qs:[{id:"bought",text:"Did you buy Naked Juice products between 2007 and 2013?",req:true}] },
];

// ─── PHARMA & MEDICAL SETTLEMENTS ────────────────────────────────────────────
const PHARMA_SUITS = [
  { id:"p1", cat:"pharma", company:"Johnson & Johnson", icon:"🧴", payout:25000, ps:"$5,000–$100,000+", deadline:"Ongoing", urgent:false,
    desc:"J&J's talcum powder (Baby Powder, Shower to Shower) was found to contain asbestos and is linked to ovarian cancer and mesothelioma.",
    detail:"J&J agreed to a $8.9B settlement for talcum powder cancer claims. If you or a family member used J&J talcum powder for personal hygiene and were diagnosed with ovarian cancer or mesothelioma, you may have a significant claim.",
    firm:"Motley Rice", firmPPL:2500,
    qs:[{id:"used",text:"Did you or a family member use J&J Baby Powder or Shower to Shower regularly?",req:true},{id:"cancer",text:"Were you or a family member diagnosed with ovarian cancer or mesothelioma?",req:true}] },
  { id:"p2", cat:"pharma", company:"Bayer / Monsanto", icon:"🌿", payout:100000, ps:"$5,000–$250,000+", deadline:"Ongoing", urgent:false,
    desc:"Bayer's Roundup weedkiller (glyphosate) has been linked to non-Hodgkin's lymphoma in regular users.",
    detail:"Bayer agreed to pay over $10B to resolve Roundup cancer claims. Farmers, landscapers, and regular home users who developed non-Hodgkin's lymphoma after Roundup exposure may be entitled to major compensation.",
    firm:"Baum Hedlund", firmPPL:3000,
    qs:[{id:"used",text:"Did you regularly use Roundup or other glyphosate-based herbicides?",req:true},{id:"nhl",text:"Were you diagnosed with non-Hodgkin's lymphoma or another cancer?",req:true}] },
  { id:"p3", cat:"pharma", company:"Philips", icon:"😴", payout:7500, ps:"$1,500–$50,000", deadline:"Ongoing", urgent:false,
    desc:"Philips recalled 15 million CPAP and BiPAP devices after foam degradation was found to release toxic particles and carcinogens.",
    detail:"The polyurethane foam in Philips DreamStation and System One devices breaks down and can be inhaled, potentially causing cancer, respiratory issues, and organ damage. Philips is paying compensation to affected users.",
    firm:"Keller Postman", firmPPL:1200,
    qs:[{id:"device",text:"Did you own a Philips DreamStation, DreamStation 2, or System One CPAP/BiPAP?",req:true},{id:"years",text:"Did you use the device between 2009 and 2021?",req:true},{id:"health",text:"Have you experienced respiratory issues, headaches, or received a cancer diagnosis?",req:false}] },
  { id:"p4", cat:"pharma", company:"3M / Aearo Technologies", icon:"🎧", payout:15000, ps:"$5,000–$300,000+", deadline:"Ongoing", urgent:true,
    desc:"3M's dual-ended Combat Arms earplugs (CAEv2) were defective and failed to protect US military personnel from hearing damage.",
    detail:"3M paid $9.1B — the largest mass tort settlement in US history — for defective military earplugs that caused hearing loss and tinnitus. Active duty and veteran service members who used CAEv2 earplugs between 2003–2015 may qualify.",
    firm:"Aylstock Witkin", firmPPL:2000,
    qs:[{id:"military",text:"Did you serve in the US military between 2003 and 2015?",req:true},{id:"earplugs",text:"Were you issued or did you use 3M Combat Arms earplugs (dual-ended, yellow/olive)?",req:true},{id:"hearing",text:"Do you suffer from hearing loss or tinnitus?",req:false}] },
  { id:"p5", cat:"pharma", company:"Exactech", icon:"🦴", payout:50000, ps:"$10,000–$150,000+", deadline:"Ongoing", urgent:false,
    desc:"Exactech recalled hundreds of thousands of hip, knee, and ankle implants after packaging defects caused premature device failure.",
    detail:"Packaging defects allowed oxygen to degrade the polyethylene components, causing implants to fail years early. Patients who received Exactech implants and experienced early revision surgery or implant failure may be owed substantial compensation.",
    firm:"Napoli Shkolnik", firmPPL:2200,
    qs:[{id:"implant",text:"Did you receive an Exactech hip, knee, or ankle replacement implant?",req:true},{id:"revision",text:"Did you require revision surgery or experience joint pain/instability?",req:false}] },
  { id:"p6", cat:"pharma", company:"Generic Drug Makers", icon:"💊", payout:500, ps:"$100–$2,000", deadline:"Ongoing", urgent:false,
    desc:"40+ pharmaceutical companies were found to have price-fixed generic drugs including blood pressure, diabetes, and seizure medications.",
    detail:"A massive antitrust conspiracy involving dozens of generic drug manufacturers inflated prices for over 300 drugs. Consumers and insurers who paid inflated prices between 2009–2020 may have claims.",
    firm:"Hagens Berman", firmPPL:300,
    qs:[{id:"generic",text:"Did you purchase generic prescription drugs in the US between 2009–2020?",req:true},{id:"drugs",text:"Did you take any of the following: metformin, lisinopril, atorvastatin, or other common generics?",req:false}] },
];

// ─── HOUSING & FINANCE SETTLEMENTS ───────────────────────────────────────────
const HOUSING_SUITS = [
  { id:"h1", cat:"housing", company:"Wells Fargo", icon:"🏦", payout:5000, ps:"$100–$50,000", deadline:"Ongoing", urgent:false,
    desc:"Wells Fargo created 3.5 million fake accounts without customer consent, charging fees and damaging credit scores.",
    detail:"Wells Fargo employees opened millions of unauthorized deposit and credit card accounts to meet aggressive sales quotas. Customers who had unauthorized accounts opened, paid fees, or suffered credit damage between 2002–2017 may be owed compensation.",
    firm:"Lieff Cabraser", firmPPL:400,
    qs:[{id:"customer",text:"Were you a Wells Fargo customer between 2002 and 2017?",req:true},{id:"unknown",text:"Did you discover accounts or credit cards you didn't open?",req:false},{id:"fees",text:"Did you pay fees on accounts you didn't authorize?",req:false}] },
  { id:"h2", cat:"housing", company:"Rocket Mortgage / Quicken Loans", icon:"🚀", payout:3500, ps:"$500–$10,000", deadline:"Nov 30, 2025", urgent:false,
    desc:"Rocket Mortgage charged hidden fees and used deceptive advertising around 'no closing cost' and rate-lock promises.",
    detail:"Multiple class actions allege Rocket Mortgage misrepresented mortgage terms, charged undisclosed fees, and failed to honor rate lock commitments. Borrowers from 2015–2023 may qualify.",
    firm:"Gibbs Law Group", firmPPL:350,
    qs:[{id:"mortgage",text:"Did you get a mortgage through Rocket Mortgage or Quicken Loans between 2015–2023?",req:true},{id:"fees",text:"Did you pay unexpected fees at closing or experience rate lock issues?",req:false}] },
  { id:"h3", cat:"housing", company:"Redfin / NAR", icon:"🏡", payout:2000, ps:"$1,000–$15,000", deadline:"Dec 15, 2025", urgent:true,
    desc:"The National Association of Realtors conspired to inflate commissions, forcing home sellers to pay inflated buyer's agent fees.",
    detail:"A landmark $418M antitrust settlement found that NAR's rules artificially inflated real estate commissions. Home sellers from 2014–2024 who paid buyer's agent commissions through MLS-listed brokerages may be eligible.",
    firm:"Keller Postman", firmPPL:500,
    qs:[{id:"sold",text:"Did you sell a home in the US between 2014 and 2024?",req:true},{id:"mls",text:"Was your home listed on a Multiple Listing Service (MLS)?",req:true},{id:"commission",text:"Did you pay a buyer's agent commission at closing?",req:true}] },
  { id:"h4", cat:"housing", company:"CoreLogic / TransUnion Rental", icon:"📋", payout:1500, ps:"$300–$5,000", deadline:"Ongoing", urgent:false,
    desc:"Tenant screening companies reported inaccurate criminal and eviction records, causing wrongful rental denials.",
    detail:"CoreLogic and other tenant screening companies violated the Fair Credit Reporting Act by reporting inaccurate, incomplete, or outdated information used to deny housing. Renters denied housing based on background checks between 2015–2023 may qualify.",
    firm:"Francis Mailman Soumilas", firmPPL:280,
    qs:[{id:"denied",text:"Were you denied housing or an apartment between 2015–2023?",req:true},{id:"screening",text:"Did the landlord use a background or credit check in their decision?",req:true},{id:"inaccurate",text:"Did you discover inaccurate information in a background check?",req:false}] },
  { id:"h5", cat:"housing", company:"Nationstar / Mr. Cooper", icon:"📄", payout:800, ps:"$500–$3,000", deadline:"Ongoing", urgent:false,
    desc:"Nationstar Mortgage (now Mr. Cooper) improperly handled mortgage modifications, foreclosures, and escrow accounts.",
    detail:"Nationstar violated the Real Estate Settlement Procedures Act and consumer protection laws through shoddy loan servicing. Borrowers who experienced improper loan modifications, wrongful foreclosure attempts, or escrow errors between 2012–2020 may qualify.",
    firm:"Hagens Berman", firmPPL:250,
    qs:[{id:"mortgage",text:"Was your mortgage serviced by Nationstar or Mr. Cooper between 2012–2020?",req:true},{id:"issue",text:"Did you experience a wrongful foreclosure notice, failed loan modification, or escrow error?",req:false}] },
  { id:"h6", cat:"housing", company:"Payday Lenders (Multiple)", icon:"💸", payout:400, ps:"$100–$2,500", deadline:"Ongoing", urgent:false,
    desc:"Multiple payday lenders charged illegal interest rates and fees exceeding state usury limits, trapping borrowers in debt cycles.",
    detail:"Lenders including ACE Cash Express, CashCall, and Western Sky charged APRs of 100–900% in states where this is illegal. Borrowers who took payday or installment loans between 2008–2022 in states with usury caps may be owed refunds.",
    firm:"Gibbs Law Group", firmPPL:180,
    qs:[{id:"loan",text:"Did you take out a payday or short-term loan between 2008–2022?",req:true},{id:"highrate",text:"Did the loan carry an interest rate above 36% APR?",req:false}] },
];

// ─── MASTER SUITS INDEX ───────────────────────────────────────────────────────
// To add a new vertical: create a new _SUITS array above and spread it here.
const ALL_SUITS = [...TECH_SUITS, ...AUTO_SUITS, ...FOOD_SUITS, ...PHARMA_SUITS, ...HOUSING_SUITS];

// ─── NHTSA API HELPERS ────────────────────────────────────────────────────────
const NHTSA_VIN_URL = v => `/api/nhtsa?type=decodeVin&vin=${encodeURIComponent(v)}`;
const NHTSA_RECALL_VIN = v => `/api/nhtsa?type=recallsByVin&vin=${encodeURIComponent(v)}`;
const NHTSA_RECALL_VEH = (mk,mo,yr) => `/api/nhtsa?type=recallsByVehicle&make=${encodeURIComponent(mk)}&model=${encodeURIComponent(mo)}&year=${encodeURIComponent(yr)}`;
const NHTSA_MODELS_URL = (mk,yr) => `/api/nhtsa?type=models&make=${encodeURIComponent(mk)}&year=${encodeURIComponent(yr)}`;

const MAKES_LIST = ["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","GMC","Honda","Hyundai","Jeep","Kia","Lexus","Lincoln","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Pontiac","Porsche","Ram","Saturn","Subaru","Tesla","Toyota","Volkswagen","Volvo"];
const YEARS_LIST = Array.from({length:25},(_,i)=>2024-i);

function nhtsaSeverity(recall) {
  const t = (recall.Consequence||"").toLowerCase();
  if (t.includes("death")||t.includes("fatal")||t.includes("fire")) return {label:"CRITICAL",color:"#ef4444"};
  if (t.includes("injur")||t.includes("crash")||t.includes("accident")) return {label:"HIGH",color:"#f97316"};
  return {label:"MODERATE",color:"#f59e0b"};
}

function matchRecallToSuits(recall) {
  const text = [recall.Component||"",recall.Summary||"",recall.Consequence||""].join(" ").toLowerCase();
  return AUTO_SUITS.filter(s => s.vinKeywords?.some(kw => text.includes(kw)));
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800;12..96,900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#060609;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#1e1e2c;border-radius:99px;}
.app{min-height:100vh;background:#060609;color:#e8e4dc;font-family:'Bricolage Grotesque',sans-serif;}

/* NAV */
.nav{height:56px;background:rgba(6,6,9,0.92);backdrop-filter:blur(24px);border-bottom:1px solid #12121e;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:100;}
.nav-logo{display:flex;align-items:center;gap:10px;cursor:pointer;}
.nav-logo-icon{width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,#f97316,#ef4444);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 16px rgba(249,115,22,0.35);}
.nav-logo-name{font-size:15px;font-weight:900;letter-spacing:-0.5px;}
.nav-center{display:flex;gap:2px;}
.ntab{background:transparent;border:none;color:#52525b;font-family:inherit;font-size:13px;font-weight:600;padding:7px 13px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all 0.15s;}
.ntab:hover{color:#e8e4dc;background:rgba(255,255,255,0.05);}
.ntab.on{color:#e8e4dc;background:rgba(255,255,255,0.08);font-weight:700;}
.nbadge{background:#f97316;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:100px;}
.nbadge.g{background:#22d3a0;color:#060609;}
.nav-right{display:flex;align-items:center;gap:8px;}
.pot-pill{background:rgba(34,211,160,0.1);border:1px solid rgba(34,211,160,0.25);color:#22d3a0;font-size:12px;font-weight:800;padding:6px 12px;border-radius:8px;cursor:pointer;}
.nav-btn{background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.25);color:#f97316;font-family:inherit;font-size:12px;font-weight:700;padding:7px 14px;border-radius:8px;cursor:pointer;transition:all 0.15s;}
.nav-btn:hover{background:rgba(249,115,22,0.22);}

/* NOTIF */
.notif{background:rgba(239,68,68,0.08);border-bottom:1px solid rgba(239,68,68,0.18);padding:9px 24px;display:flex;align-items:center;gap:10px;font-size:13px;}
.notif-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0;animation:blink 1.5s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
.notif-text{flex:1;color:#fca5a5;}
.notif-text strong{color:#fecaca;}
.notif-x{background:transparent;border:none;color:#52525b;cursor:pointer;font-size:16px;}

/* HERO */
.hero{max-width:1140px;margin:0 auto;padding:56px 24px 48px;}
.hero-tag{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(249,115,22,0.3);background:rgba(249,115,22,0.07);border-radius:100px;padding:5px 14px 5px 8px;font-size:12px;font-weight:600;color:#fb923c;margin-bottom:22px;}
.hero-dot{width:6px;height:6px;border-radius:50%;background:#f97316;box-shadow:0 0 10px #f97316;animation:blink 2s infinite;}
.hero-h1{font-size:clamp(44px,7vw,84px);font-weight:900;line-height:0.93;letter-spacing:-3px;margin-bottom:16px;}
.hero-h1 em{font-style:normal;color:#f97316;}
.hero-sub{font-size:16px;color:#71717a;line-height:1.75;max-width:500px;margin-bottom:32px;}

/* CATEGORY SWITCHER */
.cat-switcher{display:flex;gap:8px;margin-bottom:32px;flex-wrap:wrap;}
.cat-btn{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 18px;cursor:pointer;transition:all 0.2s;font-family:inherit;}
.cat-btn:hover{border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);}
.cat-btn.on{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.25);}
.cat-icon{font-size:18px;}
.cat-label{font-size:13px;font-weight:700;color:#e8e4dc;}
.cat-count{font-size:11px;font-weight:700;padding:2px 7px;border-radius:100px;}
.cat-coming{font-size:10px;font-weight:600;color:#3f3f46;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:2px 6px;letter-spacing:0.5px;}

/* AI BOX */
.ai-box{background:#0d0d16;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:22px;margin-bottom:40px;position:relative;overflow:hidden;}
.ai-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#f97316 30%,#6366f1 70%,transparent);}
.ai-lbl{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#f97316;letter-spacing:0.3px;margin-bottom:12px;}
.ai-ldot{width:6px;height:6px;border-radius:50%;background:#f97316;box-shadow:0 0 8px #f97316;animation:blink 1.5s infinite;}
.ai-ta{width:100%;background:transparent;border:none;outline:none;color:#e8e4dc;font-family:inherit;font-size:15px;line-height:1.7;resize:none;min-height:52px;}
.ai-ta::placeholder{color:#27272a;}
.ai-foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;gap:8px;}
.ai-chips{display:flex;gap:6px;flex-wrap:wrap;}
.ai-chip{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:#52525b;font-family:inherit;font-size:11px;font-weight:600;padding:4px 11px;border-radius:100px;cursor:pointer;transition:all 0.15s;}
.ai-chip:hover{color:#f97316;border-color:rgba(249,115,22,0.3);}
.ai-go{background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border:none;border-radius:9px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:6px;}
.ai-go:hover:not(:disabled){opacity:0.9;transform:scale(1.02);}
.ai-go:disabled{opacity:0.3;cursor:not-allowed;}
.ai-result{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);animation:fadein 0.3s ease;}
@keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.ai-msg{font-size:14px;color:#71717a;font-style:italic;line-height:1.7;margin-bottom:10px;}
.ai-tags{display:flex;flex-wrap:wrap;gap:6px;}
.ai-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);color:#818cf8;border-radius:100px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.ai-tag:hover{background:rgba(99,102,241,0.2);}
.typing{display:flex;gap:4px;align-items:center;}
.td{width:6px;height:6px;border-radius:50%;background:#f97316;animation:tb 1.2s infinite;}
.td:nth-child(2){animation-delay:0.2s;}.td:nth-child(3){animation-delay:0.4s;}
@keyframes tb{0%,60%,100%{transform:translateY(0);opacity:0.3}30%{transform:translateY(-6px);opacity:1}}

/* STATS */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:1140px;margin:0 auto 32px;padding:0 24px;}
.stat{background:#0d0d16;border:1px solid rgba(255,255,255,0.06);border-radius:13px;padding:18px 20px;}
.stat-n{font-size:30px;font-weight:900;line-height:1;letter-spacing:-1px;margin-bottom:4px;}
.stat-l{font-size:12px;color:#52525b;}

/* AUTO VIN SCANNER */
.vin-section{max-width:1140px;margin:0 auto 32px;padding:0 24px;}
.vin-box{background:#0d0d16;border:1px solid rgba(220,38,38,0.2);border-radius:16px;padding:24px;position:relative;overflow:hidden;}
.vin-box::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#dc2626,#f97316,#dc2626);}
.vin-title{font-size:16px;font-weight:800;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
.vin-sub{font-size:13px;color:#52525b;margin-bottom:18px;line-height:1.6;}
.vin-tabs{display:flex;gap:6px;margin-bottom:16px;}
.vtab{background:transparent;border:1px solid rgba(255,255,255,0.08);color:#52525b;font-family:inherit;font-size:12px;font-weight:700;padding:6px 14px;border-radius:8px;cursor:pointer;transition:all 0.15s;}
.vtab:hover{border-color:rgba(255,255,255,0.2);color:#a1a1aa;}
.vtab.on{background:rgba(220,38,38,0.12);border-color:rgba(220,38,38,0.3);color:#ef4444;}
.vin-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;}
.vin-in{flex:1;min-width:220px;background:#060609;border:1.5px solid rgba(255,255,255,0.08);border-radius:10px;color:#e8e4dc;font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;letter-spacing:4px;padding:12px 16px;outline:none;transition:all 0.2s;text-transform:uppercase;}
.vin-in::placeholder{color:#1e1e1e;letter-spacing:2px;}
.vin-in:focus{border-color:#dc2626;}
.vin-ct{font-size:11px;margin-top:4px;}
.vin-ct.ok{color:#22d3a0;}.vin-ct.bad{color:#52525b;}
.man-row{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;flex:1;}
.fsel{background:#060609;border:1.5px solid rgba(255,255,255,0.08);border-radius:10px;color:#e8e4dc;font-family:inherit;font-size:14px;padding:11px 12px;outline:none;transition:border-color 0.2s;cursor:pointer;min-width:110px;flex:1;}
.fsel:focus{border-color:#dc2626;}
.scan-btn{padding:13px 22px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;white-space:nowrap;display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(220,38,38,0.2);}
.scan-btn:hover:not(:disabled){opacity:0.9;transform:scale(1.02);}
.scan-btn:disabled{opacity:0.25;cursor:not-allowed;transform:none;}

/* SCAN ANIMATION */
.scan-anim{text-align:center;padding:44px 24px;max-width:1140px;margin:0 auto;}
.scan-car{font-size:64px;display:inline-block;animation:drive 1s ease-in-out infinite alternate;margin-bottom:16px;}
@keyframes drive{from{transform:translateX(-20px)}to{transform:translateX(20px)}}
.scan-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;}
.scan-sub{font-size:14px;color:#52525b;margin-bottom:22px;}
.scan-track{width:300px;height:3px;background:#1a1a1a;border-radius:99px;overflow:hidden;margin:0 auto 20px;}
.scan-fill{height:100%;background:linear-gradient(90deg,#dc2626,#f97316);border-radius:99px;transition:width 0.5s ease;}
.scan-steps{display:flex;flex-direction:column;gap:7px;max-width:340px;margin:0 auto;text-align:left;}
.ss{display:flex;align-items:center;gap:9px;font-size:13px;}
.ss.done{color:#22d3a0;}.ss.act{color:#e8e4dc;}.ss.wait{color:#2a2a2a;}
.ss-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.ss-spin{width:13px;height:13px;border:2px solid #dc2626;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg)}}

/* NHTSA RESULTS */
.nhtsa-results{max-width:1140px;margin:0 auto;padding:0 24px 24px;}
.vehicle-bar{background:#0d0d16;border:1px solid rgba(255,255,255,0.07);border-radius:13px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.vb-info{display:flex;align-items:center;gap:12px;}
.vb-name{font-size:17px;font-weight:800;letter-spacing:-0.3px;}
.vb-detail{font-size:12px;color:#52525b;margin-top:2px;}
.vb-stats{display:flex;gap:10px;flex-wrap:wrap;}
.vbs{background:#060609;border:1px solid rgba(255,255,255,0.06);border-radius:9px;padding:9px 14px;text-align:center;}
.vbs-n{font-size:20px;font-weight:900;letter-spacing:-0.5px;line-height:1;}
.vbs-l{font-size:9px;color:#52525b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.match-banner{background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.18);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.mb-title{font-size:14px;font-weight:700;color:#ef4444;margin-bottom:2px;}
.mb-sub{font-size:13px;color:#52525b;}
.mb-val{margin-left:auto;flex-shrink:0;text-align:right;}
.mb-num{font-size:28px;font-weight:900;color:#ef4444;letter-spacing:-1px;line-height:1;}
.mb-lbl{font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:1px;}
.nhtsa-sec-head{font-size:13px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;color:#52525b;margin:16px 0 10px;display:flex;align-items:center;gap:10px;}
.nhtsa-sec-head::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06);}
.recall-item{background:#0d0d16;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;margin-bottom:8px;}
.ri-accent{height:2px;}
.ri-body{padding:14px 16px;}
.ri-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;}
.sev-pill{font-size:9px;font-weight:800;padding:2px 8px;border-radius:100px;letter-spacing:1px;}
.comp-pill{font-size:10px;color:#52525b;background:#060609;border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:2px 7px;}
.ri-summary{font-size:13px;color:#71717a;line-height:1.6;margin-bottom:8px;}
.ri-risk{font-size:12px;color:#a1a1aa;padding:8px 11px;background:#060609;border-radius:8px;border-left:2px solid #dc2626;margin-bottom:10px;line-height:1.5;}
.ri-settlements{border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;margin-top:2px;}
.ris-label{font-size:10px;font-weight:700;color:#dc2626;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px;}
.smr{display:flex;align-items:center;justify-content:space-between;background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.12);border-radius:8px;padding:9px 13px;cursor:pointer;transition:all 0.15s;margin-bottom:5px;}
.smr:hover{background:rgba(220,38,38,0.1);border-color:rgba(220,38,38,0.25);}
.smr-title{font-size:13px;font-weight:700;margin-bottom:2px;}
.smr-pay{font-size:12px;color:#22d3a0;font-weight:600;}
.smr-cta{background:transparent;border:1px solid rgba(220,38,38,0.25);color:#dc2626;font-family:inherit;font-size:12px;font-weight:700;padding:5px 12px;border-radius:7px;cursor:pointer;flex-shrink:0;}
.no-smr{font-size:12px;color:#2a2a2a;font-style:italic;}
.nhtsa-error{background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px 16px;font-size:13px;color:#f87171;margin-bottom:14px;}

/* BROWSE */
.browse{max-width:1140px;margin:0 auto;padding:0 24px 80px;}
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;}
.sec-title{font-size:20px;font-weight:800;letter-spacing:-0.5px;}
.filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;}
.fpill{background:transparent;border:1px solid rgba(255,255,255,0.08);color:#52525b;font-family:inherit;font-size:12px;font-weight:600;padding:5px 14px;border-radius:100px;cursor:pointer;transition:all 0.15s;}
.fpill:hover{color:#a1a1aa;border-color:rgba(255,255,255,0.18);}
.fpill.on{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.28);color:#e8e4dc;}
.search-wrap{position:relative;margin-bottom:18px;}
.search-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#3f3f46;pointer-events:none;}
.search-in{width:100%;background:#0d0d16;border:1px solid rgba(255,255,255,0.07);border-radius:10px;color:#e8e4dc;font-family:inherit;font-size:14px;padding:11px 14px 11px 38px;outline:none;transition:border-color 0.2s;}
.search-in:focus{border-color:rgba(249,115,22,0.4);}
.search-in::placeholder{color:#3f3f46;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;}

/* CARDS */
.card{background:#0d0d16;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
.card:hover{border-color:rgba(255,255,255,0.16);transform:translateY(-2px);box-shadow:0 14px 40px rgba(0,0,0,0.5);}
.card.hl{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.04);}
.card.sv{border-color:rgba(34,211,160,0.3);}
.card-cat-tag{position:absolute;top:0;left:0;right:0;height:2px;}
.urgent-ribbon{position:absolute;top:10px;right:-26px;background:#ef4444;color:#fff;font-size:8px;font-weight:800;letter-spacing:1.5px;padding:3px 32px;transform:rotate(45deg);}
.card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:11px;}
.card-icon{font-size:24px;}
.cat-badge{font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:3px 9px;border-radius:100px;border:1px solid;}
.card-co{font-size:11px;color:#52525b;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:3px;}
.card-title{font-size:14px;font-weight:700;margin-bottom:8px;line-height:1.35;}
.card-desc{font-size:13px;color:#71717a;line-height:1.6;margin-bottom:14px;}
.card-ft{display:flex;justify-content:space-between;align-items:flex-end;}
.payout-l{font-size:10px;color:#3f3f46;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;}
.payout-v{font-size:24px;font-weight:900;color:#22d3a0;letter-spacing:-0.8px;line-height:1;}
.dl{font-size:11px;color:#3f3f46;text-align:right;}
.dl span{display:block;color:#52525b;font-weight:600;margin-top:1px;}
.card-btns{display:flex;gap:7px;margin-top:12px;}
.cbtn{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#71717a;font-family:inherit;font-size:12px;font-weight:700;padding:8px;border-radius:8px;cursor:pointer;transition:all 0.15s;text-align:center;}
.cbtn:hover{background:rgba(255,255,255,0.09);color:#e8e4dc;}
.cbtn.save{color:#22d3a0;border-color:rgba(34,211,160,0.22);background:rgba(34,211,160,0.05);}
.cbtn.save:hover{background:rgba(34,211,160,0.11);}
.cbtn.saved{background:rgba(34,211,160,0.1);border-color:rgba(34,211,160,0.35);color:#22d3a0;}

/* SAVED */
.saved-page{max-width:1140px;margin:0 auto;padding:48px 24px 80px;}
.sp-title{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:6px;}
.sp-sub{font-size:15px;color:#71717a;margin-bottom:28px;}
.pot-bar{background:linear-gradient(135deg,rgba(249,115,22,0.09),rgba(99,102,241,0.07));border:1px solid rgba(249,115,22,0.18);border-radius:14px;padding:24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.pot-val{font-size:44px;font-weight:900;color:#22d3a0;letter-spacing:-2px;line-height:1;}
.pot-share{background:#f97316;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.pot-share:hover{background:#ea6c08;}
.empty{text-align:center;padding:70px 20px;color:#3f3f46;}
.empty-icon{font-size:48px;margin-bottom:12px;}
.empty-title{font-size:20px;font-weight:800;color:#52525b;margin-bottom:6px;}
.empty-sub{font-size:14px;line-height:1.7;max-width:320px;margin:0 auto 20px;}
.btn-p{background:#f97316;color:#fff;border:none;border-radius:10px;padding:13px 22px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.btn-p:hover{background:#ea6c08;}

/* MODAL */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadein 0.2s ease;}
.modal{background:#0d0d16;border:1px solid rgba(255,255,255,0.09);border-radius:18px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;position:relative;animation:mIn 0.25s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes mIn{from{opacity:0;transform:scale(0.93) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
.modal-stripe{height:3px;border-radius:18px 18px 0 0;}
.mclose{position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.06);border:none;color:#52525b;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:all 0.15s;z-index:10;}
.mclose:hover{background:rgba(255,255,255,0.12);color:#e8e4dc;}
.mbody{padding:24px;}
.mtabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.07);margin:-24px -24px 20px;padding:0 24px;}
.mtab{background:transparent;border:none;border-bottom:2px solid transparent;color:#52525b;font-family:inherit;font-size:13px;font-weight:600;padding:13px 14px;cursor:pointer;transition:all 0.15s;margin-bottom:-1px;}
.mtab:hover{color:#e8e4dc;}
.mtab.on{color:#f97316;border-bottom-color:#f97316;}
.m-icon{font-size:38px;margin-bottom:10px;}
.m-co{font-size:11px;color:#52525b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
.m-title{font-size:20px;font-weight:800;margin-bottom:8px;line-height:1.2;letter-spacing:-0.3px;}
.m-desc{font-size:14px;color:#71717a;line-height:1.7;margin-bottom:18px;}
.m-meta{display:flex;gap:9px;margin-bottom:22px;}
.mtile{flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;}
.mtile-l{font-size:9px;color:#3f3f46;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.mtile-v{font-size:20px;font-weight:900;line-height:1;letter-spacing:-0.5px;}
.q-head{font-size:10px;font-weight:700;color:#3f3f46;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;}
.qi{margin-bottom:14px;}
.qt{font-size:14px;color:#d4d4d8;line-height:1.6;margin-bottom:9px;font-weight:500;}
.qr{font-size:10px;color:#f97316;margin-left:5px;font-weight:800;}
.qbtns{display:flex;gap:7px;}
.qbtn{flex:1;padding:10px;border-radius:9px;border:1.5px solid rgba(255,255,255,0.07);background:transparent;color:#52525b;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;}
.qbtn:hover{border-color:rgba(255,255,255,0.18);color:#a1a1aa;}
.qbtn.y.sel{background:rgba(34,211,160,0.1);border-color:#22d3a0;color:#22d3a0;}
.qbtn.n.sel{background:rgba(244,63,94,0.1);border-color:#f43f5e;color:#f43f5e;}
.chk-btn{width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;border:none;border-radius:11px;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;transition:all 0.2s;margin-top:18px;}
.chk-btn:disabled{opacity:0.2;cursor:not-allowed;}
.chk-btn:not(:disabled):hover{opacity:0.9;transform:scale(1.01);}
.r-yes{margin-top:16px;background:rgba(34,211,160,0.07);border:1.5px solid rgba(34,211,160,0.28);border-radius:14px;padding:24px;text-align:center;animation:fadein 0.3s ease;}
.r-no{margin-top:16px;background:rgba(244,63,94,0.06);border:1.5px solid rgba(244,63,94,0.18);border-radius:14px;padding:24px;text-align:center;animation:fadein 0.3s ease;}
.r-emoji{font-size:38px;margin-bottom:10px;}
.r-title{font-size:20px;font-weight:900;margin-bottom:5px;}
.r-payout{font-size:50px;font-weight:900;color:#22d3a0;line-height:1;letter-spacing:-2px;margin:6px 0;}
.r-sub{font-size:13px;color:#71717a;line-height:1.7;margin-bottom:12px;}
.r-cta{width:100%;padding:13px;background:#22d3a0;color:#060609;border:none;border-radius:10px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;transition:all 0.15s;}
.r-cta:hover{background:#34d399;}
.firm-box{background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.18);border-radius:12px;padding:18px;margin-bottom:12px;}
.firm-name{font-size:14px;font-weight:800;margin-bottom:3px;}
.firm-sub{font-size:13px;color:#71717a;margin-bottom:12px;line-height:1.6;}
.no-fee-pill{display:inline-flex;align-items:center;gap:5px;background:rgba(34,211,160,0.08);border:1px solid rgba(34,211,160,0.22);border-radius:100px;padding:4px 11px;font-size:11px;color:#22d3a0;font-weight:700;margin-bottom:12px;}
.linput{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:9px;color:#e8e4dc;font-family:inherit;font-size:13px;padding:10px 12px;outline:none;margin-top:4px;}
.linput:focus{border-color:rgba(249,115,22,0.4);}
.llabel{font-size:11px;font-weight:700;color:#52525b;}
.lfield{margin-bottom:11px;}
.disc{max-width:1140px;margin:0 auto;text-align:center;font-size:12px;color:#1e1e2e;padding:20px 24px 48px;line-height:2;}
@media(max-width:700px){
  .stats{grid-template-columns:repeat(2,1fr);}
  .grid{grid-template-columns:1fr;}
  .nav-center{display:none;}
  .cat-switcher{gap:6px;}
  .cat-btn{padding:8px 12px;}
  .man-row{flex-direction:column;}
}
`;

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
function Dots() {
  return <div className="typing"><div className="td"/><div className="td"/><div className="td"/></div>;
}

function AIBox({ onMatch }) {
  const [txt, setTxt] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [ids, setIds] = useState([]);
  const examples = [
    "I lived in Illinois and used Facebook",
    "T-Mobile customer, got a breach letter",
    "My 2015 MacBook keyboard broke",
    "I own a 2018 Honda CR-V",
    "VW TDI diesel owner",
    "Amazon charged me for Prime I didn't want",
  ];

  const run = async () => {
    if (!txt.trim()) return;
    setLoading(true); setMsg(null); setIds([]);
    try {
      // Secure proxy — API key lives in Vercel env vars, never exposed client-side
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: txt }),
      });
      const parsed = await r.json();
      setMsg(parsed.summary || "Here's what I found.");
      setIds(parsed.matchIds || []);
      onMatch(parsed.matchIds || []);
    } catch (_) {
      setMsg("I found some potential matches. Check the highlighted cases below.");
      onMatch([]);
    }
    setLoading(false);
  };

  return (
    <div className="ai-box">
      <div className="ai-lbl"><div className="ai-ldot"/>AI Settlement Finder · Searches Tech + Auto</div>
      <textarea
        className="ai-ta" rows={2}
        placeholder="Describe your situation... e.g. I was a T-Mobile customer, or I own a 2018 Honda CR-V with a 1.5T engine"
        value={txt}
        onChange={e => setTxt(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
      />
      <div className="ai-foot">
        <div className="ai-chips">
          {!txt && examples.map(ex => <button key={ex} className="ai-chip" onClick={() => setTxt(ex)}>{ex}</button>)}
        </div>
        <button className="ai-go" disabled={!txt.trim() || loading} onClick={run}>
          {loading ? <Dots/> : <span>Find My Claims →</span>}
        </button>
      </div>
      {(loading || msg) && (
        <div className="ai-result">
          {loading && <Dots/>}
          {msg && <>
            <div className="ai-msg">"{msg}"</div>
            {ids.length > 0 ? (
              <div className="ai-tags">
                {ids.map(id => {
                  const s = ALL_SUITS.find(l => l.id === id);
                  return s ? (
                    <span key={id} className="ai-tag" onClick={() => document.getElementById("card-" + id)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                      {s.icon} {s.company} · {s.ps}
                    </span>
                  ) : null;
                })}
              </div>
            ) : <span style={{fontSize:13,color:"#52525b"}}>No strong matches — browse all cases below.</span>}
          </>}
        </div>
      )}
    </div>
  );
}

function SuitCard({ s, saved, hl, onSave, onOpen }) {
  const cat = CATEGORIES.find(c => c.id === s.cat);
  const color = cat?.color || "#f97316";
  return (
    <div id={"card-" + s.id} className={"card" + (hl ? " hl" : "") + (saved ? " sv" : "")} onClick={() => onOpen(s)}>
      <div className="card-cat-tag" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
      {s.urgent && <div className="urgent-ribbon">URGENT</div>}
      <div className="card-head" style={{ marginTop: 6 }}>
        <div className="card-icon">{s.icon}</div>
        <div className="cat-badge" style={{ color, borderColor: color + "44", background: color + "12" }}>{cat?.label}</div>
      </div>
      <div className="card-co">{s.company}</div>
      <div className="card-title">{s.desc.split(".")[0]}.</div>
      <div className="card-desc">{s.desc}</div>
      <div className="card-ft">
        <div><div className="payout-l">Up to</div><div className="payout-v">{s.ps}</div></div>
        <div className="dl">Deadline<span>{s.deadline}</span></div>
      </div>
      <div className="card-btns">
        <button className="cbtn" onClick={e => { e.stopPropagation(); onOpen(s); }}>Check Eligibility →</button>
        <button className={"cbtn " + (saved ? "saved" : "save")} onClick={e => { e.stopPropagation(); onSave(s.id); }}>
          {saved ? "✓ Saved" : "+ Save"}
        </button>
      </div>
    </div>
  );
}

function EligTab({ s, saved, onSave }) {
  const [ans, setAns] = useState({});
  const [result, setResult] = useState(null);
  const allReq = s.qs.filter(q => q.req).every(q => ans[q.id] !== undefined);
  const check = () => setResult(s.qs.filter(q => q.req).every(q => ans[q.id] === "yes") ? "yes" : "no");
  return (
    <div>
      <div className="q-head">Eligibility Questions</div>
      {s.qs.map((q, i) => (
        <div key={q.id} className="qi">
          <div className="qt"><span style={{ color: "#3f3f46", marginRight: 6 }}>{i + 1}.</span>{q.text}{q.req && <span className="qr">Required</span>}</div>
          <div className="qbtns">
            <button className={"qbtn y" + (ans[q.id] === "yes" ? " sel" : "")} onClick={() => setAns(a => ({ ...a, [q.id]: "yes" }))}>✓ Yes</button>
            <button className={"qbtn n" + (ans[q.id] === "no" ? " sel" : "")} onClick={() => setAns(a => ({ ...a, [q.id]: "no" }))}>✗ No</button>
          </div>
        </div>
      ))}
      {!result && <button className="chk-btn" disabled={!allReq} onClick={check}>Check My Eligibility</button>}
      {result === "yes" && (
        <div className="r-yes">
          <div className="r-emoji">🎉</div>
          <div className="r-title" style={{ color: "#22d3a0" }}>You Likely Qualify!</div>
          <div className="r-payout">{s.ps}</div>
          <div className="r-sub">Based on your answers, you're potentially eligible. Save this case and connect with attorneys to start your claim.</div>
          <button className="r-cta" onClick={() => onSave(s.id)}>{saved ? "✓ Saved" : "💾 Save & Start Claim"}</button>
        </div>
      )}
      {result === "no" && (
        <div className="r-no">
          <div className="r-emoji">😕</div>
          <div className="r-title" style={{ color: "#f43f5e" }}>Likely Doesn't Apply</div>
          <div className="r-sub">You may not meet the core requirements. Browse other open cases — you may qualify for those.</div>
        </div>
      )}
    </div>
  );
}

function FirmTab({ s }) {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  if (done) return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 7 }}>Request Sent!</div>
      <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7 }}>{s.firm} will contact you within 1 business day.<br />There's no fee unless you win.</div>
    </div>
  );
  return (
    <div>
      <div className="no-fee-pill">✓ No fee unless you win</div>
      <div className="firm-box">
        <div className="firm-name">{s.firm}</div>
        <div className="firm-sub">Specialized plaintiff's firm handling this case. Submit your info for a callback within 24 hours.</div>
        <div style={{ fontSize: 12, color: "#52525b" }}>Firm pays ClaimCheck <strong style={{ color: "#f97316" }}>${s.firmPPL}/lead</strong> for qualified referrals.</div>
      </div>
      {[["name","Full Name","Jane Smith"],["email","Email","jane@example.com"],["phone","Phone (optional)","555-000-0000"]].map(([k,l,p]) => (
        <div key={k} className="lfield">
          <label className="llabel">{l}</label>
          <input className="linput" placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
        </div>
      ))}
      <button className="r-cta" style={{ marginTop: 8 }} disabled={!form.name || !form.email} onClick={() => setDone(true)}>
        Connect Me With {s.firm} →
      </button>
      <div style={{ fontSize: 11, color: "#3f3f46", textAlign: "center", marginTop: 8 }}>Free consultation · No obligation · Contingency fee only</div>
    </div>
  );
}

function SuitModal({ s, onClose, saved, onSave }) {
  const [tab, setTab] = useState("check");
  const cat = CATEGORIES.find(c => c.id === s.cat);
  const color = cat?.color || "#f97316";
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-stripe" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
        <button className="mclose" onClick={onClose}>✕</button>
        <div className="mbody" style={{ paddingBottom: 0 }}>
          <div className="m-icon">{s.icon}</div>
          <div className="m-co">{s.company} · {cat?.label}</div>
          <div className="m-title">{s.desc.split(".")[0]}.</div>
          <div className="m-desc">{s.detail || s.desc}</div>
          <div className="m-meta">
            <div className="mtile"><div className="mtile-l">Up to</div><div className="mtile-v" style={{ color: "#22d3a0" }}>{s.ps}</div></div>
            <div className="mtile"><div className="mtile-l">Deadline</div><div className="mtile-v" style={{ fontSize: 15, marginTop: 3 }}>{s.deadline}</div></div>
            <div className="mtile"><div className="mtile-l">Firm PPL</div><div className="mtile-v" style={{ fontSize: 15, marginTop: 3, color: "#f97316" }}>${s.firmPPL}</div></div>
          </div>
        </div>
        <div className="mtabs">
          {[["check","✓ Eligibility"],["detail","Details"],["firm","⚖️ Attorney"]].map(([id,lbl]) => (
            <button key={id} className={"mtab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
        <div className="mbody">
          {tab === "check" && <EligTab s={s} saved={saved} onSave={onSave} />}
          {tab === "detail" && (
            <div>
              <div style={{ fontSize: 14, color: "#71717a", lineHeight: 1.75 }}>{s.detail || s.desc}</div>
              {s.makes && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Affected Makes</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.makes.map(m => <span key={m} style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 12, fontWeight: 600, padding: "3px 10px", color: "#a1a1aa" }}>{m}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "firm" && <FirmTab s={s} />}
        </div>
      </div>
    </div>
  );
}

// ─── VIN SCANNER (auto vertical) ─────────────────────────────────────────────
function VINScanner({ onSuitOpen }) {
  const [vinMode, setVinMode] = useState("vin");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [models, setModels] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanPct, setScanPct] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canGo = vinMode === "vin" ? vin.length === 17 : (make && year);

  const fetchModels = useCallback(async (mk, yr) => {
    if (!mk || !yr) return;
    try {
      const r = await fetch(NHTSA_MODELS_URL(mk, yr));
      const d = await r.json();
      setModels((d.Results || []).map(m => m.Model_Name).sort());
    } catch { setModels([]); }
  }, []);

  const STEPS = ["Connecting to NHTSA database...","Decoding VIN...","Fetching recall records...","Matching to settlements...","Calculating potential..."];

  const scan = async () => {
    setScanning(true); setScanStep(0); setScanPct(0); setResult(null); setError(null);
    try {
      let vInfo = {};
      let recalls = [];

      if (vinMode === "vin") {
        setScanStep(1); setScanPct(20);
        const vd = await (await fetch(NHTSA_VIN_URL(vin))).json();
        const get = n => (vd.Results||[]).find(r=>r.Variable===n)?.Value||"";
        vInfo = { year:get("Model Year"), make:get("Make"), model:get("Model"), trim:get("Trim"), engine:get("Engine Displacement (L)"), vin };
        if (!vInfo.make || vInfo.make === "Not Applicable") throw new Error("VIN not recognized. Please check and try again.");

        setScanStep(2); setScanPct(40);
        const rd = await (await fetch(NHTSA_RECALL_VIN(vin))).json();
        recalls = rd.results || [];

        setScanStep(3); setScanPct(60);
        if (vInfo.make && vInfo.model && vInfo.year) {
          try {
            const rd2 = await (await fetch(NHTSA_RECALL_VEH(vInfo.make, vInfo.model, vInfo.year))).json();
            const existing = new Set(recalls.map(r=>r.NHTSACampaignNumber));
            (rd2.results||[]).forEach(r=>{ if(!existing.has(r.NHTSACampaignNumber)) recalls.push(r); });
          } catch {}
        }
      } else {
        setScanStep(1); setScanPct(30);
        vInfo = { make, model, year, vin: null };
        setScanStep(2); setScanPct(50);
        const rd = await (await fetch(NHTSA_RECALL_VEH(make, model||make, year))).json();
        recalls = rd.results || [];
        setScanStep(3); setScanPct(70);
      }

      const recallsTagged = recalls.map(r => ({ ...r, matched: matchRecallToSuits(r) }));
      const vMake = (vInfo.make||"").toLowerCase();
      const makeSuits = AUTO_SUITS.filter(s => (s.makes||[]).some(m=>m.toLowerCase()===vMake||vMake.includes(m.toLowerCase())));

      setScanStep(4); setScanPct(90);
      await new Promise(r=>setTimeout(r,400));
      setScanPct(100);

      setResult({
        vehicle: vInfo,
        recalls: recallsTagged,
        makeSuits,
        totalPot: makeSuits.reduce((a,s)=>a+s.payout,0),
      });
    } catch(e) {
      setError(e.message || "Failed to connect to NHTSA. Please try again.");
    }
    setScanning(false);
  };

  return (
    <div className="vin-section">
      <div className="vin-box">
        <div className="vin-title">🔍 VIN Scanner <span style={{fontSize:11,fontWeight:600,color:"#52525b",marginLeft:6}}>Live NHTSA data</span></div>
        <div className="vin-sub">Enter your VIN for a real-time scan of the federal recall database. We cross-reference every recall against our settlement database to find what you may be owed.</div>

        <div className="vin-tabs">
          <button className={"vtab" + (vinMode==="vin"?" on":"")} onClick={()=>setVinMode("vin")}>🔑 VIN Number</button>
          <button className={"vtab" + (vinMode==="manual"?" on":"")} onClick={()=>setVinMode("manual")}>🚗 Make / Year</button>
        </div>

        {vinMode === "vin" ? (
          <div className="vin-row">
            <div style={{flex:1}}>
              <input className="vin-in" placeholder="1HGCV1F34JA000000" value={vin} maxLength={17}
                onChange={e=>setVin(e.target.value.replace(/[^A-Za-z0-9]/g,"").toUpperCase())} />
              <div className={"vin-ct " + (vin.length===17?"ok":"bad")}>
                {vin.length===17 ? "✓ Valid VIN length" : vin.length+"/17 characters — find on dashboard, door jamb, or insurance card"}
              </div>
            </div>
            <button className="scan-btn" disabled={vin.length!==17||scanning} onClick={scan}>
              {scanning ? "Scanning..." : "Scan →"}
            </button>
          </div>
        ) : (
          <div className="vin-row">
            <div className="man-row">
              <select className="fsel" value={make} onChange={e=>{setMake(e.target.value);setModel("");if(e.target.value&&year)fetchModels(e.target.value,year);}}>
                <option value="">Make</option>
                {MAKES_LIST.map(m=><option key={m}>{m}</option>)}
              </select>
              <select className="fsel" value={year} onChange={e=>{setYear(e.target.value);setModel("");if(make&&e.target.value)fetchModels(make,e.target.value);}}>
                <option value="">Year</option>
                {YEARS_LIST.map(y=><option key={y}>{y}</option>)}
              </select>
              <select className="fsel" value={model} onChange={e=>setModel(e.target.value)} disabled={!models.length}>
                <option value="">{models.length?"Model (optional)":"Select make+year first"}</option>
                {models.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <button className="scan-btn" disabled={!canGo||scanning} onClick={scan}>
              {scanning ? "Scanning..." : "Scan →"}
            </button>
          </div>
        )}

        {error && <div className="nhtsa-error" style={{marginTop:12}}><strong>Error:</strong> {error}</div>}
      </div>

      {scanning && (
        <div className="scan-anim">
          <div className="scan-car">🚗</div>
          <div className="scan-title">Scanning NHTSA Database...</div>
          <div className="scan-sub">Pulling live federal recall records · Cross-referencing settlements</div>
          <div className="scan-track"><div className="scan-fill" style={{width:scanPct+"%"}}/></div>
          <div className="scan-steps">
            {STEPS.map((s,i)=>(
              <div key={i} className={"ss"+(i<scanStep-1?" done":i===scanStep-1?" act":" wait")}>
                {i<scanStep-1?<div className="ss-dot" style={{background:"#22d3a0"}}/>:i===scanStep-1?<div className="ss-spin"/>:<div className="ss-dot" style={{background:"#1a1a1a"}}/>}
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && !scanning && (
        <div className="nhtsa-results">
          <div className="vehicle-bar">
            <div className="vb-info">
              <span style={{fontSize:28}}>🚗</span>
              <div>
                <div className="vb-name">{result.vehicle.year} {result.vehicle.make} {result.vehicle.model}{result.vehicle.trim?" "+result.vehicle.trim:""}</div>
                <div className="vb-detail">{result.vehicle.engine?result.vehicle.engine+"L · ":""}{result.vehicle.vin||"Manual lookup"}</div>
              </div>
            </div>
            <div className="vb-stats">
              {[
                {n:result.recalls.length, l:"NHTSA Recalls", c:result.recalls.length>0?"#ef4444":"#22d3a0"},
                {n:result.makeSuits.length, l:"Settlements", c:result.makeSuits.length>0?"#f97316":"#52525b"},
                {n:"$"+(result.totalPot/1000).toFixed(0)+"K", l:"Max Potential", c:"#22d3a0"},
              ].map((v,i)=>(
                <div key={i} className="vbs">
                  <div className="vbs-n" style={{color:v.c}}>{v.n}</div>
                  <div className="vbs-l">{v.l}</div>
                </div>
              ))}
            </div>
          </div>

          {result.makeSuits.length > 0 && (
            <div className="match-banner">
              <span style={{fontSize:24,flexShrink:0}}>⚠️</span>
              <div>
                <div className="mb-title">Potential Settlement Match — Action Required</div>
                <div className="mb-sub">Your {result.vehicle.make} may be covered by {result.makeSuits.length} active class action settlement{result.makeSuits.length!==1?"s":""}.</div>
              </div>
              <div className="mb-val">
                <div className="mb-num">${result.totalPot.toLocaleString()}</div>
                <div className="mb-lbl">Max potential</div>
              </div>
            </div>
          )}

          {result.recalls.length > 0 && (
            <>
              <div className="nhtsa-sec-head">Live NHTSA Recalls · {result.recalls.length} found</div>
              {result.recalls.map((r,i) => {
                const sev = nhtsaSeverity(r);
                return (
                  <div key={i} className="recall-item">
                    <div className="ri-accent" style={{background:`linear-gradient(90deg,${sev.color},transparent)`}}/>
                    <div className="ri-body">
                      <div className="ri-top">
                        <span className="sev-pill" style={{background:sev.color+"20",color:sev.color,border:"1px solid "+sev.color+"44"}}>{sev.label}</span>
                        {r.Component && <span className="comp-pill">{r.Component.split(":")[0]}</span>}
                        <span style={{fontSize:11,color:"#2a2a2a",marginLeft:"auto"}}>{r.NHTSACampaignNumber}</span>
                      </div>
                      {r.Summary && <div className="ri-summary">{r.Summary.length>250?r.Summary.substring(0,250)+"...":r.Summary}</div>}
                      {r.Consequence && <div className="ri-risk"><strong style={{color:"#dc2626",fontSize:10,textTransform:"uppercase",letterSpacing:1}}>Risk: </strong>{r.Consequence}</div>}
                      {r.matched.length > 0 && (
                        <div className="ri-settlements">
                          <div className="ris-label">⚖️ {r.matched.length} Settlement Match{r.matched.length>1?"es":""}</div>
                          {r.matched.map(s => (
                            <div key={s.id} className="smr" onClick={()=>onSuitOpen(s)}>
                              <div><div className="smr-title">{s.company}</div><div className="smr-pay">Up to {s.ps}</div></div>
                              <button className="smr-cta">Check →</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {result.recalls.length === 0 && (
            <div style={{background:"rgba(34,211,160,0.06)",border:"1px solid rgba(34,211,160,0.2)",borderRadius:12,padding:"16px 18px",fontSize:13,color:"#52525b",marginBottom:12}}>
              ✅ No open NHTSA recalls found for this vehicle. You may still qualify for class action settlements below based on your make and model.
            </div>
          )}

          {result.makeSuits.length > 0 && (
            <>
              <div className="nhtsa-sec-head">All Settlements for {result.vehicle.make}</div>
              <div className="grid" style={{marginBottom:0}}>
                {result.makeSuits.map(s => (
                  <div key={s.id} className="card" style={{cursor:"pointer"}} onClick={()=>onSuitOpen(s)}>
                    <div className="card-cat-tag" style={{background:"linear-gradient(90deg,#dc2626,transparent)"}}/>
                    {s.urgent && <div className="urgent-ribbon">URGENT</div>}
                    <div className="card-head" style={{marginTop:6}}>
                      <div className="card-icon">{s.icon}</div>
                      <div className="cat-badge" style={{color:"#dc2626",borderColor:"#dc262644",background:"#dc262612"}}>Auto</div>
                    </div>
                    <div className="card-co">{s.company}</div>
                    <div className="card-title">{s.desc.split(".")[0]}.</div>
                    <div className="card-desc">{s.desc}</div>
                    <div className="card-ft">
                      <div><div className="payout-l">Up to</div><div className="payout-v">{s.ps}</div></div>
                      <div className="dl">Deadline<span style={{color:s.urgent?"#f59e0b":"#52525b"}}>{s.deadline}</span></div>
                    </div>
                    <div className="card-btns"><button className="cbtn">Check Eligibility →</button></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SAVED PAGE ───────────────────────────────────────────────────────────────
function SavedPage({ saved, onUnsave, onBrowse, onOpen }) {
  const list = ALL_SUITS.filter(s => saved.includes(s.id));
  const total = list.reduce((a, s) => a + s.payout, 0);
  const [copied, setCopied] = useState(false);
  return (
    <div className="saved-page">
      <div className="sp-title">My Saved Cases</div>
      <div className="sp-sub">Track your potential claims and connect with attorneys.</div>
      {list.length > 0 ? (
        <>
          <div className="pot-bar">
            <div>
              <div style={{fontSize:11,color:"#52525b",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Your Total Potential Value</div>
              <div className="pot-val">${total.toLocaleString()}</div>
              <div style={{fontSize:13,color:"#52525b",marginTop:5}}>{list.length} case{list.length!==1?"s":""} saved</div>
            </div>
            <button className="pot-share" onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);}}>
              {copied?"✓ Copied!":"📤 Share Your Number"}
            </button>
          </div>
          <div className="grid">
            {list.map(s=><SuitCard key={s.id} s={s} saved={true} hl={false} onSave={onUnsave} onOpen={onOpen}/>)}
          </div>
        </>
      ) : (
        <div className="empty">
          <div className="empty-icon">📂</div>
          <div className="empty-title">No saved cases yet</div>
          <div className="empty-sub">Browse open settlements and save the ones you may qualify for.</div>
          <button className="btn-p" onClick={onBrowse}>Browse All Cases →</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [hl, setHl] = useState([]);
  const [saved, setSaved] = useState([]);
  const [active, setActive] = useState(null);
  const [notif, setNotif] = useState(true);

  const toggleSave = id => setSaved(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filtered = ALL_SUITS.filter(s => {
    const mc = activeCat === "all" || s.cat === activeCat;
    const q = search.toLowerCase();
    const ms = !q || s.company.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
    return mc && ms;
  });

  const totalSaved = ALL_SUITS.filter(s => saved.includes(s.id)).reduce((a, s) => a + s.payout, 0);
  const countByCat = id => id === "all" ? ALL_SUITS.length : ALL_SUITS.filter(s => s.cat === id).length;
  const urgentCount = ALL_SUITS.filter(s => s.urgent).length;

  return (
    <div className="app">
      <style>{CSS}</style>

      {notif && (
        <div className="notif">
          <div className="notif-dot"/>
          <div className="notif-text">
            <strong>⏰ {urgentCount} urgent deadlines</strong> — TikTok (Jul 30), Facebook (Aug 1), Honda Oil (Aug 30), 3M Earplugs, NAR Realtor, Ford Transmission (Dec 31). <span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>setTab("home")}>Check eligibility →</span>
          </div>
          <button className="notif-x" onClick={()=>setNotif(false)}>✕</button>
        </div>
      )}

      <nav className="nav">
        <div className="nav-logo" onClick={()=>setTab("home")}>
          <div className="nav-logo-icon">⚖️</div>
          <div className="nav-logo-name">ClaimCheck</div>
        </div>
        <div className="nav-center">
          {[["home","Browse",null],["saved","Saved",saved.length||null],["profile","Profile",null]].map(([id,lbl,badge])=>(
            <button key={id} className={"ntab"+(tab===id?" on":"")} onClick={()=>setTab(id)}>
              {lbl}{badge?<span className={"nbadge"+(id==="saved"?" g":"")}>{badge}</span>:null}
            </button>
          ))}
        </div>
        <div className="nav-right">
          {totalSaved>0 && <div className="pot-pill" onClick={()=>setTab("saved")}>💰 ${totalSaved.toLocaleString()} potential</div>}
          <button className="nav-btn" onClick={()=>setTab("saved")}>My Cases {saved.length>0?"("+saved.length+")":""}</button>
        </div>
      </nav>

      {tab === "home" && (
        <>
          <div className="hero">
            <div className="hero-tag"><div className="hero-dot"/>Free · Tech · Auto · Food · Pharma · Housing</div>
            <h1 className="hero-h1">Are you owed<br/><em>money?</em></h1>
            <p className="hero-sub">From data breaches to defective cars, contaminated food to predatory loans — corporations owe billions every year. Find every dollar across 5 categories in one place.</p>

            {/* Category switcher */}
            <div className="cat-switcher">
              {CATEGORIES.map(cat => (
                <button key={cat.id} className={"cat-btn"+(activeCat===cat.id?" on":"")} onClick={()=>setActiveCat(cat.id)} style={activeCat===cat.id?{borderColor:cat.color+"55",background:cat.color+"10"}:{}}>
                  <span className="cat-icon">{cat.icon}</span>
                  <div style={{textAlign:"left"}}>
                    <div className="cat-label">{cat.label}</div>
                    <div style={{fontSize:10,color:activeCat===cat.id?cat.color:"#3f3f46",marginTop:1}}>
                      {cat.id==="all" ? ALL_SUITS.length+" cases" : countByCat(cat.id)+" cases"}
                    </div>
                  </div>
                  {activeCat===cat.id && (
                    <span className="cat-count" style={{background:cat.color+"20",color:cat.color,border:"1px solid "+cat.color+"44"}}>
                      {countByCat(cat.id)}
                    </span>
                  )}
                </button>
              ))}
              {/* All categories are now live */}
            </div>

            <AIBox onMatch={ids=>{setHl(ids);setTimeout(()=>document.getElementById("browse-grid")?.scrollIntoView({behavior:"smooth"}),300);}}/>
          </div>

          <div className="stats">
            {[
              {n:ALL_SUITS.length, l:"Open Settlements", c:"#f97316"},
              {n:"5", l:"Verticals Live", c:"#6366f1"},
              {n:"$250K+", l:"Max Per Person", c:"#22d3a0"},
              {n:"Free", l:"Always Free to Check", c:"#e8e4dc"},
            ].map((s,i)=>(
              <div key={i} className="stat">
                <div className="stat-n" style={{color:s.c}}>{s.n}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Auto VIN scanner — only show when auto or all is selected */}
          {(activeCat === "auto" || activeCat === "all") && (
            <VINScanner onSuitOpen={setActive}/>
          )}

          {/* Browse grid */}
          <div className="browse">
            <div className="sec-head" id="browse-grid">
              <div className="sec-title">
                {activeCat === "all" ? "All Open Cases" : CATEGORIES.find(c=>c.id===activeCat)?.label + " Cases"}
              </div>
              <div style={{fontSize:13,color:"#52525b"}}>{filtered.length} showing</div>
            </div>
            <div className="filter-row">
              {CATEGORIES.filter(c=>c.id!=="all").map(c=>(
                <button key={c.id} className={"fpill"+(activeCat===c.id?" on":"")} onClick={()=>setActiveCat(c.id)} style={activeCat===c.id?{background:c.color+"12",borderColor:c.color+"44",color:c.color}:{}}>
                  {c.icon} {c.label}
                </button>
              ))}
              <button className={"fpill"+(activeCat==="all"?" on":"")} onClick={()=>setActiveCat("all")}>All ({ALL_SUITS.length})</button>
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-in" placeholder="Search company, issue, or keyword..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="grid">
              {filtered.map(s=><SuitCard key={s.id} s={s} saved={saved.includes(s.id)} hl={hl.includes(s.id)} onSave={toggleSave} onOpen={setActive}/>)}
            </div>
            {filtered.length===0 && (
              <div style={{textAlign:"center",padding:"52px 0",color:"#3f3f46"}}>
                <div style={{fontSize:40,marginBottom:10}}>🔎</div>
                <div style={{fontSize:16,fontWeight:700}}>No matching cases</div>
              </div>
            )}
          </div>

          <div className="disc">
            ClaimCheck is not a law firm and does not provide legal advice. Eligibility estimates only.<br/>
            Auto recall data sourced live from the NHTSA federal database (nhtsa.gov). Settlement matching is approximate.
          </div>
        </>
      )}

      {tab === "saved" && <SavedPage saved={saved} onUnsave={toggleSave} onBrowse={()=>setTab("home")} onOpen={setActive}/>}

      {tab === "profile" && (
        <div style={{maxWidth:680,margin:"0 auto",padding:"48px 24px 80px"}}>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:8}}>My Profile</div>
          <div style={{fontSize:15,color:"#71717a",marginBottom:36,lineHeight:1.6}}>Save your info once. We'll auto-match you against every new settlement across all categories.</div>
          {[["Full Name","Jane Smith"],["Email","jane@example.com"],["State",""],["ZIP Code","10001"],["Devices Owned","iPhone, MacBook, Android..."],["Services Used","Facebook, Google, TikTok, Amazon..."],["Phone Carriers","T-Mobile, Verizon, AT&T..."],["Vehicles Owned","2018 Honda CR-V, 2015 VW Jetta TDI..."]].map(([l,p])=>(
            <div key={l} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#52525b",marginBottom:5}}>{l}</div>
              {l==="State" ? (
                <select style={{width:"100%",background:"#0d0d16",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#e8e4dc",fontFamily:"inherit",fontSize:14,padding:"11px 13px",outline:"none"}}>
                  <option value="">Select state...</option>
                  {["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"].map(s=><option key={s}>{s}</option>)}
                </select>
              ) : (
                <input placeholder={p} style={{width:"100%",background:"#0d0d16",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#e8e4dc",fontFamily:"inherit",fontSize:14,padding:"11px 13px",outline:"none"}}/>
              )}
            </div>
          ))}
          <button style={{background:"linear-gradient(135deg,#f97316,#ef4444)",color:"#fff",border:"none",borderRadius:11,padding:"13px 26px",fontFamily:"inherit",fontSize:15,fontWeight:800,cursor:"pointer",marginTop:8}}>
            Save Profile
          </button>
        </div>
      )}

      {active && <SuitModal s={active} onClose={()=>setActive(null)} saved={saved.includes(active.id)} onSave={toggleSave}/>}
    </div>
  );
}
