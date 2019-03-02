function getIPAdress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

const express = require("express");
const chalk = require("chalk");
const path = require("path");
const port = 8083;
const app = express();
const ip = getIPAdress();
const bodyParser = require('body-parser');

app.use(express.static(path.join(__dirname, "/src")));
app.use(bodyParser.urlencoded({    
  extended: true
}));
var router = express.Router();
var appData = require('./PackageData.json');
var dateData = require('./dateAvailabilityUrl.json');
var packages = require('./Packages.json');
router.post("/package-availability", function (req, res) {
  res.json({
    code: 200,
    data: appData
  });
});


router.post("/date-availability", function (req, res) {
  res.json({
    code: 200,
    data: dateData
  });
});

router.post("/reserve", function (req, res) {
  res.json({
    "BookingId": 342493,
    "ExpirationMinutes": 19.954264773333335
  });
});

router.post("/check-email", function (req, res) {
  var email = req.body.Email;
  var Rxp = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
  if(Rxp.test(email)){
      if(email == "568146940@qq.com"){
        res.json({
          EmailInUse: true,
          FastTrack: false
        });
      }else{
        res.json({
          EmailInUse: false,
          FastTrack: false
        })
      }
  }else{
    res.json({
      EmailInUse: false,
      FastTrack: false
    })
  }
})

router.post("/packages", function (req, res) {
  res.json({
    code: 200,
    data: packages
  });
})
router.post("/forgot-password", function (req, res) {
  res.json({
    code: 200,
  });
})

router.post("/wiz-login", function (req, res) {
  res.json({
    Credit: 0,
    Name: "liedfdf",
    PhoneNumber: null,
    PlayerId: 862483,
    Success: true
  });
})
app.use("/booking", router);









app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/src/index.html"))
})

app.listen(port, function () {
  console.log(chalk.bgYellow(`server running in http://${ip}:${port}`));
});