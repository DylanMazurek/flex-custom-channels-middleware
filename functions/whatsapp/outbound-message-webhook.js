const lessThanOneDayAgo = (date) => {
  const DAY = 1 * 23 * 60 * 60 * 1000;
  const oneDayAgo = Date.now() - DAY;

  return date > oneDayAgo;
}

exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  var env = process.env.SERVERLESS_ENVIRONMENT;
  var chatServiceSid = process.env.TWILIO_CHAT_SERVICE_SID;

  var schema = event.Schema;
  var customChannelName = "whatsapp";
  var fromIdentity = event.FromIdentity;
  var fromNumber = event.From;
  var toIdentity = event.ToIdentity;
  var toNumber = event.ToNumber;
  var body = event.Body;
  var channelSid = event.ChannelSid;

  const subAccountDetails = JSON.parse(Runtime.getAssets()['/sub-account-details-' + env + '.json'].open());

  var schemaDetails = subAccountDetails[schema.toLowerCase()][customChannelName];
  
  const response = new Twilio.Response();
  if(toIdentity !== fromNumber){
    client.chat
    .services(chatServiceSid)
    .channels(channelSid)
    .messages
    .list({limit: 1, order: 'desc'})
    .then(latestMessageList => {
      var isLessThan24Hours = latestMessageList.length > 0 ? lessThanOneDayAgo(latestMessageList[0].dateCreated) : null;
      if(isLessThan24Hours || isLessThan24Hours === null){
        const subAccountClient = require('twilio')(
          schemaDetails.accountSid,
          schemaDetails.authToken
        );

        subAccountClient
        .messages
        .create({body: body, from: fromIdentity, to: toNumber})
        .then(message => {
          console.log(message.sid);

          response.setStatusCode(200);
          callback(null, response);
        });
      } else {
        client.chat
        .services(chatServiceSid)
        .channels(channelSid)
        .messages
        .create({ body: "This message is being sent outside of the 24 hour window. Please make sure to send a WhatsApp approved templated response."} )
        .then(message => {
          response.setStatusCode(500);
          response.setBody(`outbound message error - templated response not used. ${error}`);
          callback(null, response);
        });
      }
    })
    .catch(error => {
      response.setStatusCode(500);
      response.setBody(`outbound message error ${error}`);
      callback(null, response);
    })
  } else {
    response.setStatusCode(200);
    callback(null, response);
  }
};
