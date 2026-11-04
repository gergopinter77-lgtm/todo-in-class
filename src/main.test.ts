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
                    <button type="submit">Add</button>
                </form>
                <p id="error-message"></p>
                <ul class="todo-list" id="todo-list"></ul>
                <button type="button" id="clear-all">Clear all</button>
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
