(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  // This runs alongside whatever your existing site.js already does
  // (opening the pre-filled WhatsApp message) — it does not replace it.
  form.addEventListener('submit', function () {
    const name = document.getElementById('cf-name')?.value || '';
    const phone = document.getElementById('cf-phone')?.value || '';
    const message = document.getElementById('cf-message')?.value || '';
    if (!message) return;
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message }),
    }).catch(() => {});
  });
})();
