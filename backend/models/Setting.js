const pool = require('../src/config/database');

class Setting {
  static async findAll() {
    const [settings] = await pool.execute(
      'SELECT setting_key, setting_value, setting_type, description FROM settings ORDER BY setting_key'
    );
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseInt(value, 10);
      }
      
      settingsObj[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description
      };
    });
    
    return settingsObj;
  }
  static async findByKey(key) {
    const [settings] = await pool.execute(
      'SELECT setting_value, setting_type FROM settings WHERE setting_key = ?',
      [key]
    );
    
    if (settings.length === 0) {
      return null;
    }
    
    const setting = settings[0];
    let value = setting.setting_value;
    if (setting.setting_type === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (setting.setting_type === 'number') {
      value = parseInt(value, 10);
    }
    
    return value;
  }
  static async update(key, value, type = 'string') {
    let stringValue = String(value);
    if (type === 'boolean') {
      stringValue = value ? 'true' : 'false';
    }
    
    await pool.execute(
      `INSERT INTO settings (setting_key, setting_value, setting_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type)`,
      [key, stringValue, type]
    );
    
    return this.findByKey(key);
  }
  static async updateMultiple(settingsObj) {
    const updates = [];
    
    for (const [key, data] of Object.entries(settingsObj)) {
      const { value, type = 'string' } = data;
      let stringValue = String(value);
      
      if (type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      }
      
      updates.push(
        pool.execute(
          `INSERT INTO settings (setting_key, setting_value, setting_type)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             setting_value = VALUES(setting_value),
             setting_type = VALUES(setting_type)`,
          [key, stringValue, type]
        )
      );
    }
    
    await Promise.all(updates);
    return this.findAll();
  }
}

module.exports = Setting;

