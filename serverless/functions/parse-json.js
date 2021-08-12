exports.handler = function (context, event, callback) {
  const response = new Twilio.Response();
  response.setStatusCode(200);
  response.appendHeader('Content-Type', 'application/json');
  var json = JSON.parse(event.body);
  response.setBody(json);

  callback(null, json);
};
