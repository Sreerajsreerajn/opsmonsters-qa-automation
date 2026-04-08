require('./commands');

Cypress.on('uncaught:exception', (err) => {
  const ignored = ['ResizeObserver loop', 'Non-Error promise rejection', 'ChunkLoadError'];
  if (ignored.some(msg => err.message && err.message.includes(msg))) return false;
  return false;
});
