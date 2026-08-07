document.addEventListener("DOMContentLoaded", () => {
  // --- Element Selectors ---
  const searchInput = document.getElementById("searchHistory");
  const filterSelect = document.getElementById("filterStatus");
  const historyListContainer = document.getElementById("historyList");
  
  const statTotalSpan = document.getElementById("stat-total");
  const statCompletedSpan = document.getElementById("stat-completed");
  const statCancelledSpan = document.getElementById("stat-cancelled");

  const today = new Date().toISOString().split("T")[0];

  // ==================================================
  // Login Functions
  // ==================================================

  window.logoutUser = function() {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    }
  };

  window.downloadReceipt = function(bookingId) {
    try {
      const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
      const b = bookings.find(item => item.bookingId === bookingId);
      if (!b) {
        alert("Booking not found!");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const goldColor = [197, 168, 128]; 
      const darkColor = [30, 41, 59];    
      const greyColor = [100, 116, 139];  

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.text("GRAND HORIZON JAIPUR", 105, 25, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
      doc.text("Luxury Hotel Reservation Receipt", 105, 32, { align: "center" });

      doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 38, 190, 38);

      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

      let y = 50;
      const leftCol = 25;
      const rightCol = 80;
      const step = 8;

      const printRow = (label, value) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, leftCol, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), rightCol, y);
        y += step;
      };

      printRow("Booking ID:", b.bookingId);
      printRow("Guest Name:", b.customerName);
      printRow("Phone Number:", b.phoneNumber);
      printRow("Room Type:", b.roomTypeName);
      printRow("Room Location:", b.roomLocation || "Available at check-in");
      printRow("Check-In Date:", b.checkIn);
      printRow("Check-Out Date:", b.checkOut);
      printRow("Number of Nights:", `${b.nights} night(s)`);
      printRow("Room Price Per Night:", `$${b.pricePerNight}`);
      printRow("Taxes and Charges:", `$${b.gst}`);
      
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total:", leftCol, y);
      doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.setFontSize(13);
      doc.text(`$${b.totalPrice}`, rightCol, y);
      
      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      y += step;

      printRow("Booking Status:", b.status || "Confirmed");
      printRow("Booking Date:", b.bookingTime || "N/A");

      y += 4;
      doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
      doc.line(20, y, 190, y);

      y += 12;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
      doc.text("Thank you for choosing Grand Horizon Jaipur.", 105, y, { align: "center" });
      doc.text("We look forward to serving you again.", 105, y + 6, { align: "center" });

      doc.save(`Booking-${b.bookingId}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error: Could not generate receipt PDF.");
    }
  };

  // ==================================================
  // Booking Functions
  // ==================================================

  function loadBookingHistory() {
    try {
      const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];

      // History contains only cancelled and past stays
      const historicalBookings = bookings.filter(b => {
        const isCancelled = b.status === "Cancelled";
        const isCompleted = b.checkOut < today && b.status !== "Cancelled";
        return isCancelled || isCompleted;
      });

      // Calculate stats dynamically
      const totalCount = historicalBookings.length;
      const completedCount = historicalBookings.filter(b => b.status !== "Cancelled" && b.checkOut < today).length;
      const cancelledCount = historicalBookings.filter(b => b.status === "Cancelled").length;

      if (statTotalSpan) statTotalSpan.textContent = totalCount;
      if (statCompletedSpan) statCompletedSpan.textContent = completedCount;
      if (statCancelledSpan) statCancelledSpan.textContent = cancelledCount;

      historyListContainer.innerHTML = "";

      const filterValue = filterSelect.value;
      let displayList = historicalBookings;
      
      if (filterValue === "Completed") {
        displayList = historicalBookings.filter(b => b.status !== "Cancelled" && b.checkOut < today);
      } else if (filterValue === "Cancelled") {
        displayList = historicalBookings.filter(b => b.status === "Cancelled");
      }

      const query = searchInput.value.trim().toLowerCase();
      if (query) {
        displayList = displayList.filter(b => {
          return b.bookingId.toLowerCase().includes(query) ||
                 b.customerName.toLowerCase().includes(query) ||
                 b.phoneNumber.includes(query);
        });
      }

      if (displayList.length === 0) {
        historyListContainer.style.display = "block";
        historyListContainer.innerHTML = `
          <div style="text-align: center; padding: 4rem 2rem; background: var(--glass-bg); border: 1px dashed var(--border-color); border-radius: 8px; max-width: 600px; margin: 2rem auto;">
            <div style="font-size: 3.5rem; margin-bottom: 1.5rem; filter: grayscale(0.2);">📖</div>
            <h3 style="color: var(--accent-gold); font-size: 1.3rem; margin-bottom: 0.75rem; font-family: var(--font-heading);">No Booking History</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin: 0;">
              No historical reservations found matching your criteria. Active or future reservations appear under the My Bookings section on the Home page.
            </p>
          </div>
        `;
        return;
      }

      historyListContainer.style.display = "grid";

      displayList.forEach(b => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const checkInStr = new Date(b.checkIn).toLocaleDateString(undefined, options);
        const checkOutStr = new Date(b.checkOut).toLocaleDateString(undefined, options);

        const isCancelled = b.status === "Cancelled";
        const statusText = isCancelled ? "Cancelled" : "Completed";
        const statusColor = isCancelled ? "#ff6b6b" : "#4ade80";
        const statusBg = isCancelled ? "rgba(255, 107, 107, 0.15)" : "rgba(74, 222, 128, 0.15)";

        const card = document.createElement("article");
        card.className = "booking-entry-card";
        card.innerHTML = `
          <h3>
            <span>${b.bookingId}</span>
            <span style="font-size: 0.8rem; color: ${statusColor}; background-color: ${statusBg}; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 500;">${statusText}</span>
          </h3>
          <p><strong>Guest Name:</strong> <span>${b.customerName}</span></p>
          <p><strong>Phone:</strong> <span>${b.phoneNumber}</span></p>
          <p><strong>Room Type:</strong> <span>${b.roomTypeName}</span></p>
          <p><strong>Location:</strong> <span>${b.roomLocation || "Available at check-in"}</span></p>
          <p><strong>Check-In:</strong> <span>${checkInStr}</span></p>
          <p><strong>Check-Out:</strong> <span>${checkOutStr}</span></p>
          <p><strong>Stay Duration:</strong> <span>${b.nights} night(s)</span></p>
          <p><strong>Booking Date:</strong> <span style="font-size: 0.85rem; opacity: 0.8;">${b.bookingTime || "N/A"}</span></p>
          <p style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 0.75rem; margin-top: 0.75rem; font-weight: 600; font-size: 1.05rem;">
            <strong>Grand Total:</strong> 
            <span style="color: var(--accent-gold); font-size: 1.1rem;">$${b.totalPrice}</span>
          </p>
          <button class="btn-secondary" style="font-size: 0.85rem; padding: 0.6rem 1rem; width: 100%; border: 1px solid var(--accent-gold); color: var(--accent-gold); background: transparent; cursor: pointer; border-radius: 4px; font-weight: 600; transition: all 0.3s; margin-top: 1rem;" onmouseover="this.style.background='var(--accent-gold)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--accent-gold)';" onclick="downloadReceipt('${b.bookingId}')">Download Receipt</button>
        `;
        historyListContainer.appendChild(card);
      });
    } catch (e) {
      console.error(e);
      historyListContainer.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Error loading reservation history.</p>`;
    }
  }

  // --- Attach Event Listeners ---
  if (searchInput) {
    searchInput.addEventListener("input", loadBookingHistory);
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", loadBookingHistory);
  }

  window.addEventListener("storage", (event) => {
    if (event.key === "hotelBookings") {
      loadBookingHistory();
    }
  });

  loadBookingHistory();
});
