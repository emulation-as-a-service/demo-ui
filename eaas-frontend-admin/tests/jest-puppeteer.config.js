const headless = process.env.HEADLESS !== 'false';

module.exports = {
    launch: {
        headless: headless,
        slowMo: headless ? 50 : 150,
    },
    server: {
        command: 'npm run server',
        launchTimeout: 5 * 60 * 1000,
        protocol: 'http',
        port: 8082,
    }
}
