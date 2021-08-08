const { v4: uuidv4 } = require('uuid');

const sendMessage = (channelSid, user, body) => {
  const client = context.getTwilioClient();
  
  try {
    const response = await client.httpClient.request({
      method: "POST",
      uri: `https://chat.twilio.com/v2/Services/${context.CONVERSATION_SERVICE_SID}/Channels/${channelSid}/Messages`,
      data: {
        From: user,
        Body: body,
        Attributes: `{"ChannelType": "${event.channelType}"}`,
      },
      headers: {
        'X-Twilio-Webhook-Enabled': 'true'
      },
      username: context.ACCOUNT_SID,
      password: context.AUTH_TOKEN
    });
    console.log(`Response: ${JSON.stringify(response.body)} ${response.statusCode}`);
    callback(null, response);
  } catch (err) {
    console.log(`[${user}] errored`, err);
    callback(null, { status: "message error" });
  }
}

const getSyncItem = (from, syncMap) => {
  const client = context.getTwilioClient();
  const syncItem = await client.sync
    .services(context.SYNC_SERVICE_SID)
    .syncMaps(syncMap)
    .syncMapItems(from)
    .fetch();
  
  return syncItem;
}

const createSyncItem = (channelSid, from, targetName, customChannelName) => {
  const syncMapName = customChannelName;
  const client = context.getTwilioClient();
  const syncItem = await client.sync
      .services(context.SYNC_SERVICE_SID)
      .syncMaps(syncMapName)
      .syncMapItems.create({
        key: from,
        data: {
          channelSid: channelSid,
          targetName: targetName
        },
        ttl: 864000,
      });
  
  return syncItem;
}

const createNewChannel = (flexFlowSid, customChannelName, chatUserName, from, to) => {
  const DOMAIN = ( context.DOMAIN_NAME === "localhost:3000" ) ? `dawong.au.ngrok.io` : context.DOMAIN_NAME;
  const chatServiceSid = process.env.CHAT_SERVICE_SID;
  const client = context.getTwilioClient();
  
  const flexChannel = await client.flexApi.channel.create({
      flexFlowSid: flexFlowSid,
      identity: chatUserName,
      chatUserFriendlyName: from,
      chatFriendlyName: from,
      target: chatUserName,
      preEngagementData: {
        friendlyName: from
      }
    });
  
  const outboundMessageWebhookUrl = `https://${DOMAIN}/${customChannelName}/outbound-message-webhook` +
    `?ChannelSid=${channel.sid}` +
    `&FromIdentity=${encodeURIComponent(to)}` +
    `&ToIdentity=${encodeURIComponent(fromIdentity)}` +
    `&ToNumber=${encodeURIComponent(from)}`;
  const respWebhook = await client.chat.services(chatServiceSid).channels(flexChannel.sid).webhooks.create({
    type: 'webhook',
    'configuration.method': 'POST',
    'configuration.url': webhookUrl,
    'configuration.filters': ['onMessageSent']
  });

  const channelUpdateWebhookUrl = `https://${DOMAIN}/channel-update-webhook` +
    `?ToNumber=${encodeURIComponent(from)}` +
    `&CustomChannelName=${customChannelName}`;
  
  const respWebhook = await client.chat.services(chatServiceSid).channels(flexChannel.sid).webhooks.create({
    type: 'webhook',
    'configuration.method': 'POST',
    'configuration.url': webhookUrl,
    'configuration.filters': ['onChannelUpdated']
  });
}

exports.inboundMessage = function (customChannelName, from, to, body) {
  const client = context.getTwilioClient();
  var channelTargetName = `${schema}-${from}-${uuidv4()}`;
  const syncItem = await getSyncItem(client, from, customChannelName);

  if(syncItem === undefined){
      const channel = await createNewChannel(
        customChannelName,
        channelTargetName,
        from,
        to
    );

    syncItem = await createSyncItem(channel.channelSid, from, channelTargetName, customChannelName)
  }

  const message = await sendMessage(
    syncItem.channelSid,
    syncItem.targetName,
    body);
}