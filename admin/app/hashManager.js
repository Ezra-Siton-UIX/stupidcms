// Hash Management with Unsaved Changes Protection
// Handles navigation with dirty state tracking

let previousHash = window.location.hash || '#/';
let isDirtyCallback = null;

function initHashManager(isDirtyFunction) {
  isDirtyCallback = isDirtyFunction;
  previousHash = window.location.hash;
}

function getPreviousHash() {
  return previousHash;
}

function updatePreviousHash() {
  previousHash = window.location.hash;
}

function navigateWithUnsavedCheck(newHash) {
  if (isDirtyCallback && isDirtyCallback()) {
    const message = 'Your changes will not be saved. Are you sure you want to leave this page?';
    if (!window.confirm(message)) {
      return false; // Stay on current page
    }
  }
  window.location.hash = newHash;
  previousHash = newHash;
  return true;
}

window.hashManager = {
  initHashManager,
  getPreviousHash,
  updatePreviousHash,
  navigateWithUnsavedCheck
};
