require('dotenv').config();
var twilio = require('twilio');

const commonFunc = require(Runtime.getFunctions()['common-functions'].path);

exports.handler = async function(context, event, callback) {
  var env = process.env.SERVERLESS_ENVIRONMENT;
  var customChannelName = "twitter";
  var from = event.From;
  var to = event.To;
  var body = event.Body;
  
  commonFunc
    .inboundMessage(
      customChannelName,
      from,
      to,
      body
    )
    .then(() => {
      let response = new Twilio.twiml.MessagingResponse();
      callback(null, response);
    })
    .catch((error) => {
      const response = new Twilio.Response();
      response.setStatusCode(500);
      response.setBody(`error ${error}`);
      callback(null, response);
    });
}