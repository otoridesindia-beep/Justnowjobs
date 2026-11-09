const SUPABASE_URL = 'https://ebaziwpmxtmgbllhepqt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o0zxeW01L97UirMOkU3AFg_Nml_uhaW';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const jobsList = document.getElementById('jobsList');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
const jobsNotice = document.querySelector('.disclaimer');
const jobForm = document.getElementById('jobForm');
const adminJobList = document.getElementById('adminJobList');
const adminJobCount = document.getElementById('adminJobCount');
const adminStatus = document.getElementById('adminStatus');
const adminSection = document.getElementById('admin');
const saveJobButton = document.getElementById('saveJob');
const jobDialog = document.getElementById('jobDialog');
const jobDialogTitle = document.getElementById('jobDialogTitle');
const jobDialogCompany = document.getElementById('jobDialogCompany');
const jobDialogDetails = document.getElementById('jobDialogDetails');
const jobDialogApply = document.getElementById('jobDialogApply');

const profileToggle = document.getElementById('profileToggle');
const accountDialog = document.getElementById('accountDialog');
const accountEyebrow = document.getElementById('accountEyebrow');
const accountTitle = document.getElementById('accountTitle');
const accountSubtitle = document.getElementById('accountSubtitle');
const guestView = document.getElementById('guestView');
const memberView = document.getElementById('memberView');
const memberDetails = document.getElementById('memberDetails');
const adminLoginView = document.getElementById('adminLoginView');
const adminSessionView = document.getElementById('adminSessionView');
const signupForm = document.getElementById('signupForm');
const signinForm = document.getElementById('signinForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const signupStatus = document.getElementById('signupStatus');
const signinStatus = document.getElementById('signinStatus');
const adminLoginStatus = document.getElementById('adminLoginStatus');
const tabSignup = document.getElementById('tabSignup');
const tabSignin = document.getElementById('tabSignin');
const openAdminButton = document.getElementById('openAdminButton');

const roleLabels = {
  Analytics: 'ANALYTICS',
  Engineering: 'ENGINEERING',
  Science: 'DATA SCIENCE',
  Product: 'PRODUCT'
};
const roleClasses = {
  Analytics: '',
  Engineering: 'tag-engineering',
  Science: 'tag-science',
  Product: 'tag-product'
};

// Remove data left behind by the earlier browser-only version of the app.
['justnow-jobs', 'justnow-users', 'justnow-admin'].forEach((key) => {
  try { localStorage.removeItem(key); } catch (error) { /* storage unavailable */ }
});

/* ---------- Helpers ---------- */

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function setStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function safeApplyLink(value) {
  const trimmed = String(value ?? '').trim();
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null;
}

function relativeTime(isoDate) {
  const minutes = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 60000);
  if (Number.isNaN(minutes) || minutes < 60) return 'Just now';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

/* ---------- Jobs (stored in Supabase) ---------- */

function getInitialJobs() {
  return Array.from(document.querySelectorAll('.job-card')).map((card, index) => {
    const logo = card.querySelector('.company-logo');
    const logoAccent = logo.querySelector('span');
    return {
      id: `sample-${index + 1}`,
      role: card.dataset.role,
      listingType: 'Posting',
      location: card.dataset.location,
      skills: card.dataset.search,
      title: card.querySelector('.job-main h3').textContent,
      company: card.querySelector('.company').textContent.split('·')[0].trim(),
      posted: card.querySelector('.posted').textContent,
      arrangement: card.querySelector('.job-details span').textContent,
      salary: card.querySelector('.job-details strong').textContent,
      apply: card.querySelector('.apply-link').getAttribute('href'),
      logoMark: logo.childNodes[0].textContent.trim(),
      logoAccent: logoAccent ? logoAccent.textContent : '',
      logoClass: Array.from(logo.classList).find((className) => className !== 'company-logo') || ''
    };
  });
}

function rowToJob(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    role: row.role,
    listingType: row.listing_type || 'Posting',
    place: row.place || '',
    description: row.description || '',
    location: row.location,
    arrangement: row.arrangement,
    salary: row.salary,
    skills: row.skills,
    apply: row.apply,
    posted: relativeTime(row.created_at),
    logoMark: row.logo_mark,
    logoAccent: row.logo_accent,
    logoClass: row.logo_class
  };
}

