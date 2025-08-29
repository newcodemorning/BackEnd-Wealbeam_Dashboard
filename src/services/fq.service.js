const Faq = require('../models/faq.model');

class FaqService {
  // Create an FAQ
  async createFaq(question, answer) {
    const fqData = {
      question,
      answer,
    };

    const faq = new Faq(fqData);
    await faq.save();
    return faq;
  }

  // Get all FAQs
  async getAllFaqs(lang) {
    const faqs = await Faq.find().sort({ created_at: -1 }); 
    const res = faqs.map(fq => ({
      id: fq._id,
      question: fq.question?.[lang] ?? fq.question,
      answer: fq.answer?.[lang] ?? fq.answer,
      created_at: fq.created_at,
      updated_at: fq.updated_at
    }));
    return res;
  }

  // Get an FAQ by ID
  async getFaqById(id) {
    const faq = await Faq.findById(id);
    if (!faq) throw new Error('FAQ not found');

    return faq;
  }

  // Update an FAQ
  async updateFaq(id, question, answer) {
    const faq = await Faq.findByIdAndUpdate(
      id,
      { question, answer, updated_at: new Date() },
      { new: true } // Return the updated document
    );

    if (!faq) throw new Error('FAQ not found');
    return faq;
  }

  // Delete an FAQ
  async deleteFaq(id) {
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) throw new Error('FAQ not found');

    return { message: 'FAQ deleted successfully' };
  }
}

module.exports = new FaqService();
