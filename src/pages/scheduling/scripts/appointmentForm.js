// appointmentForm.js
import { initCustomCalendar } from '../../../components/customCalendar/lenCalendarPlugin';
import { API_BASE_URL } from '../../../config.js';

document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.getElementById('appointmentForm');

    // Step elements
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');

    // Navigation buttons
    const next1 = document.getElementById('next-1');
    const next2 = document.getElementById('next-2');
    const mobileback2 = document.getElementById('mobile-back-2');
    const back3 = document.getElementById('back-3'); // "Back" button in Step 3

    const goReviewBtn = document.getElementById('go-review'); // "Review" button in Step 3
    const backToCalendar = document.getElementById('back-to-calendar'); // "Back to Calendar" in Step 4
    const finalSubmit = document.getElementById('final-submit'); // "Submit" button in Step 4

    // Client Info Inputs
    const clientInputs = document.querySelectorAll('#firstName, #lastName, #streetAddress, #city, #state, #zip, #clientPhone, #clientEmail');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientEmailInput = document.getElementById('clientEmail');
    const emailError = document.getElementById('emailError');
    const phoneError = document.getElementById('phoneError');

    // Horse Info Container and Button
    const horseContainer = document.getElementById('horse-info-container');
    const addHorseBtn = document.getElementById('add-horse-btn');
    const next2Btn = next2; // Alias for clarity

    // Calendar App + Step 3 UI
    const calendarApp = document.getElementById('calendar-app');
    const calendarUI = document.getElementById('calendar-ui');

    // Step 4 Review
    const reviewStep = document.getElementById('step-4');
    const reviewDetailsDiv = document.getElementById('review-details');

    // Track up to 3 selected slots
    let selectedSlots = [];

    let autocompleteSuggestions = [];
    const streetAddressInput = document.getElementById('streetAddress');
    const datalist = document.getElementById('address-suggestions');
    let debounceTimer; // for input debouncing

    streetAddressInput.addEventListener('input', () => {
      const inputVal = streetAddressInput.value.trim();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (inputVal.length < 3) {
        datalist.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/autocomplete?input=${encodeURIComponent(inputVal)}`);
          const data = await resp.json();
          if (data.error) {
            console.error('Autocomplete Error:', data.error);
            datalist.innerHTML = '';
            return;
          }
          autocompleteSuggestions = data;
          datalist.innerHTML = '';
          data.forEach(prediction => {
            const option = document.createElement('option');
            option.value = prediction.description;
            option.dataset.placeId = prediction.place_id;
            datalist.appendChild(option);
          });
        } catch (err) {
          console.error('Autocomplete Fetch Error:', err);
          datalist.innerHTML = '';
        }
      }, 300);
    });

    // If user selects an autocomplete suggestion => get place details
    streetAddressInput.addEventListener('change', async () => {
      const selectedValue = streetAddressInput.value;
      const selection = autocompleteSuggestions.find(p => p.description === selectedValue);
      if (!selection) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/api/place-details?place_id=${encodeURIComponent(selection.place_id)}`);
        const data = await resp.json();
        if (data.error) {
          console.error('Place Details Error:', data.error);
          return;
        }

        const addressComponents = data.address_components || [];
        let number = '';
        let route = '';
        let locCity = '';
        let locState = '';
        let locZip = '';

        addressComponents.forEach(c => {
          if (c.types.includes('street_number')) number = c.long_name;
          if (c.types.includes('route')) route = c.long_name;
          if (c.types.includes('locality')) locCity = c.long_name;
          if (c.types.includes('administrative_area_level_1')) locState = c.short_name;
          if (c.types.includes('postal_code')) locZip = c.long_name;
        });

        const fullStreet = number ? number + ' ' + route : route;
        if (fullStreet) streetAddressInput.value = fullStreet;
        if (locCity) document.getElementById('city').value = locCity;
        if (locState) document.getElementById('state').value = locState;
        if (locZip) document.getElementById('zip').value = locZip;

        checkClientFormCompleteness();
      } catch (err) {
        console.error('Place Details Fetch Error:', err);
      }
    });

    // ========== CLEAVE.JS FOR PHONE NUMBER FORMATTING ==========
    new Cleave('#clientPhone', {
        phone: true,
        phoneRegionCode: 'US',
    });

    // ========== HELPER: Check Client Form Completeness ==========
    function checkClientFormCompleteness() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const streetAddress = document.getElementById('streetAddress').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const clientEmail = clientEmailInput.value.trim();

        // Patterns
        const zipPattern = /^\d{5}$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneDigits = clientPhone.replace(/\D/g, '');

        // Validation flags
        let isValid = true;

        // Validate required fields
        if (!firstName || !lastName || !streetAddress || !city || !state || !zip || !clientPhone || !clientEmail) {
            isValid = false;
        }

        // Validate ZIP
        if (!zipPattern.test(zip)) {
            isValid = false;
        }

        // Validate Email
        if (!emailPattern.test(clientEmail)) {
            emailError.style.display = 'block';
            isValid = false;
        } else {
            emailError.style.display = 'none';
        }

        // Validate Phone
        if (phoneDigits.length !== 10) {
            phoneError.style.display = 'block';
            isValid = false;
        } else {
            phoneError.style.display = 'none';
        }

        // Enable or disable Next button
        next1.disabled = !isValid;
    }

    // ========== HELPER: Check Horse Form Completeness ==========
    function checkHorseFormCompleteness() {
        const horseBlocks = horseContainer.querySelectorAll('.horse-info-block');
        let atLeastOneValid = false;

        horseBlocks.forEach(block => {
            const nameInput = block.querySelector('input[name="horseName[]"]');
            const occupationSelect = block.querySelector('select[name="horseOccupation[]"]');
            const lastCareInput = block.querySelector('input[name="horseLastCare[]"]');
            const lamHistSelect = block.querySelector('select.laminitis-history');
            const specNeedsSelect = block.querySelector('select.special-needs-history');

            const nameOk = nameInput && nameInput.value.trim() !== '';
            const occupationOk = occupationSelect && occupationSelect.value;
            const lastCareOk = lastCareInput && lastCareInput.value;
            const lamOk = lamHistSelect && lamHistSelect.value;
            const specOk = specNeedsSelect && specNeedsSelect.value;

            if (nameOk && occupationOk && lastCareOk && lamOk && specOk) {
                atLeastOneValid = true;
            }
        });

        // Enable or disable Next button
        next2Btn.disabled = !atLeastOneValid;
    }

    // ========== SHOW/HIDE CONDITIONAL FIELDS ==========
    function initHorseBlockEvents(horseBlock) {
        // Remove button
        const removeBtn = horseBlock.querySelector('.remove-horse-btn');
        removeBtn.addEventListener('click', () => {
            horseBlock.remove();
            checkHorseFormCompleteness();
        });

        // Listen for changes in this block to re-check completeness
        horseBlock.querySelectorAll('input, select, textarea')
            .forEach(el => el.addEventListener('change', checkHorseFormCompleteness));

        // Laminitis toggle
        const laminitisSelect = horseBlock.querySelector('.laminitis-history');
        const laminitisDetails = horseBlock.querySelector('.laminitis-details');
        if (laminitisSelect && laminitisDetails) {
            laminitisSelect.addEventListener('change', () => {
                if (laminitisSelect.value === 'Yes') {
                    laminitisDetails.style.display = 'block';
                } else {
                    laminitisDetails.style.display = 'none';
                }
                checkHorseFormCompleteness();
            });
        }

        // If "Do you have x-rays" = yes => show x-ray upload (Laminitis)
        const lamXraySelect = horseBlock.querySelector('.laminitis-xray-select');
        const lamXrayUpload = horseBlock.querySelector('.laminitis-xray-upload');
        if (lamXraySelect && lamXrayUpload) {
            lamXraySelect.addEventListener('change', () => {
                lamXrayUpload.style.display = (lamXraySelect.value === 'Yes') ? 'block' : 'none';
                checkHorseFormCompleteness();
            });
        }

        // Special needs toggle
        const specialNeedsSelect = horseBlock.querySelector('.special-needs-history');
        const specialNeedsDetails = horseBlock.querySelector('.special-needs-details');
        if (specialNeedsSelect && specialNeedsDetails) {
            specialNeedsSelect.addEventListener('change', () => {
                specialNeedsDetails.style.display = (specialNeedsSelect.value === 'Yes') ? 'block' : 'none';
                checkHorseFormCompleteness();
            });
        }

        // If "Do you have x-rays" for special needs = yes => show x-ray upload
        const spXraySelect = horseBlock.querySelector('.special-needs-xray-select');
        const spXrayUpload = horseBlock.querySelector('.special-needs-xray-upload');
        if (spXraySelect && spXrayUpload) {
            spXraySelect.addEventListener('change', () => {
                spXrayUpload.style.display = (spXraySelect.value === 'Yes') ? 'block' : 'none';
                checkHorseFormCompleteness();
            });
        }
    }

    // ========== INITIALIZE HORSE BLOCK EVENTS ==========
    function initializeInitialHorseBlock() {
        const initialBlocks = horseContainer.querySelectorAll('.horse-info-block');
        initialBlocks.forEach(block => initHorseBlockEvents(block));
    }
    initializeInitialHorseBlock();

    // ========== EVENT LISTENERS FOR CLIENT INFO ==========
    clientInputs.forEach(ci => {
        ci.addEventListener('input', checkClientFormCompleteness);
        ci.addEventListener('change', checkClientFormCompleteness);
    });

    // ========== ADDING MORE HORSES ==========
    if (addHorseBtn) {
        addHorseBtn.addEventListener('click', () => {
        const newBlock = document.createElement('div');
        newBlock.classList.add('horse-info-block');
        newBlock.innerHTML = `
            <button type="button" class="remove-horse-btn" title="Remove Horse"><i class="fas fa-times"></i></button>
    
            <div class="horse-info-columns">
                <div class="form-group">
                    <label>Name:<span class="required-asterisk">*</span></label>
                    <input type="text" name="horseName[]" required />
                </div>
    
                <div class="form-group">
                    <label>Breed:</label>
                    <input type="text" name="horseBreed[]" />
                </div>
    
                <div class="form-group">
                    <label>Age:</label>
                    <input type="number" name="horseAge[]" min="0" />
                </div>
    
                <div class="form-group">
                    <label>Sex:</label>
                    <select name="horseSex[]">
                        <option value="" disabled selected>Select</option>
                        <option value="Mare">Mare</option>
                        <option value="Gelding">Gelding</option>
                        <option value="Stallion">Stallion</option>
                    </select>
                </div>
    
                <div class="form-group">
                    <label>Occupation:<span class="required-asterisk">*</span></label>
                    <select name="horseOccupation[]" required>
                        <option value="" disabled selected>Select</option>
                        <option value="Working">Working</option>
                        <option value="Hunting / Packing">Hunting/Packing</option>
                        <option value="Jumping / Eventing">Jumping/Eventing</option>
                        <option value="Trail Riding">Trail Riding</option>
                        <option value="Retired / Pasture Pet">Retired/Pasture Pet</option>
                    </select>
                </div>
    
                <div class="form-group">
                    <label>Date of Last Farrier Care:<span class="required-asterisk">*</span></label>
                    <input type="date" name="horseLastCare[]" required />
                </div>
            </div>
    
            <!-- Laminitis History -->
            <div class="form-group">
                <label>History of Laminitis?:<span class="required-asterisk">*</span></label>
                <select class="laminitis-history" name="laminitisHistory[]" required>
                    <option value="" disabled selected>Select</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
            <div class="conditional-group laminitis-details">
                <div class="form-group">
                    <label>Is your horse currently in an active laminitic episode?:</label>
                    <select name="laminitisActive[]">
                        <option value="No" selected>No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Your horse's veterinarian (name/practice):</label>
                    <input type="text" name="laminitisVet[]" />
                </div>

                <div class="form-group">
                    <label>Do you have x-rays of the current laminitic episode?:</label>
                    <select class="laminitis-xray-select" name="laminitisXray[]">
                        <option value="No" selected>No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>
                <div class="form-group conditional-group laminitis-xray-upload">
                    <label>Upload X-ray images:</label>
                    <input type="file" name="laminitisXrayFile[]" multiple accept="image/*" />
                </div>
            </div><!-- End Laminitis Details -->
    
            <!-- Special farrier needs? -->
            <div class="form-group">
                <label>Any known medical issues or special farrier needs?:<span class="required-asterisk">*</span></label>
                <select class="special-needs-history" name="specialNeedsHistory[]" required>
                    <option value="" disabled selected>Select</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                </select>
            </div>
            <div class="conditional-group special-needs-details">
                <div class="form-group">
                    <label>Please explain your horse’s special needs:</label>
                    <textarea name="specialNeedsExplain[]" rows="2"></textarea>
                </div>
            </div>
        `;
    
        horseContainer.appendChild(newBlock);
        initHorseBlockEvents(newBlock);
        checkHorseFormCompleteness();
        });
    }

    // STEP NAVIGATION LOGIC
    // ========== "Next" BUTTON FROM STEP 1 TO STEP 2 ==========
    next1.addEventListener('click', () => {
        step1.style.display = 'none';
        step2.style.display = 'block';
        window.scrollTo(0, 0);
        checkHorseFormCompleteness();
    });

    // ========== "Back" and "Next" BUTTONS FROM STEP 2 TO STEP 1 & 3 ==========
    function addNavigationButtonsStep2() {
        // Only add the desktop navigation if the viewport is wider than 575.98px
        if (window.innerWidth > 575.98) {
          // Create navigation container and tag it as desktop-only.
          const navDiv = document.createElement('div');
          navDiv.classList.add('form-navigation', 'desktop-nav');
      
          // Create "Back" button.
          const back2 = document.createElement('button');
          back2.type = 'button';
          back2.id = 'back-2';
          back2.classList.add('btn', 'btn-back');
          back2.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
          back2.addEventListener('click', () => {
            step2.style.display = 'none';
            step1.style.display = 'block';
            window.scrollTo(0, 0);
          });
      
          // Append "Back" and "Next" buttons to navigation container.
          navDiv.appendChild(back2);
          navDiv.appendChild(next2); // next2 is assumed to be the desktop "Next" button.
      
          // Append navigation container to step2 fieldset.
          document.querySelector('#step-2 fieldset').appendChild(navDiv);
        }
    }

    // Replace the existing "Back" button appending with this function call
    addNavigationButtonsStep2();

    // If the mobile back button exists (i.e. in mobile view), add an event listener:
    if (mobileback2) {
        mobileback2.addEventListener('click', () => {
        // Go back from Step 2 (Horse Info) to Step 1 (Client Info)
        step2.style.display = 'none';
        step1.style.display = 'block';
        window.scrollTo(0, 0);
        });
    }

    // ========== "Next" BUTTON FROM STEP 2 TO STEP 3 ==========
    next2.addEventListener('click', () => {
        step2.style.display = 'none';
        step3.style.display = 'block';
        window.scrollTo(0, 0);
    
        initCalendar();
    });

    // ========== "Back" BUTTON FROM STEP 3 TO STEP 2 ==========
    back3.addEventListener('click', () => {
      step3.style.display = 'none';
      step2.style.display = 'block';
      window.scrollTo(0, 0);
    });

    // ========== "Review" BUTTON FROM STEP 3 TO STEP 4 ==========
    goReviewBtn.addEventListener('click', () => {
        step3.style.display = 'none';
        step4.style.display = 'block';
        window.scrollTo(0, 0);

        // Populate the #review-details with a summary
        populateReviewSummary();
    });

    // ========== "Back to Calendar" BUTTON ON STEP 4 ==========
    backToCalendar.addEventListener('click', () => {
        step4.style.display = 'none';
        step3.style.display = 'block';
        window.scrollTo(0, 0);

        initCalendar();
    });

    // ========== REAL-TIME VALIDATION FOR EMAIL ==========
    clientEmailInput.addEventListener('input', () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailError.style.display = emailPattern.test(clientEmailInput.value.trim()) ? 'none' : 'block';
        checkClientFormCompleteness();
    });

    // ========== REAL-TIME VALIDATION FOR PHONE ==========
    clientPhoneInput.addEventListener('input', () => {
        const phoneDigits = clientPhoneInput.value.replace(/\D/g, '');
        phoneError.style.display = (phoneDigits.length === 10) ? 'none' : 'block';
        checkClientFormCompleteness();
    });

    // ========== FORM SUBMISSION (FROM STEP 4) ==========
    finalSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            client: {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                address: `${document.getElementById('streetAddress').value.trim()}, ${document.getElementById('city').value.trim()}`,
                phone: document.getElementById('clientPhone').value.trim(),
                email: document.getElementById('clientEmail').value.trim()
            },
            horses: Array.from(horseContainer.querySelectorAll('.horse-info-block')).map(block => ({
                name: block.querySelector('[name="horseName[]"]').value,
                breed: block.querySelector('[name="horseBreed[]"]').value,
                occupation: block.querySelector('[name="horseOccupation[]"]').value,
                lastCare: block.querySelector('[name="horseLastCare[]"]').value,
                laminitisHistory: block.querySelector('[name="laminitisHistory[]"]').value,
                specialNeeds: block.querySelector('[name="specialNeedsHistory[]"]').value,
                xrayUrl: block.querySelector('[name="laminitisXrayFile[]"]')?.files[0]?.name || '' // Will be replaced with actual S3 URL
            })),
            selectedSlots: selectedSlots.map(slot => ({
                date: slot.date.toISOString(),
                hour: slot.hour
            }))
        };

        try {
            // 1. Upload X-rays first (if any)
            const xrayUploads = [];
            const xrayFiles = Array.from(document.querySelectorAll('[name="laminitisXrayFile[]"]')).filter(
                input => input.files.length > 0
            );
            
            for (const fileInput of xrayFiles) {
                const formDataToUpload = new FormData();
                formDataToUpload.append('xray', fileInput.files[0]);
                
                // 1) Capture the response
                const uploadResponse = await fetch(`${API_BASE_URL}/api/upload-xray`, {
                  method: 'POST',
                  body: formDataToUpload,
                });
              
                // 2) Parse JSON
                const { url } = await uploadResponse.json();
              
                // 3) Store the S3 URL
                xrayUploads.push(url);
            }

            // 2. Update formData with actual S3 URLs
            let xrayIndex = 0;
            formData.horses = formData.horses.map(horse => {
                if (horse.xrayUrl) {
                    return { ...horse, xrayUrl: xrayUploads[xrayIndex++] };
                }
                return horse;
            });

            // 3. Submit appointment data
            const response = await fetch(`${API_BASE_URL}/api/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Submission failed');

            // Success handling
            window.location.href = '/confirmation.html';
            
        } catch (error) {
            console.error('Submission error:', error);
            alert('Submission failed. Please check your connection and try again.');
        }
    });

    // ========== HELPER: Highlight the chosen time slot in the UI ==========
    // (Minor Error 2) => We'll skip letting user select if the date is .proximity-red
    // We'll fix it inside lenCalendarPlugin showTimeSlotsForDay or onTimeSelect check
    // We'll do it in onTimeSelect as well, see below:

    function onTimeSlotClicked(date, hour) {
      const dateKey = formatDateKey(date);
      const cell = calendarUI.querySelector(`[data-date="${dateKey}"]`);

      // MINOR Error 2 => If cell is .proximity-red => disallow
      if (cell && cell.classList.contains('proximity-red')) {
        alert("We are out of your area on this date. For emergencies, please call (707) 740-3925");
        return;
      }

      // The toggling logic remains the same as before
      const idx = selectedSlots.findIndex(s => s.date.getTime() === date.getTime() && s.hour === hour);
      if (idx >= 0) {
        // Unselect
        selectedSlots.splice(idx, 1);
        unHighlightSlot(date, hour);
        goReviewBtn.disabled = (selectedSlots.length === 0);
      } else {
        if (selectedSlots.length >= 3) {
          alert("You can only select up to 3 times. Please deselect one first.");
          return;
        }
        selectedSlots.push({ date, hour });
        highlightSelectedSlot(date, hour);
        goReviewBtn.disabled = false;
      }
    }
    
      /**
       * [NEW] If the user unselects a slot, remove the highlight from the calendar cell,
       * remove the label text, etc.
       */
    function unHighlightSlot(dateObj, hour) {
        const dateKey = formatDateKey(dateObj);
        const cell = calendarUI.querySelector(`[data-date="${dateKey}"]`);
        if (cell) {
          // If there are no more selected hours on this date, remove .selected-date
          // Otherwise, keep it
          const stillSelectedThisDate = selectedSlots.some(
            (s) => formatDateKey(s.date) === dateKey
          );
          if (!stillSelectedThisDate) {
            cell.classList.remove('selected-date');
          }
    
          // Remove any label for this specific hour
          const labelDiv = cell.querySelector('.day-selected-labels');
          if (labelDiv) {
            // We find a <span> with the matching text or data-h attribute
            const hourSpan = labelDiv.querySelector(`[data-hour="${hour}"]`);
            if (hourSpan) {
              hourSpan.remove();
            }
            // If no spans remain, remove the container
            if (!labelDiv.querySelector('span')) {
              labelDiv.remove();
            }
          }
        }
    
        // Also remove the highlight from any popup time-slot that says "hour:00"
        const allTimeSlots = document.querySelectorAll('.time-slot');
        allTimeSlots.forEach((div) => {
          if (div.dataset && div.dataset.date === dateKey && div.dataset.hour == hour) {
            div.classList.remove('selected');
          }
        });
    }
    
      /**
       * [CHANGED] highlightSelectedSlot now also adds a "requested" label on the date cell
       * in a `.day-selected-labels` container, exactly like city labels do.
       */
      function highlightSelectedSlot(dateObj, hour) {
        const dateKey = formatDateKey(dateObj);
        const cell = calendarUI.querySelector(`[data-date="${dateKey}"]`);
        if (cell) {
            cell.classList.add('selected-date');
    
            // 1) Append a small label. We'll keep them separate from city-badges
            // but similar approach:
            let labelDiv = cell.querySelector('.day-selected-labels');
            if (!labelDiv) {
                labelDiv = document.createElement('div');
                labelDiv.classList.add('day-selected-labels');
                cell.appendChild(labelDiv);
            }
            // Check if we already have a label for that hour
            let hourSpan = labelDiv.querySelector(`[data-hour="${hour}"]`);
            if (!hourSpan) {
                hourSpan = document.createElement('span');
                hourSpan.classList.add('selected-slot-badge');
                hourSpan.dataset.hour = hour; // So we can remove it if unselected
                hourSpan.textContent = `${formatTimeRange(hour)} requested`; // Updated to use 12-hour format
                labelDiv.appendChild(hourSpan);
            }
        }
    
        // 2) If the popup is open, find the specific time-slot div
        // Now that we want to track the date, let's store data attributes
        const timeSlotDivs = document.querySelectorAll('.time-slot');
        timeSlotDivs.forEach((div) => {
            // We'll check data-date & data-hour
            if (
                div.dataset.date === dateKey &&
                parseInt(div.dataset.hour, 10) === hour
            ) {
                div.classList.add('selected');
            }
        });
    }
    
      /**
       * [CHANGED] We'll pass `onCalendarRendered`, so that when the calendar re-draws,
       * we highlight any previously selected slots. We'll also store data attributes
       * (date, hour) on each .time-slot div so we can automatically highlight them.
       */
    function initCalendar() {
      const streetAddress = document.getElementById('streetAddress').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value;
      const zip = document.getElementById('zip').value.trim();
      const fullAddress = `${streetAddress}, ${city}, ${state} ${zip}`;

      initCustomCalendar(calendarUI, {
        startHour: 8,
        endHour: 17,
        proximityModuleOptions: { userAddress: fullAddress },

        // If a cell is "red", we skip selection => see Minor Error 2 fix
        onTimeSelect: ({ date, hour }) => {
          onTimeSlotClicked(date, hour);
        },

        onCalendarRendered: () => {
          // Re-highlight
          selectedSlots.forEach(({ date, hour }) => {
            highlightSelectedSlot(date, hour);
          });
          goReviewBtn.disabled = selectedSlots.length < 1;
        },

        selectedSlots: selectedSlots,
      });
    }

    // ========== HELPER: Step 4 Summary ==========
    function populateReviewSummary() {
      // Clear existing content
      reviewDetailsDiv.innerHTML = '';
  
      // 1) Summarize Client Info
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const phone = document.getElementById('clientPhone').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const address = document.getElementById('streetAddress').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value;
      const zip = document.getElementById('zip').value.trim();
  
      // Create Client Info Section with Two Columns
      const clientSection = document.createElement('div');
      clientSection.classList.add('review-client-info');
      clientSection.innerHTML = `
          <div class="client-info-column">
              <h4>Your Information</h4>
              <p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</p>
          </div>
          <div class="client-info-column">
              <h4>Contact Information</h4>
              <p><strong>Phone:</strong> ${phone}</p>
              <p><strong>Email:</strong> ${email}</p>
          </div>
      `;
      reviewDetailsDiv.appendChild(clientSection);
  
      // Append Edit Button Below Client Info
      const editClientBtn = document.createElement('button');
      editClientBtn.type = 'button';
      editClientBtn.classList.add('btn', 'btn-back', 'edit-section');
      editClientBtn.setAttribute('data-target', 'step-1');
      editClientBtn.textContent = 'Edit Client Info';
      reviewDetailsDiv.appendChild(editClientBtn);
  
      // Add Horizontal Rule
      reviewDetailsDiv.appendChild(document.createElement('hr'));
  
      // 2) Summarize Horse Info with Enhanced Details
  
      // Create and append the Horse Information Header
      const horseHeader = document.createElement('h4');
      horseHeader.textContent = 'Horse Information';
      horseHeader.style.color = 'gold'; // Ensure it matches existing styles
      reviewDetailsDiv.appendChild(horseHeader);
  
      // Create the Horses Grid Container
      const horseSection = document.createElement('div');
      horseSection.classList.add('review-horses-grid');
  
      const horseBlocks = horseContainer.querySelectorAll('.horse-info-block');
      horseBlocks.forEach((block, index) => {
          const name = block.querySelector('input[name="horseName[]"]').value.trim();
          const breed = block.querySelector('input[name="horseBreed[]"]').value.trim();
          const occupation = block.querySelector('select[name="horseOccupation[]"]').value;
          const lastCare = block.querySelector('input[name="horseLastCare[]"]').value;
          const lamHistory = block.querySelector('select[name="laminitisHistory[]"]').value;
          const specialNeeds = block.querySelector('select[name="specialNeedsHistory[]"]').value;
  
          horseSection.innerHTML += `
              <div class="review-horse-card">
                  <p><strong>Horse #${index + 1} Name:</strong> ${name}</p>
                  <p><strong>Breed:</strong> ${breed}</p>
                  <p><strong>Occupation:</strong> ${occupation}</p>
                  <p><strong>Date of Last Farrier Care:</strong> ${lastCare}</p>
                  <p><strong>History of Laminitis:</strong> ${lamHistory}</p>
                  <p><strong>Special Farrier Needs:</strong> ${specialNeeds}</p>
              </div>
          `;
      });
  
      reviewDetailsDiv.appendChild(horseSection);
  
      // Append Edit Button Below Horse Info
      const editHorseBtn = document.createElement('button');
      editHorseBtn.type = 'button';
      editHorseBtn.classList.add('btn', 'btn-back', 'edit-section');
      editHorseBtn.setAttribute('data-target', 'step-2');
      editHorseBtn.textContent = 'Edit Horse Info';
      reviewDetailsDiv.appendChild(editHorseBtn);
  
      // Add Horizontal Rule
      reviewDetailsDiv.appendChild(document.createElement('hr'));
  
      // 3) Summarize Selected Time Slots
      const timesSection = document.createElement('div');
      timesSection.innerHTML = `<h4>Requested Appointment Times (Up to 3)</h4>`;
  
      if (selectedSlots.length === 0) {
          timesSection.innerHTML += `<p>No times selected. Please return to the Calendar to request your appointment.</p>`;
      } else {
          // Create a Flex container for appointment slots
          const appointmentsGrid = document.createElement('div');
          appointmentsGrid.classList.add('review-appointments-grid');
  
          selectedSlots.forEach((slot, idx) => {
              const dateStr = slot.date.toDateString(); // e.g., "Mon Sep 06 2023"
              const timeRange = formatTimeRange(slot.hour); // e.g., "8:00 AM - 9:00 AM"
  
              appointmentsGrid.innerHTML += `
                  <div class="review-appointment-card">
                      <p><strong>Slot #${idx + 1}:</strong></p>
                      <p>${dateStr}</p>
                      <p>${timeRange}</p>
                  </div>
              `;
          });
  
          timesSection.appendChild(appointmentsGrid);
      }
  
      reviewDetailsDiv.appendChild(timesSection);
  
      // Append Edit Button Below Time Slots
      const editTimeBtn = document.createElement('button');
      editTimeBtn.type = 'button';
      editTimeBtn.classList.add('btn', 'btn-back', 'edit-section');
      editTimeBtn.setAttribute('data-target', 'step-3');
      editTimeBtn.textContent = 'Edit Calendar';
      reviewDetailsDiv.appendChild(editTimeBtn);
  
      // Add Event Listeners to "Edit" Buttons
      reviewDetailsDiv.querySelectorAll('.edit-section').forEach(btn => {
          btn.addEventListener('click', () => {
              const target = btn.getAttribute('data-target');
              step4.style.display = 'none';
              if (target === 'step-1') {
                  step1.style.display = 'block';
              } else if (target === 'step-2') {
                  step2.style.display = 'block';
              } else if (target === 'step-3') {
                  step3.style.display = 'block';
              }
              window.scrollTo(0, 0);
          });
      });
    }
  
    // UTILITY
    function formatTime(hour) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      return `${formattedHour}:00 ${period}`;
    }
    
    function formatTimeRange(hour) {
        return `${formatTime(hour)} - ${formatTime(hour + 1)}`;
    }

    function formatDateKey(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    // INITIAL checks
    checkClientFormCompleteness();
    checkHorseFormCompleteness();

});