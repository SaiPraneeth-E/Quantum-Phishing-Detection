const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputUrl: { type: String, required: true },
  prediction: { type: String, enum: ['phishing', 'legitimate'], required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  riskFactors: { type: [String], default: [] },
  timestamp: { type: Date, default: Date.now },
});

predictionSchema.index({ userId: 1, timestamp: -1 });

module.exports =
  mongoose.models.Prediction || mongoose.model('Prediction', predictionSchema);
