let myForm = document.querySelector('form');
let myName = document.querySelector('#name');

myForm.addEventListener('submit', (e) => {
    e.preventDefault();
    confirmMessage.TextContent = `Hi ${myName.value}, your 
    foodbank has been registered.`;
});