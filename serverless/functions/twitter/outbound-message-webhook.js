var request = require('request');

exports.handler = function (context, event, callback) {
  var from = event.From;
  var to = event.To;
  var body = event.Body;

  var onlyReplyTo =
    context.ONLY_REPLY_TO_DEBUG !== null
      ? context.ONLY_REPLY_TO_DEBUG.split(',')
      : null;

  if (
    from.split('-')[0] !== to &&
    from !== 'system' &&
    onlyReplyTo !== null &&
    onlyReplyTo.indexOf(to) !== -1
  ) {
    const oAuthConfig = {
      token: context.TWITTER_API_KEY,
      token_secret: context.TWITTER_API_KEY_SECRET,
      consumer_key: context.TWITTER_CONSUMER_KEY,
      consumer_secret: context.TWITTER_CONSUMER_SECRET,
    };

    const requestConfig = {
      url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
      oauth: oAuthConfig,
      json: {
        event: {
          type: 'message_create',
          message_create: {
            target: {
              recipient_id: to,
            },
            message_data: {
              text: body,
            },
          },
        },
      },
    };

    request.post(requestConfig, function (err, httpResponse, body) {
      if (err) {
        const response = new Twilio.Response();
        response.setStatusCode(500);
        response.setBody(`error ${error}`);
        return callback(null, response);
      }
    });
  } else {
    const response = new Twilio.Response();
    response.setStatusCode(200);
    response.setBody(`success`);
    return callback(null, response);
  }
};
