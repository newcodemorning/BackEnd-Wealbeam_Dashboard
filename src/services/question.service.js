const { Question, Form } = require('../models/question.model');

class QuestionService {
    async createForm(formData) {
        // Check if form with this subject already exists
        const existingForm = await Form.findOne({ subject: formData.subject });
        if (existingForm) {
            throw new Error('Form with this subject already exists');
        }

        const checkSpaces = formData.subject.split(' ').length;
        if (checkSpaces > 1) {
            throw new Error('Subject should not contain spaces');
        }

        if (!formData.questions || formData.questions.length === 0) {
            throw new Error('Form must contain at least one question');
        }

        const orders = formData.questions.map(q => q.order);
        const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);

        if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
            throw new Error('Question orders are not sequential');
        }

        return Form.create(formData);
    }

    async updateForm(subject, updateData) {
        const form = await Form.findOne({ subject });
        if (!form) {
            throw new Error('Form not found');
        }

        if (updateData.questions) {
            // Validate question orders are sequential
            const orders = updateData.questions.map(q => q.order);
            const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);

            if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
                throw new Error('Question orders are not sequential');
            }
        }

        return Form.findOneAndUpdate({ subject }, updateData, { new: true });
    }

    _localize(field, lang = 'en') {
        // Handles: undefined, string, or object with language keys
        if (field === undefined || field === null) return '';
        if (typeof field === 'string') return field;
        // field is an object like { en: '...', ar: '...' }
        if (field[lang]) return field[lang];
        if (field.en) return field.en;
        // fallback to first non-empty value, or empty string
        const first = Object.values(field).find(v => v !== undefined && v !== null && v !== '');
        return first || '';
    }

    async getFormBySubject(subject, lang = 'en') {
        const form = await Form.findOne({ subject }).lean();
        if (form) {
            // Transform form to return language-specific text
            const transformedForm = {
                _id: form._id,
                subject: form.subject,
                questions: form.questions.map(q => ({
                    _id: q._id,
                    text: this._localize(q.text, lang),
                    type: q.type,
                    order: q.order,
                    dangerAnswer: q.dangerAnswer,
                    options: q.options ? q.options.map(opt => ({
                        _id: opt._id,
                        text: this._localize(opt.text, lang),
                        name: this._localize(opt.name, lang),
                        isDanger: opt.isDanger
                    })) : []
                })),
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            };

            return transformedForm;
        }
        return form;
    }

    async getDailyForm(lang = 'en') {
        return await this.getFormBySubject('daily', lang);
    }

    async getAllForms() {
        return Form.find().lean();
    }

    async deleteForm(subject) {
        return Form.findOneAndDelete({ subject });
    }

    async getFormById(id, lang = 'en') {

        const form = await Form.findById(id).lean();;
        if (form) {
            // Transform form to return language-specific text
            const transformedForm = {
                _id: form._id,
                subject: form.subject,
                questions: form.questions.map(q => ({
                    _id: q._id,
                    text: this._localize(q.text, lang),
                    type: q.type,
                    order: q.order,
                    dangerAnswer: q.dangerAnswer,
                    options: q.options ? q.options.map(opt => ({
                        _id: opt._id,
                        text: this._localize(opt.text, lang),
                        name: this._localize(opt.name, lang),
                        isDanger: opt.isDanger
                    })) : []
                })),
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            };

            return transformedForm;
        }
        return form;


    }

    async updateFormById(id, updateData) {
        const form = await Form.findById(id);
        if (!form) {
            throw new Error('Form not found');
        }
        if (updateData.questions) {
            // Validate question orders are sequential
            const orders = updateData.questions.map(q => q.order);
            const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);
            if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
                throw new Error('Question orders are not sequential');
            }
        }
        return Form.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deleteFormById(id) {
        return Form.findByIdAndDelete(id);
    }
}

module.exports = new QuestionService();