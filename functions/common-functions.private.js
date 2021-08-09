const { v4: uuidv4 } = require('uuid');

exports.inboundMessage = async function (context, customChannelName, from, to, body) {
  const client = context.getTwilioClient();
  const DOMAIN =
    context.DOMAIN_NAME === 'localhost:3000'
      ? `2d584f3b8be0.ngrok.io`
      : context.DOMAIN_NAME;   
  
  if (from !== "1418807378179346432") {
    let syncItem = await getSyncItem(from, customChannelName);

    if (syncItem === undefined) {
      const channel = await createNewChannel(
        context.FLEX_FLOW_SID,
        customChannelName,
        from,
        to
      );

      syncItem = await createSyncItem(channel.sid, from, to, customChannelName);
    }

    if (syncItem.data.from_user_id === from) {
      let message = await sendMessage(
        syncItem.data.channelSid,
        syncItem.data.from_user_id,
        body);
    }
  }
  
  return;

  async function sendMessage (channelSid, user, body) {
    const client = context.getTwilioClient();

    try {
      const response = await client.httpClient.request({
        method: 'POST',
        uri: `https://chat.twilio.com/v2/Services/${context.CONVERSATION_SERVICE_SID}/Channels/${channelSid}/Messages`,
        data: {
          From: user,
          Body: body,
          //Attributes: `{"ChannelType": "${event.channelType}"}`,
        },
        headers: {
          'X-Twilio-Webhook-Enabled': 'true',
        },
        username: context.ACCOUNT_SID,
        password: context.AUTH_TOKEN,
      });
      // console.log(
      //   `Response: ${JSON.stringify(response.body)} ${response.statusCode}`
      // );
      return response;
    } catch (err) {
      //console.log(`[${user}] errored`, err);
      return { status: 'message error' };
    }
  };

  async function getSyncItem(from, syncMap) {
    try {
      const client = context.getTwilioClient();
      let syncItem = await client.sync
        .services(context.SYNC_SERVICE_SID)
        .syncMaps(syncMap)
        .syncMapItems(from)
        .fetch();
      
      return syncItem;
    } catch(error) {
      return undefined;
    }
  };

  async function createSyncItem(
    channelSid,
    from,
    to,
    customChannelName
  ){
    const syncMapName = customChannelName;
    const client = context.getTwilioClient();
    const syncItem = await client.sync
      .services(context.SYNC_SERVICE_SID)
      .syncMaps(syncMapName)
      .syncMapItems.create({
        key: from,
        data: {
          channelSid: channelSid,
          from_user_id: from,
          to_user_id: to
        },
        ttl: 3600,
      });

    return syncItem;
  };

  async function createNewChannel(
    flexFlowSid,
    customChannelName,
    from,
    to
  ){
    const chatServiceSid = process.env.CONVERSATION_SERVICE_SID;
    const client = context.getTwilioClient();

    const flexChannel = await client.flexApi.channel.create({
      flexFlowSid: flexFlowSid,
      identity: from,
      chatUserFriendlyName: from,
      chatFriendlyName: from,
      target: from,
      preEngagementData: {
        friendlyName: from,
      },
    });

    const outboundMessageWebhookUrl =
      `https://${DOMAIN}/${customChannelName}/outbound-message-webhook` +
      `?ChannelSid=${flexChannel.sid}` +
      `&From=${encodeURIComponent(to)}` +
      `&To=${encodeURIComponent(from)}`
    
    const respOutboundWebhook = await client.chat
      .services(chatServiceSid)
      .channels(flexChannel.sid)
      .webhooks.create({
        'type': 'webhook',
        'configuration.method': 'POST',
        'configuration.url': outboundMessageWebhookUrl,
        'configuration.filters': ['onMessageSent'],
      });

    // const channelUpdateWebhookUrl =
    //   `https://${DOMAIN}/channel-update-webhook` +
    //   `?ToNumber=${encodeURIComponent(from)}` +
    //   `&CustomChannelName=${customChannelName}`;

    // const respChannelUpdateWebhook = await client.chat
    //   .services(chatServiceSid)
    //   .channels(flexChannel.sid)
    //   .webhooks.create({
    //     'type': 'webhook',
    //     'configuration.method': 'POST',
    //     'configuration.url': channelUpdateWebhookUrl,
    //     'configuration.filters': ['onChannelUpdated'],
    //   });
    
    return { sid: flexChannel.sid };
  };
}