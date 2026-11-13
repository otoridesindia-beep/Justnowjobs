(() => {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('service-worker.js').catch((error) => {
      console.error('Could not register the Hyrnex service worker:', error);
    });
  }

  if (!/Android/i.test(navigator.userAgent) || window.matchMedia('(display-mode: standalone)').matches) return;

  let installPrompt = null;
  const footer = document.querySelector('footer');
  if (!footer) return;

  const container = document.createElement('div');
  container.className = 'install-app';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'install-app-button';
  button.textContent = 'Install Hyrnex';
  const status = document.createElement('span');
  status.className = 'install-app-status';
  status.setAttribute('role', 'status');
  container.append(button, status);
  footer.appendChild(container);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    status.textContent = '';
  });

  button.addEventListener('click', async () => {
    if (!installPrompt) {
      status.textContent = 'Open your browser menu and choose Install app or Add to Home screen.';
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome !== 'accepted') {
        status.textContent = 'To install later, use Install app or Add to Home screen in your browser menu.';
      }
    } catch (error) {
      console.error('Could not open the installation prompt:', error);
      status.textContent = 'Could not open the install prompt. Try Install app or Add to Home screen in your browser menu.';
    }
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    container.remove();
  });
})();
