const Interview = require('../models/Interview');
const { evaluateAnswer: evaluateWithAI, generateQuestionsFromText, normalizeQuestions } = require('../utils/ai');

const flattenQuestions = (questionBundle) => {
  const technicalQuestions = (questionBundle.technicalQuestions || []).map((question) => ({
    ...question,
    category: 'technical',
  }));
  const hrQuestions = (questionBundle.hrQuestions || []).map((question) => ({
    ...question,
    category: 'hr',
  }));
  const scenarioQuestions = (questionBundle.scenarioQuestions || []).map((question) => ({
    ...question,
    category: 'scenario',
  }));

  return normalizeQuestions([...technicalQuestions, ...hrQuestions, ...scenarioQuestions]);
};

const buildScoreSummary = (answers) => {
  const scores = answers.map((answer) => Number(answer.score) || 0);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = scores.length ? Number((totalScore / scores.length).toFixed(1)) : 0;
  const strengths = [...new Set(answers.flatMap((answer) => answer.strengths || []))].slice(0, 6);
  const weaknesses = [...new Set(answers.flatMap((answer) => answer.weaknesses || []))].slice(0, 6);
  const improvementTips = [...new Set(answers.flatMap((answer) => answer.improvementTips || []))].slice(0, 6);

  return {
    totalScore,
    averageScore,
    strengths,
    weaknesses,
    improvementTips,
  };
};

const generateQuestions = async (req, res) => {
  try {
    const { pdfText } = req.body;

    if (!pdfText) {
      return res.status(400).json({ message: 'PDF text is required' });
    }

    const generatedQuestions = await generateQuestionsFromText(pdfText);
    const questions = flattenQuestions(generatedQuestions);

    return res.json({
      message: 'Questions generated successfully',
      questions,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Question generation failed', error: error.message });
  }
};

const startInterview = async (req, res) => {
  try {
    const { pdfText, questions } = req.body;

    if (!pdfText || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'PDF text and questions are required' });
    }

    const interview = await Interview.create({
      userId: req.user.userId,
      pdfText,
      questions: normalizeQuestions(questions),
      answers: [],
      scores: [],
      scoreSummary: {
        totalScore: 0,
        averageScore: 0,
        strengths: [],
        weaknesses: [],
        improvementTips: [],
      },
    });

    return res.status(201).json({
      message: 'Interview session started',
      interview,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to start interview', error: error.message });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const { interviewId, questionId, question, answer } = req.body;

    if (!interviewId || !questionId || !question || !answer) {
      return res.status(400).json({ message: 'Interview ID, question, and answer are required' });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user.userId });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const questionItem = interview.questions.find((item) => item.id === questionId);
    const context = `${interview.pdfText}\n\nQuestion focus: ${questionItem?.question || question}`;
    const evaluation = await evaluateWithAI({ question, answer, context });

    const filteredAnswers = interview.answers.filter((item) => item.questionId !== questionId);
    const updatedAnswer = {
      questionId,
      question,
      answer,
      score: Number(evaluation.score) || 0,
      feedback: evaluation.feedback,
      improvedAnswer: evaluation.improvedAnswer,
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      improvementTips: evaluation.improvementTips || [],
      answeredAt: new Date(),
    };

    const answers = [...filteredAnswers, updatedAnswer];
    const scores = answers.map((item) => Number(item.score) || 0);
    const scoreSummary = buildScoreSummary(answers);

    interview.answers = answers;
    interview.scores = scores;
    interview.scoreSummary = scoreSummary;
    await interview.save();

    return res.json({
      message: 'Answer evaluated successfully',
      evaluation: updatedAnswer,
      interview,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to evaluate answer', error: error.message });
  }
};

module.exports = {
  evaluateAnswer,
  generateQuestions,
  startInterview,
};
