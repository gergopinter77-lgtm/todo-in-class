const path = require('path')

module.exports = {
    // no browsers here: npm run e2e opens Chrome itself (scripts/run-e2e.cjs), npm run e2e:remote waits for one
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
