import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

const addTodo = (todos: Todo[], text: string) => {
    const newTodo:Todo = {
        id: 123,
        text,
        completed: false
    }
    return [...todos, newTodo]
}

const removeTodo = (todos: Todo[], id: number): Todo[] => {
    return todos.filter(todo => todo.id !== id);
}

describe('add Todo', () => {
    it('should add a new todo to the list', () => {
        const todos: Todo[] = [];
        const result = addTodo(todos, 'Test todo');
        expect(result.length).toBe(1)
        expect(result[0].text).toBe('Test todo')
        expect(result[0].completed).toBe(false)
    })
})
describe('dark mode button', () => {
    beforeAll(async () => {
        // main.ts looks up its elements when it loads, so the markup has to exist first
        document.body.innerHTML = `
            <div class="container">
                <button type="button" id="dark-mode-toggle">Dark Mode</button>
                <form class="todo-form">
                    <input type="text" id="todo-input">
                    <input type="date" id="due-date">
                    <button type="submit">Add</button>
                </form>
                <p id="error-message"></p>
                <button type="button" id="sort-status">Sort by status</button>
                <ul class="todo-list" id="todo-list"></ul>
                <button type="button" id="clear-all">Clear all</button>
                <button type="button" id="export-todos">Export JSON</button>
                <button type="button" id="export-pdf">Export PDF</button>
                <button type="button" id="import-todos">Import JSON</button>
                <input type="file" id="import-file" hidden>
                <input type="color" id="color" value="#f4f4f4">
            </div>
        `
        await import('./main')
    })

    beforeEach(() => {
        document.body.classList.remove('dark-mode')
    })

    const clickToggle = () => {
        const button = document.getElementById('dark-mode-toggle') as HTMLButtonElement
        button.click()
    }

    it('should start in light mode', () => {
        expect(document.body.classList.contains('dark-mode')).toBe(false)
    })

    it('should turn on dark mode when clicked', () => {
        clickToggle()
        expect(document.body.classList.contains('dark-mode')).toBe(true)
    })

    it('should turn dark mode off when clicked again', () => {
        clickToggle()
        clickToggle()
        expect(document.body.classList.contains('dark-mode')).toBe(false)
    })
})

describe('background color picker', () => {
    it('should change the page background to the picked color', () => {
        const colorPicker = document.getElementById('color') as HTMLInputElement
        colorPicker.value = '#ff8800'
        colorPicker.dispatchEvent(new Event('input'))
        expect(document.body.style.getPropertyValue('--body-background-color')).toBe('#ff8800')
    })
})

describe('clear all button', () => {
    const addTodoThroughForm = (text: string) => {
        const todoInput = document.getElementById('todo-input') as HTMLInputElement
        const todoForm = document.querySelector('.todo-form') as HTMLFormElement
        todoInput.value = text
        todoForm.requestSubmit()
    }

    const clickClearAll = () => {
        const button = document.getElementById('clear-all') as HTMLButtonElement
        button.click()
    }

    const getTodoItems = () => document.querySelectorAll('.todo-item')

    beforeEach(() => {
        clickClearAll()
    })

    it('should remove every todo', () => {
        addTodoThroughForm('One')
        addTodoThroughForm('Two')
        addTodoThroughForm('Three')
        expect(getTodoItems().length).toBe(3)

        clickClearAll()
        expect(getTodoItems().length).toBe(0)
    })

    it('should let new todos be added after clearing', () => {
        addTodoThroughForm('Old todo')
        clickClearAll()
        addTodoThroughForm('New todo')

        const items = getTodoItems()
        expect(items.length).toBe(1)
        expect(items[0].querySelector('.todo-text')?.textContent).toBe('New todo')
    })

    it('should do nothing when the list is already empty', () => {
        expect(() => clickClearAll()).not.toThrow()
        expect(getTodoItems().length).toBe(0)
    })
})

