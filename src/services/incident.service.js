const Incident = require('../models/incident.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');

class IncidentService {
    async createIncident(incidentData) {
        const incident = new Incident(incidentData);
        return await incident.save();
    }

    async getIncidentsByStudent(studentId) {
        return await Incident.find({ student: studentId })
            .sort({ dateTime: -1 })
            .populate({
                path: 'reporter',
                select: 'email role'
            })
            .populate({
                path: 'student',
                select: 'first_name last_name',
                populate: {
                    path: 'class',
                    select: 'ClassName Subject',
                    populate: {
                        path: 'teacher',
                        select: 'first_name last_name',
                        model: 'Teacher'
                    }
                }
            });
    }

    async getIncidentById(incidentId) {
        return await Incident.findById(incidentId)
            .sort({ dateTime: -1 })
            .populate({
                path: 'reporter',
                select: 'email role'
            })
            .populate({
                path: 'student',
                select: 'first_name last_name',
                populate: {
                    path: 'class',
                    select: 'ClassName Subject',
                    populate: {
                        path: 'teacher',
                        select: 'first_name last_name',
                        model: 'Teacher'
                    }
                }
            });
    }

    async updateIncident(incidentId, updateData) {
        // Remove any fields that shouldn't be directly updated
        const { comment, userId, ...updateFields } = updateData;

        // Prepare the update object
        const updateObject = { ...updateFields };

        // If there's a comment, add it to the comments array
        if (comment) {
            updateObject.$push = {
                comments: {
                    text: comment,
                    postedBy: userId,
                    createdAt: new Date()
                }
            };
        }

        const updatedIncident = await Incident.findByIdAndUpdate(
            incidentId,
            updateObject,
            { 
                new: true,
                runValidators: true
            }
        ).populate({
            path: 'reporter',
            select: 'email role'
        }).populate({
            path: 'student',
            select: 'first_name last_name',
            populate: {
                path: 'class',
                select: 'ClassName Subject',
                populate: {
                    path: 'teacher',
                    select: 'first_name last_name',
                    model: 'Teacher'
                }
            }
        });

        if (!updatedIncident) {
            throw new Error('Incident not found');
        }

        return updatedIncident;
    }

    async deleteIncident(incidentId) {
        return await Incident.findByIdAndDelete(incidentId);
    }
}

module.exports = new IncidentService();