function jobToRow(job) {
  return {
    title: job.title,
    company: job.company,
    role: job.role,
    listing_type: job.listingType,
    place: job.place,
    description: job.description,
    location: job.location,
    arrangement: job.arrangement,
    salary: job.salary,
    skills: job.skills,
    apply: job.apply,
    logo_mark: job.logoMark,
    logo_accent: job.logoAccent,
    logo_class: job.logoClass
  };
}

let jobs = getInitialJobs();
let jobsAreLive = false;

async function fetchJobs() {
  if (!db) {
    jobsNotice.textContent = 'Could not reach the database. Showing sample opportunities.';
    return;
  }
  const { data, error } = await db.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) {
    jobsNotice.textContent = 'Could not load live listings. Showing sample opportunities.';
    return;
  }
  jobs = data.map(rowToJob);
  jobsAreLive = true;
  jobsNotice.textContent = 'Listings are posted by the Justnow Jobs team.';
  renderJobs();
}

function getSearchText(job) {
  return `${job.title} ${job.company} ${job.skills} ${job.location} ${job.role}`.toLowerCase();
}

function renderJobs() {
  jobsList.innerHTML = jobs.map((job) => {
    const roleClass = roleClasses[job.role] || '';
    const logoClass = job.logoClass || '';
    const logoMark = job.logoMark || job.company.charAt(0).toUpperCase();
    return `
      <article class="job-card" data-job-id="${escapeHTML(job.id)}" data-role="${escapeHTML(job.role)}" data-type="${escapeHTML(job.listingType)}" data-location="${escapeHTML(job.location)}" data-search="${escapeHTML(getSearchText(job))}">
        <div class="company-logo ${escapeHTML(logoClass)}">${escapeHTML(logoMark)}${job.logoAccent ? `<span>${escapeHTML(job.logoAccent)}</span>` : ''}</div>
        <div class="job-main"><div class="job-meta"><span class="role-tag ${roleClass}">${escapeHTML(roleLabels[job.role] || job.role)}</span>${job.listingType !== 'Posting' ? `<span class="type-tag">${escapeHTML(job.listingType)}</span>` : ''}<span class="posted">${escapeHTML(job.posted || 'Just now')}</span></div><h3>${escapeHTML(job.title)}</h3><p class="company">${escapeHTML(job.company)} <span>·</span> ${escapeHTML(job.place || job.location)}</p></div>
        <div class="job-details"><span>${escapeHTML(job.arrangement)}</span><strong>${escapeHTML(job.salary)}</strong></div>
        <a class="apply-link" href="${escapeHTML(job.apply)}">View role <span aria-hidden="true">↗</span></a>
      </article>`;
  }).join('');
  filterJobs();
  renderAdminList();
}

