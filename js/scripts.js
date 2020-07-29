(function (document) {
  var form = document.getElementById('form');
  var nameInput = document.getElementById('name');
  var emailInput = document.getElementById('email');

  function handleSubmit(event) {
    // Do nothing if the user clicks "Sign Up".
    event.preventDefault();
  }

  function handleInput(event) {
    var value = event.target.value;
    var valid = event.target.validity.valid;

    if (valid || value === '') {
      event.target.removeAttribute('style');
      return;
    }

    event.target.setAttribute('style', 'border: 2px solid red;');
  }

  form.addEventListener('submit', handleSubmit);
  nameInput.addEventListener('input', handleInput);
  emailInput.addEventListener('input', handleInput);
})(window.document);
