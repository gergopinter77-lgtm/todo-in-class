import './style.css'

// structure of the data schema
interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  dueDate: string; // 'YYYY-MM-DD' from the date picker, '' when none was picked
}

let todos: Todo[] = [];
// counts up so every todo gets its own id, Date.now() repeats when two are added in the same millisecond
let nextId = 1;

const todoInput = document.getElementById('todo-input') as HTMLInputElement
const dueDateInput = document.getElementById('due-date') as HTMLInputElement
const todoForm = document.querySelector('.todo-form') as HTMLFormElement
const todoList = document.getElementById('todo-list') as HTMLUListElement
const errorMessage = document.getElementById('error-message') as HTMLParagraphElement
const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLButtonElement
const colorPicker = document.getElementById('color') as HTMLInputElement

const addTodo = (text:string, dueDate:string):void => {
  const newTodo: Todo = {
    id: nextId++,
    text: text,
    completed: false,
    createdAt: new Date(),
    dueDate: dueDate,
  }
  todos.push(newTodo)
  console.log(`Todo added: ${todos}`)

  renderTodos();
}

const formatDueDate = (dueDate:string):string => {
  // build the date from its parts, new Date('YYYY-MM-DD') reads it as UTC and can be a day off
  const [year, month, day] = dueDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

// overdue means the due date was before today and the todo isn't done
const isOverdue = (todo:Todo):boolean => {
  if (todo.completed || todo.dueDate === '') return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  // 'YYYY-MM-DD' strings sort the same way the dates do, so they can be compared directly
  return todo.dueDate < today
}

const renderTodos = ():void => {
  // clear the current list
  todoList.innerHTML = '';

  todos.forEach(todo => {
    const li = document.createElement('li')
    // the completed and overdue classes are the hooks for styling those todos
    li.className = 'todo-item'
    if (todo.completed) li.classList.add('completed')
    if (isOverdue(todo)) li.classList.add('overdue')
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''}>
      <div>
        <span class="todo-text">${todo.text}</span>
        <div class="todo-dates">
          <span>Created ${todo.createdAt.toLocaleDateString()}</span>
          ${todo.dueDate ? `<span class="todo-due">Due ${formatDueDate(todo.dueDate)}</span>` : ''}
        </div>
      </div>
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
    addTodo(text, dueDateInput.value)
    todoInput.value = '' //clear
    dueDateInput.value = ''
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