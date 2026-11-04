import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

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
