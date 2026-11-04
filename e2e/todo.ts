import { Selector, ClientFunction } from 'testcafe'

// TestCafe starts its own dev server on this port, see appCommand in .testcaferc.cjs
const APP_URL = 'http://localhost:5199'

const todoInput = Selector('#todo-input')
const dueDateInput = Selector('#due-date')
const addButton = Selector('.todo-form button')
const todoItems = Selector('.todo-item')
const darkModeToggle = Selector('#dark-mode-toggle')
const body = Selector('body')

// dates are worked out in the browser so they use the same time zone and format as the app
const getDateString = ClientFunction((daysFromToday: number) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromToday)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
})

const getDisplayedDate = ClientFunction((dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString()
})

const pickBackgroundColor = ClientFunction((color: string) => {
    const colorPicker = document.getElementById('color') as HTMLInputElement
    colorPicker.value = color
    colorPicker.dispatchEvent(new Event('input'))
})

const getBodyStyle = ClientFunction((property: string) => {
    return document.body.style.getPropertyValue(property)
})

const addTodo = async (t: TestController, text: string, dueDate = '') => {
    await t.typeText(todoInput, text, { replace: true })
    if (dueDate !== '') {
        await t.typeText(dueDateInput, dueDate)
    }
    await t.click(addButton)
}

fixture('Todo app')
    .page(APP_URL)

test('adds a todo with the day it was created', async t => {
    const today = await getDisplayedDate(await getDateString(0))

    await addTodo(t, 'Buy milk')

    await t
        .expect(todoItems.count).eql(1)
        .expect(todoItems.nth(0).find('.todo-text').innerText).eql('Buy milk')
        .expect(todoItems.nth(0).find('.todo-dates').innerText).contains(`Created ${today}`)
        .expect(todoItems.nth(0).find('.todo-due').exists).notOk()
})

test('clears the inputs after adding a todo', async t => {
    await addTodo(t, 'Buy milk', await getDateString(3))

    await t
        .expect(todoInput.value).eql('')
        .expect(dueDateInput.value).eql('')
})

test('does not add an empty todo', async t => {
    await t
        .click(addButton)
        .typeText(todoInput, '   ')
        .click(addButton)
        .expect(todoItems.count).eql(0)
})

test('shows the due date when one is picked', async t => {
    const dueDate = await getDateString(3)

    await addTodo(t, 'Finish the class project', dueDate)

    await t.expect(todoItems.nth(0).find('.todo-due').innerText)
        .eql(`Due ${await getDisplayedDate(dueDate)}`)
})

test('marks a todo done and not done with its checkbox', async t => {
    await addTodo(t, 'Buy milk')
    const checkbox = todoItems.nth(0).find('input[type="checkbox"]')

    await t
        .click(checkbox)
        .expect(todoItems.nth(0).hasClass('completed')).ok()
        .expect(checkbox.checked).ok()
        .click(checkbox)
        .expect(todoItems.nth(0).hasClass('completed')).notOk()
        .expect(checkbox.checked).notOk()
})

test('only marks the todo that was ticked', async t => {
    await addTodo(t, 'One')
    await addTodo(t, 'Two')
    await addTodo(t, 'Three')

    await t
        .click(todoItems.nth(1).find('input[type="checkbox"]'))
        .expect(todoItems.nth(0).hasClass('completed')).notOk()
        .expect(todoItems.nth(1).hasClass('completed')).ok()
        .expect(todoItems.nth(2).hasClass('completed')).notOk()
})

test('removes only the todo whose Remove button was clicked', async t => {
    await addTodo(t, 'One')
    await addTodo(t, 'Two')
    await addTodo(t, 'Three')

    await t
        .click(todoItems.nth(1).find('button'))
        .expect(todoItems.count).eql(2)
        .expect(todoItems.nth(0).find('.todo-text').innerText).eql('One')
        .expect(todoItems.nth(1).find('.todo-text').innerText).eql('Three')
})

test('marks a todo past its due date as overdue', async t => {
    await addTodo(t, 'Due yesterday', await getDateString(-1))

    await t.expect(todoItems.nth(0).hasClass('overdue')).ok()
})

test('does not mark todos due today or later as overdue', async t => {
    await addTodo(t, 'Due today', await getDateString(0))
    await addTodo(t, 'Due next week', await getDateString(7))
    await addTodo(t, 'No due date')

    await t
        .expect(todoItems.nth(0).hasClass('overdue')).notOk()
        .expect(todoItems.nth(1).hasClass('overdue')).notOk()
        .expect(todoItems.nth(2).hasClass('overdue')).notOk()
})

test('stops showing a done todo as overdue', async t => {
    await addTodo(t, 'Due yesterday', await getDateString(-1))

    await t
        .click(todoItems.nth(0).find('input[type="checkbox"]'))
        .expect(todoItems.nth(0).hasClass('overdue')).notOk()
        .expect(todoItems.nth(0).hasClass('completed')).ok()
})

test('turns dark mode on and off', async t => {
    await t
        .expect(body.hasClass('dark-mode')).notOk()
        .click(darkModeToggle)
        .expect(body.hasClass('dark-mode')).ok()
        .click(darkModeToggle)
        .expect(body.hasClass('dark-mode')).notOk()
})

test('changes the page background with the color picker', async t => {
    await pickBackgroundColor('#ff8800')

    await t
        .expect(getBodyStyle('--body-background-color')).eql('#ff8800')
        .expect(body.getStyleProperty('background-color')).eql('rgb(255, 136, 0)')
})
