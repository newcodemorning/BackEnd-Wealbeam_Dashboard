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



    async getFormBySubject(subject, lang) {
        console.log("Requested language:", lang);
        const form = await Form.findOne({ subject }).lean();
        if (form) {
            form.questions = form.questions.map(q => ({
                ...q,
                text: q.text[lang] || q.text,
                options: q.options ? q.options.map(opt => ({
                    ...opt,
                    text: opt.text[lang] || opt.text
                })) : []
            }));    
        }
        return form;
    }

    async getDailyForm(lang) {
        

        const form = await Form.findOne({ subject: 'daily' }).lean();
        if (form) {
            form.questions = form.questions.map(q => ({
                ...q,
                text: q.text[lang] || q.text,
                options: q.options ? q.options.map(opt => ({
                    ...opt,
                    text: opt.text[lang] || opt.text
                })) : []
            }));
        }
        return form;
    }

    async getAllForms() {
        return Form.find().lean();
    }

    async deleteForm(subject) {
        return Form.findOneAndDelete({ subject });
    }

    async getFormById(id ,lang) {

        const form = await Form.findById(id).lean();;
        if (form) {
            form.questions = form.questions.map(q => ({
                ...q,
                text: q.text[lang] || q.text,
                options: q.options ? q.options.map(opt => ({
                    ...opt,
                    text: opt.text[lang] || opt.text
                })) : []
            }));
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