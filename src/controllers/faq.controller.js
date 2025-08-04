const FqService = require('../services/fq.service');

async function createFq(req, res) {
  try {
    const { question, answer } = req.body;
    const fq = await FqService.createFaq(question, answer);

    res.status(201).json({
      message: 'FAQ created successfully',
      data: fq,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAllFqs(req, res) {
  try {
    const faqs = await FqService.getAllFaqs();
    res.status(200).json({
      message: 'FAQs fetched successfully',
      data: faqs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateFq(req, res) {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const fq = await FqService.updateFaq(id, question, answer);

    res.status(200).json({
      message: 'FAQ updated successfully',
      data: fq,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function deleteFq(req, res) {
  try {
    const { id } = req.params;
    await FqService.deleteFaq(id);

    res.status(200).json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createFq,
  getAllFqs,
  updateFq,
  deleteFq,
};
