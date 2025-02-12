//mobileHorseFormAdjuster.js
document.addEventListener('DOMContentLoaded', function() {
  // Only execute mobile-specific logic if the viewport width is small.
  const isMobile = window.innerWidth <= 575.98;
  if (!isMobile) return;

  // ===============================
  // Create the Modal Container
  // ===============================
  const modalContainer = document.createElement('div');
  modalContainer.id = 'horse-info-modal';
  modalContainer.className = 'horse-info-modal';
  modalContainer.innerHTML = `
    <div class="horse-info-modal-content">
      <button type="button" id="modal-close" class="modal-close">&times;</button>
      <div id="modal-step-container">
        <!-- Step 0: Basic Horse Info -->
        <div class="modal-step">
          <h3>Basic Horse Info</h3>
          <label for="modal-horse-name">Name:<span class="required-asterisk">*</span></label>
          <input type="text" id="modal-horse-name" required>
          
          <label for="modal-horse-breed">Breed:</label>
          <input type="text" id="modal-horse-breed">
          
          <label for="modal-horse-age">Age:</label>
          <input type="number" id="modal-horse-age" min="0">
          
          <label for="modal-horse-sex">Sex:</label>
          <select id="modal-horse-sex">
            <option value="" disabled selected>Select</option>
            <option value="Mare">Mare</option>
            <option value="Gelding">Gelding</option>
            <option value="Stallion">Stallion</option>
          </select>
          
          <label for="modal-horse-occupation">Occupation:<span class="required-asterisk">*</span></label>
          <select id="modal-horse-occupation" required>
            <option value="" disabled selected>Select</option>
            <option value="Working">Working</option>
            <option value="Hunting / Packing">Hunting/Packing</option>
            <option value="Jumping / Eventing">Jumping/Eventing</option>
            <option value="Trail Riding">Trail Riding</option>
            <option value="Retired / Pasture Pet">Retired/Pasture Pet</option>
          </select>
          
          <label for="modal-horse-lastcare">Date of Last Farrier Care:<span class="required-asterisk">*</span></label>
          <input type="date" id="modal-horse-lastcare" required>
        </div>
        
        <!-- Step 1: Laminitis Information -->
        <div class="modal-step">
          <h3>Laminitis Information</h3>
          <label for="modal-horse-laminitis">History of Laminitis?:<span class="required-asterisk">*</span></label>
          <select id="modal-horse-laminitis" required>
            <option value="" disabled selected>Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          
          <!-- Wrap all additional laminitis questions in a container -->
          <div id="modal-laminitis-conditional" class="conditional-group">
            <label for="modal-horse-laminitis-active">Is your horse currently in an active laminitic episode?:</label>
            <select id="modal-horse-laminitis-active">
              <option value="No" selected>No</option>
              <option value="Yes">Yes</option>
            </select>
            
            <label for="modal-horse-laminitis-vet">Your horse's veterinarian (name/practice)?:</label>
            <input type="text" id="modal-horse-laminitis-vet">
            
            <label for="modal-horse-laminitis-xray">Do you have x-rays of the current laminitic episode?:</label>
            <select id="modal-horse-laminitis-xray">
              <option value="No" selected>No</option>
              <option value="Yes">Yes</option>
            </select>
            
            <div id="modal-laminitis-xray-upload" class="conditional-group">
              <label for="modal-horse-laminitis-xray-upload">Upload X-ray images:</label>
              <input type="file" id="modal-horse-laminitis-xray-upload" multiple accept="image/*">
            </div>
          </div>
        </div>
        
        <!-- Step 2: Special Needs -->
        <div class="modal-step">
          <h3>Special Needs</h3>
          <label for="modal-horse-special-needs">Any other (non-laminitic) known medical issues or special farrier needs?:<span class="required-asterisk">*</span></label>
          <select id="modal-horse-special-needs" required>
            <option value="" disabled selected>Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          
          <div id="modal-special-needs-details" class="conditional-group">
            <label for="modal-horse-special-explain">Please explain your horse’s special needs:</label>
            <textarea id="modal-horse-special-explain" rows="2"></textarea>
            
            <label for="modal-horse-special-vet">Your horse's veterinarian (name/practice)?:</label>
            <input type="text" id="modal-horse-special-vet">
            
            <label for="modal-horse-special-xray">Do you have x-rays pertaining to this condition?:</label>
            <select id="modal-horse-special-xray">
              <option value="No" selected>No</option>
              <option value="Yes">Yes</option>
            </select>
            
            <div id="modal-special-xray-upload" class="conditional-group">
              <label for="modal-horse-special-xray-upload">Upload X-ray images:</label>
              <input type="file" id="modal-horse-special-xray-upload" multiple accept="image/*">
            </div>
          </div>
        </div>
      </div>
      <!-- Modal Navigation Buttons -->
      <div class="modal-navigation">
        <button type="button" id="modal-back" class="btn btn-back">Back</button>
        <button type="button" id="modal-next" class="btn btn-next" disabled>Next</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalContainer);

  // =====================================
  // Query Mobile & Modal Elements
  // =====================================
  const mobileAddBtn = document.getElementById('mobile-add-horse');
  const mobileHorseList = document.getElementById('mobile-horse-list');
  const mobileHorseNextBtn = document.getElementById('mobile-horse-next');
  const mobileHorseBackBtn = document.getElementById('mobile-horse-back'); // if it exists

  const horseModal = document.getElementById('horse-info-modal');
  const modalClose = document.getElementById('modal-close');
  const modalNextBtn = document.getElementById('modal-next');
  const modalBackBtn = document.getElementById('modal-back');
  const modalSteps = document.querySelectorAll('#modal-step-container .modal-step');

  // =====================================
  // Attach Conditional Toggle Listeners
  // (Place these immediately after the modal is in the DOM)
  // =====================================
  const modalLaminitisSelect = document.getElementById('modal-horse-laminitis');
  const modalLaminitisConditional = document.getElementById('modal-laminitis-conditional');
  
  if (modalLaminitisSelect && modalLaminitisConditional) {
    modalLaminitisConditional.style.display = 'none';
    
    modalLaminitisSelect.addEventListener('change', () => {
      if (modalLaminitisSelect.value === 'Yes') {
        modalLaminitisConditional.style.display = 'block';
      } else {
        modalLaminitisConditional.style.display = 'none';
      }
    });
  }

  const modalLaminitisXraySelect = document.getElementById('modal-horse-laminitis-xray');
  const modalLaminitisXrayUploadInner = document.getElementById('modal-laminitis-xray-upload');

  if (modalLaminitisXraySelect && modalLaminitisXrayUploadInner) {
    modalLaminitisXrayUploadInner.style.display = 'none';
    
    modalLaminitisXraySelect.addEventListener('change', function() {
      if (modalLaminitisXraySelect.value === 'Yes') {
        modalLaminitisXrayUploadInner.style.display = 'block';
      } else {
        modalLaminitisXrayUploadInner.style.display = 'none';
      }
    });
  }

  const modalSpecialNeedsSelect = document.getElementById('modal-horse-special-needs');
  const modalSpecialNeedsDetails = document.getElementById('modal-special-needs-details');

  if (modalSpecialNeedsSelect && modalSpecialNeedsDetails) {
    modalSpecialNeedsDetails.style.display = 'none';

    modalSpecialNeedsSelect.addEventListener('change', () => {
      if (modalSpecialNeedsSelect.value === 'Yes') {
        modalSpecialNeedsDetails.style.display = 'block';
      } else {
        modalSpecialNeedsDetails.style.display = 'none';
      }
    });
  }

  const modalSpecialXraySelect = document.getElementById('modal-horse-special-xray');
  const modalSpecialXrayContainer = document.getElementById('modal-special-xray-upload');

  if (modalSpecialXraySelect && modalSpecialXrayContainer) {
    modalSpecialXrayContainer.style.display = 'none';

    modalSpecialXraySelect.addEventListener('change', () => {
      if (modalSpecialXraySelect.value === 'Yes') {
        modalSpecialXrayContainer.style.display = 'block';
      } else {
        modalSpecialXrayContainer.style.display = 'none';
      }
    });
  }

  // =====================================
  // State Variables
  // =====================================
  let currentModalStep = 0;
  let currentEditingIndex = null;
  let mobileHorseData = [];

  // =====================================
  // Helper Functions
  // =====================================
  function updateModalStepVisibility() {
    modalSteps.forEach((step, index) => {
      step.style.display = index === currentModalStep ? 'block' : 'none';
    });
    modalBackBtn.style.display = currentModalStep === 0 ? 'none' : 'inline-block';
  }

  function updateModalNextState() {
    let valid = true;
    if (currentModalStep === 0) {
      const name = document.getElementById('modal-horse-name').value.trim();
      const occupation = document.getElementById('modal-horse-occupation').value;
      const lastCare = document.getElementById('modal-horse-lastcare').value;
      valid = name && occupation && lastCare;
    } else if (currentModalStep === 1) {
      const lam = document.getElementById('modal-horse-laminitis').value;
      valid = !!lam;
    } else if (currentModalStep === 2) {
      const special = document.getElementById('modal-horse-special-needs').value;
      valid = !!special;
    }
    modalNextBtn.disabled = !valid;
  }

  const modalInputs = document.querySelectorAll('#horse-info-modal input, #horse-info-modal select, #horse-info-modal textarea');
  modalInputs.forEach(input => {
    input.addEventListener('input', updateModalNextState);
    input.addEventListener('change', updateModalNextState);
  });

  function openHorseModal(editIndex = null) {
    currentEditingIndex = editIndex;
    currentModalStep = 0;
    updateModalStepVisibility();
    updateModalNextState();
    horseModal.style.display = 'flex';
  }

  function closeHorseModal() {
    horseModal.style.display = 'none';
  }

  modalNextBtn.addEventListener('click', () => {
    if (currentModalStep < modalSteps.length - 1) {
      currentModalStep++;
      updateModalStepVisibility();
      updateModalNextState();
    } else {
      const newHorse = {
        name: document.getElementById('modal-horse-name').value.trim(),
        breed: document.getElementById('modal-horse-breed').value.trim(),
        age: document.getElementById('modal-horse-age').value,
        sex: document.getElementById('modal-horse-sex').value,
        occupation: document.getElementById('modal-horse-occupation').value,
        lastCare: document.getElementById('modal-horse-lastcare').value,
        laminitis: document.getElementById('modal-horse-laminitis').value,
        laminitisActive: document.getElementById('modal-horse-laminitis-active').value,
        laminitisVet: document.getElementById('modal-horse-laminitis-vet').value.trim(),
        laminitisXray: document.getElementById('modal-horse-laminitis-xray').value,
        specialNeeds: document.getElementById('modal-horse-special-needs').value,
        specialExplain: document.getElementById('modal-horse-special-explain').value.trim(),
        specialVet: document.getElementById('modal-horse-special-vet').value.trim(),
        specialXray: document.getElementById('modal-horse-special-xray').value
      };
      if (currentEditingIndex !== null) {
        mobileHorseData[currentEditingIndex] = newHorse;
      } else {
        mobileHorseData.push(newHorse);
      }
      updateMobileHorseList();
      closeHorseModal();
      mobileHorseNextBtn.disabled = mobileHorseData.length === 0;
    }
  });

  modalBackBtn.addEventListener('click', () => {
    if (currentModalStep > 0) {
      currentModalStep--;
      updateModalStepVisibility();
      updateModalNextState();
    }
  });

  modalClose.addEventListener('click', closeHorseModal);

  if (mobileAddBtn) {
    mobileAddBtn.addEventListener('click', () => {
      openHorseModal(null);
    });
  }

  function updateMobileHorseList() {
    mobileHorseList.innerHTML = '';
    mobileHorseData.forEach((horse, index) => {
      // Create the container square
      const square = document.createElement('div');
      square.classList.add('mobile-horse-square');
  
      // Create a span for the horse name
      const nameSpan = document.createElement('span');
      nameSpan.textContent = horse.name || 'Unnamed';
      square.appendChild(nameSpan);
  
      // Create the delete button (an "x")
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('mobile-horse-delete');
      deleteBtn.innerHTML = '&times;';
  
      // Attach event listener so that clicking the delete button shows a confirmation popup.
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent triggering the edit modal
        if (window.confirm("Are you sure you want to delete this horse?")) {
          mobileHorseData.splice(index, 1);
          updateMobileHorseList();
          mobileHorseNextBtn.disabled = mobileHorseData.length === 0;
        }
      });
      
      // Append the delete button to the square
      square.appendChild(deleteBtn);
      
      // Clicking the square itself opens the modal for editing
      square.addEventListener('click', () => {
        openHorseModal(index);
      });
      
      mobileHorseList.appendChild(square);
    });
  }

  mobileHorseNextBtn.addEventListener('click', () => {
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    step2.style.display = 'none';
    step3.style.display = 'block';
    window.scrollTo(0, 0);
  });
  
  window.mobileHorseData = mobileHorseData;
});