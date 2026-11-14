const SUPABASE_URL = 'https://ebaziwpmxtmgbllhepqt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o0zxeW01L97UirMOkU3AFg_Nml_uhaW';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

const searchInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const locationFilter = document.getElementById('locationFilter');
const typeFilter = document.getElementById('typeFilter');
const stateFilter = document.getElementById('stateFilter');
const jobStateSelect = document.getElementById('jobState');
const INDIAN_STATES = ['Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
INDIAN_STATES.forEach((name) => {
  stateFilter.add(new Option(name, name));
  jobStateSelect.add(new Option(name, name));
});
const jobsList = document.getElementById('jobsList');
const resultCount = document.getElementById('resultCount');
const emptyState = document.getElementById('emptyState');
const jobsNotice = document.querySelector('.disclaimer');
const savedJobsToggle = document.getElementById('savedJobsToggle');
const savedJobCount = document.getElementById('savedJobCount');
const savedJobsStatus = document.getElementById('savedJobsStatus');
const jobShareStatus = document.getElementById('jobShareStatus');
const shareDialog = document.getElementById('shareDialog');
const shareDialogMessage = document.getElementById('shareDialogMessage');
const shareDialogMessageLabel = document.getElementById('shareDialogMessageLabel');
const shareDialogStatus = document.getElementById('shareDialogStatus');
const shareWhatsApp = document.getElementById('shareWhatsApp');
const moreShareOptions = document.getElementById('moreShareOptions');
let currentShareData = null;
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

const roleLabels = {};
const roleClasses = {};
const SAVED_JOBS_KEY = 'hyrnex-saved-jobs';
let savedJobIds = new Set();
let savedJobsStorageAvailable = true;
let savedJobsOnly = false;
let activeCategory = 'all';
const NON_IT_ROLES = new Set(['HR Executive', 'Sales Executive', 'Marketing Executive', 'Accountant', 'Customer Support', 'Operations Executive', 'Business Development', 'Admin / Back Office', 'Other Non-IT']);
const categoryOf = (role) => (NON_IT_ROLES.has(role) ? 'Non-IT' : 'IT');
let savedJobsLoadError = '';

try {
  const savedJobs = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]');
  if (!Array.isArray(savedJobs) || savedJobs.some((id) => typeof id !== 'string')) {
    throw new Error('Saved jobs data is invalid.');
  }
  savedJobIds = new Set(savedJobs);
} catch (error) {
  savedJobsStorageAvailable = false;
  savedJobsLoadError = `Could not load saved jobs: ${error instanceof Error ? error.message : String(error)}`;
}

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

if (savedJobsLoadError) setStatus(savedJobsStatus, savedJobsLoadError, true);

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

/* ---------- Daily interview question ---------- */

const dailyQuestionPrompt = document.getElementById('dailyQuestionPrompt');
const dailyQuestionDate = document.getElementById('dailyQuestionDate');
const dailyQuestionAnswerText = document.getElementById('dailyQuestionAnswerText');
const dailyQuestionAnswer = document.getElementById('dailyQuestionAnswer');
const dailyQuestionToggle = document.getElementById('dailyQuestionToggle');
const dailyQuestionStatus = document.getElementById('dailyQuestionStatus');
const today = new Date();
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
dailyQuestionDate.dateTime = todayDate;
dailyQuestionDate.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(today);
dailyQuestionPrompt.textContent = 'Loading today’s interview question…';
dailyQuestionToggle.hidden = true;
dailyQuestionAnswer.hidden = true;

function renderDailyQuestion(question) {
  if (!question) {
    dailyQuestionPrompt.textContent = 'No interview question has been published for today yet.';
    dailyQuestionToggle.hidden = true;
    dailyQuestionAnswer.hidden = true;
    dailyQuestionDate.dateTime = todayDate;
    dailyQuestionDate.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(today);
    return;
  }

  const [year, month, day] = question.publish_date.split('-').map(Number);
  const publishDate = new Date(year, month - 1, day);
  dailyQuestionPrompt.textContent = question.question;
  dailyQuestionAnswerText.textContent = question.answer;
  dailyQuestionDate.dateTime = question.publish_date;
  dailyQuestionDate.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(publishDate);
  dailyQuestionAnswer.hidden = true;
  dailyQuestionToggle.hidden = false;
  dailyQuestionToggle.setAttribute('aria-expanded', 'false');
  dailyQuestionToggle.innerHTML = 'Reveal answer guide <span aria-hidden="true">↓</span>';
}

