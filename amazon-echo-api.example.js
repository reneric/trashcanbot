/**
 * This sample shows how to interact with a Particle device using the Particle Cloud and Alexa AppKit.
 */


//needed for making requests to Particle Cloud API
var http = require('https');


var deviceID = "PARTICLE_PHOTON_DEVICE_ID";
var particleToken = "PARTICLE_AUTH_TOKEN";

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    //Have Alexa say a welcome message
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
    // var slotName = intentRequest.intent.slot.name;
    switch (intentName) {
      case "TrashBotIntent":
        console.log("TrashBotIntent");
        TrashBotSession(intent, session, callback);
        break;
      case "TrashBotRebootIntent":
        console.log("TrashBotRebootIntent");
        TrashBotRebootSession(intent, session, callback);
        break;
      case "ControlPinIntent":
        console.log("ControlPinIntent");
        SetPinSession(intent, session, callback);
        break;
      default:
        throw "Invalid intent"
    }
}


function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
}


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.1",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

function getWelcomeResponse(callback) {
    console.log("WelcomeResponse");
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Hey Ren, I am Trash bot. How can I help you?"
                + "";
    var repromptText = "Hello? How can I help you?";
    var shouldEndSession = false;

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function SetPinSession(intent, session, callback) {
    console.log('SetPinSession: ', intent);
    var cardTitle = intent.name;
    var Pin = intent.slots.Pin;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    //Check if user has specified the Pin status to HIGH or LOW
    if (Pin) {
        var PinStatus = Pin.value;

        console.log(PinStatus);
        //set the status {0,1} of the Pin through the Particle Cloud
        var data = 'args='+PinStatus;
        var options = {
            host: 'api.particle.io',
            port: 443,
            path: '/v1/devices/'+deviceID+'/relay',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer '+particleToken,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        console.log('making the request');

        var req = http.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log("body: " + chunk);
                speechOutput = "Christmas Lights "+PinStatus+ ".";
                shouldEndSession = true;
                callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });

            res.on('error', function (chunk) {
                console.log('Error: '+chunk);
            });
        });

        req.on('error', function(e){console.log('error: '+e)});
        req.write(data);
        req.end();


    } else {
        speechOutput = "I'm not sure I know what the pin is, please try again";
        repromptText = "I'm not sure what the pin is, please try again";
        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}


function TrashBotSession(intent, session, callback) {

    var cardTitle = intent.name;
    var status;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    var data = 'args=where are you';

    var options = {
        host: 'api.particle.io',
        port: 443,
        path: '/v1/devices/'+deviceID+'/present?format=raw',
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '+particleToken,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';

        res.on('data', function(d) {
          body += d;
          console.log("TrashBotSession: ", body);
          //parse the JSON to extract the temperature value:
          var status = body;
          if (status == "1") {
            speechOutput = "Your trash can is in the garage.";
          } else {
            speechOutput = "Your trash can is at the road.";
          }
          shouldEndSession = true;
          callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });

        res.on('error', function (chunk) {
            console.log('Error: '+chunk);
        });
    });

    req.write(data);
    req.end();

}

function TrashBotRebootSession(intent, session, callback) {
    var cardTitle = intent.name;
    var status;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    var data = 'args=reboot';
    var options = {
        host: 'api.particle.io',
        port: 443,
        path: '/v1/devices/'+deviceID+'/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer '+particleToken,
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body = '';

        res.on('data', function(d) {
            console.log("TrashBotRebootSession: ", d);
          speechOutput = "Okay. Rebooting now.";
          shouldEndSession = true;
          callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
        });

        res.on('error', function (chunk) {
            console.log('Error: '+chunk);
        });
    });

    req.write(data);
    req.end();

}
