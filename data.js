// data.js - Initial Sample Data for Department Notice Board System Demo
// All images are rendered as self-contained crisp vector SVGs so the prototype works 100% offline without broken links.

// Helper to create clean academic SVG banners as Data URLs
function createSvgBanner(title, subtitle, categoryColor, iconType) {
  const icons = {
    exam: `<rect x="35" y="25" width="50" height="70" rx="6" fill="none" stroke="#ffffff" stroke-width="4"/><line x1="45" y1="45" x2="75" y2="45" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="45" y1="60" x2="75" y2="60" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="45" y1="75" x2="65" y2="75" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`,
    academic: `<polygon points="60,25 10,50 60,75 110,50" fill="#ffffff" opacity="0.95"/><path d="M30,60 L30,85 Q60,105 90,85 L90,60" fill="none" stroke="#ffffff" stroke-width="4"/><path d="M100,55 L100,90" stroke="#f6ad55" stroke-width="3" stroke-linecap="round"/>`,
    placement: `<rect x="25" y="38" width="70" height="52" rx="6" fill="none" stroke="#ffffff" stroke-width="4"/><path d="M42,38 L42,26 Q42,22 46,22 L74,22 Q78,22 78,26 L78,38" fill="none" stroke="#ffffff" stroke-width="4"/><line x1="25" y1="60" x2="95" y2="60" stroke="#ffffff" stroke-width="3" stroke-dasharray="4,4"/>`,
    event: `<rect x="20" y="30" width="80" height="65" rx="6" fill="none" stroke="#ffffff" stroke-width="4"/><line x1="20" y1="48" x2="100" y2="48" stroke="#ffffff" stroke-width="4"/><line x1="38" y1="20" x2="38" y2="34" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><line x1="82" y1="20" x2="82" y2="34" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><circle cx="45" cy="65" r="5" fill="#f6ad55"/><circle cx="65" cy="65" r="5" fill="#ffffff"/><circle cx="85" cy="65" r="5" fill="#ffffff"/>`,
    announcement: `<path d="M25,50 L55,30 L55,80 Z" fill="#ffffff"/><rect x="55" y="42" width="28" height="26" fill="#ffffff"/><path d="M40,75 L48,95 L60,95 L52,75 Z" fill="#ffffff"/><path d="M85,42 Q98,55 85,68" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${categoryColor[0]}" />
        <stop offset="100%" stop-color="${categoryColor[1]}" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.08" />
      </pattern>
    </defs>
    <rect width="800" height="420" fill="url(#grad)" />
    <rect width="800" height="420" fill="url(#grid)" />
    <circle cx="700" cy="80" r="160" fill="#ffffff" fill-opacity="0.05" />
    <circle cx="100" cy="360" r="120" fill="#ffffff" fill-opacity="0.04" />
    <g transform="translate(60, 40) scale(1.1)">
      ${icons[iconType] || icons.announcement}
    </g>
    <text x="60" y="270" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" letter-spacing="-0.5">${title}</text>
    <text x="60" y="320" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400">${subtitle}</text>
    <rect x="60" y="355" width="130" height="28" rx="14" fill="#ffffff" fill-opacity="0.2" />
    <text x="125" y="374" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="1">OFFICIAL NOTICE</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Additional sample gallery images
function createGallerySvg(label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="${color}" />
    <rect x="20" y="20" width="560" height="360" rx="8" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="6,6"/>
    <circle cx="300" cy="180" r="45" fill="#ffffff" fill-opacity="0.15" />
    <path d="M280,180 L295,195 L325,165" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
    <text x="300" y="260" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="600">${label}</text>
    <text x="300" y="295" text-anchor="middle" fill="#ffffff" fill-opacity="0.75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14">Department Archive Document</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Calculate realistic dates relative to current date
const now = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

// Initial Pristine Demo Notices
const INITIAL_NOTICES = [
  {
    id: "NOTC-2026-001",
    title: "Mid-Term Examination Schedule & Room Allocations - Autumn 2026",
    category: "Examinations",
    description: "The Departmental Examination Committee has released the comprehensive schedule and seating matrix for the upcoming Mid-Term Examinations. Students are advised to verify their designated roll numbers and examination halls at least 24 hours prior to their first scheduled paper. Any clashes or requests for examination review must be submitted through the Department Grievance Portal before the stipulated deadline. Strictly no electronic gadgets other than approved scientific calculators will be permitted in the examination halls.",
    eventStartDate: addDays(4),
    eventEndDate: addDays(9),
    deadline: addDays(2), // UPCOMING DEADLINE (Closest: 2 days)
    bannerImage: createSvgBanner("Mid-Term Examinations", "Seating Matrix & Clash Form Available", ["#1e3a8a", "#1d4ed8"], "exam"),
    images: [
      { name: "Exam_Hall_Blueprint.svg", url: createGallerySvg("Seating Blueprint Hall A-C", "#1e3a8a") },
      { name: "Approved_Calculator_List.svg", url: createGallerySvg("Approved Calculators Guide", "#2563eb") }
    ],
    videos: [],
    publishedAt: "2026-10-18T09:30:00.000Z"
  },
  {
    id: "NOTC-2026-002",
    title: "Google Campus Recruitment Drive - Software Engineer & SWE Intern",
    category: "Placements and Careers",
    description: "Google University Relations has announced campus recruitment eligibility criteria and registration deadlines for 2027 and 2028 graduating batches. Eligible branches: CSE, IT, AI-ML, and ECE with a minimum CGPA of 7.5 and no active backlogs. Round 1 will consist of an online technical assessment testing algorithms, data structures, and CS fundamentals. Registered candidates must complete their resume uploads and link their GitHub/portfolio profiles before the portal closes.",
    eventStartDate: addDays(12),
    eventEndDate: addDays(14),
    deadline: addDays(5), // UPCOMING DEADLINE (5 days)
    bannerImage: createSvgBanner("Google Campus Drive", "Software Engineering Full-time & Internships", ["#047857", "#059669"], "placement"),
    images: [
      { name: "Job_Description_SWE_2026.svg", url: createGallerySvg("Google Job Description & Tracks", "#065f46") }
    ],
    videos: [],
    publishedAt: "2026-10-19T14:15:00.000Z"
  },
  {
    id: "NOTC-2026-003",
    title: "Annual Tech Symposium 'HackVertex 2026' - 36-Hour Hackathon",
    category: "Events and Activities",
    description: "The Department Student Technical Council proudly invites entries for HackVertex 2026, our flagship 36-hour continuous build hackathon. Themes include Edge AI, Autonomous Systems, Web3 Scalability, and Smart Health Technologies. Mentors from premier industry partners will be on campus to guide teams through prototyping and deployment. Cash prizes worth $5,000, cloud credits, and direct interview fast-tracks will be awarded to top podium finishes.",
    eventStartDate: addDays(7),
    eventEndDate: addDays(9),
    deadline: addDays(4), // UPCOMING DEADLINE (4 days)
    bannerImage: createSvgBanner("HackVertex 2026", "36-Hour National Inter-College Hackathon", ["#7c2d12", "#c2410c"], "event"),
    images: [
      { name: "HackVertex_Rulebook.svg", url: createGallerySvg("Hackathon Tracks & Evaluation Rubric", "#9a3412") },
      { name: "Sponsors_Cloud_Access.svg", url: createGallerySvg("Cloud Credit Redemptions", "#c2410c") }
    ],
    videos: [
      {
        name: "HackVertex_Teaser_Promo.mp4",
        // Valid local base64 lightweight sample video or browser sample to demonstrate native video controls
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      }
    ],
    publishedAt: "2026-10-20T11:00:00.000Z"
  },
  {
    id: "NOTC-2026-004",
    title: "Curriculum Revision & Departmental Elective Selection Guidelines",
    category: "Academic",
    description: "The Academic Affairs Council has released the revised syllabus structure and list of departmental electives for the forthcoming semester. New advanced electives include Cloud Native Architectures, Deep Reinforcement Learning, and Quantum Computing Fundamentals. Students are required to consult their faculty mentors prior to submitting preference forms on the student portal. Syllabi booklets are available for review.",
    eventStartDate: null,
    eventEndDate: null,
    deadline: null, // NO DEADLINE - Academic Announcement
    bannerImage: createSvgBanner("Elective Course Selection", "Updated Syllabus Structure & Course Outlines", ["#4338ca", "#6366f1"], "academic"),
    images: [],
    videos: [],
    publishedAt: "2026-10-21T08:00:00.000Z"
  },
  {
    id: "NOTC-2026-005",
    title: "Distinguished Guest Lecture on Generative AI System Design",
    category: "Events and Activities",
    description: "We are pleased to host Dr. A. V. Ramanathan, Principal Research Scientist at DeepScale Labs, for an exclusive technical colloquium on 'Scalable Inference Pipelines for Multi-Modal Foundation Models'. The lecture will be held in the Department Auditorium and is mandatory for all final-year undergraduate and graduate research scholars.",
    eventStartDate: addDays(11),
    eventEndDate: addDays(11), // Single-day event
    deadline: null, // NO DEADLINE
    bannerImage: null, // COMPACT CARD WITH NO BANNER (Tests non-banner card styling)
    images: [],
    videos: [],
    publishedAt: "2026-10-20T16:45:00.000Z"
  },
  {
    id: "NOTC-2026-006",
    title: "Campus Wi-Fi Maintenance & Department Server Rack Migration",
    category: "General Announcements",
    description: "Please be informed that departmental network switches and compute servers in Block-C will undergo scheduled infrastructure upgrades this weekend between 22:00 Saturday and 06:00 Sunday. Access to the local GPU cluster and internal intranet repositories will experience intermittent downtime during this window. External internet access via wired lab connections will remain operational.",
    eventStartDate: null,
    eventEndDate: null,
    deadline: null, // NO DEADLINE, NO MEDIA
    bannerImage: null, // NO BANNER (Compact card)
    images: [],
    videos: [],
    publishedAt: "2026-10-21T18:20:00.000Z"
  },
  {
    id: "NOTC-2026-007",
    title: "Supplementary Examination Fee Submission & Hall Ticket Collection",
    category: "Examinations",
    description: "Notice regarding the clearance of supplementary examination backlog papers for even-semester modules. The designated window for payment processing and verification at the department finance counter has now officially closed. Students who submitted fees before the deadline can collect printed hall tickets from Room 204.",
    eventStartDate: addDays(-10),
    eventEndDate: addDays(-5),
    deadline: addDays(-3), // PASSED DEADLINE (3 days ago - tests passed deadline sorting)
    bannerImage: null,
    images: [],
    videos: [],
    publishedAt: "2026-10-10T10:00:00.000Z"
  },
  {
    id: "NOTC-2026-008",
    title: "Undergraduate Research Fellowship Applications (Winter Cohort)",
    category: "Academic",
    description: "The Department Research Council announces fellowship grants of $1,200 per student for winter research internships under faculty supervision. Selected scholars will work on funded projects in Distributed Systems, Computer Vision, and Edge Robotics. Proposals must include a 2-page abstract and recommendation letter from a sponsoring faculty member.",
    eventStartDate: addDays(15),
    eventEndDate: addDays(45),
    deadline: addDays(8), // UPCOMING DEADLINE (8 days)
    bannerImage: createSvgBanner("UG Research Fellowships", "Faculty Mentored Winter Internship Grants", ["#0e7490", "#06b6d4"], "academic"),
    images: [
      { name: "Proposal_Template.svg", url: createGallerySvg("Research Proposal Format Guidelines", "#0891b2") }
    ],
    videos: [],
    publishedAt: "2026-10-17T12:00:00.000Z"
  }
];

// The 5 Exact Categories in Exact Order
const CATEGORIES = [
  {
    id: "examinations",
    name: "Examinations",
    icon: "exam",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    accentColor: "#1d4ed8",
    description: "Official notifications regarding semester exams, practical schedules, seating charts, revaluation, and backlog verifications."
  },
  {
    id: "academic",
    name: "Academic",
    icon: "academic",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    accentColor: "#4f46e5",
    description: "Curriculum updates, elective course allocations, syllabus documents, academic calendars, and faculty research fellowships."
  },
  {
    id: "placements-and-careers",
    name: "Placements and Careers",
    icon: "placement",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    accentColor: "#059669",
    description: "Campus drive notifications, company eligibility criteria, internship openings, skill-building workshops, and career advice."
  },
  {
    id: "events-and-activities",
    name: "Events and Activities",
    icon: "event",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    accentColor: "#d97706",
    description: "Technical symposiums, hackathons, departmental guest lectures, student club initiatives, and extracurricular competitions."
  },
  {
    id: "general-announcements",
    name: "General Announcements",
    icon: "announcement",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    accentColor: "#475569",
    description: "Department infrastructure updates, lab equipment protocols, holiday schedules, administrative memos, and student support advisories."
  }
];
