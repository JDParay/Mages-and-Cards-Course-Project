function handleMenu(destination) {
  console.log("Navigating to: " + destination);
  
  if(destination === 'START') {
    alert("Loading Chapter Select...");
    // This is where you'd swap the HTML to show your Chapter Select screen
  }
}

function openOptions() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('options-modal').style.display = 'block';
}

function openCredits() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('credits-modal').style.display = 'block';
}

function closeModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('options-modal').style.display = 'none';
    document.getElementById('credits-modal').style.display = 'none';
}

document.querySelectorAll('input[name="gfx"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const pattern = document.querySelector('.body-before-selector'); // your background class
        if (e.target.value === 'low') {
            pattern.style.display = 'none'; // Save performance
        } else {
            pattern.style.display = 'block';
        }
    });
});
