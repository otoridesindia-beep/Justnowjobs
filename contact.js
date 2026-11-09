const SUPABASE_URL = 'https://ebaziwpmxtmgbllhepqt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o0zxeW01L97UirMOkU3AFg_Nml_uhaW';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('contactStatus');
const submitButton = document.getElementById('contactSubmit');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', isError);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!db) return setStatus('Could not reach the database. Check your connection.', true);

  const name = document.getElementById('contactName').value.trim();
  const mobile = document.getElementById('contactMobile').value.replace(/\D/g, '').slice(-10);
  const jobRole = document.getElementById('contactRole').value.trim();
  const location = document.getElementById('contactLocation').value.trim();
  const file = document.getElementById('contactResume').files[0];

  if (name.length < 2) return setStatus('Enter your name.', true);
  if (mobile.length !== 10) return setStatus('Enter a valid 10-digit mobile number.', true);
  if (jobRole.length < 2) return setStatus('Enter the job role you are looking for.', true);
  if (location.length < 2) return setStatus('Enter your preferred location.', true);
  if (!file) return setStatus('Upload your resume.', true);

  const extension = (file.name.split('.').pop() || '').toLowerCase();
  if (!RESUME_TYPES[extension]) return setStatus('Resume must be a PDF, DOC or DOCX file.', true);
  if (file.size > MAX_RESUME_BYTES) return setStatus('Resume must be 5 MB or smaller.', true);

  submitButton.disabled = true;
  setStatus('Submitting…');

  const resumePath = `${crypto.randomUUID()}.${extension}`;
  const upload = await db.storage.from('resumes').upload(resumePath, file, { contentType: RESUME_TYPES[extension] });
  if (upload.error) {
    submitButton.disabled = false;
    return setStatus(`Could not upload the resume: ${upload.error.message}`, true);
  }

  const { error } = await db.from('contact_requests').insert({
    name, mobile, job_role: jobRole, location, resume_path: resumePath
  });
  submitButton.disabled = false;
  if (error) {
    await db.storage.from('resumes').remove([resumePath]);
    return setStatus(`Could not submit: ${error.message}`, true);
  }

  form.reset();
  setStatus('Thank you! We have received your details and will contact you soon.');
});