async function loadDailyQuestion() {
  if (!db) {
    renderDailyQuestion(null);
    setStatus(dailyQuestionStatus, 'Daily questions are unavailable because the database is not connected.', true);
    return;
  }
  const { data, error } = await db.from('daily_questions')
    .select('question, answer, publish_date')
    .eq('publish_date', todayDate)
    .maybeSingle();
  if (error) {
    renderDailyQuestion(null);
    return setStatus(dailyQuestionStatus, `Could not load today’s question: ${error.message}`, true);
  }
  setStatus(dailyQuestionStatus, '');
  renderDailyQuestion(data);
}

dailyQuestionToggle.addEventListener('click', () => {
  const isExpanded = dailyQuestionToggle.getAttribute('aria-expanded') === 'true';
  dailyQuestionToggle.setAttribute('aria-expanded', String(!isExpanded));
  dailyQuestionAnswer.hidden = isExpanded;
  dailyQuestionToggle.innerHTML = isExpanded
    ? 'Reveal answer guide <span aria-hidden="true">↓</span>'
    : 'Hide answer guide <span aria-hidden="true">↑</span>';
});

/* ---------- Daily question admin ---------- */

const dailyQuestionForm = document.getElementById('dailyQuestionForm');
const dailyQuestionId = document.getElementById('dailyQuestionId');
const dailyQuestionPublishDate = document.getElementById('dailyQuestionPublishDate');
const dailyQuestionAdminPrompt = document.getElementById('dailyQuestionAdminPrompt');
const dailyQuestionAdminAnswer = document.getElementById('dailyQuestionAdminAnswer');
const dailyQuestionFormHeading = document.getElementById('dailyQuestionFormHeading');
const saveDailyQuestionButton = document.getElementById('saveDailyQuestion');
const dailyQuestionAdminStatus = document.getElementById('dailyQuestionAdminStatus');
const dailyQuestionListStatus = document.getElementById('dailyQuestionListStatus');
const dailyQuestionAdminList = document.getElementById('dailyQuestionAdminList');
const dailyQuestionAdminCount = document.getElementById('dailyQuestionAdminCount');
const cancelDailyQuestionEdit = document.getElementById('cancelDailyQuestionEdit');
let adminDailyQuestions = [];

function resetDailyQuestionForm() {
  dailyQuestionForm.reset();
  dailyQuestionId.value = '';
  dailyQuestionPublishDate.value = todayDate;
  dailyQuestionFormHeading.textContent = 'Post a daily interview question';
  saveDailyQuestionButton.textContent = 'Publish question';
  cancelDailyQuestionEdit.hidden = true;
}

function renderDailyQuestionAdminList() {
  dailyQuestionAdminCount.textContent = `(${adminDailyQuestions.length})`;
  dailyQuestionAdminList.innerHTML = adminDailyQuestions.map((question) => `
    <div class="admin-list-item">
      <div><strong>${escapeHTML(question.publish_date)} · ${escapeHTML(question.question)}</strong><span>${escapeHTML(question.answer)}</span></div>
      <div class="admin-actions">
        <button class="admin-action" type="button" data-action="edit-question" data-id="${escapeHTML(question.id)}">Edit</button>
        <button class="admin-action delete" type="button" data-action="delete-question" data-id="${escapeHTML(question.id)}">Delete</button>
      </div>
    </div>`).join('') || '<p class="admin-note">No daily questions yet. Publish one using the form above.</p>';
}

async function loadDailyQuestionAdminList() {
  if (!db || !currentProfile?.is_admin) return;
  setStatus(dailyQuestionListStatus, 'Loading scheduled questions…');
  const { data, error } = await db.from('daily_questions')
    .select('id, question, answer, publish_date')
    .order('publish_date', { ascending: false });
  if (error) return setStatus(dailyQuestionListStatus, `Could not load scheduled questions: ${error.message}`, true);
  adminDailyQuestions = data;
  setStatus(dailyQuestionListStatus, '');
  renderDailyQuestionAdminList();
}

dailyQuestionPublishDate.value = todayDate;

dailyQuestionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!db || !currentProfile?.is_admin) return setStatus(dailyQuestionAdminStatus, 'Admin sign-in and a database connection are required.', true);

  const question = {
    publish_date: dailyQuestionPublishDate.value,
    question: dailyQuestionAdminPrompt.value.trim(),
    answer: dailyQuestionAdminAnswer.value.trim(),
    created_by: currentProfile.id
  };
  if (!question.publish_date || question.question.length < 10 || question.answer.length < 10) {
    return setStatus(dailyQuestionAdminStatus, 'Enter a publish date, a question, and an answer guide (at least 10 characters each).', true);
  }

  saveDailyQuestionButton.disabled = true;
  const query = dailyQuestionId.value
    ? db.from('daily_questions').update(question).eq('id', dailyQuestionId.value).select()
    : db.from('daily_questions').upsert(question, { onConflict: 'publish_date' }).select();
  const { data, error } = await query;
  saveDailyQuestionButton.disabled = false;
  if (error || !data || data.length === 0) {
    return setStatus(dailyQuestionAdminStatus, `Could not publish the question: ${error?.message || 'No question was saved.'}`, true);
  }

  resetDailyQuestionForm();
  setStatus(dailyQuestionAdminStatus, 'Daily question published.');
  await loadDailyQuestionAdminList();
  await loadDailyQuestion();
});

cancelDailyQuestionEdit.addEventListener('click', () => {
  resetDailyQuestionForm();
  setStatus(dailyQuestionAdminStatus, '');
});

dailyQuestionAdminList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const question = adminDailyQuestions.find((item) => item.id === button.dataset.id);
  if (!question) return;

  if (button.dataset.action === 'edit-question') {
    dailyQuestionId.value = question.id;
    dailyQuestionPublishDate.value = question.publish_date;
    dailyQuestionAdminPrompt.value = question.question;
    dailyQuestionAdminAnswer.value = question.answer;
    dailyQuestionFormHeading.textContent = 'Edit daily interview question';
    saveDailyQuestionButton.textContent = 'Save changes';
    cancelDailyQuestionEdit.hidden = false;
    setStatus(dailyQuestionAdminStatus, '');
    dailyQuestionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    dailyQuestionPublishDate.focus();
    return;
  }

  if (button.dataset.action === 'delete-question' && window.confirm(`Delete the interview question for ${question.publish_date}?`)) {
    if (!db || !currentProfile?.is_admin) return setStatus(dailyQuestionListStatus, 'Admin sign-in and a database connection are required.', true);
    const { data, error } = await db.from('daily_questions').delete().eq('id', question.id).select();
    if (error || !data || data.length === 0) {
      return setStatus(dailyQuestionListStatus, `Could not delete the question: ${error?.message || 'No question was deleted.'}`, true);
    }
    if (dailyQuestionId.value === question.id) resetDailyQuestionForm();
    setStatus(dailyQuestionListStatus, 'Question deleted.');
    await loadDailyQuestionAdminList();
    if (question.publish_date === todayDate) await loadDailyQuestion();
  }
});

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
    state: row.state || '',
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
    state: job.state,
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

let jobs = [];
let jobsAreLive = false;

async function fetchJobs() {
  if (!db) {
    jobsNotice.textContent = 'Could not reach the database. Please check your connection and refresh.';
    return;
  }
  const { data, error } = await db.from('jobs').select('*').order('created_at', { ascending: false });
  if (error) {
    jobsNotice.textContent = 'Could not load live listings. Please refresh and try again.';
    return;
  }
  jobs = data.map(rowToJob);
  jobsAreLive = true;
  jobsNotice.textContent = 'Browse current opportunities on the Hyrnex jobs board.';
  renderJobs();
}

function getSearchText(job) {
  return `${job.title} ${job.company} ${job.skills} ${job.location} ${job.role}`.toLowerCase();
}

