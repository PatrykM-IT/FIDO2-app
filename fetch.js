import SimpleWebAuthnBrowser from '@simplewebauthn/browser';
  const { startRegistration } = SimpleWebAuthnBrowser;

  const registrationForm = document.getElementById('registration-form');
  const elemSuccess = document.getElementById('success');
  const elemError = document.getElementById('error');

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    const registrationResp = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        password,
      }),
    });
    console.log("TEST after sending data")
    const registrationJSON = await registrationResp.json();

    let attResp;
    try {
      attResp = await startRegistration(registrationJSON);
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        elemError.innerText = 'Error: Authenticator was probably already registered by user';
      } else {
        elemError.innerText = error;
      }

      throw error;
    }

    const verificationResp = await fetch('/verify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    });

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.innerHTML = 'Success!';
    } else {
      elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
        verificationJSON,
      )}</pre>`;
    }
  });