const express = require('express');
const controller = require('../controllers/studyContentController');
const { authenticateToken } = require('../middleware/auth');

const publicRouter = express.Router();
publicRouter.get('/', controller.publicStudyGuide);

const adminRouter = express.Router();
adminRouter.use(authenticateToken);
adminRouter.get('/domains', controller.listDomains);
adminRouter.post('/domains', controller.createDomain);
adminRouter.patch('/domains/:id', controller.updateDomain);
adminRouter.delete('/domains/:id', controller.deleteDomain);
adminRouter.post('/modules', controller.createModule);
adminRouter.patch('/modules/:id', controller.updateModule);
adminRouter.delete('/modules/:id', controller.deleteModule);

module.exports = { publicRouter, adminRouter };
