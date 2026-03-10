function handleMenu(destination) {
  console.log("Navigating to: " + destination);
  
  if(destination === 'START') {
    alert("Loading Chapter Select...");
    // This is where you'd swap the HTML to show your Chapter Select screen
  }
}

function openOptions() {
    document.body.classList.add('modal-active');
    document.getElementById('options-modal').classList.add('show');
}

function openCredits() {
    document.body.classList.add('modal-active');
    document.getElementById('credits-modal').classList.add('show');
}

function closeModals() {
    document.body.classList.remove('modal-active');
    document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('show'));
}
