// PM2 receives ONLY non-secret bootstrap pointers. The client id/secret live in
// INFISICAL_CREDENTIALS_FILE (0400 on the VPS); app secrets are fetched in memory at startup.
const bootstrap = {
    NODE_ENV: 'dev',
    INFISICAL_SITE_URL: process.env.INFISICAL_SITE_URL || 'https://app.infisical.com',
    INFISICAL_PROJECT_ID: process.env.INFISICAL_PROJECT_ID || "",
    INFISICAL_ENV: process.env.INFISICAL_ENV || 'dev',
    INFISICAL_CREDENTIALS_FILE: process.env.INFISICAL_CREDENTIALS_FILE || "",
}

const common = {
    max_memory_restart: '500M',
    kill_timeout: 10000,
    exp_backoff_restart_delay: 1000,
    stop_exit_codes: [78], // permanent bootstrap error (bad credentials/path/config): don't restart-loop
}

module.exports = {
    apps: [
        {
            ...common,
            name: 'api',
            script: 'dist/index.js',
            // PM2 cluster: 2 processes share the same port and PM2 balances the connections between them.
            // nginx points to that single port.
            instances: 2,
            exec_mode: 'cluster',
            env: { ...bootstrap, PORT: process.env.PORT_API || '5000' },
        },
        {
            ...common,
            name: 'worker',
            script: 'dist/worker.js',
            instances: 1, // a single BullMQ worker process
            exec_mode: 'fork',
            env: bootstrap,
        },
    ],
};
