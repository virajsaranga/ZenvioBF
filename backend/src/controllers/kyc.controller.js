const User = require('../models/User.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer for KYC documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `uploads/kyc/${req.user._id}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  },
});

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|pdf/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
}).fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
]);

// @POST /api/kyc/submit
exports.submitKYC = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (['approved', 'pending'].includes(user.kyc.status)) {
      return res.status(400).json({
        success: false,
        message: user.kyc.status === 'approved' ? 'KYC already approved' : 'KYC submission already under review',
      });
    }

    const { dateOfBirth, nationality, street, city, state, country, zipCode, docType } = req.body;
    const files = req.files || {};

    const documents = [];
    if (files.front) documents.push({ type: docType || 'national_id', fileUrl: `/uploads/kyc/${user._id}/${files.front[0].filename}`, fileName: files.front[0].filename });
    if (files.back)  documents.push({ type: `${docType || 'national_id'}_back`, fileUrl: `/uploads/kyc/${user._id}/${files.back[0].filename}`, fileName: files.back[0].filename });
    if (files.selfie) documents.push({ type: 'selfie', fileUrl: `/uploads/kyc/${user._id}/${files.selfie[0].filename}`, fileName: files.selfie[0].filename });
    if (files.addressProof) documents.push({ type: 'proof_of_address', fileUrl: `/uploads/kyc/${user._id}/${files.addressProof[0].filename}`, fileName: files.addressProof[0].filename });

    user.kyc = {
      ...user.kyc,
      status: 'pending',
      submittedAt: Date.now(),
      documents,
      personalInfo: {
        dateOfBirth,
        nationality,
        address: { street, city, state, country, zipCode },
      },
    };

    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'KYC submitted successfully. Under review (1-3 business days).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/kyc/status
exports.getKYCStatus = async (req, res) => {
  const user = await User.findById(req.user._id).select('kyc');
  res.json({ success: true, kyc: user.kyc });
};
