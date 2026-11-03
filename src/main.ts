import './style.css'

// structure of the data schema
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

let todos: Todo[] = [];

const todoInput = document.getElementById('todo-input') as HTMLInputElement
const todoForm = document.querySelector('.todo-form') as HTMLFormElement
const todoList = document.getElementById('todo-list') as HTMLUListElement
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement
const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLButtonElement
const colorPicker = document.getElementById('color') as HTMLInputElement

const addTodo = (text:string):void => {
  const newTodo: Todo = {
    id: Date.now(),
    text: text,
    completed: false,
  }
  todos.push(newTodo)
  console.log(`Todo added: ${todos}`)

  renderTodos();
}

const renderTodos = ():void => {
  // clear the current list
  todoList.innerHTML = '';

  todos.forEach(todo => {
    const li = document.createElement('li')
    // the completed class is the hook for styling done todos
    li.className = todo.completed ? 'todo-item completed' : 'todo-item'
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <span>${todo.text}</span>
      <button>Remove</button>
    `
    addCheckboxListener(li, todo.id)
    addRemoveButtonListener(li, todo.id)
    todoList.appendChild(li)
  })
}

renderTodos();

todoForm.addEventListener('submit', (event: Event) => {
  event.preventDefault();

  const text = todoInput.value.trim()

  if (text !== '') {
    addTodo(text)
    todoInput.value = '' //clear 
  }
})


const addRemoveButtonListener = (li:HTMLLIElement, id:number):void => {
  const removeButton = li.querySelector('button')
  removeButton?.addEventListener('click', () => removeTodo(id))
}


const removeTodo = (id:number):void => {
  todos = todos.filter(todo => todo.id !== id)
  renderTodos()
}


const addCheckboxListener = (li:HTMLLIElement, id:number):void => {
  const checkbox = li.querySelector('input[type="checkbox"]')
  checkbox?.addEventListener('change', () => toggleTodo(id))
}


const toggleTodo = (id:number):void => {
  todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo)
  renderTodos()
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode')
})

// update the page background live while a color is being picked
colorPicker.addEventListener('input', () => {
  document.body.style.setProperty('--body-background-color', colorPicker.value)
})