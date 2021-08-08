require('dotenv').config();
var twilio = require('twilio');

const commonFunc = require(Runtime.getFunctions()['common-functions'].path);

exports.handler = async function(context, event, callback) {
  var client = new twilio(context.ACCOUNT_SID, context.AUTH_TOKEN);

  var env = process.env.SERVERLESS_ENVIRONMENT;
  var schema = event.Schema;
  var customChannelName = "whatsapp";
  var from = event.From;
  var to = event.To;
  var body = event.Body;

  const subAccountDetails = JSON.parse(Runtime.getAssets()['/sub-account-details-' + env + '.json'].open());
  var schemaDetails = subAccountDetails[schema.toLowerCase()][customChannelName];
  
  commonFunc.customChannelInboundMessage(client, schemaDetails, customChannelName, schema, from, to, body)
  .then(() => {
    let response = new Twilio.twiml.MessagingResponse();
    callback(null, response);
  }).catch(error => {
    const response = new Twilio.Response();
    response.setStatusCode(500);
    response.setBody(`error ${error}`);
    callback(null, response);
  });
}