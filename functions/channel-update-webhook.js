exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  var chatServiceSid = process.env.TWILIO_CHAT_SERVICE_SID;

  var attributes = JSON.parse(event.Attributes);

  var schema = attributes.schema;
  var from = attributes.from;
  var customChannelName = event.CustomChannelName;
  var channelSid = event.ChannelSid;

  const response = new Twilio.Response();
  response.setStatusCode(200);

  if(attributes.status === "INACTIVE" && (attributes.syncDocDeleted !== "true")){
    client.sync
    .services(process.env.TWILIO_OTHER_CHANNELS_SYNC_SERVICE_SID)
    .documents(`${schema}-${from}-${customChannelName}`)
    .remove()
    .then(() => {
      return client.chat
        .services(chatServiceSid)
        .channels(channelSid)
        .fetch();
    })
    .then(channel => {
      var newAttributes = JSON.parse(channel.attributes);
      newAttributes.syncDocDeleted = "true";

      return client.chat
      .services(chatServiceSid)
      .channels(channelSid)
      .update({ attributes: JSON.stringify(newAttributes) });
    })
    .then(() => {
      callback(null, response);
    })
    .catch(() => {
      callback(null, response);
    });
  } else {
    callback(null, response);
  }
};
