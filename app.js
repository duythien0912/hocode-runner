const cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for dying workers
    cluster.on('exit', function (worker) {

        // Replace the dead worker, we're not sentimental
        console.log('Worker %d died :(', worker.id);
        cluster.fork();

    });

    // Code to run if we're in a worker process
} else {

    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const compression = require('compression');
    const path = require('path');
    var run = require('./lib/runner').run


    const app = express()
    const port = 8080

    const router = express.Router()

    app.use(cors());
    app.use(compression());

    router.get('/runner', (req, res) => {
        res.sendFile(path.join(__dirname + '/index.html'));

    })

    router.post('/runner', function (req, res) {
        run({
            language: 'java',
            code: req.body.code,
            fixture: req.body.test,
        }, function (buffer) {
            res.json(buffer);
        });
    })
    // app.use(cookieParser())
    app.use(bodyParser.json())

    app.use(router)

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))

}

