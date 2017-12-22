'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to BC Bus. Ask me when is the bus comming by saing, When is the next bus?';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please ask me when the next bus is.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using BC Bus. Hope you catch your bus! Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createFavoriteColorAttributes(favoriteColor) {
    return {
        favoriteColor,
    };
}


function getBusResponse(intent, session, callback) {
    let favoriteColor;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    // let stop = intent.slots.Stop.value

    let nextBus=getBusTime("2k");
    if(nextBus==-1)
      speechOutput="There was an error. There might not be any busses running.";
    else{
      speechOutput="The next bus at " + stop+ " is in " + nextBus + " minutes.";
      nextBus=getBusTime("South Street");
      speechOutput+="The next bus at " + stop+ " is in " + nextBus + " minutes.";
      shouldEndSession = true;
    }


    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if(intentName === 'NextBusIntent'){
        getBusResponse(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

function getBusTime(stop){
  console.log("Looking up bus times for "+ stop);
  let code;
  if(stop=="2k")
    code='4068930'
  else if(stop=="South Street")
    code='4068934'

  var request = require('sync-request');
  var res = request('GET', 'https://transloc-api-1-2.p.mashape.com/arrival-estimates.json?agencies=32&callback=call&stops='+code, {
    'headers': {
      "X-Mashape-Key": "85jZIbD80wmsh4RYjRC7YG1vdAIup1BI3Mfjsnq2NXrRce0Ejc",
      "Accept": "application/json"
    }
  });
  var info = JSON.parse(res.getBody('utf8'));
  console.log(info);


  // var unirest = require('unirest');
  // // var hdate = require('human-date');
  // unirest.get("https://transloc-api-1-2.p.mashape.com/arrival-estimates.json?agencies=32&callback=call&stops=4068934")
  // .header("X-Mashape-Key", "85jZIbD80wmsh4RYjRC7YG1vdAIup1BI3Mfjsnq2NXrRce0Ejc")
  // .header("Accept", "application/json")
  // .end(function (result) {
  //   console.log(result.status, result.headers, result.body);
  //
  let date;
    try {
      date=info.data[0].arrivals[0].arrival_at;
    }
    catch (e) {
       return -1;
       console.log(e);
       logMyErrors(e); // pass exception object to error handler
    }

    console.log("Next bus--> " + date);
    // for(let i=0; i<result.body.data[0].arrivals.length; i++){

      let parsed=date.split('-');
      let year=parsed[0];
      let month=parsed[1];
      let split2=parsed[2].split('T');
      let day=split2[0];
      let time=split2[1].split(':');
      let hour=time[0];
      let minute=time[1];
      let second=time[2];
      var date1 = new Date(year, month-1, day,  hour, minute); // 9:00 AM
      var date2 =Date.now();
      if (date2 < date1) {
        date1.setDate(date1.getDate()-1);
      }
      var diff = date2 - date1;
      var msec = diff;
      var hh = Math.floor(msec / 1000 / 60 / 60);
      msec -= hh * 1000 * 60 * 60;
      var mm = Math.floor(msec / 1000 / 60);
      msec -= mm * 1000 * 60;
      var ss = Math.floor(msec / 1000);
      msec -= ss * 1000;
  // + hdate.relativeTime(new Date(year, month-1, day, hour, minute, second)

      let response="The next bus will be at "+ stop+ " in "+ (60-mm) + " minutes";
      console.log(response);
      return (60-mm);


}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
