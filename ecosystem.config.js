module.exports = {
    apps: [
        {
            name: "Production-Backend",
            script: "index.js",
            watch: false,
            env: {
                NODE_ENV: "production",
            },
            max_restarts: 10,             
            error_file: "./logs/error.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            merge_logs: true,
        }
    ],

    deploy: {
        production: {
            user: "moment",
            host: "46.252.193.108",  
            ref: "origin/production",     
            repo: "git@github.com:Badawy403/weallbeam.git",
            path: "/var/www/weallbeam/production-backend",
            "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production",
            shared: ["uploads","logs"]     
        }
    }
}
