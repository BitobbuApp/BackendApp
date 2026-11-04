// PM2 receives ONLY non-secret bootstrap pointers. The client id/secret live in
// INFISICAL_CREDENTIALS_FILE (0400 on the VPS); app secrets are fetched in memory at startup.
const bootstrap = {
    NODE_ENV: 'dev',
    INFISICAL_SITE_URL: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
    INFISICAL_PROJECT_ID: process.env.INFISICAL_PROJECT_ID || "",
    INFISICAL_ENV: process.env.INFISICAL_ENV || 'dev',
    INFISICAL_CREDENTIALS_FILE: process.env.INFISICAL_CREDENTIALS_FILE || "",
}

module.exports = {
    apps: [
        {
            name: 'api',
            script: 'dist/index.js',
            instances: 1,
            max_memory_restart: '500M',
            kill_timeout: 10000,
            exp_backoff_restart_delay: 1000,
            exec_mode: 'fork',
            stop_exit_codes: [78], // permanent bootstrap error (bad credentials/path/config): don't restart-loop
            env: bootstrap,
        },
        {
            name: 'worker',
            script: 'dist/worker.js',
            instances: 1,
            max_memory_restart: '500M',
            kill_timeout: 10000,
            exp_backoff_restart_delay: 1000,
            exec_mode: 'fork',
            stop_exit_codes: [78], // permanent bootstrap error (bad credentials/path/config): don't restart-loop
            env: bootstrap,
        },
    ],
};
