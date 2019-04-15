'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    const Service = hap.Service;
    
    /// /////////////////////////////////////////////////////////////////////////
    // ServiceStatus Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.ServiceStatus = function() {
      Characteristic.call(this, 'Status', '0258a1bf-6b32-470d-aa92-ba340eee4441');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ServiceStatus, Characteristic);
    Characteristic.ServiceStatus.UUID = '0258a1bf-6b32-470d-aa92-ba340eee4441';   
  
    /// /////////////////////////////////////////////////////////////////////////
    // RunningTime Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.RunningTime = function() {
      Characteristic.call(this, 'Running Time', '03d42db4-8b9c-4b43-b45d-88a59450f2d9');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.RunningTime, Characteristic);
    Characteristic.RunningTime.UUID = '03d42db4-8b9c-4b43-b45d-88a59450f2d9';  
    
    /// /////////////////////////////////////////////////////////////////////////
    // Instances Service
    /// ///////////////////////////////////////////////////////////////////////// 
    Service.Instances = function(displayName, subtype) {
      Service.call(this, displayName, 'f5b4c659-d8dd-4ce1-9757-24c902e586ac ', subtype);
      
      // Required Characteristics
      this.addCharacteristic(Characteristic.On);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
      this.addOptionalCharacteristic(Characteristic.ServiceStatus);
      this.addOptionalCharacteristic(Characteristic.RunningTime);
    
    };
    inherits(Service.Instances, Service);
    Service.Instances.UUID = 'f5b4c659-d8dd-4ce1-9757-24c902e586ac ';
  
  }
};