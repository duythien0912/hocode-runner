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

    // app.use(cookieParser())
    app.use(bodyParser.json())

    router.get('/runner', (req, res) => {
        res.sendFile(path.join(__dirname + '/index.html'));

    })

    router.post('/runner', function (req, res) {
        run({
            language: 'java',
            code: req.body.code,
            fixture: req.body.test,
        }, function (buffer) {
            const regex = RegExp(/<DESCRIBE::>(.*)<RUNCOUNT::>(.*)<GETFAILURECOUNT::>(.*)<COMPLETEDIN::>(.*)<GETALLFAILURE::>(.*)<GETALLFAILUREEND::>(.*)<GETIGNORECOUNT::>(.*)<WASSUCCESSFUL::>(.*)/gms);
            const str = buffer.stdout.replace(/\n/g, '');

            console.log("[str]")
            console.log(str)
            let m = regex.exec(str);
            console.log("[m]")
            console.log(m)

            if (m !== null) {
                var listFa = [];
                var resm5 = m[5].split("<GETONEFAILURE::>");
                for (let index = 0; index < resm5.length; index++) {
                    const itemIn = resm5[index];
                    if (itemIn !== "") {

                        var resu = itemIn.split("<");
                        var exp = resu[1].split(">")[0];
                        var outt = resu[2].split(">")[0];


                        listFa.push({
                            INDEX: index,
                            DETAIL: itemIn,
                            NAMEFUNC: itemIn.split("(TestFixture): ")[0],
                            EXPECTED: exp,
                            EXPECTED_OUTPUT: outt,
                        });
                    }
                }

                let outP = {
                    "DESCRIBE": m[1],
                    "RUNCOUNT": m[2],
                    "GETFAILURECOUNT": m[3],
                    "COMPLETEDIN": m[4],
                    "GETALLFAILURE": listFa,
                    "GETIGNORECOUNT": m[7],
                    "WASSUCCESSFUL": m[8],
                }
                buffer.stdout = outP;
            }
            res.json(buffer);
        });
    })

    app.use(function (err, req, res, next) {
        if (err.message === '404') {
            res.status(404);
            res.json({ error: err.message });
        }
    });


    app.use(router)

    app.listen(port, () => console.log(`Hocode app listening on port ${port}!`))
}

