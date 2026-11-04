// Runs the TestCafe tests in headless Chrome.
// TestCafe can't launch Chrome 156 on its own (the browser starts but never connects),
// so this opens Chrome itself and points it at a TestCafe remote connection instead.
// The rest of the settings (tests, app command, TypeScript) come from .testcaferc.cjs.
const createTestCafe = require('testcafe')
const { spawn, execSync } = require('child_process')
const fs = require('fs')
const net = require('net')
const os = require('os')
const path = require('path')

const APP_PORT = 5199
const CONNECT_TIMEOUT_MS = 30000

const findChrome = () => {
    const candidates = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
    ]
    const found = candidates.find(candidate => candidate && fs.existsSync(candidate))
    if (!found) {
        throw new Error('Chrome not found. Set CHROME_PATH to the full path of chrome.exe.')
    }
    return found
}

// a dev server left over from a crashed run keeps the port busy and makes the next run fail
const isPortInUseOn = (port, host) => new Promise(resolve => {
    const server = net.createServer()
    // only "address in use" counts, e.g. ::1 fails differently on machines without IPv6
    server.once('error', error => resolve(error.code === 'EADDRINUSE'))
    server.once('listening', () => server.close(() => resolve(false)))
    server.listen(port, host)
})

// Vite can end up on either the IPv4 or the IPv6 localhost address, so check both
const isPortInUse = async (port) =>
    (await isPortInUseOn(port, '127.0.0.1')) || (await isPortInUseOn(port, '::1'))

const stopChrome = (chrome) => {
    if (!chrome || chrome.exitCode !== null) return
    if (process.platform === 'win32') {
        // Chrome starts several processes, /T closes all of them
        try { execSync(`taskkill /PID ${chrome.pid} /T /F`, { stdio: 'ignore' }) } catch { /* already closed */ }
    } else {
        chrome.kill()
    }
}

const main = async () => {
    if (await isPortInUse(APP_PORT)) {
        console.error(`Port ${APP_PORT} is already in use, probably by a dev server left over from an earlier test run.`)
        console.error('Stop that process and run the tests again.')
        return 1
    }

    const testcafe = await createTestCafe()
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'testcafe-chrome-'))
    let chrome

    try {
        const connection = await testcafe.createBrowserConnection()
        const connected = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Chrome did not connect to TestCafe in time.')), CONNECT_TIMEOUT_MS)
            connection.once('ready', () => {
                clearTimeout(timer)
                resolve()
            })
        })

        chrome = spawn(findChrome(), [
            '--headless=new',
            `--user-data-dir=${profileDir}`,
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            connection.url,
        ], { stdio: 'ignore' })

        await connected
        const failedCount = await testcafe.createRunner().browsers(connection).run()
        return failedCount > 0 ? 1 : 0
    } finally {
        stopChrome(chrome)
        // closing TestCafe also stops the dev server it started
        await testcafe.close()
        fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
}

main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
        console.error(error.message)
        process.exit(1)
    })
