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
    this.mainService = this.accessory.getService(Service.Switch, this.accessory.displayName);
    
    this.getService();
    
    this.handleAccessory(false);

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  
  async handleAccessory(add){
  
    try {
      
      this._activeServices = new Map();
      
      let services = await this.handleServices();
      
      for(const service of services){
 
        if(service){
        
          let InstanceService;
      
          this._services.set(service.name, service);
          this._activeServices.set(service.name, service);
  
          if(this.accessory.getServiceByUUIDAndSubType(Service.Instances, service.subname)){
        
            InstanceService = this.accessory.getServiceByUUIDAndSubType(Service.Instances, service.subname);
            
            if(!this.accessory.context[service.name])
              this.accessory.context[service.name] = {};
            
            this.mainService.addLinkedService(InstanceService);
            
            if(!add)
              this.getService(InstanceService);
    
          } else {
    
            this.logger.info(this.accessory.displayName + ': Adding new Service: ' + service.name);

            let instance = new Service.Instances(service.name, service.subname);
            InstanceService = this.accessory.addService(instance);
        
            if(!this.accessory.context[service.name])
              this.accessory.context[service.name] = {};
            
            this.mainService.addLinkedService(InstanceService);
        
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
    
      setTimeout(this.handleAccessory.bind(this, true), 30000);  
    
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
  
        if(service.subtype && service.subtype !== this.accessory.displayName){
  
          if(!this._activeServices.has(service.displayName)){

            this.logger.warn(this.accessory.displayName + ': Removing Service: ' + service.displayName);  
            this._services.delete(service.displayName);
            this.accessory.removeService(service);  
  
          }
  
        } 
  
      }
  
      resolve(true);

    });
  
  }

  getService(service) {
    
    if(service){

      service.getCharacteristic(Characteristic.On)
        .on('set', this.setServiceState.bind(this, service));
        
      service.getCharacteristic(Characteristic.CPUUsage)  
        .on('get', this.getCPUUsage.bind(this, service));
        
      service.getCharacteristic(Characteristic.RunningTime)  
        .on('get', this.getRunningTime.bind(this, service));

      this.getStatus(service);   
    
    } else {
      
      this.mainService.getCharacteristic(Characteristic.On)
        .on('set', this.setMainServiceState.bind(this))
        .updateValue(false);
        
      if(!this.mainService.testCharacteristic(Characteristic.CPUUsage))
        this.mainService.addCharacteristic(Characteristic.CPUUsage);
      
      this.mainService.getCharacteristic(Characteristic.CPUUsage)  
        .on('get', this.getMainCPUUsage.bind(this));
      
    }

  }
  
  getMainCPUUsage(callback){
  
    let overallCpu = 0;
        
    this.accessory.services.map( service => {
      
      if(service.subtype && service.subtype !== this.accessory.displayName){
    
        overallCpu += parseFloat(service.getCharacteristic(Characteristic.CPUUsage).value);
    
      }
      
    });
    
    overallCpu = Math.round(overallCpu * 100) / 100;
    
    callback(null, overallCpu);
  
  }
  
  async getStatus(service){
  
    try {
   
      let state = await this.handleServiceStatus(service);
   
      state = (state === 'active') ? true : false;
   
      service.getCharacteristic(Characteristic.On)
        .updateValue(state);
     
      service.getCharacteristic(Characteristic.ServiceStatus)
        .updateValue(state?'active':'inactive');
    
    } catch(err){
    
      this.logger.error(service.displayName + ': An error occured while getting service state');
      this.logger.error(err); 
    
    } finally {
    
      if(this._services.has(service.displayName))
        setTimeout(this.getStatus.bind(this, service), this.accessory.context.polling);
    
    }
  
  }
  
  async getCPUUsage(service, callback){
  
    let cpu;
  
    try {
    
      let state = service.getCharacteristic(Characteristic.On).value;
      
      if(!state){
  
        cpu = 0;
      
      } else {
      
        this.accessory.context[service.displayName].pid = this.accessory.context[service.displayName].pid||await this.handleServicePIDs(service);       

        cpu = await this.handleCPUUsage(this.accessory.context[service.displayName].pid);
        
        if(cpu === 'PID changed!'){
        
          this.accessory.context[service.displayName].pid = await this.handleServicePIDs(service);
          cpu = await this.handleCPUUsage(this.accessory.context[service.displayName].pid);
      
          if(cpu === 'PID changed!') cpu = 0; //maybe off?
        
        }
        
      }
      
      cpu = parseFloat(cpu);
    
    } catch(err){
    
      this.logger.error(service.displayName + ': An error occured while getting cpu usage');
      this.logger.error(err);
      
      cpu = 0;
    
    } finally {
    
      callback(null, cpu);
    
    }
  
  }
  
  async getRunningTime(service, callback){
  
    let runningTime;
  
    try {
      
      let state = service.getCharacteristic(Characteristic.On).value;
      
      !state ? runningTime = '-' : runningTime = await this.handleRunningTime(service);  
    
    } catch(err){
    
      this.logger.error(service.displayName + ': An error occured while getting running time');
      this.logger.error(err);
      
      runningTime = '-';
    
    } finally {
    
      callback(null, runningTime);
    
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
  
  async setMainServiceState(state, callback){

    const self = this;

    try {

      if(state){
      
        this.logger.info(this.accessory.displayName + ': Restarting all services!');
      
        this.accessory.services.map( async service => {
    
          if(service.subtype && service.subtype !== this.accessory.displayName){
  
            await this.handleSetCommand(service, null, true);
  
          }
         
        });

      }

    } catch(err){

      this.logger.error(this.accessory.displayName + ': An error occured while restarting all services!');
      this.logger.error(err);

    } finally {

      setTimeout(function(){ self.mainService.getCharacteristic(Characteristic.On).updateValue(false); }, 500);
    
      callback();
  
    }
  
  }
  
  handleSetCommand(service, state, restart){
  
    restart ? state = 'restart ' : state = state ? 'start ' : 'stop ';
  
    return new Promise((resolve, reject) => {
      exec((this.accessory.context.sudo ? 'sudo ' : '') + 'systemctl ' + state + service.subtype, (error, stdout, stderr) => {
        if (stderr) return reject(stderr);     
        //if(error) return reject(error)
      
        resolve(true);
      });
    });
  
  }
  
  handleServiceStatus(service){
  
    return new Promise((resolve, reject) => {
      exec('systemctl is-active --quiet ' + service.subtype + ' && echo active', (error, stdout, stderr) => {
        if (stderr) return reject(stderr);     
        //if(error) return reject(error)
      
        stdout = stdout.toString();
        if(stdout==='') stdout = 'inactive';
      
        let lines = stdout.split('\n')[0];
      
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
        } else {
          lines = '0s'
        }
        
        resolve(lines);
      });
    });
  
  }
  
  handleServicePIDs(service){

    return new Promise((resolve, reject) => {
  
      exec('systemctl status ' + service.subtype + ' -n 0 | grep "Main PID:"', (error, stdout, stderr) => {
        if (stderr) return reject(stderr);
     
        let lines = stdout.toString().split('\n')[0];
    
        lines = lines.split(' Main PID: ')[1];
        lines = lines.split(' (')[0];
      
        resolve(lines);
      
      });

    });

  }
  
  handleCPUUsage(pid){

    return new Promise((resolve, reject) => {
  
      exec('ps -p ' + pid + ' -o pcpu --no-headers', (error, stdout, stderr) => {
        if (stderr) return reject(stderr);
     
        let lines = stdout.toString().replace(/\s/g,'').split('\n')[0];
      
        if(lines==='')  lines = 'PID changed!';
      
        resolve(lines);
      
      });

    });

  }
  
}
  
module.exports = BridgeAccessory;
