const incidentService = require('../services/incident.service');

exports.createIncident = async (req, res) => {
    try {
        // Ensure user is authenticated and has an ID
        console.log('User:', req.user);
        console.log('User Id',req.user.id);
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        // Add reporter from authenticated user
        const incidentData = {
            ...req.body,
            reporter: req.user.id
        };

        const incident = await incidentService.createIncident(incidentData);
        
        res.status(201).json({
            success: true,
            data: incident
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

exports.getStudentIncidents = async (req, res) => {
    try {
        const incidents = await incidentService.getIncidentsByStudent(req.params.studentId);
        res.json({
            success: true,
            data: incidents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.getIncident = async (req, res) => {
    try {
        const incident = await incidentService.getIncidentById(req.params.incidentId);
        if (!incident) {
            return res.status(404).json({
                success: false,
                error: 'Incident not found'
            });
        }
        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.updateIncident = async (req, res) => {
    try {

        const incident = await incidentService.updateIncident(
            req.params.incidentId,
            { ...req.body, userId: req.user._id }
        );
        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

exports.deleteIncident = async (req, res) => {
    try {
        await incidentService.deleteIncident(req.params.incidentId);
        res.json({
            success: true,
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};