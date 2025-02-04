export function initTooltipModule() {
    function attachTooltip(cell, text) {
        console.log("[attachTooltip] Attempting to attach tooltip to cell:", cell, "with text:", text);
      
        if (!cell.classList.contains("proximity-green") && !cell.classList.contains("proximity-red")) {
          console.log("[attachTooltip] Skipping cell. No proximity-related class detected.");
          return;
        }
      
        let existingTooltip = document.querySelector(`.cell-tooltip-popup[data-for="${cell.dataset.date}"]`);
        if (existingTooltip) {
          console.log("[attachTooltip] Removing existing tooltip for date:", cell.dataset.date);
          existingTooltip.remove();
        }
      
        const tooltip = document.createElement("div");
        tooltip.classList.add("cell-tooltip-popup");
        tooltip.textContent = text;
        tooltip.setAttribute("data-for", cell.dataset.date);
        document.body.appendChild(tooltip);
      
        const rect = cell.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const isAbove = rect.top > window.innerHeight / 2;
      
        console.log("[attachTooltip] Cell rect:", rect, "Tooltip rect:", tooltipRect);
      
        if (isAbove) {
          console.log("[attachTooltip] Positioning tooltip above the cell.");
          tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.classList.add("above");
        } else {
          console.log("[attachTooltip] Positioning tooltip below the cell.");
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.classList.add("below");
        }
      
        tooltip.style.display = "block";
      
        cell.addEventListener("mouseleave", () => {
          console.log("[attachTooltip] Removing tooltip for cell:", cell);
          tooltip.remove();
        });
    }
  
    function addTooltipsToCells(container) {
      console.log("[addTooltipsToCells] Adding tooltips to cells in container:", container);
    
      const cells = container.querySelectorAll(".calendar-cell");
      console.log(`[addTooltipsToCells] Found ${cells.length} cells.`);
    
      cells.forEach((cell) => {
        const tooltipText = cell.getAttribute("data-tooltip-text");
        console.log("[addTooltipsToCells] Checking cell:", cell, "Tooltip text:", tooltipText);
    
        if (tooltipText) {
          // Instead of calling attachTooltip(cell, tooltipText) directly,
          // just add a 'mouseenter' event to call attachTooltip when hovered.
          cell.addEventListener("mouseenter", () => {
            attachTooltip(cell, tooltipText);
          });
        } else {
          console.log("[addTooltipsToCells] No tooltip text found for cell:", cell);
        }
      });
    }
  
    // Return the methods to use in other parts of the app
    return {
      attachTooltip,
      addTooltipsToCells,
    };
  }
  