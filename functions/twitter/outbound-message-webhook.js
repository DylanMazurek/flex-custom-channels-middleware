var request = require('request');

exports.handler = function (context, event, callback) {
  var customChannelName = "twitter";
  var from = event.From;
  var to = event.To;
  var body = event.Body;

  if (from !== to && from !== 'system' && from !== '15425351') {
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
              recipient_id: 15425351,
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
        callback(null, response);
      }
      const response = new Twilio.Response();
      response.setStatusCode(200);
      response.setBody(`success`);
      callback(null, response);
    });
  }

  
};
