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
    // Updatable Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.Updatable = function() {
      Characteristic.call(this, 'Updatable Plugins', '7a95059c-f154-463f-95ee-527dbd123e8b');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Updatable, Characteristic);
    Characteristic.Updatable.UUID = '7a95059c-f154-463f-95ee-527dbd123e8b';   
    
    /// /////////////////////////////////////////////////////////////////////////
    // CPUUsage Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.CPUUsage = function() {
      Characteristic.call(this, 'CPU', '76c9c4e5-23b0-441c-aea6-f2cb680d5a95');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.PERCENTAGE,
        minValue: 0,
        maxValue: 100,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.CPUUsage, Characteristic);
    Characteristic.CPUUsage.UUID = '76c9c4e5-23b0-441c-aea6-f2cb680d5a95'; 
    
    /// /////////////////////////////////////////////////////////////////////////
    // MemoryUsage Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.RAMUsage = function() {
      Characteristic.call(this, 'RAM', '782a5e2f-a172-4b72-aa57-8408f68cb5e8');
      this.setProps({
        format: Characteristic.Formats.FLOAT,
        unit: Characteristic.Units.PERCENTAGE,
        minValue: 0,
        maxValue: 100,
        minStep: 0.01,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.RAMUsage, Characteristic);
    Characteristic.RAMUsage.UUID = '782a5e2f-a172-4b72-aa57-8408f68cb5e8'; 
  
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
    // DiskSpace Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.DiskSpace = function() {
      Characteristic.call(this, 'Free Disk Space', 'c4a3856e-5995-4d4f-affd-144d4444b45e');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.DiskSpace, Characteristic);
    Characteristic.DiskSpace.UUID = 'c4a3856e-5995-4d4f-affd-144d4444b45e'; 
    
    /// /////////////////////////////////////////////////////////////////////////
    // UpdatePlugins Characteristic
    /// ///////////////////////////////////////////////////////////////////////// 
    Characteristic.UpdatePlugins = function() {
      Characteristic.call(this, 'Update Plugins', 'f01b98d1-d183-46a8-beab-afa169031335');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.UpdatePlugins, Characteristic);
    Characteristic.UpdatePlugins.UUID = 'f01b98d1-d183-46a8-beab-afa169031335';  
    
    /// /////////////////////////////////////////////////////////////////////////
    // Instances Service
    /// ///////////////////////////////////////////////////////////////////////// 
    Service.Instances = function(displayName, subtype) {
      Service.call(this, displayName, 'f5b4c659-d8dd-4ce1-9757-24c902e586ac', subtype);
      
      // Required Characteristics
      this.addCharacteristic(Characteristic.On);
      this.addCharacteristic(Characteristic.ServiceStatus);
      this.addCharacteristic(Characteristic.RunningTime);
      this.addCharacteristic(Characteristic.CPUUsage);
      this.addCharacteristic(Characteristic.RAMUsage);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
    
    };
    inherits(Service.Instances, Service);
    Service.Instances.UUID = 'f5b4c659-d8dd-4ce1-9757-24c902e586ac';
    
    /// /////////////////////////////////////////////////////////////////////////
    // Switch Service
    /// ///////////////////////////////////////////////////////////////////////// 
    Service.Switch = function(displayName, subtype) {
      Service.call(this, displayName, '00000049-0000-1000-8000-0026BB765291', subtype);
      
      // Required Characteristics
      this.addCharacteristic(Characteristic.On);

      // Optional Characteristics
      this.addOptionalCharacteristic(Characteristic.Name);
      this.addOptionalCharacteristic(Characteristic.CPUUsage);
      this.addOptionalCharacteristic(Characteristic.RAMUsage);
      this.addOptionalCharacteristic(Characteristic.RunningTime);
      this.addOptionalCharacteristic(Characteristic.DiskSpace);
      this.addOptionalCharacteristic(Characteristic.Updatable);
      this.addOptionalCharacteristic(Characteristic.UpdatePlugins);
      this.addOptionalCharacteristic(Characteristic.CurrentTemperature);
    
    };
    inherits(Service.Switch, Service);
    Service.Switch.UUID = '00000049-0000-1000-8000-0026BB765291';
  
  }
};
