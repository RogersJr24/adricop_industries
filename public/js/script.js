// Function to show alert message
function showMessage() {
    alert("You clicked the button!");
}

function loadMessages() {

    fetch(apiUrl("/messages"))

        .then(res => res.json())

        .then(data => {

            let messagesHTML = "";

            data.forEach(msg => {

                messagesHTML += `

<div class="message">

<h4>${msg.name}</h4>

<p>${msg.message}</p>

<small>${msg.email}</small>

</div>

`;

            });

            document.getElementById("messagesList").innerHTML = messagesHTML;

        });

}

document.addEventListener("DOMContentLoaded", function () {

    var contactForm = document.getElementById("contactForm");
    var messagesList = document.getElementById("messagesList");

    if (!contactForm || !messagesList) {
        return;
    }

    loadMessages();

    contactForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const formData = new FormData(this);

        fetch(apiUrl("/contact"), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: formData.get("name"),
                email: formData.get("email"),
                message: formData.get("message")
            })
        })

            .then(res => res.json())

            .then(data => {

                if (data.success) {

                    document.getElementById("successMessage").innerText = "Message sent successfully!";

                    document.getElementById("contactForm").reset();

                    loadMessages();

                } else {

                    document.getElementById("successMessage").innerText = "Error saving message";

                }

            });

    });

});
