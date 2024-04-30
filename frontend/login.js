'use strict';

async function loginClick(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // sounds
    let clickSound = new Audio('assets/sounds/click.wav');
    clickSound.volume = 0.3;
    clickSound.play(); 

    // Get username and password from the form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Display error if username or password is empty
    if (username.length === 0 || password.length === 0) {
        document.getElementById('error').innerText = 'Username or password cannot be empty.';
        return;
    }

    // Show waiting cursor
    const loginBody = document.querySelector('.login-body');
    loginBody.classList.add('waiting');

    // Login or register
    const register = document.getElementById('select-register').checked;
    const success = await userLogin(username, password, register);

    // Remove waiting cursor
    loginBody.classList.remove('waiting');

    if (!success) {
        return;
    }

    // Redirect user to another page
    window.location.href = 'game.html';
}

async function userLogin(name, password, register) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/${register ? "register" : "users"}/${name}/${password}`);
        if (response.ok) {
            const data = await response.json();

            // Save data to localStorage
            localStorage.setItem('userName', JSON.stringify(data.username));
            localStorage.setItem('userPassword', JSON.stringify(data.password));

            return true;
        }

        document.getElementById('error').innerText = await response.text();

    } catch (error) {
        document.getElementById('error').innerText = 'Error while connecting to backend.';
    }


    return false;
}

function updateSubmitBtn() {
    document.getElementById('error').innerText = '';
    document.getElementById('login-register-btn').innerText = document.getElementById('select-login').checked ? 'Log In' : 'Register';
    // sounds
    let clickSound = new Audio('assets/sounds/click.wav');
    clickSound.volume = 0.3;
    clickSound.play(); 
}

const loginSelectButtons = document.querySelectorAll('.login-select');
for (let i = 0; i < loginSelectButtons.length; i++) {
    loginSelectButtons[i].addEventListener('change', updateSubmitBtn);
}

document.getElementById('login-form').addEventListener('submit', loginClick);
