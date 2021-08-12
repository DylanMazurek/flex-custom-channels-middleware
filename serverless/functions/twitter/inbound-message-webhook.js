require('dotenv').config();
var twilio = require('twilio');
var crypto = require('crypto');

const commonFunc = require(Runtime.getFunctions()['common-functions'].path);

exports.handler = async function (context, event, callback) {
  if (event.crc_token) {
    console.log(`Verification challenge received`);
    try {
      if (!validateSignature(event.crc_token)) {
        console.error('Cannot validate webhook signature');
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const crc = await validateWebhook(event.crc_token);
    return callback(null, JSON.stringify(crc));
  }

  if (event.direct_message_events === undefined) {
    return callback(null, {});
  }

  const message = event.direct_message_events.shift();
  const userFriendlyName =
    event.users[message.message_create.sender_id].screen_name;

  // Filter out empty messages or non-message events
  if (
    typeof message === 'undefined' ||
    typeof message.message_create === 'undefined'
  ) {
    return callback(null, {});
  }

  // Filter out messages created by the the authenticating users (to avoid sending messages to oneself)
  if (
    message.message_create.sender_id ===
    message.message_create.target.recipient_id
  ) {
    return callback(null, {});
  }

  // Filter out messages sent outbound
  if (message.for_user_id === message.message_create.sender_id) {
    return callback(null, {});
  }

  var customChannelName = 'twitter';
  var from = message.message_create.sender_id;
  var to = message.message_create.target.recipient_id;
  var body = message.message_create.message_data.text;

  commonFunc
    .inboundMessage(
      context,
      customChannelName,
      from,
      to,
      userFriendlyName,
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
      return callback(null, response);
    });
};

async function validateWebhook(token) {
  const responseToken = crypto
    .createHmac('sha256', process.env.TWITTER_CONSUMER_SECRET)
    .update(token)
    .digest('base64');
  return { response_token: `sha256=${responseToken}` };
}

async function validateSignature(token) {
  const signature =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.TWITTER_CONSUMER_SECRET)
      .update(token)
      .digest('base64');

  return signature;
}
