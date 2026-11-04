const path = require('path')

module.exports = {
    browsers: ['chrome:headless'],
    src: ['e2e/'],
    hostname: 'localhost',
    // start the app on its own port for the tests and stop it when they finish
    appCommand: 'node node_modules/vite/bin/vite.js --port 5199 --strictPort',
    appInitDelay: 4000,
    compilerOptions: {
        typescript: {
            configPath: 'e2e/tsconfig.json',
            // TestCafe ships TypeScript 4.9, which can't read the project's newer @types/node,
            // so compile the tests with the project's own TypeScript instead
            customCompilerModulePath: path.resolve(__dirname, 'node_modules/typescript'),
        },
    },
}
