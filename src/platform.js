'use strict';

const packageFile = require('../package.json');
const LogUtil = require('../lib/LogUtil.js');

//Accessory
const Bridge = require('./accessory.js');

const pluginName = 'homebridge-instances-platform';
const platformName = 'InstancesPlatform';

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {

  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  return InstancesPlatform;
};

function InstancesPlatform (log, config, api) {
  if (!api || !config) return;

  // HB
  this.log = log;
  this.logger = new LogUtil(null, log);
  this.accessories = [];
  this.config = config;
  
  this.config.polling = this.config.polling * 1000||5000;
  this.config.startParam = this.config.startParam || 'home';
  this.config.showInactives = this.config.showInactives || false;
  this.config.sudo = this.config.sudo || false;
  this.config.clearCache = this.config.clearCache || false;
  this.config.temperature = this.config.temperature || {};
  this.config.notifier = this.config.notifier || {};
  
  this.config.temperature = {
    active: this.config.temperature.active || false,
    file: this.config.temperature.file || '/sys/class/thermal/thermal_zone0/temp', 
    multiplier: this.config.temperature.multiplier || 1000
  };
  
  this.config.notifier = {
    active: this.config.notifier.active || false,
    token: this.config.notifier.token, 
    chatID: this.config.notifier.chatID,
    filter: this.config.notifier.filter || ['Main process exited'],
    filterInstances: this.config.notifier.filterInstances || [];
    spamInterval: this.config.notifier.spamInterval * 60 * 1000 || 1 * 60 * 1000
  };
  
  if(!this.config.notifier.token || !this.config.notifier.chatID || !this.config.notifier.active)
    this.config.notifier = false;
  
  if (api) {
  
    if (api.version < 2.2) {
      throw new Error('Unexpected API version. Please update your homebridge!');
    }
    
    this.log('**************************************************************');
    this.log('InstancesPlatform v'+packageFile.version+' by SeydX');
    this.log('GitHub: https://github.com/SeydX/homebridge-instances-platform');
    this.log('Email: seyd55@outlook.de');
    this.log('**************************************************************');
    this.log('start success...');
    
    this.api = api;
      
    this.api.on('didFinishLaunching', this._initPlatform.bind(this));
  }
}

InstancesPlatform.prototype = {

  _initPlatform: function(){
  
    if(!this.accessories.length){
  
      if(!this.config.clearCache)
        this._addOrConfigure(null, true); 
    
    } else {
    
      if(this.config.clearCache)
        this.accessories.map( accessory => this.removeAccessory(accessory) );
    
    }
  
  },
  
  _addOrConfigure: function(accessory, add){

    const self = this;
    
    if(add){

      let uuid = UUIDGen.generate('Homebridge Instances');
      accessory = new Accessory('Homebridge Instances', uuid, 8);
      accessory.addService(Service.Switch, 'Homebridge Instances', 'Homebridge Instances');
      
      accessory.context = {};

    } else {
    
      this.logger.info('Configuring accessory ' + accessory.displayName);

    }  

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, accessory.displayName)
      .setCharacteristic(Characteristic.Identify, accessory.displayName)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'Instances')
      .setCharacteristic(Characteristic.SerialNumber, '1234567890')
      .setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);
    
    accessory.reachable = true;
    accessory.context.polling = this.config.polling;
    accessory.context.showInactives = this.config.showInactives;
    accessory.context.startParam = this.config.startParam;
    accessory.context.sudo = this.config.sudo;
    accessory.context.temperature = this.config.temperature;
    accessory.context.notifier = this.config.notifier;

    if(add){
    
      this.logger.info('Registering platform accessory: ' + accessory.displayName);
        
      this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
      this.accessories.push(accessory);
    
    }
    
    accessory.on('identify', function (paired, callback) {
      self.logger.info(accessory.displayName + ': Hi!');
      callback();
    });
      
    new Bridge(this, accessory);

  },

  configureAccessory: function(accessory){

    this.accessories.push(accessory);
    
    if(!this.config.clearCache)
      this._addOrConfigure(accessory, false);
  
  },

  removeAccessory: function (accessory) {
    if (accessory) {

      this.logger.warn('Removing accessory: ' + accessory.displayName + '. No longer configured.');

      let newAccessories = this.accessories.map( acc => {
        if(acc.displayName !== accessory.displayName){
          return acc;
        }
      });

      let filteredAccessories = newAccessories.filter(function (el) {
        return el != null;
      });

      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]); 

      this.accessories = filteredAccessories;

    }
  }

};
