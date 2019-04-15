'use strict';

const { exec } = require('child_process');

const LogUtil = require('../lib/LogUtil.js');
const HomeKitTypes = require('./HomeKit.js');

var Service, Characteristic;

class BridgeAccessory {
  constructor (platform, accessory) {

    // HB
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;    
    HomeKitTypes.registerWith(platform.api.hap);

    this.platform = platform;
    this.log = platform.log;
    this.logger = new LogUtil(null, platform.log);
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;
    this._services = new Map();
    
    this.accessory = accessory;
    
    this.handleAccessory(false);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  async handleAccessory(add){
  
    try {
      
      let services = await this.handleServices();
      
      for(const service of services){
 
        if(service){
        
          let InstanceService;
      
          this._services.set(service.name, service);
  
          if(this.accessory.getServiceByUUIDAndSubType(Service.Instances, service.subname)){
        
            InstanceService = this.accessory.getServiceByUUIDAndSubType(Service.Instances, service.subname);
            
            if(!add)
              this.getService(InstanceService);
    
          } else {
    
            this.logger.info(this.accessory.displayName + ': Adding new Service: ' + service.name);

            let instance = this.handleInstances(service.name, service.subname);
            InstanceService = this.accessory.addService(instance);
        
            this.getService(InstanceService);
          
          }
  
        }

      }
      
      this.accessory.services.map( service => { if(service.subtype) this._services.set(service.displayName, service); });
      
      await this.handleDisabledServices();

    } catch(err){

      this.logger.error(this.accessory.displayName + ': An error occured while fetching services!');
      this.logger.error(err);

    } finally {
    
      setTimeout(this.handleAccessory.bind(this, true), 10000);  
    
    }

  
  }
  
  handleServices(){
  
    return new Promise((resolve, reject) => {
      exec('systemctl list-unit-files | grep enabled | grep ' + this.accessory.context.startParam, (error, stdout, stderr) => {
        if (stderr) return reject(stderr);
        //if(error) return reject(error)
      
        let lines = stdout.toString().split('\n');
      
        lines = lines.map( service => {
      
          let originService = service.split('.service')[0];
      
          service = service.split('.service')[0];
          service = service.replace(/-/g, ' ');        
          service = service.split(' ');

          service = service.map((word)=>{
            const firstletter = word.charAt(0).toUpperCase();
            word = firstletter.concat(word.slice(1,word.length));

            return word;
          });

          service = service.join(' ');
          service = service.slice(this.accessory.context.startParam.length);
    
          let Services = {
            name: service,
            subname: originService
          };
        
          if(service) return Services;
      
        });
      
        let services = lines.filter(function (el) {
          return el != null;
        });
      
        resolve(services);
      });
    });
  
  }
  
  handleDisabledServices(){
  
    return new Promise((resolve) => {
  
      for(const service of this.accessory.services){
  
        if(service.subtype){
  
          if(!this._services.has(service.displayName)){

            this.logger.warn(this.accessory.displayName + ': Removing Service: ' + service.displayName);  
            this._services.delete(service.displayName);
            this.accessory.removeService(service);  
  
          }
  
        } 
  
      }
  
      resolve(true);

    });
  
  }
  
  handleInstances(service, subtype){
  
    let Instances = new Service.Instances(service, subtype);
    
    Instances.addCharacteristic(Characteristic.ServiceStatus);
    
    Instances.addCharacteristic(Characteristic.RunningTime);
  
    return Instances;
  
  }

  getService(service) {
  
    service.getCharacteristic(Characteristic.On)
      .on('set', this.setServiceState.bind(this, service));
   
    this.getStatus(service);   

  }
  
  async getStatus(service){
  
    try {
   
      let state = await this.handleServiceStatus(service);
      let runningTime = await this.handleRunningTime(service);
   
      state = (state === 'active') ? true : false;
   
      service.getCharacteristic(Characteristic.On)
        .updateValue(state);
     
      service.getCharacteristic(Characteristic.ServiceStatus)
        .updateValue(state?'active':'not active');
     
      service.getCharacteristic(Characteristic.RunningTime)
        .updateValue(state?runningTime:'not running');
    
    } catch(err){
    
      this.logger.error(service.displayName + ': An error occured while getting service state');
      this.logger.error(err); 
    
    } finally {
    
      if(this._services.has(service.displayName))
        setTimeout(this.getStatus.bind(this, service), this.accessory.context.polling);
    
    }
  
  }
  
  async setServiceState(service, state, callback){
  
    try {

      this.logger.info(service.displayName + ': ' + (state ? 'Start' : 'Stop'));

      await this.handleSetCommand(service, state);

    } catch(err){

      this.logger.error(service.displayName + ': An error occured while setting new state!');
      this.logger.error(err);

    } finally {

      callback();

    }
  
  }
  
  handleSetCommand(service, state){
  
    return new Promise((resolve, reject) => {
      exec((this.accessory.context.sudo ? 'sudo ' : '') + 'systemctl ' + (state ? 'start ' : 'stop ') + service.subtype, (error, stdout, stderr) => {
        if (stderr) return reject(stderr);     
        //if(error) return reject(error)
      
        let lines = stdout.toString().split('\n')[0];
      
        resolve(lines);
      });
    });
  
  }
  
  handleServiceStatus(service){
  
    return new Promise((resolve, reject) => {
      exec('systemctl is-active --quiet ' + service.subtype + ' && echo active', (error, stdout, stderr) => {
        if (stderr) return reject(stderr);     
        //if(error) return reject(error)
      
        let lines = stdout.toString().split('\n')[0];
      
        resolve(lines);
      });
    });
  
  }
  
  handleRunningTime(service){
  
    return new Promise((resolve, reject) => {
      exec('systemctl status ' + service.subtype + ' -n 0 | grep since', (error, stdout, stderr) => {
        if (stderr) return reject(stderr);     
        //if(error) return reject(error)
      
        let lines = stdout.toString().split('\n')[0];
      
        if(lines){
          lines = lines.split(';')[1];
          lines = lines.split('ago')[0];

          resolve(lines);
        }
      });
    });
  
  }
  
}
  
module.exports = BridgeAccessory;