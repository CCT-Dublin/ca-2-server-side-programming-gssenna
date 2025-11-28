// Listen for form submission
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Clear previous errors
    const clear = id => document.getElementById(id).textContent = '';
    clear('firstNameError'); clear('secondNameError'); clear('emailError'); clear('phoneError'); clear('eircodeError');

    let isValid = true;

    const firstName = document.getElementById('firstName').value.trim();
    const secondName = document.getElementById('secondName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const eircode = document.getElementById('eircode').value.trim();

    // Rules
    const nameRegex = /^[A-Za-z0-9]{1,20}$/;           // letters or numbers, max 20
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // basic email
    const phoneRegex = /^\d{10}$/;                     // exactly 10 digits
    const eircodeRegex = /^[0-9][A-Za-z0-9]{5}$/;     // starts with number, alphanumeric, exactly 6 chars

    if (!nameRegex.test(firstName)) {
        document.getElementById('firstNameError').textContent = 'First name: only letters/numbers, max 20 characters.';
        isValid = false;
    }
    if (!nameRegex.test(secondName)) {
        document.getElementById('secondNameError').textContent = 'Surname: only letters/numbers, max 20 characters.';
        isValid = false;
    }

    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Email must be a valid email address.';
        isValid = false;
    }

    if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').textContent = 'Phone must contain exactly 10 digits (numbers only).';
        isValid = false;
    }

    if (!eircodeRegex.test(eircode)) {
        document.getElementById('eircodeError').textContent = 'Eircode must start with a number, be alphanumeric and be exactly 6 characters.';
        isValid = false;
    }

    // If valid, submit via fetch to /submit (example) — prevents relying on PHP
    if (isValid) {
        // gather data in snake_case to match DB
        const data = {
            first_name: firstName,
            second_name: secondName,
            email: email,
            phone: phone,
            eircode: eircode
        };

        fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (!res.ok) throw new Error('Server error');
            return res.json();
        })
        .then(json => {
            alert('Form was sent successfully!');
            this.reset();
        })
        .catch(err => {
            alert('Erro ao submeter: ' + err.message);
        });
    }
});
