// lenCalendarPlugin.js

import './lenCalendarStyles.css';
import { API_BASE_URL } from '../../config.js';
import { initTooltipModule } from "./modules/tooltipModule.js";

/**
 * Fetch busy slots from your Apps Script endpoint:
 * "busy" array includes { start, end, city, allDay }
 */
async function fetchBusySlots(startDate, endDate) {
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  const url = `${API_BASE_URL}/api/calendar/busy-slots?start=${startStr}&end=${endStr}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    console.error("[fetchBusySlots] Error in server response:", data.error);
    throw new Error(data.error);
  }
  return data.busy; 
}

export function initCustomCalendar(container, options = {}) {
  const {
    startHour = 8,
    endHour = 17,
    onTimeSelect = () => {},
    onFetchEventsError = () => {},
    proximityModuleOptions = null,
    onCalendarRendered = () => {},
    selectedSlots = [],
    useTooltipModule = true,
  } = options;

  let currentDate = new Date();
  let busySlotsMap = {};
  let tooltipModule = null;
  let activeCell = null; // **1. Track the currently active cell**
  console.log("[initCustomCalendar] Tooltip module enabled:", useTooltipModule);

  const calendarInstance = {
    async getScheduledCities() {
      try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const busySlots = await fetchBusySlots(startOfMonth, endOfMonth);
        const cities = {};

        busySlots.forEach(slot => {
          const dateKey = new Date(slot.start).toISOString().split('T')[0];
          if (!cities[dateKey]) {
            cities[dateKey] = { name: [] };
          }
          if (slot.city) {
            cities[dateKey].name.push(slot.city);
          }
        });
        return cities;
      } catch (error) {
        console.error("Error fetching scheduled cities:", error);
        return {};
      }
    },
    getCellByDate(dateKey) {
      const cell = container.querySelector(`[data-date="${dateKey}"]`);
      if (!cell) {
        console.warn(`[getCellByDate] No cell found for date: ${dateKey}`);
      }
      return cell;
    }
  };

  async function updateProximityOnRender() {
    if (proximityModuleOptions && proximityModuleOptions.userAddress) {
      const { updateCalendarColors } = await import("./modules/proximityModule.js");
      const monthYearKey = getMonthYearKey(currentDate);
      await updateCalendarColors(calendarInstance, proximityModuleOptions.userAddress, monthYearKey);
    } else {
    }
  }

  container.innerHTML = `
    <div class="calendar-nav">
      <button type="button" class="prev-month">&lt;</button>
      <span class="current-month-year"></span>
      <button type="button" class="next-month">&gt;</button>
    </div>
    <div class="calendar-weekdays">
      <div class="weekday">Sun</div>
      <div class="weekday">Mon</div>
      <div class="weekday">Tue</div>
      <div class="weekday">Wed</div>
      <div class="weekday">Thu</div>
      <div class="weekday">Fri</div>
      <div class="weekday">Sat</div>
    </div>
    <div class="calendar-grid"></div>
  `;

  const navEl = container.querySelector('.calendar-nav');
  const gridEl = container.querySelector('.calendar-grid');
  let isUpdatingCalendarColors = false;

  const popup = document.createElement('div');
  popup.classList.add('time-slot-popup');
  popup.style.display = 'none';
  document.body.appendChild(popup);

  if (useTooltipModule) {
    console.log("[initCustomCalendar] Initializing tooltip module.");
    tooltipModule = initTooltipModule();
    if (tooltipModule && typeof tooltipModule.addTooltipsToCells === "function") {
      console.log("[initCustomCalendar] Tooltip module initialized successfully.");
    } else {
      console.error("[initCustomCalendar] Tooltip module initialization failed.");
    }
  }

  async function renderCalendar() {
    console.log("[renderCalendar] Rendering calendar for date:", currentDate);
    if (isUpdatingCalendarColors) {
      console.warn("[renderCalendar] Calendar is currently updating colors. Aborting render.");
      return;
    }
    isUpdatingCalendarColors = true;

    gridEl.classList.add('fade-out');
    await new Promise((resolve) => setTimeout(resolve, 300));
    gridEl.innerHTML = '';

    navEl.querySelector('.current-month-year').textContent = currentDate.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dayNumber = 1 - startDayOfWeek;
    const totalWeeks = Math.ceil((daysInMonth + startDayOfWeek) / 7);

    console.log("[renderCalendar] First day of the month:", firstOfMonth, "Start day of week:", startDayOfWeek);

    for (let week = 0; week < totalWeeks; week++) {
      const row = document.createElement('div');
      row.classList.add('calendar-row');

      for (let col = 0; col < 7; col++) {
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');

        // **2. Assign data-row-index to each cell**
        cell.dataset.rowIndex = week;

        const thisDate = new Date(year, month, dayNumber);

        if (dayNumber > 0 && dayNumber <= daysInMonth) {
          const dateKey = formatDateKey(thisDate);
          cell.textContent = thisDate.getDate();
          cell.setAttribute('data-date', dateKey);

          if (thisDate < today) {
            cell.classList.add('disabled');
          } else {
            // **3. Update click handler to pass rowIndex**
            cell.addEventListener('click', () => showTimeSlotsForDay(thisDate, cell));
          }
        } else {
          cell.textContent = thisDate.getDate();
          cell.classList.add('disabled');
        }
        row.appendChild(cell);
        dayNumber++;
      }
      gridEl.appendChild(row);
    }

    try {
      const startM = new Date(year, month, 1);
      const endM = new Date(year, month + 1, 0);
      const busySlots = await fetchBusySlots(startM, endM);

      busySlotsMap = processBusySlots(busySlots);

      markDaysWithAppointments();

      // Ensure `updateCalendarColors` is run before invoking `addTooltipsToCells`
      await updateProximityOnRender();

      // Add tooltips after all updates
      if (tooltipModule) {
        console.log("[renderCalendar] Adding tooltips to cells after updates.");
        tooltipModule.addTooltipsToCells(gridEl);
      }
    } catch (err) {
      console.error("[renderCalendar] Caught error when fetching or processing busy slots:", err);
      onFetchEventsError(err);
    } finally {
      gridEl.classList.remove('fade-out');
      gridEl.classList.add('fade-in');
      setTimeout(() => gridEl.classList.remove('fade-in'), 300);
      isUpdatingCalendarColors = false;
      onCalendarRendered();
    }
  }

  /**
   * -----------------------------------------------
   * processBusySlots to handle allDay
   * -----------------------------------------------
   */
  function processBusySlots(busySlots) {
    const map = {};
  
    busySlots.forEach(slot => {
  
      const start = new Date(slot.start);
      const end = new Date(slot.end);
  
      // 1) If it's all day AND city is empty => block out the entire day(s).
      if (String(slot.allDay) === "true" && slot.city === "") {
        // Loop each day from start up to (but not including) end
        const cur = new Date(start);
        while (cur < end) {
          const dayKey = cur.toISOString().split('T')[0];
          if (!map[dayKey]) {
            map[dayKey] = [];
          }
          // Mark it so we know it's "all-day unavailable"
          map[dayKey].push({ allDay: true });
          cur.setDate(cur.getDate() + 1);
        }
        return; // Skip any hour-based logic
      }
  
      // 2) Otherwise, do your usual hour-based logic
      const cityName = slot.city || "";
      const startHr = start.getHours();
      const endHr = end.getHours();
  
      const dayKey = start.toISOString().split('T')[0];
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
  
  
      for (let hr = startHr; hr < endHr; hr++) {
        map[dayKey].push({ hour: hr, city: cityName });
      }
    });
  
    return map;
  }

  /**
   * -----------------------------------------------
   * markDaysWithAppointments
   * -----------------------------------------------
   */
  function markDaysWithAppointments() {
    const rows = gridEl.querySelectorAll('.calendar-row');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('.calendar-cell');
      cells.forEach((cell, colIndex) => {
        if (!cell.classList.contains('disabled')) {
          const dayNum = parseInt(cell.textContent, 10);
          const dateForCell = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
          const dayKey = formatDateKey(dateForCell);
  
          const dayBusy = busySlotsMap[dayKey] || [];
          const hasAllDayBlock = dayBusy.some(b => b.allDay === true);
  
          if (hasAllDayBlock) {
            cell.classList.add('disabled');
            cell.innerHTML = `
              <div class="day-num">${dayNum}</div>
              <div class="unavailable-text">Lux Farrier Service is unavailable on this date</div>
            `;
          }
        }
      });
    });
  }

  /**
   * -----------------------------------------------
   * ShowTimeSlotsForDay - don't show the popup if
   * the day is disabled (including all-day block).
   * Implement toggle and dynamic alignment.
   * -----------------------------------------------
   */

  function positionTimeSlotPopup(cell, popup, rowIndex) {
    const rect = cell.getBoundingClientRect();
    const colIndex = [...cell.parentElement.children].indexOf(cell);

    // Display the popup first to ensure offsetWidth is correctly calculated
    popup.style.display = 'block';

    // Force the browser to compute styles (reflow) to get accurate offsetWidth
    void popup.offsetWidth; // This line forces a reflow

    if (colIndex === 0 || colIndex === 1) {
      // Sunday (colIndex 0) and Monday (colIndex 1): position to the right
      popup.style.left = `${rect.right + 10}px`;
    } else {
      // Other days: position to the left
      popup.style.left = `${rect.left - popup.offsetWidth - 10}px`;
    }

    // **4. Dynamic Vertical Alignment Based on Row Position**
    if (rowIndex < 3) {
      // Top three rows: align popup's top with cell's top
      popup.style.top = `${rect.top}px`;
    } else {
      // Last three rows: align popup's bottom with cell's bottom
      popup.style.top = `${rect.bottom - popup.offsetHeight}px`;
    }
  }

  // Helper functions for time formatting
  function formatTime(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:00 ${period}`;
  }

  function formatTimeRange(hour) {
    return `${formatTime(hour)} - ${formatTime(hour + 1)}`;
  }

  function showTimeSlotsForDay(dateObj, cell) {
    if (cell.classList.contains('disabled')) {
        return;
    }

    // **Toggle Popup if Clicking the Same Cell Again**
    if (activeCell === cell) {
        popup.style.display = 'none';
        activeCell = null;
        return;
    }

    // If another cell is active, close its popup
    if (activeCell && activeCell !== cell) {
        popup.style.display = 'none';
    }

    activeCell = cell; // Set the new active cell

    // Clear previous popup content
    popup.innerHTML = `<h4>${dateObj.toDateString()}</h4>`;
    const dayKey = formatDateKey(dateObj);
    const busySlotsForDay = busySlotsMap[dayKey] || [];

    // Populate the popup with time slots
    for (let hour = startHour; hour < endHour; hour++) {
        const slotDiv = document.createElement('div');
        slotDiv.textContent = formatTimeRange(hour); // Updated to use 12-hour format
        slotDiv.classList.add('time-slot');

        slotDiv.dataset.date = dayKey;
        slotDiv.dataset.hour = hour;

        const isBusy = busySlotsForDay.find(bs => bs.hour === hour);
        if (isBusy) {
            slotDiv.classList.add('busy');
            slotDiv.textContent += isBusy.city
                ? ` (Booked in ${isBusy.city})`
                : " (Unavailable)";
        } else {
            slotDiv.addEventListener('click', (evt) => {
                onTimeSelect({ date: dateObj, hour });
                // **Remove or Comment Out the Popup Close Line**
                // popup.style.display = 'none'; // This line is removed
                evt.stopPropagation(); // Prevent event from bubbling up
            });
        }

        const isSelected = selectedSlots.some(
            s => formatDateKey(s.date) === dayKey && s.hour === hour
        );
        if (isSelected) {
            slotDiv.classList.add('selected');
        }

        popup.appendChild(slotDiv);
    }

    // **Retrieve rowIndex from data attribute**
    const rowIndex = parseInt(cell.dataset.rowIndex, 10);

    // Position the popup correctly
    positionTimeSlotPopup(cell, popup, rowIndex);
}

  document.addEventListener('click', (evt) => {
    if (!popup.contains(evt.target) && !evt.target.classList.contains('calendar-cell')) {
      popup.style.display = 'none';
      activeCell = null; // Reset activeCell when clicking away
    }
  });

  navEl.querySelector('.prev-month').addEventListener('click', async () => {
    const now = new Date();
    if (
      currentDate.getFullYear() < now.getFullYear() ||
      (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() <= now.getMonth())
    ) {
      return;
    }
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    await renderCalendar();
    if (proximityModuleOptions?.userAddress) {
      const { updateCalendarColors } = await import("./modules/proximityModule.js");
      updateCalendarColors(calendarInstance, proximityModuleOptions.userAddress, getMonthYearKey(currentDate));
    }
  });

  navEl.querySelector('.next-month').addEventListener('click', async () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    await renderCalendar();
    if (proximityModuleOptions?.userAddress) {
      const { updateCalendarColors } = await import("./modules/proximityModule.js");
      updateCalendarColors(calendarInstance, proximityModuleOptions.userAddress, getMonthYearKey(currentDate));
    }
  });

  function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getMonthYearKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  // Initial call
  renderCalendar();
}
