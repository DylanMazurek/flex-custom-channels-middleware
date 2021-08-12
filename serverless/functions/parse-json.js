exports.handler = function (context, event, callback) {
  const response = new Twilio.Response();
  response.setStatusCode(200);
  var json = JSON.parse(event.body);
  response.setBody(json);

  callback(null, response);
};