function filterJobs() {
  const query = searchInput.value.trim().toLowerCase();
  const role = roleFilter.value;
  const location = locationFilter.value;
  const type = typeFilter.value;
  let visibleCount = 0;

  jobsList.querySelectorAll('.job-card').forEach((card) => {
    const matchesSearch = !query || card.dataset.search.includes(query);
    const matchesRole = role === 'all' || card.dataset.role === role;
    const matchesLocation = location === 'all' || card.dataset.location === location;
    const matchesType = type === 'all' || card.dataset.type === type;
    const isVisible = matchesSearch && matchesRole && matchesLocation && matchesType;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  resultCount.textContent = visibleCount;
  emptyState.hidden = visibleCount !== 0;
}

jobsList.addEventListener('click', (event) => {
  const viewLink = event.target.closest('.apply-link');
  if (!viewLink) return;
  event.preventDefault();

  const card = viewLink.closest('.job-card');
  const job = jobs.find((item) => item.id === card.dataset.jobId);
  if (!job) return;

  jobDialogTitle.textContent = job.title;
  jobDialogCompany.textContent = job.company;
  const details = [
    ['Listing type', job.listingType],
    ['Role type', roleLabels[job.role] || job.role],
    ['Location', job.place ? `${job.place} (${job.location})` : job.location],
    ['Description', job.description || 'Not provided'],
    ['Work arrangement', job.arrangement],
    ['Salary range', job.salary],
    ['Skills & keywords', job.skills || 'Not specified'],
    ['Posted', job.posted || 'Just now']
  ];
  jobDialogDetails.innerHTML = details.map(([label, value]) =>
    `<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(value)}</td></tr>`
  ).join('');

  const applyLink = safeApplyLink(job.apply);
  jobDialogApply.hidden = !applyLink;
  if (applyLink) jobDialogApply.href = applyLink;
  jobDialog.showModal();
});

document.getElementById('closeJobDialog').addEventListener('click', () => jobDialog.close());
document.getElementById('backToJobs').addEventListener('click', () => jobDialog.close());
jobDialog.addEventListener('click', (event) => {
  if (event.target === jobDialog) jobDialog.close();
});

searchInput.addEventListener('input', filterJobs);
roleFilter.addEventListener('change', filterJobs);
locationFilter.addEventListener('change', filterJobs);
typeFilter.addEventListener('change', filterJobs);
document.getElementById('clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  typeFilter.value = 'all';
  roleFilter.value = 'all';
  locationFilter.value = 'all';
  filterJobs();
});

/* ---------- Admin console ---------- */

function renderAdminList() {
  adminJobCount.textContent = `(${jobs.length})`;
  adminJobList.innerHTML = jobs.map((job) => `
    <div class="admin-list-item">
      <div><strong>${escapeHTML(job.title)}</strong><span>${escapeHTML(job.company)} · ${escapeHTML(job.listingType)} · ${escapeHTML(job.role)} · ${escapeHTML(job.location)}</span></div>
      <div class="admin-actions">
        <button class="admin-action" type="button" data-action="edit" data-id="${escapeHTML(job.id)}">Edit</button>
        <button class="admin-action delete" type="button" data-action="delete" data-id="${escapeHTML(job.id)}">Delete</button>
      </div>
    </div>`).join('') || '<p class="admin-note">No job listings yet. Add one using the form above.</p>';
}

function resetForm() {
  jobForm.reset();
  document.getElementById('jobId').value = '';
  document.getElementById('jobArrangement').value = 'Full-time';
  document.getElementById('formHeading').textContent = 'Post a job';
  saveJobButton.textContent = 'Post job';
  document.getElementById('cancelEdit').hidden = true;
}

function describeWriteError(error) {
  if (!error) return 'Nothing was changed. You may not have admin access.';
  return `Could not save: ${error.message}`;
}

jobForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!db || !jobsAreLive) return setStatus(adminStatus, 'The database is not connected, so changes cannot be saved.', true);
  if (!currentProfile?.is_admin) return setStatus(adminStatus, 'Admin sign-in is required.', true);

  const apply = safeApplyLink(document.getElementById('jobApply').value);
  if (!apply) return setStatus(adminStatus, 'Enter a valid https://, http://, or mailto: application link.', true);

  const id = document.getElementById('jobId').value;
  const existingJob = jobs.find((job) => job.id === id);
  const company = document.getElementById('jobCompany').value.trim();
  const job = {
    title: document.getElementById('jobTitle').value.trim(),
    company,
    role: document.getElementById('jobRole').value,
    listingType: document.getElementById('jobType').value,
    place: document.getElementById('jobPlace').value.trim(),
    description: document.getElementById('jobDescription').value.trim(),
    location: document.getElementById('jobLocation').value,
    arrangement: document.getElementById('jobArrangement').value.trim(),
    salary: document.getElementById('jobSalary').value.trim(),
    skills: document.getElementById('jobSkills').value.trim(),
    apply,
    logoMark: existingJob ? existingJob.logoMark : company.charAt(0).toUpperCase(),
    logoAccent: existingJob ? existingJob.logoAccent : '',
    logoClass: existingJob ? existingJob.logoClass : ''
  };

  saveJobButton.disabled = true;
  const query = existingJob
    ? db.from('jobs').update(jobToRow(job)).eq('id', id).select()
    : db.from('jobs').insert(jobToRow(job)).select();
  const { data, error } = await query;
  saveJobButton.disabled = false;

  if (error || !data || data.length === 0) return setStatus(adminStatus, describeWriteError(error), true);

  const saved = rowToJob(data[0]);
  jobs = existingJob ? jobs.map((item) => (item.id === id ? saved : item)) : [saved, ...jobs];
  setStatus(adminStatus, existingJob ? 'Job listing updated.' : 'Job listing posted.');
  resetForm();
  renderJobs();
});

