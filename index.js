var AWS = require('aws-sdk');
var request = new AWS.EC2();
var region = 'us-east-1';
var instanceId = 'i-0a9d28eee67fc3524';
var lambdaF = 'PHStock-ApiCall-ELK';
var params = {
  InstanceIds: [
     instanceId
  ]
};

async function callElkLambda() {
    console.log('[INFO]', 'callElkLambda function start');
    var lambda = new AWS.Lambda({
      region: region
    });
    var lParam = {
      FunctionName: lambdaF,
      Payload: JSON.stringify({})
    };
    
    return await lambda.invoke(lParam).promise();
}

async function start() {
    console.log('[INFO]', 'start function start');
    return await request.startInstances(params).promise();
};

async function stop() {
    console.log('[INFO]', 'stop function start');
    return await request.stopInstances(params).promise();
};

async function describe() {
    console.log('[INFO]', 'describe function start');
    return await request.describeInstances(params).promise();
}

async function waitFor() {
    console.log('[INFO]', 'waitFor function start');
    var paramsForWait = {
        InstanceIds: [ instanceId ]
    };

    return await request.waitFor("instanceRunning", paramsForWait).promise();
}

async function workflow(code) {
    console.log('[INFO]', 'workflow function start');
    // 0 (pending), 16 (running), 32 (shutting-down), 48 (terminated), 64 (stopping), and 80 (stopped)
    if (code == 80) {
        // Start the instance
        start();
    } else if (code == 16) {
        // Check if instance is up
        var waitForPromise = waitFor();
        var waitP = await waitForPromise;
        console.log('[INFO]', 'waitP', waitP);
        if (waitP) {
            // Update stocks
            // var callPromise = callElkLambda();
            // var callP = await callPromise;
            // console.log('[INFO]', 'callP', callP);
            // Stop instnace
            callElkLambda();
            stop();
        }
    }
}

exports.handler = function (event, context, callback) {
    
  var describePromise = describe();
  describePromise.then(function(data) { 
      var code = data.Reservations[0].Instances[0].State.Code;
      console.log('[INFO]', 'describePromise code: ', code);
      workflow(code); 
  });
};