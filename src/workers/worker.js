const { parentPort, workerData } = require("worker_threads");

function execCharge() {
    setTimeout(() => {
        console.log('Executing charge... ');
        workerData.transaction.status = 'success';
        parentPort.postMessage(workerData.transaction);
    }, 100);
}


execCharge();