function renderJobs() {
  savedJobCount.textContent = savedJobIds.size;
  savedJobsToggle.setAttribute('aria-pressed', String(savedJobsOnly));
  savedJobsToggle.disabled = !savedJobsStorageAvailable;
  jobsList.innerHTML = jobs.map((job) => {
    const roleClass = roleClasses[job.role] || '';
    const logoClass = job.logoClass || '';
    const logoMark = job.logoMark || job.company.charAt(0).toUpperCase();
    const isSaved = savedJobIds.has(String(job.id));
    return `
      <article class="job-card" data-job-id="${escapeHTML(job.id)}" data-role="${escapeHTML(job.role)}" data-type="${escapeHTML(job.listingType)}" data-location="${escapeHTML(job.location)}" data-state="${escapeHTML(job.state)}" data-search="${escapeHTML(getSearchText(job))}">
        <div class="company-logo ${escapeHTML(logoClass)}">${escapeHTML(logoMark)}${job.logoAccent ? `<span>${escapeHTML(job.logoAccent)}</span>` : ''}</div>
        <div class="job-main"><div class="job-meta"><span class="role-tag ${roleClass}">${escapeHTML(roleLabels[job.role] || job.role)}</span>${job.listingType !== 'Posting' ? `<span class="type-tag">${escapeHTML(job.listingType)}</span>` : ''}<span class="posted">${escapeHTML(job.posted || 'Just now')}</span><button class="save-job-button${isSaved ? ' is-saved' : ''}" type="button" data-action="toggle-save" data-job-id="${escapeHTML(job.id)}" aria-label="${isSaved ? 'Remove' : 'Save'} ${escapeHTML(job.title)}" aria-pressed="${isSaved}"${savedJobsStorageAvailable ? '' : ' disabled'}><span aria-hidden="true">${isSaved ? '★' : '☆'}</span>${isSaved ? 'Saved' : 'Save'}</button><button class="share-job-button" type="button" data-job-id="${escapeHTML(job.id)}" aria-label="Share ${escapeHTML(job.title)} at ${escapeHTML(job.company)}" title="Share job"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"></path></svg></button></div><h3>${escapeHTML(job.title)}</h3><p class="company">${escapeHTML(job.company)} <span>·</span> ${escapeHTML([job.place, job.state].filter(Boolean).join(', ') || job.location)}</p></div>
        <div class="job-details"><span>${escapeHTML(job.arrangement)}</span><strong>${escapeHTML(job.salary)}</strong></div>
        <a class="apply-link" href="${escapeHTML(job.apply)}">View role <span aria-hidden="true">↗</span></a>
        <div class="job-share-feedback job-card-share-feedback" hidden>
          <p role="status" aria-live="polite"></p>
        </div>
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
  const state = stateFilter.value;
  let visibleCount = 0;

  jobsList.querySelectorAll('.job-card').forEach((card) => {
    const matchesSearch = !query || card.dataset.search.includes(query);
    const matchesCategory = activeCategory === 'all' || categoryOf(card.dataset.role) === activeCategory;
    const matchesRole = role === 'all' || card.dataset.role === role;
    const matchesLocation = location === 'all' || card.dataset.location === location;
    const matchesType = type === 'all' || card.dataset.type === type;
    const matchesState = state === 'all' || card.dataset.state === state;
    const matchesSaved = !savedJobsOnly || savedJobIds.has(card.dataset.jobId);
    const isVisible = matchesSearch && matchesCategory && matchesRole && matchesLocation && matchesType && matchesState && matchesSaved;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  resultCount.textContent = visibleCount;
  emptyState.hidden = visibleCount !== 0;
  if (visibleCount === 0) {
    emptyState.textContent = savedJobsOnly && savedJobIds.size === 0
      ? 'No saved jobs yet. Use the Save button on a role to keep it here.'
      : savedJobsOnly
        ? 'No saved jobs match those filters. Try changing your search or filters.'
        : 'No roles match those filters. Try a different search.';
  }
}

function shareJob(job, card) {
  const feedback = card.querySelector('.job-card-share-feedback');
  const status = feedback.querySelector('[role="status"]');
  jobsList.querySelectorAll('.job-card-share-feedback').forEach((item) => { item.hidden = true; });
  setStatus(status, '');
  const showStatus = (message, isError = false) => {
    feedback.hidden = false;
    setStatus(status, message, isError);
  };
  if (!jobsAreLive) {
    return showStatus('Sample jobs cannot be shared. Please try again when live listings are available.', true);
  }
  if (!/^https?:$/.test(location.protocol)) {
    return showStatus('Sharing requires the website to be hosted online.', true);
  }
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('job', String(job.id));
  url.hash = 'jobs';
  const shareUrl = url.href;
  const description = String(job.description || '').replace(/\s+/g, ' ').trim();
  const characters = Array.from(description);
  const summary = characters.length > 180
    ? `${characters.slice(0, 179).join('').trimEnd()}…`
    : description || [job.arrangement, job.place || job.location].filter(Boolean).join(' · ');
  const shareText = [`${job.title} at ${job.company}`, summary, 'Find this opportunity on Hyrnex:'].filter(Boolean).join('\n');
  const shareMessage = `${shareText}\n${shareUrl}`;

  currentShareData = { title: `${job.title} at ${job.company} | Hyrnex`, text: shareText, url: shareUrl };
  shareWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  shareDialogMessage.value = shareMessage;
  shareDialogMessageLabel.hidden = true;
  moreShareOptions.hidden = typeof navigator.share !== 'function';
  setStatus(shareDialogStatus, '');
  shareDialog.showModal();
}

document.getElementById('copyShareMessage').addEventListener('click', async () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareDialogMessage.value);
      shareDialogMessageLabel.hidden = true;
      return setStatus(shareDialogStatus, 'Job message copied.');
    } catch (error) {
      console.warn('Could not copy the job message:', error);
    }
  }
  shareDialogMessageLabel.hidden = false;
  setStatus(shareDialogStatus, 'Could not copy automatically. Select and copy the message below.', true);
  shareDialogMessage.focus();
  shareDialogMessage.select();
});

moreShareOptions.addEventListener('click', async () => {
  if (!currentShareData || typeof navigator.share !== 'function') {
    return setStatus(shareDialogStatus, 'Device sharing is unavailable. Use WhatsApp or copy the message.', true);
  }
  try {
    await navigator.share(currentShareData);
  } catch (error) {
    if (error.name !== 'AbortError') setStatus(shareDialogStatus, 'Could not open device sharing. Use WhatsApp or copy the message.', true);
  }
});

document.getElementById('closeShareDialog').addEventListener('click', () => shareDialog.close());
shareDialog.addEventListener('click', (event) => {
  if (event.target === shareDialog) shareDialog.close();
});

jobsList.addEventListener('click', (event) => {
  const shareButton = event.target.closest('.share-job-button');
  if (shareButton) {
    const job = jobs.find((item) => String(item.id) === shareButton.dataset.jobId);
    if (job) shareJob(job, shareButton.closest('.job-card'));
    else setStatus(jobShareStatus, 'This job is no longer available.', true);
    return;
  }
  const saveButton = event.target.closest('.save-job-button');
  if (saveButton) {
    const jobId = saveButton.dataset.jobId;
    const job = jobs.find((item) => String(item.id) === jobId);
    if (!job) return;

    const nextSavedJobIds = new Set(savedJobIds);
    const isSaved = nextSavedJobIds.has(jobId);
    if (isSaved) nextSavedJobIds.delete(jobId);
    else nextSavedJobIds.add(jobId);

    try {
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(nextSavedJobIds)));
    } catch (error) {
      savedJobsStorageAvailable = false;
      savedJobsToggle.disabled = true;
      setStatus(savedJobsStatus, `Could not update saved jobs: ${error instanceof Error ? error.message : String(error)}`, true);
      renderJobs();
      return;
    }

    savedJobIds = nextSavedJobIds;
    setStatus(savedJobsStatus, isSaved ? `${job.title} removed from saved jobs.` : `${job.title} saved for later.`);
    renderJobs();
    return;
  }

  const viewLink = event.target.closest('.apply-link');
  if (!viewLink) return;
  event.preventDefault();

  const card = viewLink.closest('.job-card');
  const job = jobs.find((item) => String(item.id) === card.dataset.jobId);
  if (!job) return;

  openJobDialog(job);
});

function openJobDialog(job) {
  jobDialogTitle.textContent = job.title;
  jobDialogCompany.textContent = job.company;
  const details = [
    ['Listing type', job.listingType],
    ['Role type', roleLabels[job.role] || job.role],
    ['Location', job.place || 'Not specified'],
    ['State', job.state || 'Not specified'],
    ['Work mode', job.location],
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
}

document.getElementById('closeJobDialog').addEventListener('click', () => jobDialog.close());
document.getElementById('backToJobs').addEventListener('click', () => jobDialog.close());
jobDialog.addEventListener('click', (event) => {
  if (event.target === jobDialog) jobDialog.close();
});

searchInput.addEventListener('input', filterJobs);
roleFilter.addEventListener('change', filterJobs);
function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.category-tab').forEach((tab) => {
    const isActive = tab.dataset.category === category;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  roleFilter.querySelectorAll('optgroup').forEach((group) => {
    group.hidden = category !== 'all' && group.dataset.category !== category;
    group.disabled = group.hidden;
  });
  if (roleFilter.selectedOptions[0]?.parentElement.disabled) roleFilter.value = 'all';
  filterJobs();
}
document.querySelectorAll('.category-tab').forEach((tab) => {
  tab.addEventListener('click', () => setCategory(tab.dataset.category));
});
locationFilter.addEventListener('change', filterJobs);
typeFilter.addEventListener('change', filterJobs);
stateFilter.addEventListener('change', filterJobs);
savedJobsToggle.addEventListener('click', () => {
  savedJobsOnly = !savedJobsOnly;
  savedJobsToggle.setAttribute('aria-pressed', String(savedJobsOnly));
  filterJobs();
});
document.getElementById('clearFilters').addEventListener('click', () => {
  searchInput.value = '';
  typeFilter.value = 'all';
  roleFilter.value = 'all';
  locationFilter.value = 'all';
  stateFilter.value = 'all';
  savedJobsOnly = false;
  savedJobsToggle.setAttribute('aria-pressed', 'false');
  setCategory('all');
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

function syncJobRoleOptions(preferredRole) {
  const category = document.getElementById('jobCategory').value;
  const roleSelect = document.getElementById('jobRole');
  roleSelect.querySelectorAll('optgroup').forEach((group) => {
    group.hidden = group.dataset.category !== category;
    group.disabled = group.hidden;
  });
  const options = [...roleSelect.querySelectorAll('optgroup:not([disabled]) option')];
  roleSelect.value = (options.find((o) => o.value === preferredRole) || options[0]).value;
}
document.getElementById('jobCategory').addEventListener('change', () => syncJobRoleOptions());
syncJobRoleOptions();

function resetForm() {
  jobForm.reset();
  syncJobRoleOptions();
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
    state: jobStateSelect.value,
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
    document.getElementById('jobCategory').value = categoryOf(job.role);
    syncJobRoleOptions(job.role);
    document.getElementById('jobType').value = job.listingType;
    document.getElementById('jobPlace').value = job.place || '';
    jobStateSelect.value = job.state || '';
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
    showAdminTab(document.getElementById('tabPost'));
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
  if (isVisible) {
    loadContactRequests();
    loadDailyQuestionAdminList();
  }
}

const adminTabs = Array.from(document.querySelectorAll('.admin-tab'));

function showAdminTab(tab, focus = false) {
  adminTabs.forEach((item) => {
    const isActive = item === tab;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-selected', String(isActive));
    item.tabIndex = isActive ? 0 : -1;
    document.getElementById(item.dataset.panel).hidden = !isActive;
  });
  if (focus) tab.focus();
}

adminTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showAdminTab(tab));
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (step) {
      event.preventDefault();
      showAdminTab(adminTabs[(index + step + adminTabs.length) % adminTabs.length], true);
    }
  });
});

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

// A leading apostrophe stops spreadsheets from running cells that start with = + - @ as formulas.
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

document.getElementById('downloadContactsCsv').addEventListener('click', () => {
  if (contactRequests.length === 0) return setStatus(contactAdminStatus, 'There are no contact requests to download.', true);
  const header = ['Name', 'Mobile', 'Job role', 'Location', 'Resume file', 'Submitted'];
  const rows = contactRequests.map((request) => [
    request.name, request.mobile, request.job_role, request.location,
    request.resume_path || '', new Date(request.created_at).toLocaleString()
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contact-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(contactAdminStatus, `Downloaded ${contactRequests.length} request${contactRequests.length === 1 ? '' : 's'}.`);
});

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
// Keep this legacy auth identifier so existing accounts can still sign in.
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
jobDialogApply.addEventListener('click', (event) => {
  if (currentProfile) return;
  event.preventDefault();
  jobDialog.close();
  showingAdminLogin = false;
  renderAccount();
  showAccountTab('signup');
  setStatus(signupStatus, 'Please sign up or sign in to apply for this role.');
  accountDialog.showModal();
});
if (new URLSearchParams(location.search).get('account') === '1') {
  const url = new URL(location.href);
  url.searchParams.delete('account');
  history.replaceState(null, '', url.href);
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
loadDailyQuestion();
fetchJobs().then(() => {
  const sharedJobId = new URLSearchParams(location.search).get('job');
  if (!sharedJobId) return;
  if (!jobsAreLive) return setStatus(jobShareStatus, 'Could not load the shared job. Please try again when live listings are available.', true);
  const job = jobs.find((item) => String(item.id) === sharedJobId);
  if (job) openJobDialog(job);
  else setStatus(jobShareStatus, 'This shared job is no longer available.', true);
});