describe('sort by status button', () => {
    // 'YYYY-MM-DD' for a day relative to today, the same format the date picker gives
    const getDateString = (daysFromToday: number) => {
        const date = new Date()
        date.setDate(date.getDate() + daysFromToday)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${date.getFullYear()}-${month}-${day}`
    }

    const addTodoThroughForm = (text: string, dueDate = '') => {
        const todoInput = document.getElementById('todo-input') as HTMLInputElement
        const dueDateInput = document.getElementById('due-date') as HTMLInputElement
        const todoForm = document.querySelector('.todo-form') as HTMLFormElement
        todoInput.value = text
        dueDateInput.value = dueDate
        todoForm.requestSubmit()
    }

    const tickTodo = (text: string) => {
        const item = [...document.querySelectorAll('.todo-item')]
            .find(li => li.querySelector('.todo-text')?.textContent === text)
        const checkbox = item?.querySelector('input[type="checkbox"]') as HTMLInputElement
        checkbox.click()
    }

    const clickSort = () => {
        const button = document.getElementById('sort-status') as HTMLButtonElement
        button.click()
    }

    const getTodoTexts = () =>
        [...document.querySelectorAll('.todo-item .todo-text')].map(span => span.textContent)

    beforeEach(() => {
        const clearAllButton = document.getElementById('clear-all') as HTMLButtonElement
        clearAllButton.click()
    })

    it('should put in progress todos first, then overdue, then done', () => {
        addTodoThroughForm('Done')
        addTodoThroughForm('Overdue', getDateString(-1))
        addTodoThroughForm('In progress')
        tickTodo('Done')

        clickSort()
        expect(getTodoTexts()).toEqual(['In progress', 'Overdue', 'Done'])
    })

    it('should keep todos with the same status in their current order', () => {
        addTodoThroughForm('Done A')
        addTodoThroughForm('In progress A')
        addTodoThroughForm('Done B')
        addTodoThroughForm('In progress B')
        tickTodo('Done A')
        tickTodo('Done B')

        clickSort()
        expect(getTodoTexts()).toEqual(['In progress A', 'In progress B', 'Done A', 'Done B'])
    })

    it('should count todos due today or later as in progress', () => {
        addTodoThroughForm('Overdue', getDateString(-1))
        addTodoThroughForm('Due today', getDateString(0))
        addTodoThroughForm('Due next week', getDateString(7))

        clickSort()
        expect(getTodoTexts()).toEqual(['Due today', 'Due next week', 'Overdue'])
    })

    it('should add new todos at the bottom after sorting', () => {
        addTodoThroughForm('Done')
        addTodoThroughForm('In progress')
        tickTodo('Done')

        clickSort()
        addTodoThroughForm('New todo')
        expect(getTodoTexts()).toEqual(['In progress', 'Done', 'New todo'])
    })
})

describe('export and import JSON', () => {
    const addTodoThroughForm = (text: string, dueDate = '') => {
        const todoInput = document.getElementById('todo-input') as HTMLInputElement
        const dueDateInput = document.getElementById('due-date') as HTMLInputElement
        const todoForm = document.querySelector('.todo-form') as HTMLFormElement
        todoInput.value = text
        dueDateInput.value = dueDate
        todoForm.requestSubmit()
    }

    const getTodoItems = () => [...document.querySelectorAll('.todo-item')]
    const getTodoTexts = () => getTodoItems().map(li => li.querySelector('.todo-text')?.textContent)

    // jsdom can't download files, so catch the file the export would have saved
    const exportAndCapture = async () => {
        let blob: Blob | undefined
        let fileName = ''
        URL.createObjectURL = vi.fn((object: Blob) => {
            blob = object
            return 'blob:test'
        })
        URL.revokeObjectURL = vi.fn()
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            fileName = this.download
        })

        const exportButton = document.getElementById('export-todos') as HTMLButtonElement
        exportButton.click()
        return { fileName, json: await blob!.text() }
    }

    // jsdom has no file picker, so put the file on the input and fire change like a real pick would
    const importFile = (name: string, content: string) => {
        const input = document.getElementById('import-file') as HTMLInputElement
        const file = new File([content], name, { type: 'application/json' })
        Object.defineProperty(input, 'files', { value: [file], configurable: true })
        input.dispatchEvent(new Event('change'))
    }

    let alertSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        const clearAllButton = document.getElementById('clear-all') as HTMLButtonElement
        clearAllButton.click()
        alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should export the todos as todos.json', async () => {
        addTodoThroughForm('Buy milk')
        addTodoThroughForm('Pay rent', '2026-12-01')
        const checkbox = getTodoItems()[0].querySelector('input[type="checkbox"]') as HTMLInputElement
        checkbox.click()

        const { fileName, json } = await exportAndCapture()
        const exported = JSON.parse(json)

        expect(fileName).toBe('todos.json')
        expect(exported).toHaveLength(2)
        expect(exported[0]).toMatchObject({ text: 'Buy milk', completed: true, dueDate: '' })
        expect(exported[1]).toMatchObject({ text: 'Pay rent', completed: false, dueDate: '2026-12-01' })
        expect(Number.isNaN(new Date(exported[0].createdAt).getTime())).toBe(false)
    })

    it('should replace the list with the imported todos', async () => {
        addTodoThroughForm('Old todo')

        importFile('todos.json', JSON.stringify([
            { text: 'Imported A', completed: true, createdAt: '2026-01-15T10:00:00.000Z', dueDate: '2099-02-01' },
            { text: 'Imported B' },
        ]))

        await vi.waitFor(() => expect(getTodoTexts()).toEqual(['Imported A', 'Imported B']))
        expect(getTodoItems()[0].classList.contains('completed')).toBe(true)
        expect(getTodoItems()[0].querySelector('.todo-due')).not.toBeNull()
        expect(getTodoItems()[1].classList.contains('completed')).toBe(false)
        expect(getTodoItems()[1].querySelector('.todo-due')).toBeNull()
    })

    it('should import a file it exported', async () => {
        addTodoThroughForm('Buy milk')
        addTodoThroughForm('Pay rent', '2026-12-01')
        const { json } = await exportAndCapture()

        const clearAllButton = document.getElementById('clear-all') as HTMLButtonElement
        clearAllButton.click()
        importFile('todos.json', json)

        await vi.waitFor(() => expect(getTodoTexts()).toEqual(['Buy milk', 'Pay rent']))
    })

    it('should give imported todos their own ids', async () => {
        // both todos have the same id in the file, ticking one must not tick the other
        importFile('todos.json', JSON.stringify([{ id: 1, text: 'First' }, { id: 1, text: 'Second' }]))
        await vi.waitFor(() => expect(getTodoTexts()).toEqual(['First', 'Second']))

        const checkbox = getTodoItems()[0].querySelector('input[type="checkbox"]') as HTMLInputElement
        checkbox.click()

        expect(getTodoItems()[0].classList.contains('completed')).toBe(true)
        expect(getTodoItems()[1].classList.contains('completed')).toBe(false)
    })

    it('should keep the list and show a message for a file that is not JSON', async () => {
        addTodoThroughForm('Keep me')

        importFile('broken.json', '{not json')

        await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith('broken.json is not a valid JSON file.'))
        expect(getTodoTexts()).toEqual(['Keep me'])
    })

    it('should keep the list and show a message for JSON that is not a list of todos', async () => {
        addTodoThroughForm('Keep me')

        importFile('wrong.json', JSON.stringify({ text: 'not in a list' }))

        await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith("wrong.json doesn't contain a list of todos."))
        expect(getTodoTexts()).toEqual(['Keep me'])
    })

    it('should show HTML in an imported todo as text instead of running it', async () => {
        const html = '<img src="x" onerror="window.hacked = true">'

        importFile('evil.json', JSON.stringify([{ text: html }]))

        await vi.waitFor(() => expect(getTodoTexts()).toEqual([html]))
        expect(document.querySelector('.todo-item img')).toBeNull()
    })
})
