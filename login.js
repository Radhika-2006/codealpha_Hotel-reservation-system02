document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const loginForm = document.getElementById("loginForm");
  const otpForm = document.getElementById("otpForm");
  
  const fullNameInput = document.getElementById("fullName");
  const phoneNumInput = document.getElementById("phoneNum");
  const otpCodeInput = document.getElementById("otpCode");

  const nameError = document.getElementById("nameError");
  const phoneError = document.getElementById("phoneError");
  const otpError = document.getElementById("otpError");

  const loginSection = document.getElementById("loginSection");
  const otpSection = document.getElementById("otpSection");

  const displayPhoneSpan = document.getElementById("displayPhone");
  const timerValSpan = document.getElementById("timerVal");
  const timerTextSpan = document.getElementById("timerText");
  const resendOtpBtn = document.getElementById("resendOtpBtn");

  // --- State Variables ---
  let generatedOtp = null;
  let storedName = "";
  let storedPhone = "";
  let timerInterval = null;
  let timeLeft = 30;

  /**
   * Generates a random 6-digit number to act as OTP.
   * @returns {string} The 6-digit code.
   */
  function generateRandomOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Starts a 30-second countdown for resending OTP.
   */
  function startCountdown() {
    // Clear any active interval first
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timeLeft = 30;
    timerValSpan.textContent = timeLeft;
    
    // UI configuration
    timerTextSpan.style.display = "inline";
    resendOtpBtn.style.display = "none";

    // Set tick interval
    timerInterval = setInterval(() => {
      timeLeft--;
      timerValSpan.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerTextSpan.style.display = "none";
        resendOtpBtn.style.display = "inline";
      }
    }, 1000);
  }

  /**
   * Handles Resend OTP action.
   */
  window.resendOTP = function() {
    generatedOtp = generateRandomOTP();
    
    // Display OTP in alert for demo verification purposes
    alert(`[Demo Verification] Your new 6-digit OTP code is: ${generatedOtp}`);
    
    // Reset timer
    startCountdown();
  };

  // Bind click event to resend button
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", window.resendOTP);
  }

  // --- Submit Handlers ---

  // 1. Send OTP Step
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    // Clear previous errors
    nameError.style.display = "none";
    phoneError.style.display = "none";

    const nameVal = fullNameInput.value.trim();
    const phoneVal = phoneNumInput.value.trim();

    // Name Validation (letters and spaces only)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(nameVal)) {
      nameError.textContent = "Full name can only contain letters and spaces.";
      nameError.style.display = "block";
      return;
    }

    // Phone Validation (exactly 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneVal)) {
      phoneError.textContent = "Please enter a valid 10-digit mobile number.";
      phoneError.style.display = "block";
      return;
    }

    // Capture values
    storedName = nameVal;
    storedPhone = phoneVal;

    // Generate and show OTP
    generatedOtp = generateRandomOTP();
    alert(`[Demo Verification] Your 6-digit OTP code is: ${generatedOtp}`);

    // Update UI Elements
    displayPhoneSpan.textContent = `+91 ${phoneVal.slice(0, 5)} ${phoneVal.slice(5)}`;
    loginSection.style.display = "none";
    otpSection.style.display = "block";

    // Launch Timer
    startCountdown();
  });

  // 2. Verify OTP Step
  otpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    otpError.style.display = "none";

    const userOtp = otpCodeInput.value.trim();

    // Match OTP code
    if (userOtp === generatedOtp) {
      // Clear interval
      if (timerInterval) clearInterval(timerInterval);

      // Save user session details in localStorage
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify({
        fullName: storedName,
        phoneNum: storedPhone
      }));

      alert(`Success! Welcome, ${storedName}. Logged in successfully.`);
      
      // Redirect to Home page
      window.location.href = "index.html";
    } else {
      otpError.textContent = "Incorrect OTP code. Please try again.";
      otpError.style.display = "block";
    }
  });
});
