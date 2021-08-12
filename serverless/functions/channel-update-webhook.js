exports.handler = async function (context, event, callback) {
  const client = context.getTwilioClient();
  var convServiceSid = process.env.CONVERSATION_SERVICE_SID;
  var syncServiceSid = process.env.SYNC_SERVICE_SID;

  var oldAttributes = JSON.parse(event.Attributes);

  var from = event.From;
  var customChannelName = event.CustomChannelName;
  var channelSid = event.ChannelSid;

  const response = new Twilio.Response();
  response.setStatusCode(200);

  if (oldAttributes.status === 'INACTIVE') {
    const channel = await client.chat
      .services(convServiceSid)
      .channels(channelSid)
      .fetch();

    // Update attributes.
    oldAttributes = JSON.parse(channel.attributes);

    if (oldAttributes.syncItemDeleted !== 'true') {
      await client.sync
        .services(syncServiceSid)
        .syncMaps(customChannelName)
        .syncMapItems(from)
        .remove();

      var newAttributes = oldAttributes;
      newAttributes.syncItemDeleted = 'true';

      await client.chat
        .services(convServiceSid)
        .channels(channelSid)
        .update({ attributes: JSON.stringify(newAttributes) });
    }

    return callback(null, response);
  } else {
    return callback(null, response);
  }
};