adminJobList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const job = jobs.find((item) => item.id === button.dataset.id);
  if (!job) return;

  if (button.dataset.action === 'edit') {
    document.getElementById('jobId').value = job.id;
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobCompany').value = job.company;
    document.getElementById('jobRole').value = job.role;
    document.getElementById('jobType').value = job.listingType;
    document.getElementById('jobPlace').value = job.place || '';
    document.getElementById('jobDescription').value = job.description || '';
    document.getElementById('jobLocation').value = job.location;
    document.getElementById('jobArrangement').value = job.arrangement;
    document.getElementById('jobSalary').value = job.salary;
    document.getElementById('jobSkills').value = job.skills;
    document.getElementById('jobApply').value = job.apply;
    document.getElementById('formHeading').textContent = 'Edit job';
    saveJobButton.textContent = 'Update job';
    document.getElementById('cancelEdit').hidden = false;
    setStatus(adminStatus, '');
    jobForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (button.dataset.action === 'delete' && window.confirm(`Delete “${job.title}” at ${job.company}?`)) {
    if (!db || !jobsAreLive) return setStatus(adminStatus, 'The database is not connected, so changes cannot be saved.', true);
    const { data, error } = await db.from('jobs').delete().eq('id', job.id).select();
    if (error || !data || data.length === 0) return setStatus(adminStatus, describeWriteError(error), true);
    jobs = jobs.filter((item) => item.id !== job.id);
    if (document.getElementById('jobId').value === job.id) resetForm();
    setStatus(adminStatus, 'Job listing deleted.');
    renderJobs();
  }
});

document.getElementById('cancelEdit').addEventListener('click', () => {
  resetForm();
  setStatus(adminStatus, '');
});

function setAdminVisible(isVisible) {
  adminSection.hidden = !isVisible;
  openAdminButton.textContent = isVisible ? 'Close admin console' : 'Open admin console';
  if (isVisible) loadContactRequests();
}

/* ---------- Contact requests (admin) ---------- */

const contactList = document.getElementById('contactList');
const contactCount = document.getElementById('contactCount');
const contactAdminStatus = document.getElementById('contactAdminStatus');
let contactRequests = [];

function renderContactRequests() {
  contactCount.textContent = `(${contactRequests.length})`;
  contactList.innerHTML = contactRequests.map((request) => `
    <div class="admin-list-item">
      <div>
        <strong>${escapeHTML(request.name)}</strong>
        <span class="contact-meta">${escapeHTML(request.mobile)} · ${escapeHTML(request.job_role)} · ${escapeHTML(request.location)}<br>${escapeHTML(new Date(request.created_at).toLocaleString())}</span>
      </div>
      <div class="admin-actions">
        ${request.resume_path ? `<button class="admin-action" type="button" data-action="resume" data-id="${escapeHTML(request.id)}">Resume</button>` : ''}
        <button class="admin-action delete" type="button" data-action="delete-contact" data-id="${escapeHTML(request.id)}">Delete</button>
      </div>
    </div>`).join('') || '<p class="admin-note">No contact requests yet.</p>';
}

async function loadContactRequests() {
  if (!db || !currentProfile?.is_admin) return;
  const { data, error } = await db.from('contact_requests').select('*').order('created_at', { ascending: false });
  if (error) return setStatus(contactAdminStatus, `Could not load contact requests: ${error.message}`, true);
  setStatus(contactAdminStatus, '');
  contactRequests = data;
  renderContactRequests();
}

contactList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const request = contactRequests.find((item) => item.id === button.dataset.id);
  if (!request) return;

  if (button.dataset.action === 'resume') {
    const { data, error } = await db.storage.from('resumes').createSignedUrl(request.resume_path, 120);
    if (error) return setStatus(contactAdminStatus, `Could not open the resume: ${error.message}`, true);
    window.open(data.signedUrl, '_blank', 'noopener');
  } else if (button.dataset.action === 'delete-contact' && window.confirm(`Delete the request from ${request.name}?`)) {
    const { data, error } = await db.from('contact_requests').delete().eq('id', request.id).select();
    if (error || !data || data.length === 0) return setStatus(contactAdminStatus, describeWriteError(error), true);
    if (request.resume_path) await db.storage.from('resumes').remove([request.resume_path]);
    contactRequests = contactRequests.filter((item) => item.id !== request.id);
    renderContactRequests();
  }
});

/* ---------- Accounts (Supabase Auth: mobile number + MPIN) ---------- */

