import './style.css'
// only the file URLs, the fonts themselves are downloaded when a PDF is exported
import dejaVuSansUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans.ttf?url'
import dejaVuSansBoldUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?url'

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
// const errorMessage = document.getElementById('error-message') as HTMLParagraphElement
const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLButtonElement
const colorPicker = document.getElementById('color') as HTMLInputElement
const clearDoneButton = document.getElementById('clear-done') as HTMLButtonElement
const sortStatusButton = document.getElementById('sort-status') as HTMLButtonElement
const exportButton = document.getElementById('export-todos') as HTMLButtonElement
const exportPdfButton = document.getElementById('export-pdf') as HTMLButtonElement
const importButton = document.getElementById('import-todos') as HTMLButtonElement
const importFileInput = document.getElementById('import-file') as HTMLInputElement

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
        <span class="todo-text"></span>
        <div class="todo-dates">
          <span>Created ${todo.createdAt.toLocaleDateString()}</span>
          ${todo.dueDate ? `<span class="todo-due">Due ${formatDueDate(todo.dueDate)}</span>` : ''}
        </div>
      </div>
      <button>Remove</button>
    `
    // set as plain text, so HTML in a todo (typed or from an imported file) is shown, not run
    const textSpan = li.querySelector('.todo-text') as HTMLSpanElement
    textSpan.textContent = todo.text
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


// removes the done todos, the rest stay in their current order
const clearDoneTodos = ():void => {
  todos = todos.filter(todo => !todo.completed)
  renderTodos()
}

clearDoneButton.addEventListener('click', clearDoneTodos)


// in progress first, then overdue, then done
const getStatusOrder = (todo:Todo):number => {
  if (todo.completed) return 2
  if (isOverdue(todo)) return 1
  return 0
}

const sortTodosByStatus = ():void => {
  // sort keeps todos with the same status in their current order
  todos = [...todos].sort((a, b) => getStatusOrder(a) - getStatusOrder(b))
  renderTodos()
}

sortStatusButton.addEventListener('click', sortTodosByStatus)


// downloads the list as todos.json, createdAt is saved as an ISO date string
const exportTodos = ():void => {
  const json = JSON.stringify(todos, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'todos.json'
  link.click()
  URL.revokeObjectURL(url)
}

// turns parsed JSON back into todos, or returns null if the file isn't a list of todos
const parseImportedTodos = (data:unknown):Todo[] | null => {
  if (!Array.isArray(data)) return null

  const imported: Todo[] = []
  for (const item of data) {
    if (typeof item !== 'object' || item === null) return null
    const { text, completed, createdAt, dueDate } = item as Record<string, unknown>
    if (typeof text !== 'string' || text.trim() === '') return null

    const created = typeof createdAt === 'string' ? new Date(createdAt) : new Date()
    imported.push({
      // new ids, so they can't clash with ids already used in this session
      id: nextId++,
      text: text.trim(),
      completed: completed === true,
      createdAt: isNaN(created.getTime()) ? new Date() : created,
      // only keep due dates in the date picker's 'YYYY-MM-DD' format
      dueDate: typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : '',
    })
  }
  return imported
}

// replaces the current list with the todos from the chosen file
const importTodos = async (file:File):Promise<void> => {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    alert(`${file.name} is not a valid JSON file.`)
    return
  }

  const imported = parseImportedTodos(data)
  if (imported === null) {
    alert(`${file.name} doesn't contain a list of todos.`)
    return
  }

  todos = imported
  renderTodos()
}

exportButton.addEventListener('click', exportTodos)


const getStatusLabel = (todo:Todo):string => {
  if (todo.completed) return 'Done'
  if (isOverdue(todo)) return 'Overdue'
  return 'In progress'
}

const loadFontAsBase64 = async (url:string):Promise<string> => {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer())
  // btoa needs a binary string, built in chunks so a big font doesn't overflow the call stack
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

// downloads todos.pdf with a table of every todo's text, status and dates
const exportTodosToPdf = async ():Promise<void> => {
  // the PDF libraries and fonts are big, so they're only loaded when someone exports
  const [{ jsPDF }, { autoTable }, regularFont, boldFont] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadFontAsBase64(dejaVuSansUrl),
    loadFontAsBase64(dejaVuSansBoldUrl),
  ])

  const doc = new jsPDF()
  // the built-in PDF fonts can't show letters like ő and ű, DejaVu Sans can
  doc.addFileToVFS('DejaVuSans.ttf', regularFont)
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
  doc.addFileToVFS('DejaVuSans-Bold.ttf', boldFont)
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')
  doc.setFont('DejaVuSans', 'normal')

  doc.setFontSize(18)
  doc.text('Todo list', 14, 20)
  doc.setFontSize(10)
  doc.text(`Exported ${new Date().toLocaleDateString()}`, 14, 27)

  if (todos.length === 0) {
    doc.text('No todos.', 14, 37)
  } else {
    autoTable(doc, {
      startY: 32,
      styles: { font: 'DejaVuSans' },
      head: [['Todo', 'Status', 'Created', 'Due']],
      body: todos.map(todo => [
        todo.text,
        getStatusLabel(todo),
        todo.createdAt.toLocaleDateString(),
        todo.dueDate ? formatDueDate(todo.dueDate) : '',
      ]),
    })
  }

  doc.save('todos.pdf')
}

exportPdfButton.addEventListener('click', exportTodosToPdf)

importButton.addEventListener('click', () => importFileInput.click())

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files?.[0]
  if (!file) return
  await importTodos(file)
  // reset, so picking the same file again still triggers a change
  importFileInput.value = ''
})

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode')
})

// update the page background live while a color is being picked
colorPicker.addEventListener('input', () => {
  document.body.style.setProperty('--body-background-color', colorPicker.value)
})