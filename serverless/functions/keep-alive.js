exports.handler = function (context, event, callback) {
  const response = new Twilio.Response();
  response.setStatusCode(200);

  callback(null, response);
};
