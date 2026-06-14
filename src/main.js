import './style.css'

const button = document.getElementById('counterBtn')
let count = 0

button.addEventListener('click', () => {
    count++
    button.textContent = `Count: ${count}`
})

console.log('Vite app is running!')