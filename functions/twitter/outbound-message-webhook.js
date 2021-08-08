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
  
  const response = new Twilio.Response();
  if(toIdentity !== fromIdentity){
    client.chat
        .messages
        .create({body: body, from: fromIdentity, to: toNumber})
        .then(message => {
          console.log(message.sid);

          response.setStatusCode(200);
          callback(null, response);
        });
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
