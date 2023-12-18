const fname =document.getElementById('name');
const email =document.getElementById('email');
const conmessage =document.getElementById('message');

const submit =document.getElementsByClassName('tm-contact-form tm-mb-200')[0];

submit.addEventListener('submit',(e)=>{
    e.preventDefault();
    console.log("Clicked");

let ebody = `
<b>Name: </b>${fname.value}
<br>
<b>Email: </b>${email.value}
<br>
<b>Message: </b>${conmessage.value}
`

    Email.send({
        SecureToken : "581b95d2-924d-4cd2-a813-e2e32feccef2",
        To : 'marc070363@gmail.com',
        From : "marc070363@gmail.com",
        Subject : "SUBDIVISION ENQUIRY | From " + email.value,
        Body : ebody
            }).then(
                (message) => {
                    // Clear input fields after sending email
                    fname.value = '';
                    email.value = '';
                    conmessage.value = '';
        
                    alert("Email Sent Successfully!");
                }
        );

})