// Supabase Auth needs an email and a password of 6+ characters. The mobile number
// becomes the login identifier and the MPIN is wrapped into the password.
const mobileToEmail = (mobile) => `${mobile}@users.justnowjobs.app`;
const mpinToPassword = (mpin) => `jn-mpin-${mpin}`;

let currentProfile = null;
let showingAdminLogin = false;

function normalizeMobile(value) {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

function isWeakMpin(mpin) {
  const digits = mpin.split('').map(Number);
  const allSame = digits.every((digit) => digit === digits[0]);
  const ascending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1);
  const descending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);
  return allSame || ascending || descending;
}

async function loadProfile() {
  currentProfile = null;
  if (!db) return;
  const { data: sessionData } = await db.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const { data } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
  currentProfile = data || null;
}

function showAccountTab(tab) {
  const isSignup = tab === 'signup';
  signupForm.hidden = !isSignup;
  signinForm.hidden = isSignup;
  tabSignup.classList.toggle('is-active', isSignup);
  tabSignin.classList.toggle('is-active', !isSignup);
  tabSignup.setAttribute('aria-selected', String(isSignup));
  tabSignin.setAttribute('aria-selected', String(!isSignup));
  setStatus(signupStatus, '');
  setStatus(signinStatus, '');
}

function renderAccount() {
  const user = currentProfile;
  const isAdmin = Boolean(user?.is_admin);
  if (isAdmin) showingAdminLogin = false;

  guestView.hidden = Boolean(user) || showingAdminLogin;
  memberView.hidden = !user || isAdmin;
  adminLoginView.hidden = Boolean(user) || !showingAdminLogin;
  adminSessionView.hidden = !isAdmin;
  profileToggle.classList.toggle('is-signed-in', Boolean(user));
  profileToggle.setAttribute('aria-label', user ? `Account: ${user.name}` : 'Sign in or register');

  if (isAdmin) {
    accountEyebrow.textContent = 'ADMINISTRATOR';
    accountTitle.textContent = `Hi, ${user.name.split(' ')[0]}`;
    accountSubtitle.textContent = 'Manage job listings from the admin console.';
  } else if (user) {
    accountEyebrow.textContent = 'YOUR ACCOUNT';
    accountTitle.textContent = `Hi, ${user.name.split(' ')[0]}`;
    accountSubtitle.textContent = 'You are signed in.';
    memberDetails.innerHTML = [['Name', user.name], ['Email', user.email], ['Mobile', user.mobile]]
      .map(([label, value]) => `<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(value)}</td></tr>`)
      .join('');
  } else if (showingAdminLogin) {
    accountEyebrow.textContent = 'ADMINISTRATOR';
    accountTitle.textContent = 'Admin login';
    accountSubtitle.textContent = 'Sign in with the admin mobile number and MPIN.';
  } else {
    accountEyebrow.textContent = 'YOUR ACCOUNT';
    accountTitle.textContent = 'Welcome';
    accountSubtitle.textContent = 'Create an account or sign in with your MPIN.';
  }

  if (!isAdmin) setAdminVisible(false);
}

