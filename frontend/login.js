'use strict';

async function userLogin(name,password) {
    const response = await fetch(`http://127.0.0.1:5000/users/${name}/${password}`);
    if (response.ok) {
        const data = await response.json();

        console.log(data);
        // Save data to localStorage
        localStorage.setItem('userName', JSON.stringify(data.username));
        localStorage.setItem('userPassword', JSON.stringify(data.password));

        // Redirect user to another page
        window.location.href = 'game.html';
    } else {
        document.getElementById("error").innerText = "Error";
    }
}

document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    // Get username and password from the form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Call your function with the username and password
    userLogin(username, password);
});