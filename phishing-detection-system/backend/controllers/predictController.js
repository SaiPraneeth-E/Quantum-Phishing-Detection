const axios = require('axios');
const Prediction = require('../models/Prediction');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.predict = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: 'URL is required.' });
    }
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      url: url.trim(),
    }, { timeout: 30000 });
    const { prediction, confidence, risk_factors } = response.data;
    const record = await Prediction.create({
      userId: req.user._id,
      inputUrl: url.trim(),
      prediction: prediction === 'phishing' ? 'phishing' : 'legitimate',
      confidence: Number(confidence) || 0,
      riskFactors: risk_factors || [],
    });
    res.json({
      prediction: record.prediction,
      confidence: record.confidence,
      riskFactors: record.riskFactors,
      id: record._id,
      timestamp: record.timestamp,
    });
  } catch (err) {
    if (err.response?.data) {
      return res.status(err.response.status || 500).json({
        message: err.response.data.detail || err.response.data.message || 'ML service error.',
      });
    }
    res.status(500).json({
      message: err.message || 'Prediction failed. Ensure ML service is running.',
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const predictions = await Prediction.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch history.' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);
    const [total, phishing, legitimate, avg] = await Promise.all([
      Prediction.countDocuments({ userId }),
      Prediction.countDocuments({ userId, prediction: 'phishing' }),
      Prediction.countDocuments({ userId, prediction: 'legitimate' }),
      Prediction.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } },
      ]),
    ]);

    const recent = await Prediction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .select('inputUrl prediction confidence timestamp')
      .lean();

    const trendRaw = await Prediction.aggregate([
      { $match: { userId, timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          total: { $sum: 1 },
          phishing: {
            $sum: {
              $cond: [{ $eq: ['$prediction', 'phishing'] }, 1, 0],
            },
          },
          legitimate: {
            $sum: {
              $cond: [{ $eq: ['$prediction', 'legitimate'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const map = new Map(trendRaw.map((t) => [t._id, t]));
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const item = map.get(key);
      weeklyTrend.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: item?.total || 0,
        phishing: item?.phishing || 0,
        legitimate: item?.legitimate || 0,
      });
    }

    res.json({
      totalPredictions: total,
      phishingCount: phishing,
      legitimateCount: legitimate,
      avgConfidence: avg[0]?.avgConfidence || 0,
      recent,
      weeklyTrend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch stats.' });
  }
};

exports.deleteHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Prediction.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: 'History item not found.' });
    }
    res.json({ message: 'History item deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to delete history item.' });
  }
};

exports.bulkPredict = async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'urls array is required.' });
    }
    const cleaned = urls
      .map((u) => String(u || '').trim())
      .filter(Boolean)
      .slice(0, 50);

    const results = [];
    for (const url of cleaned) {
      try {
        const response = await axios.post(
          `${ML_SERVICE_URL}/predict`,
          { url },
          { timeout: 30000 }
        );
        const { prediction, confidence, risk_factors } = response.data;
        const record = await Prediction.create({
          userId: req.user._id,
          inputUrl: url,
          prediction: prediction === 'phishing' ? 'phishing' : 'legitimate',
          confidence: Number(confidence) || 0,
          riskFactors: risk_factors || [],
        });
        results.push({
          id: record._id,
          inputUrl: record.inputUrl,
          prediction: record.prediction,
          confidence: record.confidence,
          riskFactors: record.riskFactors,
          timestamp: record.timestamp,
        });
      } catch (err) {
        results.push({
          inputUrl: url,
          error: err.response?.data?.detail || err.response?.data?.message || 'Prediction failed',
        });
      }
    }
    res.json({ count: results.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Bulk prediction failed.' });
  }
};
