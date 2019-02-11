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

app.use(express.static(path.join(__dirname, "/src")));

var router = express.Router();
var appData = require('./PackageData.json');
var dateData = require('./dateAvailabilityUrl.json');
var packages = require('./Packages.json');
router.post("/package-availability", function(req, res){
  res.json({
    code: 200,
    data: appData
  });
});


router.post("/date-availability", function(req, res){
  res.json({
    code: 200,
    data: dateData
  });
});

router.post("/packages", function(req,res){
  res.json({
    code: 200,
    data: packages
  });
})

app.use("/booking", router);









app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/src/index.html"))
})

app.listen(port, function () {
  console.log(chalk.bgYellow(`server running in http://${ip}:${port}`));
});