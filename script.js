document.addEventListener("DOMContentLoaded", () => {
  // --- Element Selectors ---
  const bookingForm = document.getElementById("reservationForm");
  const customerNameInput = document.getElementById("customerName");
  const phoneNumberInput = document.getElementById("phoneNumber");
  const roomTypeSelect = document.getElementById("roomType");
  const checkInInput = document.getElementById("checkInDate");
  const checkOutInput = document.getElementById("checkOutDate");
  const confirmationSection = document.getElementById("confirmation");
  
  const selectRoomButtons = document.querySelectorAll(".select-room-btn");
  
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section");

  const availabilityForm = document.getElementById("availabilityForm");
  const availRoomTypeSelect = document.getElementById("availRoomType");
  const availCheckInInput = document.getElementById("availCheckInDate");
  const availCheckOutInput = document.getElementById("availCheckOutDate");
  const availabilityResultDiv = document.getElementById("availabilityResult");

  const searchQueryInput = document.getElementById("searchQuery");
  const searchBtn = document.getElementById("searchBtn");
  const filterRoomTypeSelect = document.getElementById("filterRoomType");
  const sortBookingsSelect = document.getElementById("sortBookings");
  const bookingsListDiv = document.getElementById("bookingsList");

  // --- System Configuration ---
  const roomRates = {
    single: { name: "Single Room", price: 120 },
    double: { name: "Double Room", price: 180 },
    suite: { name: "Suite Room", price: 320 }
  };

  const totalRooms = {
    single: 5,
    double: 4,
    suite: 2
  };

  const roomSpecsMap = {
    single: {
      location: "Room 204, 2nd Floor",
      amenities: ["WiFi", "AC", "TV", "Private Bathroom", "Breakfast", "Parking"]
    },
    double: {
      location: "Room 412, 4th Floor",
      amenities: ["WiFi", "AC", "TV", "Private Bathroom", "Balcony", "Parking", "Swimming Pool", "Breakfast", "Restaurant Access"]
    },
    suite: {
      location: "Room 502, Penthouse Level",
      amenities: ["WiFi", "AC", "TV", "Luxury Bathroom", "Balcony", "Parking", "Swimming Pool", "Gym Access", "Breakfast", "Restaurant Access"]
    }
  };

  const activeSlideIndexes = {
    single: 0,
    double: 0,
    suite: 0
  };

  const today = new Date().toISOString().split("T")[0];

  // --- Initial Setup ---
  initDateConstraints();
  updateRoomAvailability();
  renderBookings();

  // Pre-fill user data if logged in
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser) {
    if (customerNameInput) customerNameInput.value = currentUser.fullName;
    if (phoneNumberInput) phoneNumberInput.value = currentUser.phoneNum;
  }

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

  // ==================================================
  // Booking Functions
  // ==================================================

  function saveBookingToLocalStorage(userData) {
    try {
      const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
      
      const isDuplicate = bookings.some(b => {
        return b.customerName === userData.customerName &&
               b.phoneNumber === userData.phoneNumber &&
               b.roomType === userData.roomType &&
               b.checkIn === userData.checkIn &&
               b.checkOut === userData.checkOut;
      });
      
      if (isDuplicate) {
        console.warn("Booking already exists. Skipping.");
        return;
      }
      
      bookings.push(userData);
      localStorage.setItem("hotelBookings", JSON.stringify(bookings));
    } catch (e) {
      console.error(e);
      alert("Error: Could not save booking details.");
    }
  }

  window.cancelBooking = function(bookingId) {
    if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
      try {
        const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
        
        const updatedBookings = bookings.map(b => {
          if (b.bookingId === bookingId) {
            return { ...b, status: "Cancelled" };
          }
          return b;
        });
        
        localStorage.setItem("hotelBookings", JSON.stringify(updatedBookings));
        alert(`Booking ${bookingId} has been successfully cancelled.`);
        
        renderBookings();
        updateRoomAvailability();
        
        const confirmationCard = confirmationSection.querySelector(".confirmation-card");
        if (confirmationCard && confirmationCard.innerHTML.includes(bookingId)) {
          confirmationSection.innerHTML = "";
        }
      } catch (e) {
        console.error(e);
        alert("Error: Could not cancel booking.");
      }
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

  function renderBookings() {
    try {
      const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
      bookingsListDiv.innerHTML = "";
      
      const query = searchQueryInput.value.trim().toLowerCase();
      const filterRoomType = filterRoomTypeSelect.value;
      const sortType = sortBookingsSelect.value;

      // Keep only active upcoming bookings
      let displayBookings = bookings.filter(b => {
        const isCancelled = b.status === "Cancelled";
        const isPast = b.checkOut < today;
        return !isCancelled && !isPast;
      });

      if (query) {
        displayBookings = displayBookings.filter(b => {
          return b.bookingId.toLowerCase().includes(query) || 
                 b.phoneNumber.includes(query);
        });
      }

      if (filterRoomType !== "all") {
        displayBookings = displayBookings.filter(b => b.roomType === filterRoomType);
      }

      displayBookings.sort((a, b) => {
        if (sortType === "checkin-desc") {
          return new Date(b.checkIn) - new Date(a.checkIn);
        } else if (sortType === "checkin-asc") {
          return new Date(a.checkIn) - new Date(b.checkIn);
        } else if (sortType === "total-desc") {
          return b.totalPrice - a.totalPrice;
        } else if (sortType === "total-asc") {
          return a.totalPrice - b.totalPrice;
        }
        return 0;
      });

      if (displayBookings.length === 0) {
        bookingsListDiv.style.display = "block";
        bookingsListDiv.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: var(--glass-bg); border: 1px solid var(--border-color); border-radius: 8px;">
            <p style="color: var(--text-muted); font-size: 1.1rem;">
              No reservations match your active query. Book a stay above to begin!
            </p>
          </div>
        `;
        return;
      }

      bookingsListDiv.style.display = "grid";

      displayBookings.forEach(b => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const checkInStr = new Date(b.checkIn).toLocaleDateString(undefined, options);
        const checkOutStr = new Date(b.checkOut).toLocaleDateString(undefined, options);

        const statusText = b.status || "Confirmed";
        const isCancelled = statusText === "Cancelled";
        const statusBadgeColor = isCancelled ? "#ff6b6b" : "#a7f3d0";
        const statusBadgeBg = isCancelled ? "rgba(255, 107, 107, 0.15)" : "rgba(74, 222, 128, 0.15)";
        
        const actionHTML = isCancelled
          ? `<div style="text-align: center; color: #ff6b6b; font-weight: 500; font-size: 0.85rem; padding: 0.5rem; background: rgba(255,107,107,0.05); border: 1px solid rgba(255,107,107,0.15); border-radius: 4px; margin-top: 1rem;">Cancelled</div>`
          : `<div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
               <button class="btn-secondary" style="font-size: 0.85rem; padding: 0.6rem 1rem; width: 100%; border: 1px solid var(--accent-gold); color: var(--accent-gold); background: transparent; cursor: pointer; border-radius: 4px; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.background='var(--accent-gold)'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='var(--accent-gold)';" onclick="downloadReceipt('${b.bookingId}')">Download Receipt</button>
               <button class="btn-cancel" style="margin-top: 0; width: 100%; padding: 0.6rem 1rem; font-size: 0.85rem;" onclick="cancelBooking('${b.bookingId}')">Cancel Reservation</button>
             </div>`;

        const card = document.createElement("article");
        card.className = "booking-entry-card";
        card.innerHTML = `
          <h3>
            <span>${b.bookingId}</span>
            <span style="font-size: 0.8rem; color: ${statusBadgeColor}; background-color: ${statusBadgeBg}; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 500;">${statusText}</span>
          </h3>
          <p><strong>Guest Name:</strong> <span>${b.customerName}</span></p>
          <p><strong>Phone:</strong> <span>${b.phoneNumber}</span></p>
          <p><strong>Room Type:</strong> <span>${b.roomTypeName}</span></p>
          <p><strong>Location:</strong> <span>${b.roomLocation || "Available at check-in"}</span></p>
          <p><strong>Check-In:</strong> <span>${checkInStr}</span></p>
          <p><strong>Check-Out:</strong> <span>${checkOutStr}</span></p>
          <p style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 0.75rem; margin-top: 0.75rem; font-weight: 600; font-size: 1.05rem;">
            <strong>Grand Total:</strong> 
            <span style="color: var(--accent-gold); font-size: 1.1rem;">$${b.totalPrice}</span>
          </p>
          ${actionHTML}
        `;

        bookingsListDiv.appendChild(card);
      });
    } catch (e) {
      console.error(e);
      bookingsListDiv.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Error loading reservations list.</p>`;
    }
  }

  // Booking Form submit handler
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();

    const nameVal = customerNameInput.value.trim();
    const phoneVal = phoneNumberInput.value.trim();
    const roomTypeVal = roomTypeSelect.value;
    const checkInVal = checkInInput.value;
    const checkOutVal = checkOutInput.value;

    if (!validateName(nameVal) || !validatePhone(phoneVal) || !validateRoomType(roomTypeVal) || !validateDates(checkInVal, checkOutVal)) {
      return;
    }

    const capacity = totalRooms[roomTypeVal];
    const overlaps = getOverlappingBookingsCount(roomTypeVal, checkInVal, checkOutVal);
    const roomLeft = capacity - overlaps;

    if (roomLeft <= 0) {
      alert("All rooms of this category are occupied for the chosen date range.");
      return;
    }

    const checkInDate = new Date(checkInVal);
    const checkOutDate = new Date(checkOutVal);
    const nights = calculateNights(checkInDate, checkOutDate);
    const roomData = roomRates[roomTypeVal];
    const roomSubtotal = roomData.price * nights;
    
    const gstRate = 0.18;
    const gstAmount = Math.round(roomSubtotal * gstRate * 100) / 100;
    const totalBill = Math.round((roomSubtotal + gstAmount) * 100) / 100;

    const bookingId = generateBookingId();
    const specs = roomSpecsMap[roomTypeVal];

    const bookingTimestamp = new Date().toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const userData = {
      bookingId: bookingId,
      customerName: nameVal,
      phoneNumber: phoneVal,
      roomType: roomTypeVal,
      roomTypeName: roomData.name,
      checkIn: checkInVal,
      checkOut: checkOutVal,
      pricePerNight: roomData.price,
      nights: nights,
      subtotal: roomSubtotal,
      gst: gstAmount,
      totalPrice: totalBill,
      roomLocation: specs.location,
      amenities: specs.amenities,
      bookingTime: bookingTimestamp,
      status: "Confirmed",
      timestamp: new Date().toISOString()
    };

    saveBookingToLocalStorage(userData);

    renderBookings();
    updateRoomAvailability(checkInVal, checkOutVal);

    availabilityResultDiv.innerHTML = "";
    availabilityForm.reset();

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const checkInStr = checkInDate.toLocaleDateString(undefined, options);
    const checkOutStr = checkOutDate.toLocaleDateString(undefined, options);

    const amenitiesHTML = userData.amenities
      .map(item => `<span style="font-size: 0.8rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 4px; color: #d1fae5; margin: 0.2rem;">${item}</span>`)
      .join("");

    confirmationSection.innerHTML = `
      <div class="confirmation-card" style="border: 2px solid var(--accent-gold); background: linear-gradient(135deg, #14271f 0%, #0d1a15 100%);">
        <div class="success-icon" style="color: var(--accent-gold); text-shadow: 0 0 10px rgba(197,168,128,0.4);">✓</div>
        <h3>Booking Confirmed!</h3>
        <p class="success-intro">Thank you, ${userData.customerName}. Your reservation has been secured successfully.</p>
        
        <div class="confirmation-details" style="border-left: 4px solid var(--accent-gold); background: rgba(0, 0, 0, 0.35);">
          <p><strong>Booking ID:</strong> <strong style="color: var(--accent-gold);">${userData.bookingId}</strong></p>
          <p><strong>Booking Status:</strong> <span style="color: #4ade80; font-weight: 600; text-transform: uppercase; font-size: 0.85rem; background: rgba(74,222,128,0.1); padding: 0.15rem 0.5rem; border-radius: 3px;">Confirmed</span></p>
          <p><strong>Room Category:</strong> <span>${userData.roomTypeName}</span></p>
          <p><strong>Room Location:</strong> <span style="color: var(--accent-gold); font-weight: 500;">${userData.roomLocation}</span></p>
          <p><strong>Price Per Night:</strong> <span>$${userData.pricePerNight}</span></p>
          <p><strong>Number of Nights:</strong> <span>${userData.nights} night(s)</span></p>
          <p><strong>Check-In Date:</strong> <span>${checkInStr}</span></p>
          <p><strong>Check-Out Date:</strong> <span>${checkOutStr}</span></p>
          <p><strong>Guest Name:</strong> <span>${userData.customerName}</span></p>
          <p><strong>Contact Phone:</strong> <span>${userData.phoneNumber}</span></p>
          <p><strong>Booking Time:</strong> <span style="font-size: 0.85rem; opacity: 0.85;">${userData.bookingTime}</span></p>
          
          <div style="margin-top: 1rem; margin-bottom: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem;">
            <strong style="color: #f8fafc; font-size: 0.85rem; display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Included Amenities</strong>
            <div style="display: flex; flex-wrap: wrap; margin-left: -0.2rem;">
              ${amenitiesHTML}
            </div>
          </div>
          
          <p style="border-top: 1px dotted rgba(255,255,255,0.15); padding-top: 0.5rem; margin-top: 0.5rem;">
            <strong>Room Cost:</strong> <span>$${userData.subtotal}</span>
          </p>
          <p><strong>GST (18%):</strong> <span>$${userData.gst}</span></p>
          
          <p style="border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.75rem; margin-top: 0.75rem; font-size: 1.2rem;">
            <strong>Grand Total:</strong> 
            <strong style="color: var(--accent-gold); font-size: 1.25rem;">$${userData.totalPrice}</strong>
          </p>
        </div>
        
        <p style="font-size: 0.9rem; color: #a7f3d0; opacity: 0.85; margin-top: 1.5rem;">An official booking record has been synced with your browser local storage.</p>
      </div>
    `;

    confirmationSection.scrollIntoView({ behavior: "smooth" });
    bookingForm.reset();
  });

  bookingForm.addEventListener("reset", () => {
    clearErrors();
    confirmationSection.innerHTML = "";
    availabilityResultDiv.innerHTML = "";
    availabilityForm.reset();
    updateRoomAvailability();
  });

  selectRoomButtons.forEach(button => {
    button.addEventListener("click", () => {
      const roomType = button.getAttribute("data-room");
      roomTypeSelect.value = roomType;
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        customerNameInput.focus();
      }, 800);
    });
  });

  // ==================================================
  // Availability Functions
  // ==================================================

  function getOverlappingBookingsCount(roomType, checkInVal, checkOutVal) {
    const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
    const activeBookings = bookings.filter(b => b.status !== "Cancelled");
    
    const overlaps = activeBookings.filter(b => {
      const matchRoom = b.roomType === roomType;
      const dateOverlap = checkInVal < b.checkOut && checkOutVal > b.checkIn;
      return matchRoom && dateOverlap;
    });

    return overlaps.length;
  }

  function updateRoomAvailability(checkInVal = "", checkOutVal = "") {
    if (!checkInVal) checkInVal = checkInInput.value;
    if (!checkOutVal) checkOutVal = checkOutInput.value;

    if (!checkInVal || !checkOutVal) {
      const todayDate = new Date();
      const tomorrowDate = new Date();
      tomorrowDate.setDate(todayDate.getDate() + 1);

      checkInVal = todayDate.toISOString().split("T")[0];
      checkOutVal = tomorrowDate.toISOString().split("T")[0];
    }

    for (const roomType in totalRooms) {
      const badge = document.getElementById(`avail-badge-${roomType}`);
      const bookBtn = document.querySelector(`.select-room-btn[data-room="${roomType}"]`);
      
      const capacity = totalRooms[roomType];
      const overlaps = getOverlappingBookingsCount(roomType, checkInVal, checkOutVal);
      const roomLeft = capacity - overlaps;

      if (badge) {
        if (roomLeft > 0) {
          badge.className = "room-avail-badge avail";
          badge.textContent = `Available: ${roomLeft} rooms left`;
          
          if (bookBtn) {
            bookBtn.disabled = false;
            bookBtn.textContent = "Book This Room";
            bookBtn.style.opacity = "1";
            bookBtn.style.cursor = "pointer";
          }
        } else {
          badge.className = "room-avail-badge not-avail";
          badge.textContent = "Not Available";
          
          if (bookBtn) {
            bookBtn.disabled = true;
            bookBtn.textContent = "Not Available";
            bookBtn.style.opacity = "0.5";
            bookBtn.style.cursor = "not-allowed";
          }
        }
      }
    }
  }

  window.updateRoomAvailability = updateRoomAvailability;

  function initDateConstraints() {
    checkInInput.setAttribute("min", today);
    checkInInput.addEventListener("change", () => {
      adjustCheckOutLimit(checkInInput, checkOutInput);
      handleDateChangeLiveBadges();
    });
    checkOutInput.addEventListener("change", () => {
      handleDateChangeLiveBadges();
    });

    availCheckInInput.setAttribute("min", today);
    availCheckInInput.addEventListener("change", () => {
      adjustCheckOutLimit(availCheckInInput, availCheckOutInput);
    });
  }

  function adjustCheckOutLimit(checkInEl, checkOutEl) {
    const checkInVal = checkInEl.value;
    if (checkInVal) {
      const nextDay = new Date(checkInVal);
      nextDay.setDate(nextDay.getDate() + 1);
      const minCheckOutVal = nextDay.toISOString().split("T")[0];
      
      checkOutEl.setAttribute("min", minCheckOutVal);
      
      if (checkOutEl.value && checkOutEl.value < minCheckOutVal) {
        checkOutEl.value = "";
      }
    }
  }

  function handleDateChangeLiveBadges() {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    if (checkIn && checkOut && checkOut > checkIn) {
      updateRoomAvailability(checkIn, checkOut);
    } else {
      updateRoomAvailability();
    }
  }

  availabilityForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const roomType = availRoomTypeSelect.value;
    const checkInVal = availCheckInInput.value;
    const checkOutVal = availCheckOutInput.value;

    if (checkInVal >= checkOutVal) {
      availabilityResultDiv.style.color = "#ff6b6b";
      availabilityResultDiv.innerHTML = "❌ Check-out date must be after check-in date.";
      return;
    }

    const capacity = totalRooms[roomType];
    const overlaps = getOverlappingBookingsCount(roomType, checkInVal, checkOutVal);
    const roomLeft = capacity - overlaps;

    if (roomLeft > 0) {
      availabilityResultDiv.style.color = "#4ade80";
      availabilityResultDiv.innerHTML = `Available: ${roomLeft} rooms left`;
    } else {
      availabilityResultDiv.style.color = "#ff6b6b";
      availabilityResultDiv.innerHTML = `Not Available`;
    }
  });

  // ==================================================
  // Review Functions
  // ==================================================

  // Room ratings and reviews are rendered statically on index.html.

  // ==================================================
  // Utility Functions
  // ==================================================

  function calculateNights(checkInDate, checkOutDate) {
    const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }

  function generateBookingId() {
    const bookings = JSON.parse(localStorage.getItem("hotelBookings")) || [];
    let isUnique = false;
    let newId = "";
    
    while (!isUnique) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      newId = `GH-${randomNumber}`;
      isUnique = !bookings.some(b => b.bookingId === newId);
    }
    
    return newId;
  }

  function clearErrors() {
    const existingErrors = bookingForm.querySelectorAll(".error-msg");
    existingErrors.forEach(error => error.remove());
    
    const validatedInputs = bookingForm.querySelectorAll("input, select");
    validatedInputs.forEach(input => {
      input.style.borderColor = "";
    });
  }

  function showError(inputElement, message) {
    inputElement.style.borderColor = "#ff6b6b";

    const errorSpan = document.createElement("small");
    errorSpan.className = "error-msg";
    errorSpan.textContent = message;
    errorSpan.style.color = "#ff6b6b";
    errorSpan.style.fontSize = "0.8rem";
    errorSpan.style.marginTop = "0.25rem";
    errorSpan.style.fontWeight = "500";
    errorSpan.style.display = "block";

    inputElement.parentElement.appendChild(errorSpan);
  }

  function validateName(name) {
    if (!name) {
      showError(customerNameInput, "Full name is required.");
      return false;
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      showError(customerNameInput, "Name should contain only letters and spaces.");
      return false;
    }
    if (name.length < 2) {
      showError(customerNameInput, "Name must be at least 2 characters long.");
      return false;
    }
    return true;
  }

  function validatePhone(phone) {
    if (!phone) {
      showError(phoneNumberInput, "Phone number is required.");
      return false;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      if (/[^\d]/.test(phone)) {
        showError(phoneNumberInput, "Phone number should contain only numbers.");
      } else {
        showError(phoneNumberInput, "Phone number must contain exactly 10 digits.");
      }
      return false;
    }
    return true;
  }

  function validateRoomType(roomType) {
    if (!roomType) {
      showError(roomTypeSelect, "Please select a room type.");
      return false;
    }
    return true;
  }

  function validateDates(checkInVal, checkOutVal) {
    let isValid = true;

    if (!checkInVal) {
      showError(checkInInput, "Check-in date is required.");
      isValid = false;
    }
    if (!checkOutVal) {
      showError(checkOutInput, "Check-out date is required.");
      isValid = false;
    }

    if (checkInVal && checkOutVal) {
      const checkInDate = new Date(checkInVal);
      const checkOutDate = new Date(checkOutVal);
      const todayDate = new Date(today);

      if (checkInDate < todayDate) {
        showError(checkInInput, "Check-in date cannot be in the past.");
        isValid = false;
      }

      if (checkOutDate <= checkInDate) {
        showError(checkOutInput, "Check-out date must be after check-in date.");
        isValid = false;
      }
    }

    return isValid;
  }

  // Slider actions
  window.changeSlide = function(roomType, direction) {
    const wrapper = document.getElementById(`slider-${roomType}`);
    const images = wrapper.querySelectorAll("img");
    
    images[activeSlideIndexes[roomType]].classList.remove("active");
    activeSlideIndexes[roomType] = (activeSlideIndexes[roomType] + direction + images.length) % images.length;
    images[activeSlideIndexes[roomType]].classList.add("active");
  };

  window.openFullscreen = function(roomType) {
    const wrapper = document.getElementById(`slider-${roomType}`);
    const activeImg = wrapper.querySelector("img.active");
    const modal = document.getElementById("galleryModal");
    const modalImg = document.getElementById("modalImage");
    
    modalImg.src = activeImg.src;
    modal.classList.add("show");
  };

  window.closeFullscreen = function() {
    const modal = document.getElementById("galleryModal");
    modal.classList.remove("show");
  };

  // Breakfast Modal
  const viewBreakfastButtons = document.querySelectorAll(".view-breakfast-btn");
  const breakfastPricingSpan = document.getElementById("breakfastPricing");

  viewBreakfastButtons.forEach(button => {
    button.addEventListener("click", () => {
      const roomType = button.getAttribute("data-room");

      if (roomType === "suite") {
        breakfastPricingSpan.textContent = "Complimentary";
        breakfastPricingSpan.style.color = "#4ade80";
      } else {
        breakfastPricingSpan.textContent = "Paid ($15 per person)";
        breakfastPricingSpan.style.color = "#c5a880";
      }

      document.getElementById("breakfastModal").classList.add("show");
    });
  });

  window.closeBreakfastModal = function() {
    document.getElementById("breakfastModal").classList.remove("show");
  };

  // Search/Filter Listeners
  searchBtn.addEventListener("click", renderBookings);
  searchQueryInput.addEventListener("input", renderBookings);
  filterRoomTypeSelect.addEventListener("change", renderBookings);
  sortBookingsSelect.addEventListener("change", renderBookings);

  // Tab storage synchronization
  window.addEventListener("storage", (event) => {
    if (event.key === "hotelBookings") {
      renderBookings();
      updateRoomAvailability();
    }
  });

  // Scroll highlights
  window.addEventListener("scroll", () => {
    let currentSectionId = "";
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= (sectionTop - 180)) {
        currentSectionId = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  });
});
