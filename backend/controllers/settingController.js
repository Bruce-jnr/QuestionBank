const Setting = require('../models/Setting');
const Admin = require('../models/Admin');
const { hashPassword } = require('../src/config/auth');

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}
async function getSettings(req, res) {
  try {
    const settings = await Setting.findAll();
    sendJSON(res, 200, { settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function updateSettings(req, res) {
  try {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { settings } = data;

        if (!settings || typeof settings !== 'object') {
          return sendJSON(res, 400, { error: 'Invalid settings data' });
        }

        await Setting.updateMultiple(settings);
        const updatedSettings = await Setting.findAll();
        
        sendJSON(res, 200, { 
          message: 'Settings updated successfully',
          settings: updatedSettings 
        });
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        sendJSON(res, 400, { error: 'Invalid JSON in request body' });
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function updateAdminProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendJSON(res, 401, { error: 'Unauthorized' });
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { email, currentPassword, newPassword } = data;

        const updates = {};
        if (email) {
          updates.email = email;
        }
        if (newPassword) {
          if (!currentPassword) {
            return sendJSON(res, 400, { error: 'Current password is required to change password' });
          }
          const admin = await Admin.findByUsername(req.user.username);
          if (!admin) {
            return sendJSON(res, 404, { error: 'Admin not found' });
          }

          const { comparePassword } = require('../src/config/auth');
          const isValid = await comparePassword(currentPassword, admin.password);
          
          if (!isValid) {
            return sendJSON(res, 401, { error: 'Current password is incorrect' });
          }
          const hashedPassword = await hashPassword(newPassword);
          await Admin.updatePassword(userId, hashedPassword);
        }
        if (email) {
          await Admin.updateEmail(userId, email);
        }

        sendJSON(res, 200, { 
          message: 'Profile updated successfully' 
        });
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        sendJSON(res, 400, { error: 'Invalid JSON in request body' });
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}
async function getAdminProfile(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendJSON(res, 401, { error: 'Unauthorized' });
    }

    const admin = await Admin.findById(userId);
    if (!admin) {
      return sendJSON(res, 404, { error: 'Admin not found' });
    }

    sendJSON(res, 200, { admin });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  updateAdminProfile,
  getAdminProfile
};

