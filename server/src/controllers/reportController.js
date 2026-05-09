const Interview = require('../models/Interview');

const unique = (items) => [...new Set(items.filter(Boolean))];

const buildReport = (interviews) => {
  const allScores = interviews.flatMap((interview) => interview.scores || []);
  const totalScore = allScores.reduce((sum, score) => sum + Number(score || 0), 0);
  const averageScore = allScores.length ? Number((totalScore / allScores.length).toFixed(1)) : 0;
  const strengths = unique(interviews.flatMap((interview) => interview.scoreSummary?.strengths || []));
  const weaknesses = unique(interviews.flatMap((interview) => interview.scoreSummary?.weaknesses || []));
  const improvementTips = unique(interviews.flatMap((interview) => interview.scoreSummary?.improvementTips || []));

  return {
    totalScore,
    averageScore,
    strengths,
    weaknesses,
    improvementTips,
  };
};

const getReport = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId !== userId) {
      return res.status(403).json({ message: 'You can only access your own report' });
    }

    const interviews = await Interview.find({ userId }).sort({ createdAt: -1 });
    const summary = buildReport(interviews);

    return res.json({
      userId,
      totalInterviews: interviews.length,
      ...summary,
      interviews,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load report', error: error.message });
  }
};

module.exports = {
  getReport,
};
