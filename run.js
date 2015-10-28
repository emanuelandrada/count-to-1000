var WebSocket = require('ws'),
    apiToken = "", //Api Token from https://api.slack.com/web (Authentication section)
    whoAmIUrl = "https://slack.com/api/auth.test?token=" + apiToken,
    authUrl = "https://slack.com/api/rtm.start?token=" + apiToken,
    request = require("request"),
    userId = '', // Id for the user the bot is posting as''
    channelId = false; //'G069T2UV9'; // Id of the channel the bot is posting to
var goal = 1000;


request(whoAmIUrl, function(err, response, body) {
  if (!err && response.statusCode === 200) {
    body = JSON.parse(body);
    userId = body.user_id;
    request(authUrl, function(err, response, body) {
      if (!err && response.statusCode === 200) {
        var res = JSON.parse(body);
        if (res.ok) {
          connectWebSocket(res.url);
       }
     }
    });
  }
});

function connectWebSocket(url) {
  var ws = new WebSocket(url);
  var channels = {};
  function channelHandler(channelId) {
    var cc = channels[channelId];
    if (!cc) {
      cc = {
        lastNumber: 0,
        lastUser: "",
        channelId: channelId,
        handleNumber: function (message) {
          if (this.timeout) {
            clearTimeout(this.timeout);
          }
          var number = Number(message.text);
          if (number && number <= this.lastNumber) {
            this.lastNumber = (number == 1) ? 1 : 0;
            this.lastUser = message.user;
          }
          else if (number) {
            this.lastNumber = number;
            this.lastUser = message.user;
            console.log('received number:', number);
            var delay = Math.pow(Math.random(), 2) * 180000 + 5000;
            console.log("delay: ", delay);
            this.timeout = setTimeout(this.prepareSend.bind(this), delay);
          }
        },
        prepareSend: function() {
          ws.send(JSON.stringify({ channel: this.channelId, id: 1, type: "typing" }));
          console.log("start typing...");
          this.timeout = setTimeout(this.sendNumber.bind(this), 3000);
        },
        sendNumber: function() {
          this.timeout = false;
          if (this.lastUser !== userId) {
            this.lastNumber++;
            this.lastUser = userId;
            var text = this.lastNumber >= goal ? "¡Ganamooo'!" : String(this.lastNumber)
            ws.send(JSON.stringify({ channel: this.channelId, id: 1, text: text, type: "message" }));
            console.log("sent: ", text);
          }
          else {
            console.log("not sent: ", this);
          }
        },
      };
      channels[channelId] = cc;
    }
    return cc;
  }

  ws.on('open', function() {
      console.log('Connected');
  });

  ws.on('message', function(message) {
      message = JSON.parse(message);

      if ((!channelId || message.channel === channelId) && message.type === 'message' && message.text) {
          channelHandler(message.channel).handleNumber(message);
        }
  });
}

