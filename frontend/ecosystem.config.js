module.exports = {
  apps: [
    {
      name: "2424-nextjs",
      script: "server.js",
      cwd: ".next/standalone",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
