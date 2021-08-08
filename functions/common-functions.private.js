const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const base64 = require('base-64');

const sendChatMessage = (serviceSid, channelSid, chatUserName, body) => {
    const params = new URLSearchParams();
    params.append('Body', body);
    params.append('From', chatUserName);
    return fetch(
        `https://chat.twilio.com/v2/Services/${serviceSid}/Channels/${channelSid}/Messages`,
        {
        method: 'post',
        body: params,
        headers: {
            'X-Twilio-Webhook-Enabled': 'true',
            Authorization: `Basic ${base64.encode(
            `${process.env.ACCOUNT_SID}:${process.env.AUTH_TOKEN}`
            )}`
        }
        }
    );
}

const getSyncDocData = (client, schema, from, channelName) => {
    var syncServiceSid = process.env.TWILIO_OTHER_CHANNELS_SYNC_SERVICE_SID;
    return client.sync
    .services(syncServiceSid)
    .documents(`${schema}-${from}-${channelName}`)
    .fetch()
    .then(doc => doc)
    .catch(doc => undefined);
}

const createNewSyncDoc = (client, channelSid, schema, from, targetName, customChannelName) => {
    var syncServiceSid = process.env.TWILIO_OTHER_CHANNELS_SYNC_SERVICE_SID;
    return new Promise((resolve, reject) => {
      client.sync
      .services(syncServiceSid)
      .documents
      .create({
        uniqueName: `${schema}-${from}-${customChannelName}`,
        data: {
          channelSid: channelSid,
          targetName: targetName
        },
        ttl: 864000
      })
      .then(doc => { resolve(doc); })
      .catch(error => {
        console.log(error);
        reject(error);
      });
    });
}

const createNewChannel = (client, flexFlowSid, customChannelName, chatUserName, schema, from, to) => {
    var chatServiceSid = process.env.TWILIO_CHAT_SERVICE_SID;
  
    return new Promise((resolve) => {
    client.flexApi.channel
      .create({
        flexFlowSid: flexFlowSid,
        identity: chatUserName,
        chatUserFriendlyName: from,
        chatFriendlyName: from,
        target: chatUserName,
        preEngagementData: {
          friendlyName: from
        }
      })
      .then(channel => {
        return client.chat
        .services(chatServiceSid)
        .channels(channel.sid)
        .fetch();
      })
      .then(channel => {  
        var newAttributes = JSON.parse(channel.attributes);
        var fromIdentity = newAttributes.from;
        newAttributes.from = from;
  
        return client.chat
          .services(chatServiceSid)
          .channels(channel.sid)
          .update({ attributes: JSON.stringify(newAttributes) })
          .then(() => client.chat
            .services(chatServiceSid)
            .channels(channel.sid)
            .webhooks.create({
              type: 'webhook',
              'configuration.method': 'POST',
              'configuration.url': `https://${process.env.DOMAIN_BASE}/${customChannelName}/outbound-message-webhook` +
              `?ChannelSid=${channel.sid}` +
              `&Schema=${encodeURIComponent(schema)}` +
              `&FromIdentity=${encodeURIComponent(to)}` +
              `&ToIdentity=${encodeURIComponent(fromIdentity)}` +
              `&ToNumber=${encodeURIComponent(from)}`,
              'configuration.filters': ['onMessageSent']
            })
          )
          .then(() => client.chat
            .services(chatServiceSid)
            .channels(channel.sid)
            .webhooks.create({
              type: 'webhook',
              'configuration.method': 'POST',
              'configuration.url': `https://${process.env.DOMAIN_BASE}/channel-update-webhook` +
              `?Schema=${encodeURIComponent(schema)}` +
              `&ToNumber=${encodeURIComponent(from)}` +
              `&CustomChannelName=whatsapp`,
              'configuration.filters': ['onChannelUpdated']
            })
          )
      })
      .then(webhook => {
        resolve({ channelSid: webhook.channelSid, newSyncDocRequired: true });
      })
      .catch(error => {
        console.log(error);
      });
    });
}

exports.customChannelInboundMessage = function(client, schemaDetails, customChannelName, schema, from, to, body) {
    var channelTargetName = `${schema}-${from}-${uuidv4()}`;

    return new Promise((resolve, reject) => {
        getSyncDocData(client, schema, from, customChannelName)
        .then(syncDoc => {
            if(syncDoc === undefined){
                return createNewChannel(
                client,
                schemaDetails.flexFlowSid,
                customChannelName,
                channelTargetName,
                schema,
                from,
                to
                );
            } else {
                return new Promise((resolve) => { resolve({syncDoc: syncDoc, newSyncDocRequired: false }); });
            }
        })
        .then(syncDocData => {
            if(syncDocData.newSyncDocRequired){
                return createNewSyncDoc(client, syncDocData.channelSid, schema, from, channelTargetName, customChannelName)
            } else {
                console.log(`Found sync doc ${syncDocData.syncDoc.sid}`);
                return new Promise((resolve) => { resolve(syncDocData.syncDoc); });
            }
        })
        .then(syncDoc => {
            return sendChatMessage(
                process.env.TWILIO_CHAT_SERVICE_SID,
                syncDoc.data.channelSid,
                syncDoc.data.targetName,
                body);
        })
        .then(() => {
            resolve(true);
        })
        .catch(error => {
            reject(error);
        });
    });
}