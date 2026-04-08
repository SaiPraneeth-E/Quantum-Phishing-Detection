const User = require('../models/User');
const Prediction = require('../models/Prediction');
const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || '').toLowerCase().trim();

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch users.' });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const predictions = await Prediction.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch predictions.' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalPredictions, phishingCount, legitimateCount, recentPredictions] =
      await Promise.all([
        User.countDocuments(),
        Prediction.countDocuments(),
        Prediction.countDocuments({ prediction: 'phishing' }),
        Prediction.countDocuments({ prediction: 'legitimate' }),
        Prediction.find().sort({ timestamp: -1 }).limit(10).populate('userId', 'name email').lean(),
      ]);
    res.json({
      totalUsers,
      totalPredictions,
      phishingCount,
      legitimateCount,
      recentActivity: recentPredictions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch analytics.' });
  }
};

exports.manageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    if (ROOT_ADMIN_EMAIL && target.email.toLowerCase() === ROOT_ADMIN_EMAIL && role !== 'admin') {
      return res.status(400).json({ message: 'Root admin cannot be demoted.' });
    }

    target.role = role;
    await target.save();
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update user.' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 }).lean();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch admins.' });
  }
};

exports.promoteToAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.role = 'admin';
    await user.save();
    res.json({ message: 'User promoted to admin.', user: await User.findById(user._id).select('-password') });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to promote user.' });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (ROOT_ADMIN_EMAIL && user.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
      return res.status(400).json({ message: 'Root admin cannot be removed.' });
    }
    user.role = 'user';
    await user.save();
    res.json({ message: 'Admin access removed.', user: await User.findById(user._id).select('-password') });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to remove admin.' });
  }
};
