// app.js - Department Notice Board System Demo
// Single-source-of-truth state, router, and UI controller

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. STATE STORE (NoticeStore)
  // Shared frontend demo state used by both Student & Admin views
  // -------------------------------------------------------------
  const STORAGE_KEY = 'dept_notice_board_demo_v2';

  const NoticeStore = {
    notices: [],

    init() {
      // Clear legacy cache if present
      localStorage.removeItem('dept_notice_board_demo_v1');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.notices = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse stored demo notices, resetting to initial.", e);
          this.notices = JSON.parse(JSON.stringify(INITIAL_NOTICES));
        }
      } else {
        this.notices = JSON.parse(JSON.stringify(INITIAL_NOTICES));
      }

      // Ensure any legacy cached data URIs have correct MIME charset
      this.notices.forEach(n => {
        if (n.bannerImage && n.bannerImage.includes(';utf8,')) {
          n.bannerImage = n.bannerImage.replace(';utf8,', ';charset=utf-8,');
        }
        if (n.images) {
          n.images.forEach(img => {
            if (img.url && img.url.includes(';utf8,')) {
              img.url = img.url.replace(';utf8,', ';charset=utf-8,');
            }
          });
        }
      });
      this.save();
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notices));
      } catch (e) {
        console.warn("Storage quota exceeded for demo state; keeping in-memory only.");
      }
    },

    resetToDefaults() {
      this.notices = JSON.parse(JSON.stringify(INITIAL_NOTICES));
      this.save();
    },

    getAll() {
      return [...this.notices];
    },

    getById(id) {
      return this.notices.find(n => n.id === id);
    },

    add(noticeData) {
      const newId = `NOTC-2026-${String(this.notices.length + 1).padStart(3, '0')}`;
      const newNotice = {
        ...noticeData,
        id: newId,
        publishedAt: new Date().toISOString()
      };
      this.notices.unshift(newNotice);
      this.save();
      return newNotice;
    },

    update(id, updatedData) {
      const idx = this.notices.findIndex(n => n.id === id);
      if (idx !== -1) {
        this.notices[idx] = {
          ...this.notices[idx],
          ...updatedData
        };
        this.save();
        return this.notices[idx];
      }
      return null;
    },

    delete(id) {
      const idx = this.notices.findIndex(n => n.id === id);
      if (idx !== -1) {
        const removed = this.notices.splice(idx, 1)[0];
        this.save();
        return removed;
      }
      return null;
    },

    getCategoryCounts() {
      const counts = {};
      CATEGORIES.forEach(c => counts[c.name] = 0);
      this.notices.forEach(n => {
        if (counts[n.category] !== undefined) {
          counts[n.category]++;
        }
      });
      return counts;
    },

    // SPECIFICATION SECTION 14: DEADLINE-BASED SORTING ALGORITHM
    // 1. Upcoming deadlines (deadline >= now), closest deadline first
    // 2. Without deadlines, newest publication timestamp first
    // 3. Passed deadlines (deadline < now), newest publication timestamp first
    // Equal deadlines -> newest publication timestamp first
    getSortedNotices(noticesList = null) {
      const list = noticesList ? [...noticesList] : [...this.notices];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = [];
      const noDeadline = [];
      const passed = [];

      list.forEach(notice => {
        if (!notice.deadline) {
          noDeadline.push(notice);
        } else {
          const dDate = new Date(notice.deadline);
          dDate.setHours(23, 59, 59, 999);
          if (dDate >= today) {
            upcoming.push(notice);
          } else {
            passed.push(notice);
          }
        }
      });

      // 1. Upcoming sorted by closest deadline first (ASC)
      // If equal deadline, newest publishedAt first (DESC)
      upcoming.sort((a, b) => {
        const diff = new Date(a.deadline) - new Date(b.deadline);
        if (diff !== 0) return diff;
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      });

      // 2. No deadline: newest publication timestamp first (DESC)
      noDeadline.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // 3. Passed deadline: newest publication timestamp first (DESC)
      passed.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      return [...upcoming, ...noDeadline, ...passed];
    }
  };

  // -------------------------------------------------------------
  // 2. PROTOTYPE APP CONTROLLER
  // -------------------------------------------------------------
  const App = {
    currentRole: 'student', // 'student' or 'admin'
    isAdminLoggedIn: false,
    currentView: 'home', // 'home', 'category', 'detail', 'admin-login', 'admin-dashboard', 'admin-management', 'admin-db-viewer'
    selectedCategory: null,
    selectedNoticeId: null,
    searchQuery: '',
    dbLastRefreshed: new Date(),

    // Temporary modal state for Add/Edit form
    formState: {
      isEditing: false,
      editId: null,
      targetCategory: null,
      bannerImage: null, // string URL or data URL
      bannerFileName: '',
      images: [], // array of { name, url, fileObj }
      videos: [], // array of { name, url, fileObj }
      isDirty: false
    },

    init() {
      NoticeStore.init();
      this.attachGlobalListeners();
      this.checkFirstVisit();
      this.render();
    },

    checkFirstVisit() {
      const seen = sessionStorage.getItem('dept_notice_role_selected');
      if (!seen) {
        this.openWelcomeModal();
      }
    },

    setRole(role) {
      this.currentRole = role;
      if (role === 'admin' && !this.isAdminLoggedIn) {
        this.currentView = 'admin-login';
      } else if (role === 'admin' && this.isAdminLoggedIn) {
        if (this.currentView === 'home' || this.currentView === 'admin-login') {
          this.currentView = 'admin-dashboard';
        }
      } else if (role === 'student') {
        if (this.currentView.startsWith('admin-')) {
          this.currentView = 'home';
        }
      }
      this.render();
    },

    navigate(view, params = {}) {
      this.currentView = view;
      if (params.category !== undefined) this.selectedCategory = params.category;
      if (params.noticeId !== undefined) this.selectedNoticeId = params.noticeId;
      if (params.searchQuery !== undefined) this.searchQuery = params.searchQuery;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.render();
    },

    showToast(message, type = 'success') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span style="font-size: 1.1rem;">${type === 'success' ? '✓' : 'ℹ'}</span>
        <div>
          <div>${message}</div>
          <div style="font-size:0.7rem; opacity:0.8;">Local frontend demo state</div>
        </div>
      `;
      container.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 20);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // -------------------------------------------------------------
    // RENDER DISPATCHER
    // -------------------------------------------------------------
    render() {
      this.renderPrototypeBar();
      this.renderAdminStrip();
      this.renderHeaderNav();

      const container = document.getElementById('mainContentArea');
      container.innerHTML = '';

      switch (this.currentView) {
        case 'home':
          container.appendChild(this.createHomeView());
          break;
        case 'category':
          container.appendChild(this.createCategoryView());
          break;
        case 'detail':
          container.appendChild(this.createDetailView());
          break;
        case 'admin-login':
          container.appendChild(this.createAdminLoginView());
          break;
        case 'admin-dashboard':
          container.appendChild(this.createAdminDashboardView());
          break;
        case 'admin-management':
          container.appendChild(this.createAdminManagementView());
          break;
        case 'admin-db-viewer':
          container.appendChild(this.createDbViewerView());
          break;
        default:
          container.appendChild(this.createHomeView());
      }
    },

    renderPrototypeBar() {
      const studentPill = document.getElementById('pillStudent');
      const adminPill = document.getElementById('pillAdmin');
      const noticeCountBadge = document.getElementById('demoNoticeCount');

      if (this.currentRole === 'student') {
        studentPill.classList.add('active');
        adminPill.classList.remove('active');
      } else {
        studentPill.classList.remove('active');
        adminPill.classList.add('active');
      }

      if (noticeCountBadge) {
        noticeCountBadge.textContent = `${NoticeStore.notices.length} notices loaded`;
      }
    },

    renderAdminStrip() {
      const strip = document.getElementById('adminStatusStrip');
      if (this.currentRole === 'admin' && this.isAdminLoggedIn) {
        strip.classList.remove('hidden');
      } else {
        strip.classList.add('hidden');
      }
    },

    renderHeaderNav() {
      const navLinksContainer = document.getElementById('navCategoryLinks');
      navLinksContainer.innerHTML = '';

      // Home Link
      const homeLi = document.createElement('li');
      homeLi.innerHTML = `
        <button class="nav-link-btn ${this.currentView === 'home' ? 'active' : ''}" data-nav="home">
          Home
        </button>
      `;
      navLinksContainer.appendChild(homeLi);

      // Category Links
      CATEGORIES.forEach(cat => {
        const li = document.createElement('li');
        const isActive = this.currentView === 'category' && this.selectedCategory === cat.name;
        li.innerHTML = `
          <button class="nav-link-btn ${isActive ? 'active' : ''}" data-cat="${cat.name}">
            ${cat.name}
          </button>
        `;
        navLinksContainer.appendChild(li);
      });

      // Admin quick link in header
      const discreetAdminBtn = document.getElementById('discreetAdminLink');
      if (this.currentRole === 'admin' && this.isAdminLoggedIn) {
        discreetAdminBtn.textContent = 'Admin Dashboard →';
        discreetAdminBtn.onclick = () => this.navigate('admin-dashboard');
      } else {
        discreetAdminBtn.textContent = 'Admin Sign In';
        discreetAdminBtn.onclick = () => this.setRole('admin');
      }
    },

    // -------------------------------------------------------------
    // 3. STUDENT HOMEPAGE VIEW
    // -------------------------------------------------------------
    createHomeView() {
      const fragment = document.createDocumentFragment();

      // Hero Banner with integrated Search
      const hero = document.createElement('div');
      hero.className = 'portal-hero';
      hero.innerHTML = `
        <div class="portal-hero-content">
          <h2>Department Notice Board</h2>
          <p>Official communication portal for computer science students, faculty, and research scholars. Check deadlines, examination matrices, and placement registrations.</p>
          <div class="search-container">
            <input type="text" id="homeSearchInput" class="search-input" 
                   placeholder="Search notices by title, keyword, or description..." 
                   value="${this.searchQuery}">
            ${this.searchQuery ? '<button id="clearSearchBtn" class="clear-search-btn" title="Clear search">×</button>' : ''}
            <button class="search-icon-btn" aria-label="Search">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" stroke-width="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      fragment.appendChild(hero);

      // Section 1: The 5 Categories in Exact Order
      const catCounts = NoticeStore.getCategoryCounts();
      const catSection = document.createElement('section');
      catSection.innerHTML = `
        <div class="section-header">
          <div>
            <h3 class="section-title">Notice Categories</h3>
            <p class="section-subtitle">Select a category to view specialized departmental announcements</p>
          </div>
        </div>
        <div class="category-grid">
          ${CATEGORIES.map(cat => `
            <div class="category-card" data-cat="${cat.name}">
              <div class="category-card-top">
                <div class="category-card-icon" style="background: ${cat.accentColor}18; color: ${cat.accentColor};">
                  ${this.getCategoryIconSvg(cat.icon)}
                </div>
                <span class="category-notice-count">${catCounts[cat.name] || 0} notices</span>
              </div>
              <div>
                <h3>${cat.name}</h3>
                <p>${cat.description}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      fragment.appendChild(catSection);

      // Section 2: Recent Notices (Deadline-Based Sorted)
      let displayNotices = NoticeStore.getSortedNotices();
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        displayNotices = displayNotices.filter(n => 
          n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
        );
      }

      const noticeSection = document.createElement('section');
      noticeSection.innerHTML = `
        <div class="section-header">
          <div>
            <h3 class="section-title">
              ${this.searchQuery ? `Search Results for "${this.searchQuery}" (${displayNotices.length})` : 'Recent & Priority Notices'}
            </h3>
            <p class="section-subtitle">
              ${this.searchQuery 
                ? 'Filtered from shared demo notices' 
                : 'Prioritized by deadline proximity, followed by recent publication'}
            </p>
          </div>
          ${this.currentRole === 'admin' ? `
            <button class="btn btn-primary btn-sm" id="homeAddNewNoticeBtn">
              + Add Notice
            </button>
          ` : ''}
        </div>
      `;

      if (displayNotices.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state-box';
        emptyState.style.cssText = 'background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:48px; text-align:center; margin-bottom:30px;';
        emptyState.innerHTML = `
          <div style="font-size:2.5rem; margin-bottom:12px;">🔍</div>
          <h4 style="font-size:1.15rem; color:#1e293b; margin-bottom:6px;">No notices found</h4>
          <p style="color:#64748b; font-size:0.9rem; margin-bottom:18px;">
            ${this.searchQuery ? `No notices matched your query "${this.searchQuery}". Try different search terms or clear search.` : 'There are currently no notices in the system.'}
          </p>
          ${this.searchQuery ? '<button class="btn btn-secondary btn-sm" id="resetSearchFromEmpty">Reset Search</button>' : ''}
        `;
        noticeSection.appendChild(emptyState);
      } else {
        const grid = document.createElement('div');
        grid.className = 'notices-grid';
        displayNotices.forEach(notice => {
          grid.appendChild(this.createNoticeCardElement(notice));
        });
        noticeSection.appendChild(grid);
      }

      fragment.appendChild(noticeSection);
      return fragment;
    },

    // -------------------------------------------------------------
    // 4. NOTICE CARD ELEMENT GENERATOR
    // Spec Section 6: Cards with banner (~70% banner) vs without banner
    // -------------------------------------------------------------
    createNoticeCardElement(notice) {
      const card = document.createElement('div');
      const hasBanner = Boolean(notice.bannerImage);
      card.className = `notice-card ${hasBanner ? 'has-banner' : 'no-banner'}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Notice: ${notice.title}`);

      // Category metadata
      const catConfig = CATEGORIES.find(c => c.name === notice.category) || CATEGORIES[4];
      const deadlineInfo = this.formatDeadlineBadge(notice.deadline);

      // Additional media indicators (images, video)
      const additionalImgsCount = (notice.images && notice.images.length) || 0;
      const videosCount = (notice.videos && notice.videos.length) || 0;

      let mediaBadgesHtml = '';
      if (additionalImgsCount > 0) {
        mediaBadgesHtml += `<span class="media-indicator-pill">📷 +${additionalImgsCount}</span>`;
      }
      if (videosCount > 0) {
        mediaBadgesHtml += `<span class="media-indicator-pill">🎬 Video</span>`;
      }

      if (hasBanner) {
        card.innerHTML = `
          <div class="card-banner-wrapper">
            <img src="${notice.bannerImage}" alt="${notice.title}" class="card-banner-img" loading="lazy">
          </div>
          <div class="card-content">
            <div class="card-meta-top">
              <span class="category-badge ${catConfig.badgeColor}">${notice.category}</span>
              ${deadlineInfo.html}
            </div>
            <h4 class="card-title">${notice.title}</h4>
            <p class="card-desc-snippet">${notice.description}</p>
            <div class="card-footer">
              <span>Published: ${this.formatPublishDate(notice.publishedAt)}</span>
              <div class="card-media-indicators">
                ${mediaBadgesHtml}
              </div>
            </div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="card-content">
            <div class="card-meta-top">
              <span class="category-badge ${catConfig.badgeColor}">${notice.category}</span>
              ${deadlineInfo.html}
            </div>
            <h4 class="card-title">${notice.title}</h4>
            <p class="card-desc-snippet">${notice.description}</p>
            <div class="card-footer">
              <span>Published: ${this.formatPublishDate(notice.publishedAt)}</span>
              <div class="card-media-indicators">
                ${mediaBadgesHtml}
              </div>
            </div>
          </div>
        `;
      }

      card.onclick = () => this.navigate('detail', { noticeId: notice.id });
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.navigate('detail', { noticeId: notice.id });
        }
      };
      return card;
    },

    // -------------------------------------------------------------
    // 5. CATEGORY PAGE VIEW
    // Spec Section 7: Title, Intro, Category Cards, Search, + Add (Admin only)
    // -------------------------------------------------------------
    createCategoryView() {
      const fragment = document.createDocumentFragment();
      const catConfig = CATEGORIES.find(c => c.name === this.selectedCategory) || CATEGORIES[0];

      // Breadcrumb / Back button
      const backNav = document.createElement('button');
      backNav.className = 'back-link-btn';
      backNav.innerHTML = `← Back to Notice Board Home`;
      backNav.onclick = () => this.navigate('home');
      fragment.appendChild(backNav);

      // Category Header Box
      const headerBox = document.createElement('div');
      headerBox.className = 'category-page-header';
      headerBox.innerHTML = `
        <div class="cat-header-text">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <span class="category-badge ${catConfig.badgeColor}" style="font-size:0.85rem;">Department Category</span>
          </div>
          <h2>${catConfig.name}</h2>
          <p>${catConfig.description}</p>
        </div>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          ${this.currentRole === 'admin' ? `
            <button class="btn btn-primary" id="catAddNewNoticeBtn">
              + Add Notice in ${catConfig.name}
            </button>
          ` : ''}
        </div>
      `;
      fragment.appendChild(headerBox);

      // Category Scoped Search & Filter Toolbar
      let categoryNotices = NoticeStore.getSortedNotices().filter(n => n.category === catConfig.name);
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        categoryNotices = categoryNotices.filter(n => 
          n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
        );
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'management-toolbar';
      toolbar.innerHTML = `
        <div class="search-container" style="max-width:400px;">
          <input type="text" id="categorySearchInput" class="search-input" 
                 placeholder="Search within ${catConfig.name}..." 
                 value="${this.searchQuery}">
          ${this.searchQuery ? '<button id="clearCatSearchBtn" class="clear-search-btn" title="Clear">×</button>' : ''}
          <button class="search-icon-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke-width="2"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div style="font-size:0.86rem; color:#64748b; font-weight:500;">
          Showing ${categoryNotices.length} notice${categoryNotices.length === 1 ? '' : 's'}
        </div>
      `;
      fragment.appendChild(toolbar);

      // Notice Cards Grid
      if (categoryNotices.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = 'background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:48px; text-align:center; margin-bottom:30px;';
        emptyState.innerHTML = `
          <div style="font-size:2.5rem; margin-bottom:12px;">📂</div>
          <h4 style="font-size:1.15rem; color:#1e293b; margin-bottom:6px;">No notices in this category</h4>
          <p style="color:#64748b; font-size:0.9rem; margin-bottom:18px;">
            ${this.searchQuery ? `No notices matched "${this.searchQuery}".` : 'There are currently no published notices under ' + catConfig.name + '.'}
          </p>
          ${this.currentRole === 'admin' ? `
            <button class="btn btn-primary btn-sm" id="catEmptyAddBtn">+ Create First Notice</button>
          ` : ''}
        `;
        fragment.appendChild(emptyState);
      } else {
        const grid = document.createElement('div');
        grid.className = 'notices-grid';
        categoryNotices.forEach(notice => {
          grid.appendChild(this.createNoticeCardElement(notice));
        });
        fragment.appendChild(grid);
      }

      return fragment;
    },

    // -------------------------------------------------------------
    // 6. NOTICE DETAIL PAGE VIEW
    // Spec Section 8: Dates, Gallery (Banner first without duplication), Videos
    // -------------------------------------------------------------
    createDetailView() {
      const fragment = document.createDocumentFragment();
      const notice = NoticeStore.getById(this.selectedNoticeId);

      if (!notice) {
        const notFound = document.createElement('div');
        notFound.innerHTML = `
          <div style="text-align:center; padding:60px 20px;">
            <h3>Notice Not Found</h3>
            <p style="color:#64748b; margin:10px 0 20px;">The requested notice could not be found in the demo state.</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Back to Home</button>
          </div>
        `;
        return notFound;
      }

      // Back navigation
      const backNav = document.createElement('button');
      backNav.className = 'back-link-btn';
      backNav.innerHTML = `← Back to ${notice.category}`;
      backNav.onclick = () => this.navigate('category', { category: notice.category });
      fragment.appendChild(backNav);

      const catConfig = CATEGORIES.find(c => c.name === notice.category) || CATEGORIES[0];
      const deadlineInfo = this.formatDeadlineBadge(notice.deadline);

      // Check dates availability: Do not display empty date labels
      const hasDates = notice.eventStartDate || notice.eventEndDate || notice.deadline;

      const container = document.createElement('div');
      container.className = 'notice-detail-container';

      // Header block
      let datesHtml = '';
      if (hasDates) {
        datesHtml = `
          <div class="dates-banner-box">
            ${notice.eventStartDate ? `
              <div class="date-stat-item">
                <span class="date-stat-label">Event Begins</span>
                <span class="date-stat-val">${this.formatFullDate(notice.eventStartDate)}</span>
              </div>
            ` : ''}
            ${notice.eventEndDate ? `
              <div class="date-stat-item">
                <span class="date-stat-label">Event Ends</span>
                <span class="date-stat-val">${this.formatFullDate(notice.eventEndDate)}</span>
              </div>
            ` : ''}
            ${notice.deadline ? `
              <div class="date-stat-item">
                <span class="date-stat-label">Submission Deadline</span>
                <span class="date-stat-val" style="color:#b91c1c;">${this.formatFullDate(notice.deadline)}</span>
              </div>
            ` : ''}
          </div>
        `;
      }

      container.innerHTML = `
        <div class="detail-header-block">
          <div class="detail-meta-row">
            <span class="category-badge ${catConfig.badgeColor}">${notice.category}</span>
            ${deadlineInfo.html}
            <span style="font-size:0.8rem; color:#64748b; margin-left:auto;">
              Notice ID: <code>${notice.id}</code>
            </span>
          </div>
          <h2 class="detail-title">${notice.title}</h2>
          <div style="font-size:0.84rem; color:#64748b; margin-bottom:14px;">
            Published on: <strong>${this.formatFullDateTime(notice.publishedAt)}</strong> by Department Administration
          </div>
          ${datesHtml}
        </div>
        <div class="detail-body-block">
          <div class="detail-description">${this.escapeHtml(notice.description)}</div>

          ${this.renderDetailMediaSection(notice)}

          ${this.currentRole === 'admin' ? `
            <div style="margin-top:36px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; gap:12px; align-items:center; background:#f8fafc; padding:16px; border-radius:10px;">
              <span style="font-size:0.85rem; font-weight:600; color:#475569;">Administrator Actions:</span>
              <button class="btn btn-secondary btn-sm" id="detailEditNoticeBtn">✏️ Edit Notice</button>
              <button class="btn btn-danger btn-sm" id="detailDeleteNoticeBtn">🗑️ Delete Notice</button>
            </div>
          ` : ''}
        </div>
      `;

      fragment.appendChild(container);
      return fragment;
    },

    renderDetailMediaSection(notice) {
      const hasBanner = Boolean(notice.bannerImage);
      const additionalImgs = notice.images || [];
      const videos = notice.videos || [];

      if (!hasBanner && additionalImgs.length === 0 && videos.length === 0) {
        return '';
      }

      let html = `<div class="detail-media-section"><h4>Attached Media & Documents</h4>`;

      // SPEC RULE: "If a banner image exists, show it as the first image in the gallery. Do not duplicate it in the gallery."
      if (hasBanner) {
        html += `
          <div>
            <div style="font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:6px; text-transform:uppercase;">Official Notice Banner</div>
            <img src="${notice.bannerImage}" alt="Notice Banner" class="detail-banner-hero">
          </div>
        `;
      }

      // Additional Images
      if (additionalImgs.length > 0) {
        html += `
          <div style="margin-top:16px;">
            <div style="font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Additional Documents / Images (${additionalImgs.length})</div>
            <div class="detail-images-gallery">
              ${additionalImgs.map(img => `
                <div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#fff;">
                  <img src="${img.url}" alt="${img.name}" class="detail-gallery-img">
                  <div style="padding:6px 10px; font-size:0.75rem; color:#475569; background:#f8fafc; border-top:1px solid #f1f5f9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${img.name}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      // Videos
      if (videos.length > 0) {
        html += `
          <div style="margin-top:20px;">
            <div style="font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Attached Video Demonstrations (${videos.length})</div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">
              ${videos.map(v => `
                <div class="video-preview-wrapper" style="border:1px solid #cbd5e1; border-radius:10px; overflow:hidden;">
                  <video controls style="width:100%; display:block; background:#000;">
                    <source src="${v.url}" type="video/mp4">
                    Your browser does not support HTML5 video preview.
                  </video>
                  <div style="padding:8px 12px; background:#f8fafc; font-size:0.76rem; color:#334155; font-weight:600; border-top:1px solid #e2e8f0;">
                    🎬 ${v.name}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      html += `</div>`;
      return html;
    },

    // -------------------------------------------------------------
    // 7. SIMULATED ADMINISTRATOR LOGIN VIEW
    // Spec Section 4: Demo login, clear demo credentials, no false security
    // -------------------------------------------------------------
    createAdminLoginView() {
      const container = document.createElement('div');
      container.style.cssText = 'max-width: 440px; margin: 40px auto;';
      container.innerHTML = `
        <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:16px; padding:32px; box-shadow:var(--shadow-md);">
          <div style="text-align:center; margin-bottom:24px;">
            <div class="dept-monogram" style="margin:0 auto 12px; width:52px; height:52px; font-size:1.3rem;">CSE</div>
            <h2 style="font-size:1.4rem; font-weight:800; color:#0f172a;">Administrator Sign In</h2>
            <p style="font-size:0.84rem; color:#64748b; margin-top:4px;">Department Notice Board Prototype</p>
          </div>

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-bottom:20px; font-size:0.8rem; color:#1e40af;">
            <strong>Demo Prototype Notice:</strong> Authentication is purely simulated for demonstration purposes. No real credentials or server-side security are involved.
          </div>

          <form id="adminLoginForm">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="adminUserField" class="form-input" value="admin" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="adminPassField" class="form-input" value="collegedemo2026" required>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:24px;">
              <button type="submit" class="btn btn-primary" style="width:100%;">
                Sign In to Admin View
              </button>
              <button type="button" id="oneClickDemoLoginBtn" class="btn btn-secondary" style="width:100%;">
                ⚡ One-Click Demo Login
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="App.setRole('student')" style="margin-top:6px;">
                Return to Student View
              </button>
            </div>
          </form>
        </div>
      `;
      return container;
    },

    // -------------------------------------------------------------
    // 8. ADMINISTRATOR DASHBOARD
    // Spec Section 9: 2 Cards: Card 1 (Notice Management), Card 2 (Database Viewer)
    // -------------------------------------------------------------
    createAdminDashboardView() {
      const container = document.createElement('div');
      container.className = 'admin-dashboard-container';
      container.innerHTML = `
        <div class="admin-welcome-card">
          <div>
            <span class="prototype-tag" style="background:#3b82f6;">Department Admin Session</span>
            <h2 style="font-size:1.6rem; font-weight:800; margin-top:6px;">Welcome, Administrator</h2>
            <p style="color:#cbd5e1; font-size:0.9rem; margin-top:4px;">
              Manage active notices across all 5 departmental categories and inspect the planned SQLite schema.
            </p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" id="adminLogoutBtn">
              Sign Out / Switch Role
            </button>
          </div>
        </div>

        <div class="admin-cards-row">
          <!-- Card 1: Notice Management -->
          <div class="admin-feature-card">
            <div>
              <div class="admin-card-icon-box">📋</div>
              <h3>Card 1: Notice Management</h3>
              <p>
                Create, edit, publish, or remove departmental notices. Experience the Universal Notice Modal with real browser file selection and deadline validation.
              </p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" id="openNoticeManagementBtn" style="flex:1;">
                Open Notice Manager →
              </button>
              <button class="btn btn-secondary" id="dashCreateNoticeBtn">
                + New Notice
              </button>
            </div>
          </div>

          <!-- Card 2: Database Viewer -->
          <div class="admin-feature-card">
            <div>
              <div class="admin-card-icon-box" style="background:#e0f2fe; color:#0284c7;">🗄️</div>
              <h3>Card 2: Database Viewer</h3>
              <p>
                Inspect the read-only simulated SQLite table representation. Demonstrates how records will be stored in SQLite when Flask is implemented.
              </p>
            </div>
            <div>
              <button class="btn btn-secondary" id="openDbViewerBtn" style="width:100%;">
                Open Demo Database Viewer →
              </button>
            </div>
          </div>
        </div>

        <!-- Walkthrough & Reset Section -->
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:24px; box-shadow:var(--shadow-sm); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <h4 style="font-size:1.05rem; font-weight:700; color:#1e293b;">Team Demonstration Guide</h4>
            <p style="color:#64748b; font-size:0.86rem; margin-top:2px;">
              Create a notice here, then switch to Student View to observe immediate shared state synchronization.
            </p>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="App.openArchitectureModal()">
              📘 How This Demo Works
            </button>
            <button class="btn btn-danger btn-sm" id="dashResetDataBtn">
              ↺ Reset Demo Data
            </button>
          </div>
        </div>
      `;
      return container;
    },

    // -------------------------------------------------------------
    // 9. NOTICE MANAGEMENT VIEW
    // Full CRUD interface for administrators
    // -------------------------------------------------------------
    createAdminManagementView() {
      const fragment = document.createDocumentFragment();

      // Back navigation
      const backNav = document.createElement('button');
      backNav.className = 'back-link-btn';
      backNav.innerHTML = `← Back to Administrator Dashboard`;
      backNav.onclick = () => this.navigate('admin-dashboard');
      fragment.appendChild(backNav);

      const header = document.createElement('div');
      header.className = 'category-page-header';
      header.innerHTML = `
        <div class="cat-header-text">
          <span class="category-badge bg-blue-100 text-blue-800 border-blue-200">Management Console</span>
          <h2 style="margin-top:6px;">Department Notice Management</h2>
          <p>Full control over active notices. Edits and deletions immediately update the shared prototype state.</p>
        </div>
        <div>
          <button class="btn btn-primary" id="manageAddNewBtn">
            + Create New Notice
          </button>
        </div>
      `;
      fragment.appendChild(header);

      // Management Filter Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'management-toolbar';
      toolbar.innerHTML = `
        <div class="filter-bar">
          <input type="text" id="manageSearchInput" class="search-input" style="max-width:320px;" 
                 placeholder="Filter notices by keyword..." value="${this.searchQuery}">
          <select id="manageCategoryFilter" class="filter-select">
            <option value="ALL">All Categories (${NoticeStore.notices.length})</option>
            ${CATEGORIES.map(c => `
              <option value="${c.name}" ${this.selectedCategory === c.name ? 'selected' : ''}>
                ${c.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div style="font-size:0.85rem; color:#64748b;">
          Sorted by: <strong>Deadline Proximity</strong>
        </div>
      `;
      fragment.appendChild(toolbar);

      // Notices Table
      let list = NoticeStore.getSortedNotices();
      if (this.selectedCategory && this.selectedCategory !== 'ALL') {
        list = list.filter(n => n.category === this.selectedCategory);
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
      }

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      tableWrapper.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Notice Details</th>
              <th>Category</th>
              <th>Deadline Status</th>
              <th>Media</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align:center; padding:32px; color:#64748b;">
                  No notices match the selected criteria.
                </td>
              </tr>
            ` : list.map(n => {
              const deadlineInfo = this.formatDeadlineBadge(n.deadline);
              const catConfig = CATEGORIES.find(c => c.name === n.category) || CATEGORIES[0];
              const bannerText = n.bannerImage ? '✓ Banner' : '—';
              const imgCount = (n.images && n.images.length) || 0;
              const vidCount = (n.videos && n.videos.length) || 0;

              return `
                <tr>
                  <td><code>${n.id}</code></td>
                  <td style="max-width:340px;">
                    <div style="font-weight:700; color:#0f172a; margin-bottom:2px;">
                      <a href="javascript:void(0)" class="table-notice-link" data-id="${n.id}" style="color:inherit; text-decoration:none;">
                        ${n.title}
                      </a>
                    </div>
                    <div style="font-size:0.75rem; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                      Published: ${this.formatPublishDate(n.publishedAt)}
                    </div>
                  </td>
                  <td>
                    <span class="category-badge ${catConfig.badgeColor}">${n.category}</span>
                  </td>
                  <td>${deadlineInfo.html}</td>
                  <td style="font-size:0.78rem; color:#475569;">
                    ${bannerText} | 📷 ${imgCount} | 🎬 ${vidCount}
                  </td>
                  <td style="text-align:right; white-space:nowrap;">
                    <button class="btn btn-secondary btn-sm table-edit-btn" data-id="${n.id}" title="Edit Notice">
                      ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm table-delete-btn" data-id="${n.id}" title="Delete Notice">
                      🗑️
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      fragment.appendChild(tableWrapper);

      return fragment;
    },

    // -------------------------------------------------------------
    // 10. DEMO DATABASE VIEWER
    // Spec Section 16: Read-only SQLite table simulation + Refresh button
    // -------------------------------------------------------------
    createDbViewerView() {
      const fragment = document.createDocumentFragment();

      // Back navigation
      const backNav = document.createElement('button');
      backNav.className = 'back-link-btn';
      backNav.innerHTML = `← Back to Administrator Dashboard`;
      backNav.onclick = () => this.navigate('admin-dashboard');
      fragment.appendChild(backNav);

      const header = document.createElement('div');
      header.className = 'db-viewer-header';
      header.innerHTML = `
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="sqlite-schema-tag">TABLE notices</span>
            <span style="font-size:0.8rem; color:#64748b; font-weight:600;">SQLite Relational Schema Simulation</span>
          </div>
          <h2 style="font-size:1.45rem; font-weight:800; color:#0f172a;">Demo Database Viewer — Frontend Simulation</h2>
          <p style="font-size:0.84rem; color:#64748b; margin-top:2px;">
            Read-only tabular inspection. Demonstrates table columns and schema mapping for the future Flask/SQLite backend.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:0.78rem; color:#64748b; text-align:right;">
            Last Refreshed:<br>
            <strong id="dbLastRefreshedTime">${this.formatFullDateTime(this.dbLastRefreshed.toISOString())}</strong>
          </div>
          <button class="btn btn-primary btn-sm" id="dbRefreshBtn">
            🔄 Refresh Table
          </button>
        </div>
      `;
      fragment.appendChild(header);

      const tableWrapper = document.createElement('div');
      tableWrapper.className = 'table-wrapper';
      const notices = NoticeStore.getAll();

      tableWrapper.innerHTML = `
        <table class="data-table" style="font-size:0.8rem;">
          <thead>
            <tr>
              <th>id (TEXT PRIMARY KEY)</th>
              <th>title (TEXT)</th>
              <th>category (VARCHAR)</th>
              <th>event_start_date (DATE)</th>
              <th>event_end_date (DATE)</th>
              <th>deadline (DATE)</th>
              <th>published_at (DATETIME)</th>
              <th>banner_image (VARCHAR)</th>
              <th>images_count (INT)</th>
              <th>videos_count (INT)</th>
            </tr>
          </thead>
          <tbody>
            ${notices.map(n => `
              <tr>
                <td><code>${n.id}</code></td>
                <td style="max-width:220px; font-weight:600; color:#1e293b;" title="${this.escapeHtml(n.title)}">
                  ${this.truncateString(n.title, 38)}
                </td>
                <td><span class="category-badge" style="background:#e2e8f0; color:#334155;">${n.category}</span></td>
                <td><code>${n.eventStartDate || 'NULL'}</code></td>
                <td><code>${n.eventEndDate || 'NULL'}</code></td>
                <td><code style="${n.deadline ? 'color:#b91c1c; font-weight:bold;' : ''}">${n.deadline || 'NULL'}</code></td>
                <td><code style="font-size:0.75rem;">${n.publishedAt ? n.publishedAt.substring(0, 19).replace('T', ' ') : 'NULL'}</code></td>
                <td><span style="color:#059669;">${n.bannerImage ? '✓ banner.svg' : 'NULL'}</span></td>
                <td><code>${(n.images && n.images.length) || 0}</code></td>
                <td><code>${(n.videos && n.videos.length) || 0}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      fragment.appendChild(tableWrapper);

      // Schema Documentation Callout
      const note = document.createElement('div');
      note.className = 'concept-box';
      note.style.marginTop = '16px';
      note.innerHTML = `
        <h4>Relational SQLite Mapping Notice</h4>
        <p>
          In the future backend phase, this table structure will be instantiated as an SQLite table via SQLAlchemy / SQLite DDL in Flask.
          Attached images and videos will be saved into local filesystem folders (<code>uploads/images/</code>, <code>uploads/videos/</code>), with foreign-key reference tables or serialized path columns.
        </p>
      `;
      fragment.appendChild(note);

      return fragment;
    },

    // -------------------------------------------------------------
    // 11. UNIVERSAL NOTICE FORM MODAL (Add / Edit)
    // Spec Sections 10, 11, 12
    // -------------------------------------------------------------
    openNoticeModal(category = null, editId = null) {
      this.formState.isEditing = Boolean(editId);
      this.formState.editId = editId;
      this.formState.targetCategory = category || (CATEGORIES[0].name);
      this.formState.bannerImage = null;
      this.formState.bannerFileName = '';
      this.formState.images = [];
      this.formState.videos = [];
      this.formState.isDirty = false;

      const modal = document.getElementById('universalNoticeModal');
      const titleEl = document.getElementById('noticeModalTitle');
      const submitBtn = document.getElementById('noticeModalSubmitBtn');

      // Populate if editing
      if (editId) {
        const existing = NoticeStore.getById(editId);
        if (existing) {
          titleEl.textContent = `Edit Notice: ${existing.id}`;
          submitBtn.textContent = 'Save Changes';
          this.formState.targetCategory = existing.category;
          this.formState.bannerImage = existing.bannerImage || null;
          this.formState.bannerFileName = existing.bannerImage ? 'existing_banner.svg' : '';
          this.formState.images = existing.images ? [...existing.images] : [];
          this.formState.videos = existing.videos ? [...existing.videos] : [];

          document.getElementById('formTitle').value = existing.title || '';
          document.getElementById('formDescription').value = existing.description || '';
          document.getElementById('formEventStart').value = existing.eventStartDate || '';
          document.getElementById('formEventEnd').value = existing.eventEndDate || '';
          document.getElementById('formDeadline').value = existing.deadline || '';
        }
      } else {
        titleEl.textContent = `Create Notice in ${this.formState.targetCategory}`;
        submitBtn.textContent = 'Publish Notice';
        document.getElementById('noticeForm').reset();
      }

      // Category Indicator (Spec: Do not include a category dropdown, category is determined by the page)
      const catDisplay = document.getElementById('formCategoryDisplay');
      if (catDisplay) {
        catDisplay.textContent = this.formState.targetCategory;
      }

      this.renderFormMediaPreviews();
      this.clearFormErrors();

      modal.classList.add('active');
    },

    closeNoticeModal(force = false) {
      if (!force && this.formState.isDirty) {
        this.openConfirmDiscardModal();
        return;
      }
      const modal = document.getElementById('universalNoticeModal');
      modal.classList.remove('active');
      document.getElementById('noticeForm').reset();
      this.formState.isDirty = false;
    },

    openConfirmDiscardModal() {
      const confirmModal = document.getElementById('confirmDiscardModal');
      confirmModal.classList.add('active');
    },

    closeConfirmDiscardModal() {
      const confirmModal = document.getElementById('confirmDiscardModal');
      confirmModal.classList.remove('active');
    },

    renderFormMediaPreviews() {
      // Banner Preview
      const bannerPreviewBox = document.getElementById('bannerPreviewArea');
      if (this.formState.bannerImage) {
        bannerPreviewBox.innerHTML = `
          <div class="file-preview-card">
            <img src="${this.formState.bannerImage}" class="file-thumbnail" alt="Banner Preview">
            <div class="file-info">
              <div class="file-name">${this.formState.bannerFileName || 'banner_image.png'}</div>
              <div class="file-meta">Selected for Notice Card & Header Hero</div>
            </div>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" id="formReplaceBannerBtn">Replace</button>
              <button type="button" class="btn btn-danger btn-sm" id="formRemoveBannerBtn">Remove</button>
            </div>
          </div>
        `;
        document.getElementById('formRemoveBannerBtn').onclick = () => {
          this.formState.bannerImage = null;
          this.formState.bannerFileName = '';
          this.formState.isDirty = true;
          this.renderFormMediaPreviews();
        };
        document.getElementById('formReplaceBannerBtn').onclick = () => {
          document.getElementById('bannerFileInput').click();
        };
      } else {
        bannerPreviewBox.innerHTML = `
          <div style="font-size:0.8rem; color:#64748b; margin-top:6px;">No banner selected. Card will render as compact title-focused layout.</div>
        `;
      }

      // Additional Images Previews (up to 5)
      const imagesGrid = document.getElementById('additionalImagesGrid');
      const imgCountBadge = document.getElementById('additionalImagesCountBadge');
      if (imgCountBadge) {
        imgCountBadge.textContent = `${this.formState.images.length}/5 selected`;
      }

      if (this.formState.images.length > 0) {
        imagesGrid.innerHTML = this.formState.images.map((img, idx) => `
          <div class="gallery-preview-item">
            <img src="${img.url}" alt="${img.name}">
            <button type="button" class="remove-thumb-btn" data-img-idx="${idx}" title="Remove image">×</button>
            <div class="gallery-item-footer">${img.name}</div>
          </div>
        `).join('');

        imagesGrid.querySelectorAll('.remove-thumb-btn').forEach(btn => {
          btn.onclick = (e) => {
            const idx = parseInt(e.target.getAttribute('data-img-idx'), 10);
            this.formState.images.splice(idx, 1);
            this.formState.isDirty = true;
            this.renderFormMediaPreviews();
          };
        });
      } else {
        imagesGrid.innerHTML = `<div style="font-size:0.8rem; color:#64748b; grid-column: 1/-1;">No additional images selected.</div>`;
      }

      // Video Previews (up to 3)
      const videoList = document.getElementById('videoPreviewsList');
      const vidCountBadge = document.getElementById('videoCountBadge');
      if (vidCountBadge) {
        vidCountBadge.textContent = `${this.formState.videos.length}/3 selected`;
      }

      if (this.formState.videos.length > 0) {
        videoList.innerHTML = this.formState.videos.map((vid, idx) => `
          <div class="file-preview-card" style="flex-direction:column; align-items:stretch;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.84rem; font-weight:600; color:#1e293b;">🎬 ${vid.name}</span>
              <button type="button" class="btn btn-danger btn-sm remove-vid-btn" data-vid-idx="${idx}">Remove Video</button>
            </div>
            <div class="video-preview-wrapper">
              <video controls style="width:100%;">
                <source src="${vid.url}" type="video/mp4">
              </video>
            </div>
          </div>
        `).join('');

        videoList.querySelectorAll('.remove-vid-btn').forEach(btn => {
          btn.onclick = (e) => {
            const idx = parseInt(e.target.getAttribute('data-vid-idx'), 10);
            this.formState.videos.splice(idx, 1);
            this.formState.isDirty = true;
            this.renderFormMediaPreviews();
          };
        });
      } else {
        videoList.innerHTML = `<div style="font-size:0.8rem; color:#64748b;">No videos selected.</div>`;
      }
    },

    clearFormErrors() {
      document.querySelectorAll('.form-error-msg').forEach(el => el.classList.remove('visible'));
    },

    showFieldError(id, msg) {
      const errEl = document.getElementById(id);
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('visible');
      }
    },

    handleNoticeFormSubmit(e) {
      e.preventDefault();
      this.clearFormErrors();

      const title = document.getElementById('formTitle').value.trim();
      const description = document.getElementById('formDescription').value.trim();
      const eventStart = document.getElementById('formEventStart').value || null;
      const eventEnd = document.getElementById('formEventEnd').value || null;
      const deadline = document.getElementById('formDeadline').value || null;

      let isValid = true;

      // 1. Required validation
      if (!title) {
        this.showFieldError('errFormTitle', 'Notice title is required.');
        isValid = false;
      }
      if (!description) {
        this.showFieldError('errFormDescription', 'Notice description is required.');
        isValid = false;
      }

      // 2. Date logic validation (Spec Section 10):
      // "If both event dates are entered, prevent the end date from preceding the start date."
      if (eventStart && eventEnd) {
        if (new Date(eventEnd) < new Date(eventStart)) {
          this.showFieldError('errFormEventEnd', 'Event end date cannot precede event start date.');
          isValid = false;
        }
      }

      if (!isValid) return;

      const noticePayload = {
        title,
        description,
        category: this.formState.targetCategory,
        eventStartDate: eventStart,
        eventEndDate: eventEnd,
        deadline: deadline,
        bannerImage: this.formState.bannerImage,
        images: this.formState.images,
        videos: this.formState.videos
      };

      if (this.formState.isEditing) {
        NoticeStore.update(this.formState.editId, noticePayload);
        this.showToast(`Notice "${title}" updated successfully in frontend demo.`);
      } else {
        NoticeStore.add(noticePayload);
        this.showToast(`Notice "${title}" added to frontend demo state.`);
      }

      this.closeNoticeModal(true);
      this.render();
    },

    // -------------------------------------------------------------
    // 12. ARCHITECTURE MODAL ("How This Demo Works")
    // Spec Section 21: Beginner friendly architecture explanation
    // -------------------------------------------------------------
    openArchitectureModal() {
      const modal = document.getElementById('architectureGuideModal');
      modal.classList.add('active');
    },

    closeArchitectureModal() {
      const modal = document.getElementById('architectureGuideModal');
      modal.classList.remove('active');
    },

    openWelcomeModal() {
      const modal = document.getElementById('welcomeRoleModal');
      modal.classList.add('active');
    },

    closeWelcomeModal(role) {
      sessionStorage.setItem('dept_notice_role_selected', 'true');
      const modal = document.getElementById('welcomeRoleModal');
      modal.classList.remove('active');
      this.setRole(role);
    },

    // -------------------------------------------------------------
    // 13. GLOBAL EVENT LISTENERS & DELEGATION
    // -------------------------------------------------------------
    attachGlobalListeners() {
      // Prototype Bar Controls
      document.getElementById('pillStudent').onclick = () => this.setRole('student');
      document.getElementById('pillAdmin').onclick = () => this.setRole('admin');
      document.getElementById('btnHowItWorks').onclick = () => this.openArchitectureModal();
      document.getElementById('btnResetDemoData').onclick = () => this.confirmResetDemoData();

      // Brand Click -> Return Home
      document.getElementById('brandLogoLink').onclick = () => this.navigate('home');

      // Admin Strip Actions
      const stripAddBtn = document.getElementById('stripAddNoticeBtn');
      if (stripAddBtn) {
        stripAddBtn.onclick = () => this.openNoticeModal(this.selectedCategory || CATEGORIES[0].name);
      }
      const stripDbBtn = document.getElementById('stripOpenDbBtn');
      if (stripDbBtn) {
        stripDbBtn.onclick = () => this.navigate('admin-db-viewer');
      }

      // Universal Notice Modal Form Submit & Cancel
      const form = document.getElementById('noticeForm');
      form.onsubmit = (e) => this.handleNoticeFormSubmit(e);

      document.getElementById('noticeModalCancelBtn').onclick = () => this.closeNoticeModal(false);
      document.getElementById('noticeModalCloseX').onclick = () => this.closeNoticeModal(false);

      // Dirty form detection
      form.addEventListener('input', () => {
        this.formState.isDirty = true;
      });

      // Date clear buttons
      document.querySelectorAll('.date-clear-btn').forEach(btn => {
        btn.onclick = (e) => {
          const targetInputId = e.currentTarget.getAttribute('data-clear-target');
          const input = document.getElementById(targetInputId);
          if (input) {
            input.value = '';
            this.formState.isDirty = true;
          }
        };
      });

      // Real File Pickers Handling (Spec Section 11)
      const bannerInput = document.getElementById('bannerFileInput');
      document.getElementById('chooseBannerBtn').onclick = () => bannerInput.click();
      bannerInput.onchange = (e) => this.handleBannerFileSelection(e);

      const additionalInput = document.getElementById('additionalImagesFileInput');
      document.getElementById('addAdditionalImagesBtn').onclick = () => additionalInput.click();
      additionalInput.onchange = (e) => this.handleAdditionalImagesSelection(e);

      const videoInput = document.getElementById('videosFileInput');
      document.getElementById('addVideosBtn').onclick = () => videoInput.click();
      videoInput.onchange = (e) => this.handleVideoSelection(e);

      // Confirm Discard Modal Buttons
      document.getElementById('confirmKeepEditingBtn').onclick = () => this.closeConfirmDiscardModal();
      document.getElementById('confirmDiscardChangesBtn').onclick = () => {
        this.closeConfirmDiscardModal();
        this.closeNoticeModal(true);
      };

      // Welcome Role Modal Buttons
      document.getElementById('selectRoleStudentBtn').onclick = () => this.closeWelcomeModal('student');
      document.getElementById('selectRoleAdminBtn').onclick = () => this.closeWelcomeModal('admin');

      // Architecture Guide Close
      document.getElementById('closeArchGuideBtn').onclick = () => this.closeArchitectureModal();
      document.getElementById('closeArchGuideX').onclick = () => this.closeArchitectureModal();

      // Delegate Dynamic Clicks
      document.addEventListener('click', (e) => {
        // Nav Category Button
        const catBtn = e.target.closest('[data-cat]');
        if (catBtn && !e.target.closest('.notice-card')) {
          const catName = catBtn.getAttribute('data-cat');
          this.navigate('category', { category: catName, searchQuery: '' });
          return;
        }

        // Nav Home Button
        const homeBtn = e.target.closest('[data-nav="home"]');
        if (homeBtn) {
          this.navigate('home', { searchQuery: '' });
          return;
        }

        // Add notice button on Home
        if (e.target.id === 'homeAddNewNoticeBtn') {
          this.openNoticeModal(CATEGORIES[0].name);
          return;
        }

        // Add notice on Category
        if (e.target.id === 'catAddNewNoticeBtn' || e.target.id === 'catEmptyAddBtn') {
          this.openNoticeModal(this.selectedCategory);
          return;
        }

        // Admin Dashboard buttons
        if (e.target.id === 'openNoticeManagementBtn') {
          this.navigate('admin-management');
          return;
        }
        if (e.target.id === 'dashCreateNoticeBtn' || e.target.id === 'manageAddNewBtn') {
          this.openNoticeModal(this.selectedCategory || CATEGORIES[0].name);
          return;
        }
        if (e.target.id === 'openDbViewerBtn') {
          this.navigate('admin-db-viewer');
          return;
        }
        if (e.target.id === 'dashResetDataBtn') {
          this.confirmResetDemoData();
          return;
        }
        if (e.target.id === 'adminLogoutBtn') {
          this.isAdminLoggedIn = false;
          this.setRole('student');
          this.showToast('Signed out of Administrator View.', 'info');
          return;
        }

        // Detail Page Buttons
        if (e.target.id === 'detailEditNoticeBtn') {
          this.openNoticeModal(null, this.selectedNoticeId);
          return;
        }
        if (e.target.id === 'detailDeleteNoticeBtn') {
          this.confirmDeleteNotice(this.selectedNoticeId);
          return;
        }

        // Table Edit/Delete in Management
        const editBtn = e.target.closest('.table-edit-btn');
        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          this.openNoticeModal(null, id);
          return;
        }
        const delBtn = e.target.closest('.table-delete-btn');
        if (delBtn) {
          const id = delBtn.getAttribute('data-id');
          this.confirmDeleteNotice(id);
          return;
        }
        const noticeLink = e.target.closest('.table-notice-link');
        if (noticeLink) {
          const id = noticeLink.getAttribute('data-id');
          this.navigate('detail', { noticeId: id });
          return;
        }

        // DB Refresh Button
        if (e.target.id === 'dbRefreshBtn') {
          this.dbLastRefreshed = new Date();
          this.render();
          this.showToast('Database table re-queried from frontend state.', 'info');
          return;
        }

        // Reset Search from Empty State
        if (e.target.id === 'resetSearchFromEmpty' || e.target.id === 'clearSearchBtn' || e.target.id === 'clearCatSearchBtn') {
          this.searchQuery = '';
          this.render();
          return;
        }
      });

      // Search Inputs Handling
      document.addEventListener('input', (e) => {
        if (e.target.id === 'homeSearchInput' || e.target.id === 'categorySearchInput' || e.target.id === 'manageSearchInput') {
          this.searchQuery = e.target.value;
          // Debounce slightly or render directly for instant reactive search
          clearTimeout(this._searchTimer);
          this._searchTimer = setTimeout(() => this.render(), 120);
        }
      });

      // Category filter in Management Table
      document.addEventListener('change', (e) => {
        if (e.target.id === 'manageCategoryFilter') {
          this.selectedCategory = e.target.value;
          this.render();
        }
      });

      // Admin Login form submit
      document.addEventListener('submit', (e) => {
        if (e.target.id === 'adminLoginForm') {
          e.preventDefault();
          this.isAdminLoggedIn = true;
          this.showToast('Demo administrator login successful!');
          this.navigate('admin-dashboard');
        }
      });

      // One click demo login
      document.addEventListener('click', (e) => {
        if (e.target.id === 'oneClickDemoLoginBtn') {
          document.getElementById('adminUserField').value = 'admin';
          document.getElementById('adminPassField').value = 'collegedemo2026';
          this.isAdminLoggedIn = true;
          this.showToast('One-click demo login authenticated.');
          this.navigate('admin-dashboard');
        }
      });

      // Keyboard navigation (Escape closes modals)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.querySelector('.modal-overlay.active');
          if (modal) {
            if (modal.id === 'universalNoticeModal') {
              this.closeNoticeModal(false);
            } else if (modal.id === 'confirmDiscardModal') {
              this.closeConfirmDiscardModal();
            } else if (modal.id === 'architectureGuideModal') {
              this.closeArchitectureModal();
            }
          }
        }
      });
    },

    // -------------------------------------------------------------
    // 14. FILE HANDLING & PREVIEWS (Real Browser Picker Simulation)
    // -------------------------------------------------------------
    handleBannerFileSelection(e) {
      const file = e.target.files[0];
      if (!file) return;

      // 5 MB limit check
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds the 5 MB maximum limit for banner images. Please choose a smaller file.`);
        e.target.value = '';
        return;
      }

      // Convert to Base64 Data URL so it persists across reloads in demo storage
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        this.formState.bannerImage = loadEvent.target.result;
        this.formState.bannerFileName = file.name;
        this.formState.isDirty = true;
        this.renderFormMediaPreviews();
      };
      reader.readAsDataURL(file);
    },

    handleAdditionalImagesSelection(e) {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const currentCount = this.formState.images.length;
      if (currentCount + files.length > 5) {
        alert(`You can attach up to 5 additional images. You currently have ${currentCount} and tried to add ${files.length}.`);
        e.target.value = '';
        return;
      }

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`Image "${file.name}" exceeds the 5 MB limit.`);
          continue;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          this.formState.images.push({
            name: file.name,
            url: loadEvent.target.result
          });
          this.formState.isDirty = true;
          this.renderFormMediaPreviews();
        };
        reader.readAsDataURL(file);
      }

      e.target.value = '';
    },

    handleVideoSelection(e) {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const currentCount = this.formState.videos.length;
      if (currentCount + files.length > 3) {
        alert(`You can attach up to 3 videos. You currently have ${currentCount} and tried to add ${files.length}.`);
        e.target.value = '';
        return;
      }

      for (const file of files) {
        // 50 MB limit check
        if (file.size > 50 * 1024 * 1024) {
          alert(`Video "${file.name}" exceeds the 50 MB limit.`);
          continue;
        }
        const url = URL.createObjectURL(file);
        this.formState.videos.push({
          name: file.name,
          url: url
        });
        this.formState.isDirty = true;
      }

      e.target.value = '';
      this.renderFormMediaPreviews();
    },

    // -------------------------------------------------------------
    // 15. DELETE & RESET ACTIONS
    // -------------------------------------------------------------
    confirmDeleteNotice(id) {
      const notice = NoticeStore.getById(id);
      if (!notice) return;

      if (confirm(`Are you sure you want to delete notice "${notice.title}"?\n\nThis will remove it from the demo state.`)) {
        NoticeStore.delete(id);
        this.showToast(`Notice "${notice.title}" deleted from demo state.`);
        if (this.currentView === 'detail') {
          this.navigate('category', { category: notice.category });
        } else {
          this.render();
        }
      }
    },

    confirmResetDemoData() {
      if (confirm("Reset Demo Data to Initial State?\n\nThis will clear all changes made during this session and reload the pristine sample departmental notices. No real databases or files are affected.")) {
        NoticeStore.resetToDefaults();
        this.searchQuery = '';
        this.showToast("Demo data successfully restored to initial state.");
        this.render();
      }
    },

    // -------------------------------------------------------------
    // 16. FORMATTING HELPERS
    // -------------------------------------------------------------
    formatDeadlineBadge(deadlineStr) {
      if (!deadlineStr) {
        return {
          status: 'none',
          html: '<span class="deadline-badge" style="background:#f1f5f9; color:#475569;">📢 Notice</span>'
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dDate = new Date(deadlineStr);
      dDate.setHours(0, 0, 0, 0);

      const diffTime = dDate - today;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        return {
          status: 'passed',
          html: `<span class="deadline-badge passed">📅 Passed (${daysAgo}d ago)</span>`
        };
      } else if (diffDays === 0) {
        return {
          status: 'today',
          html: `<span class="deadline-badge today">⚠️ Deadline Today</span>`
        };
      } else if (diffDays <= 3) {
        return {
          status: 'upcoming',
          html: `<span class="deadline-badge upcoming">⏳ Deadline: in ${diffDays} day${diffDays === 1 ? '' : 's'}</span>`
        };
      } else {
        return {
          status: 'future',
          html: `<span class="deadline-badge future">🗓️ Deadline: ${this.formatShortDate(deadlineStr)}</span>`
        };
      }
    },

    formatPublishDate(isoStr) {
      if (!isoStr) return 'Recently';
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatShortDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    formatFullDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatFullDateTime(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    truncateString(str, len = 40) {
      if (!str) return '';
      return str.length > len ? str.substring(0, len) + '...' : str;
    },

    escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
    },

    getCategoryIconSvg(iconType) {
      switch (iconType) {
        case 'exam': return '📝';
        case 'academic': return '🎓';
        case 'placement': return '💼';
        case 'event': return '🏆';
        case 'announcement': return '📢';
        default: return '📌';
      }
    }
  };

  // Expose App globally for inline button handlers
  window.App = App;

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
})();
