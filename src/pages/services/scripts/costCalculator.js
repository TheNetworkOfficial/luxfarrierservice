//costCalculator.js
document.addEventListener('DOMContentLoaded', () => {
    // We'll store items as objects: { name: string, price: number, quantity: number }
    const costCalcItems = [];
    
    const itemsContainer = document.getElementById('cost-calc-items');
    const totalContainer = document.getElementById('cost-calc-total');
  
    function updateDisplay() {
      // Clear current display
      itemsContainer.innerHTML = '';
  
      // Rebuild the list
      let total = 0;
      costCalcItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        // e.g. "Base Trim x2 ........ $90.00"
        const line = document.createElement('div');
        line.classList.add('calc-item-line');
        line.innerHTML = `
          <span class="calc-item-left">
            ${item.name} x${item.quantity}
          </span>
          <span class="calc-item-right">
            <!-- Price first -->
            <span class="calc-price">$${itemTotal.toFixed(2)}</span>
            <!-- Then plus icon -->
            <i class="fas fa-plus calc-add" data-name="${item.name}" data-price="${item.price}"></i>
            <!-- Then minus icon -->
            <i class="fas fa-minus calc-remove" data-name="${item.name}" data-price="${item.price}"></i>
          </span>
        `;
        itemsContainer.appendChild(line);
      });
  
      // Update total
      totalContainer.textContent = `Estimated Total: $${total.toFixed(2)}`;
    }
  
    // Handles adding an item
    function addItem(name, price) {
      // Check if item is already in our array
      const existing = costCalcItems.find(i => i.name === name && i.price === price);
      if (existing) {
        existing.quantity++;
      } else {
        costCalcItems.push({ name, price, quantity: 1 });
      }
      updateDisplay();
    }
  
    // Handles removing an item
    function removeItem(name, price) {
      const existing = costCalcItems.find(i => i.name === name && i.price === price);
      if (existing) {
        existing.quantity--;
        if (existing.quantity <= 0) {
          // Remove item if quantity is zero or below
          const index = costCalcItems.indexOf(existing);
          costCalcItems.splice(index, 1);
        }
        updateDisplay();
      }
    }
  
    // Listen for clicks on each plus icon
    document.querySelectorAll('.add-to-calculator').forEach(plusIcon => {
      plusIcon.addEventListener('click', () => {
        const name = plusIcon.getAttribute('data-name');
        const price = parseFloat(plusIcon.getAttribute('data-price'));
        addItem(name, price);
      });
    });
  
    // Listen for clicks on each minus icon
    document.querySelectorAll('.remove-from-calculator').forEach(minusIcon => {
      minusIcon.addEventListener('click', () => {
        const name = minusIcon.getAttribute('data-name');
        const price = parseFloat(minusIcon.getAttribute('data-price'));
        removeItem(name, price);
      });
    });
    
    // NEW: Event Delegation for cost-calc side
    itemsContainer.addEventListener('click', e => {
      const plus = e.target.closest('.calc-add');
      const minus = e.target.closest('.calc-remove');
      
      if (plus) {
        const name = plus.getAttribute('data-name');
        const price = parseFloat(plus.getAttribute('data-price'));
        addItem(name, price);
      }
      if (minus) {
        const name = minus.getAttribute('data-name');
        const price = parseFloat(minus.getAttribute('data-price'));
        removeItem(name, price);
      }
    });
    // Expose the functions to global scope so they can be used by mobileServices.js
    window.addItem = addItem;
    window.removeItem = removeItem;
});