function describeAuthError(error, fallback) {
  if (error?.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (error?.status === 422 && /disabled/i.test(error?.message || '')) return 'Sign-in is not available: the Email provider is turned off in Supabase Auth settings.';
  if (error?.code === 'email_provider_disabled') return 'Sign-in is not available: the Email provider is turned off in Supabase Auth settings.';
  return fallback;
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const mobile = normalizeMobile(document.getElementById('signupMobile').value);
  const mpin = document.getElementById('signupMpin').value;
  const confirmMpin = document.getElementById('signupMpinConfirm').value;

  if (name.length < 2) return setStatus(signupStatus, 'Enter your full name.', true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus(signupStatus, 'Enter a valid email address.', true);
  if (mobile.length !== 10) return setStatus(signupStatus, 'Enter a valid 10-digit mobile number.', true);
  if (!/^\d{4}$/.test(mpin)) return setStatus(signupStatus, 'MPIN must be exactly 4 digits.', true);
  if (isWeakMpin(mpin)) return setStatus(signupStatus, 'Choose a less predictable MPIN (not 1234, 0000, etc.).', true);
  if (mpin !== confirmMpin) return setStatus(signupStatus, 'MPINs do not match.', true);
  if (!db) return setStatus(signupStatus, 'Could not reach the database. Check your connection.', true);

  const submitButton = signupForm.querySelector('button[type=submit]');
  submitButton.disabled = true;
  const { data, error } = await db.auth.signUp({
    email: mobileToEmail(mobile),
    password: mpinToPassword(mpin),
    options: { data: { name, email, mobile } }
  });
  submitButton.disabled = false;

  if (error) {
    const alreadyUsed = /already|registered|exists/i.test(error.message);
    return setStatus(signupStatus, alreadyUsed
      ? 'An account with this mobile number already exists. Try signing in.'
      : describeAuthError(error, 'Could not create the account. Please try again.'), true);
  }
  if (!data.session) {
    return setStatus(signupStatus, 'Account created, but sign-in is blocked: turn off "Confirm email" in Supabase Auth settings.', true);
  }

  signupForm.reset();
  await loadProfile();
  renderAccount();
});

async function signInWithMobile(mobileInput, mpin) {
  const mobile = normalizeMobile(mobileInput);
  if (mobile.length !== 10 || !/^\d{4}$/.test(mpin)) return { message: 'Enter your mobile number and 4-digit MPIN.' };
  if (!db) return { message: 'Could not reach the database. Check your connection.' };
  const { error } = await db.auth.signInWithPassword({ email: mobileToEmail(mobile), password: mpinToPassword(mpin) });
  if (error) return { message: describeAuthError(error, 'Incorrect mobile number or MPIN.') };
  await loadProfile();
  return null;
}

signinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = signinForm.querySelector('button[type=submit]');
  submitButton.disabled = true;
  const failure = await signInWithMobile(document.getElementById('signinMobile').value, document.getElementById('signinMpin').value);
  submitButton.disabled = false;
  if (failure) return setStatus(signinStatus, failure.message, true);
  signinForm.reset();
  renderAccount();
});

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = document.getElementById('adminLoginSubmit');
  submitButton.disabled = true;
  const failure = await signInWithMobile(document.getElementById('adminMobile').value, document.getElementById('adminMpin').value);
  submitButton.disabled = false;
  if (failure) return setStatus(adminLoginStatus, failure.message, true);

  if (!currentProfile?.is_admin) {
    await db.auth.signOut();
    currentProfile = null;
    return setStatus(adminLoginStatus, 'Incorrect admin mobile number or MPIN, or this account is not an admin.', true);
  }
  adminLoginForm.reset();
  setStatus(adminLoginStatus, '');
  renderAccount();
});

async function signOut() {
  if (db) await db.auth.signOut();
  currentProfile = null;
  renderAccount();
  showAccountTab('signin');
}

document.getElementById('signOutButton').addEventListener('click', signOut);
document.getElementById('adminSignOutButton').addEventListener('click', signOut);

tabSignup.addEventListener('click', () => showAccountTab('signup'));
tabSignin.addEventListener('click', () => showAccountTab('signin'));

document.getElementById('goAdminLogin').addEventListener('click', () => {
  showingAdminLogin = true;
  setStatus(adminLoginStatus, '');
  renderAccount();
});
document.getElementById('backToUserLogin').addEventListener('click', () => {
  showingAdminLogin = false;
  adminLoginForm.reset();
  renderAccount();
});

['signupMpin', 'signupMpinConfirm', 'signinMpin', 'adminMpin'].forEach((id) => {
  document.getElementById(id).addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
  });
});

profileToggle.addEventListener('click', () => {
  renderAccount();
  accountDialog.showModal();
});
document.getElementById('closeAccountDialog').addEventListener('click', () => accountDialog.close());
if (new URLSearchParams(location.search).get('account') === '1') {
  history.replaceState(null, '', location.pathname);
  profileToggle.click();
}
accountDialog.addEventListener('click', (event) => {
  if (event.target === accountDialog) accountDialog.close();
});

openAdminButton.addEventListener('click', () => {
  const isOpening = adminSection.hidden;
  setAdminVisible(isOpening);
  accountDialog.close();
  if (isOpening) adminSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

if (db) {
  // Defer the callback body: calling Supabase inside it can deadlock the auth client.
  db.auth.onAuthStateChange((authEvent) => {
    if (authEvent === 'SIGNED_OUT' || authEvent === 'TOKEN_REFRESHED') {
      setTimeout(async () => {
        await loadProfile();
        renderAccount();
      }, 0);
    }
  });
}

renderJobs();
loadProfile().then(renderAccount);
fetchJobs();
