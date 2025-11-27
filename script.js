// Listen for form submission
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent form from submitting if there are errors

    // Clear previous error messages
    document.getElementById('firstNameError').textContent = '';
    document.getElementById('secondNameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('phoneError').textContent = '';
    document.getElementById('eircodeError').textContent = '';

    let isValid = true; // Flag to track if the form is valid

    // Get values from the form
    const firstName = document.getElementById('firstName').value.trim();
    const secondName = document.getElementById('secondName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const eircode = document.getElementById('eircode').value.trim();

    // Validate First Name and Second Name
    const nameRegex = /^[A-Za-z0-9]{1,20}$/; // Only letters/numbers, max 20 characters
    if (!nameRegex.test(firstName)) {
        document.getElementById('firstNameError').textContent = 'First name must be max 20 characters';
        isValid = false;
    }
    if (!nameRegex.test(secondName)) {
        document.getElementById('secondNameError').textContent = 'Surname must be max 20 characters';
        isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format check
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Invalid email format';
        isValid = false;
    }

    // Validate Phone Number
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits
    if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').textContent = 'Phone must be 10 digits';
        isValid = false;
    }

    // Validate Eircode
    const eircodeRegex = /^[A-Z]\d{2}[A-Z0-9]{4}$/i;// Checking if the eircode is in irish format
    if (!eircodeRegex.test(eircode)) {
    document.getElementById('eircodeError').textContent = 'Eircode must follow the Irish format (e.g., D09E20B)';
    isValid = false;
    }

    // If all validations pass, show success message and submit
    if (isValid) {
        alert('Form was sent successfully!');
        this.reset();
    }
});