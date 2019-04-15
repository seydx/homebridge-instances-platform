/**
 * v1.0
 *
 * @url https://github.com/SeydX/homebridge-instances-platform
 * @author SeydX <seyd55@outlook.de>
 *
**/

'use strict';

module.exports = function (homebridge) {
  let InstancesPlatform = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-instances-platform', 'InstancesPlatform', InstancesPlatform, true);
};