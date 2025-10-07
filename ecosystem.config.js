module.exports = {
    apps: [
        {
            name: "Production-Backend",
            script: "index.js",
            watch: false,
            env: {
                NODE_ENV: "production",

            },
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
            shared: ["uploads"]     
        }
    }
}
