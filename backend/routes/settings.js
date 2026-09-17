const {
  getSettings,
  updateSettings,
  updateAdminProfile,
  getAdminProfile
} = require('../controllers/settingController');
const { authenticateToken } = require('../middleware/auth');
function handleSettingsRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const isSettingsRoute = 
    (pathname === '/api/settings' && (req.method === 'GET' || req.method === 'PUT')) ||
    (pathname === '/api/settings/profile' && (req.method === 'GET' || req.method === 'PUT'));

  if (!isSettingsRoute) {
    return false;
  }
  authenticateToken(req, res, () => {
    if (pathname === '/api/settings' && req.method === 'GET') {
      getSettings(req, res);
      return;
    }
    if (pathname === '/api/settings' && req.method === 'PUT') {
      updateSettings(req, res);
      return;
    }
    if (pathname === '/api/settings/profile' && req.method === 'GET') {
      getAdminProfile(req, res);
      return;
    }
    if (pathname === '/api/settings/profile' && req.method === 'PUT') {
      updateAdminProfile(req, res);
      return;
    }
  });

  return true;
}

module.exports = {
  handleSettingsRoutes
};

