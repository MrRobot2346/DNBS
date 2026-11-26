# Department Notice Board System — Frontend Prototype

A polished, interactive frontend prototype of a College Department Notice Board System.

Built specifically for **student project team demonstrations**, this prototype helps teammates and project reviewers understand:
- What **Students** will see.
- What **Administrators** will see.
- How administrators create and manage notices via the **Universal Notice Form**.
- How notices appear on the student side.
- How **Event Dates** and **Deadlines** work.
- How **Image and Video selection** works before actual server uploads exist.
- How the Administrator and Student interfaces connect through shared state.

> **Demonstration Prototype Notice:**  
> This prototype is purely frontend-only. All data modifications exist in local browser memory (`localStorage` / in-memory state). No real database, Flask server, or remote uploads are implemented in this phase.

---

## 🚀 Quick Start / How to Run

Because this prototype is built with standard modern HTML5, CSS3, and JavaScript with zero external build dependencies:

### Option 1: Direct Browser Launch
Simply double-click [`index.html`](file:///C:/Users/DELL/.gemini/antigravity/scratch/department-notice-board/index.html) to open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Option 2: Local Python Server (Recommended)
Open a terminal in this project directory and run:

```bash
# Navigate to the project directory
cd C:\Users\DELL\.gemini\antigravity\scratch\department-notice-board

# Start Python's built-in HTTP server
python -m http.server 8000
```

Then visit: [`http://localhost:8000`](http://localhost:8000)

---

## 📋 Features Checklist & Specification Alignment

| Feature | Prototype Implementation |
| :--- | :--- |
| **Two Entry Points** | Welcome Modal + Sticky Top Switcher (**Student View** vs **Administrator View**). |
| **Admin Login** | Simulated login with fields, sample credentials, and a **"⚡ One-Click Demo Login"** button. |
| **5 Exact Categories** | 1. Examinations, 2. Academic, 3. Placements and Careers, 4. Events and Activities, 5. General Announcements. |
| **Notice Cards** | **Cards with Banner** (~70% height) and **Compact Cards without Banner** (title-focused, no empty voids). Responsive (3 desktop, 2 tablet, 1 mobile). |
| **Category Pages** | Category title, academic intro description, notice cards, search field, return-to-home button, and an **`+ Add Notice`** button visible only in Admin mode. |
| **Detail Page** | Full notice text, clean date badges (event start/end, deadline), and media gallery (banner image first without duplication, additional images, and native HTML5 video player). |
| **Admin Dashboard** | **Card 1: Notice Management** (full CRUD table) & **Card 2: Database Viewer** (read-only SQLite simulation). |
| **Universal Notice Form** | One single reusable modal for all categories. Fixed category when opened from a category page. Date logic validation, clear buttons, real file pickers, and sticky bottom action buttons. |
| **File Picker Demo** | Real `<input type="file">` picking, client-side object URL previews (`URL.createObjectURL`), limits enforced (5MB banner, 5MB images up to 5, 50MB videos up to 3). |
| **Deadline-Based Sorting** | 1. Upcoming deadlines (closest first), 2. No deadlines (newest published first), 3. Passed deadlines (newest published first). |
| **Search** | Case-insensitive search on title and description across home and category pages with instant reactive updates. |
| **Demo Database Viewer** | Read-only tabular view of the planned SQLite table schema (`id`, `title`, `category`, `event_start_date`, `deadline`, etc.) with a **"Refresh Table"** button and last-refreshed timestamp. |
| **Reset Demo Data** | One-click **"↺ Reset Demo Data"** button with confirmation to restore pristine sample notices at any time. |

---

## 🎓 Step-by-Step Demonstration Script for Teammates

Follow this sequence during your project team presentation:

1. **Role Selection & Student Homepage:**
   - Launch the app. In the welcome dialog, choose **"Student View"**.
   - Show teammates the clean academic portal header, monogram, and the 5 category cards in exact sequence.
   - Point out the difference between cards with banner graphics and cards without banners (compact styling).
   - Test the live search bar (e.g. type `"Google"` or `"Exam"`).

2. **Demonstrate Deadline-Based Sorting:**
   - Point out how the notice with the nearest upcoming deadline (2 days away) appears at the top.
   - Point out the supplementary exam notice with a passed deadline appearing at the bottom.

3. **Demonstrate Notice Details & Media:**
   - Click on the **"HackVertex 2026"** notice card.
   - Show how the banner is rendered as the first image in the media gallery.
   - Show the native browser video player previewing the teaser video.

4. **Demonstrate the Admin–Student Connection (The Key Demo):**
   - Click **"Admin Sign In"** or toggle to **"Administrator View"** in the top prototype switcher bar.
   - Click **"⚡ One-Click Demo Login"** to enter the **Administrator Dashboard**.
   - Navigate to the **"Placements and Careers"** category.
   - Notice the prominent **`+ Add Notice`** button now visible in the header.
   - Click **`+ Add Notice`** to open the **Universal Notice Form**.
   - Create a new notice:
     - Title: `Amazon AWS Cloud Internships 2027`
     - Description: `Registrations open for junior CSE students with minimum 8.0 CGPA.`
     - Deadline: Select a date 3 days from today.
     - Choose a banner image from your device.
   - Click **"Publish Notice"**.
   - Switch back to **"Student View"** using the top switcher.
   - Open **"Placements and Careers"**: the newly created notice appears instantly!

5. **Demonstrate the Demo Database Viewer:**
   - Switch back to **Administrator View** → open **"Card 2: Database Viewer"**.
   - Show teammates the tabular schema corresponding to the future SQLite relational database table.
   - Click **"🔄 Refresh Table"** to show updated row records and timestamps.

6. **Reset State:**
   - Click **"↺ Reset Demo Data"** to restore initial mock data.

---

## 🏗️ Architecture Roadmap: From Frontend Demo to Python Flask

```
Demonstration Phase (Current):
┌─────────────────────────┐         ┌────────────────────────────┐         ┌───────────────────────┐
│   Administrator View    │  <--->  │   Shared Frontend State    │  <--->  │  Student Public View  │
│ (Form, Manage, Previews)│         │ (NoticeStore in JS/Storage)│         │ (Cards, Sort, Search) │
└─────────────────────────┘         └────────────────────────────┘         └───────────────────────┘

Production Phase (Next Python Step):
┌─────────────────────────┐         ┌────────────────────────────┐         ┌───────────────────────┐
│   Administrator View    │         │       Flask Backend        │         │  Student Public View  │
│ (Web client / Mobile)   │         │ (Python 3.12 / REST API)   │         │ (Web client / Mobile) │
└───────────┬─────────────┘         └──────────────┬─────────────┘         └───────────▲───────────┘
            │ POST /api/notices                    │                                   │ GET /api/notices
            │ (Multipart form data)                │                                   │
            ▼                                      ▼                                   │
┌─────────────────────────┐         ┌────────────────────────────┐                     │
│ Server-side Validation  │ ──────> │       SQLite Database      │ ────────────────────┘
│  & File Upload to Disk  │         │ (notices.db via SQLAlchemy)│
└─────────────────────────┘         └────────────────────────────┘
```

When building the Python backend:
1. `app.py` in Flask will implement routes:
   - `GET /api/notices` (returns filtered, deadline-sorted JSON)
   - `GET /api/notices/<id>` (returns full notice record)
   - `POST /api/notices` (multipart/form-data with `werkzeug.utils.secure_filename`)
   - `PUT /api/notices/<id>` (updates existing record)
   - `DELETE /api/notices/<id>` (deletes notice and associated files)
2. SQLite table `notices` will store columns matching our **Demo Database Viewer**.
3. Media files will be stored in `uploads/` on the server filesystem.

---

## 📁 File Structure

```
department-notice-board/
├── index.html     # Semantic single-page application structure & accessible modals
├── styles.css     # Clean academic CSS design system, responsive grids, transitions
├── data.js        # Initial sample notices & crisp SVG vector graphics
├── app.js         # Reactive NoticeStore, router, form validation, deadline sorting
└── README.md      # Project documentation, teammate guide, and Flask roadmap
```
