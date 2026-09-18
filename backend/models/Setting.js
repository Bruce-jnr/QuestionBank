const prisma = require('../src/config/database');

function convertValue(setting) {
  let value = setting.setting_value;
  if (setting.setting_type === 'boolean') {
    value = value === 'true' || value === '1';
  } else if (setting.setting_type === 'number') {
    value = parseInt(value, 10);
  }
  return value;
}

class Setting {
  static async findAll() {
    const settings = await prisma.setting.findMany({
      orderBy: { setting_key: 'asc' },
      select: {
        setting_key: true,
        setting_value: true,
        setting_type: true,
        description: true
      }
    });

    return Object.fromEntries(settings.map((setting) => [
      setting.setting_key,
      {
        value: convertValue(setting),
        type: setting.setting_type,
        description: setting.description
      }
    ]));
  }

  static async findByKey(key) {
    const setting = await prisma.setting.findUnique({
      where: { setting_key: key },
      select: { setting_value: true, setting_type: true }
    });
    return setting ? convertValue(setting) : null;
  }

  static async update(key, value, type = 'string') {
    const stringValue = type === 'boolean' ? (value ? 'true' : 'false') : String(value);
    await prisma.setting.upsert({
      where: { setting_key: key },
      create: { setting_key: key, setting_value: stringValue, setting_type: type },
      update: { setting_value: stringValue, setting_type: type }
    });
    return this.findByKey(key);
  }

  static async updateMultiple(settingsObj) {
    const operations = Object.entries(settingsObj).map(([key, data]) => {
      const { value, type = 'string' } = data;
      const stringValue = type === 'boolean' ? (value ? 'true' : 'false') : String(value);
      return prisma.setting.upsert({
        where: { setting_key: key },
        create: { setting_key: key, setting_value: stringValue, setting_type: type },
        update: { setting_value: stringValue, setting_type: type }
      });
    });

    await prisma.$transaction(operations);
    return this.findAll();
  }
}

module.exports = Setting;
