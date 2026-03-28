import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { kycAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

function DropZone({ label, file, onDrop, required }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: files => onDrop(files[0]),
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 1,
  });
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
        {file ? <p className="text-sm text-green-700 font-medium">{file.name}</p>
              : <p className="text-xs text-gray-500">Drop or click to upload</p>}
      </div>
    </div>
  );
}

export default function KYCPage() {
  const { user, updateUser } = useAuthStore();
  const [kycStatus, setKycStatus] = useState(null);
  const [files, setFiles] = useState({ front: null, back: null, selfie: null, addressProof: null });
  const [form, setForm] = useState({ docType: 'national_id', dateOfBirth: '', nationality: '', street: '', city: '', state: '', country: '', zipCode: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    kycAPI.getStatus().then(r => setKycStatus(r.data.kyc)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.front || !files.selfie) return toast.error('ID front and selfie are required');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (files.front)       fd.append('front', files.front);
      if (files.back)        fd.append('back', files.back);
      if (files.selfie)      fd.append('selfie', files.selfie);
      if (files.addressProof) fd.append('addressProof', files.addressProof);
      await kycAPI.submit(fd);
      toast.success('KYC submitted successfully!');
      setKycStatus({ status: 'pending' });
      updateUser({ kyc: { status: 'pending' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  const statusColor = { approved: 'green', pending: 'yellow', rejected: 'red', not_submitted: 'gray' };
  const sc = statusColor[kycStatus?.status || 'not_submitted'];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">KYC Verification</h1>

      {/* Status Card */}
      <div className={`mb-6 p-4 rounded-xl border ${sc === 'green' ? 'bg-green-50 border-green-200' : sc === 'yellow' ? 'bg-yellow-50 border-yellow-200' : sc === 'red' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${sc === 'green' ? 'bg-green-200' : sc === 'yellow' ? 'bg-yellow-200' : sc === 'red' ? 'bg-red-200' : 'bg-gray-200'}`}>
            {sc === 'green' ? '✅' : sc === 'yellow' ? '⏳' : sc === 'red' ? '❌' : '📋'}
          </div>
          <div>
            <p className={`font-semibold text-sm ${sc === 'green' ? 'text-green-800' : sc === 'yellow' ? 'text-yellow-800' : sc === 'red' ? 'text-red-800' : 'text-gray-800'}`}>
              KYC Status: {kycStatus?.status?.replace('_', ' ').toUpperCase() || 'NOT SUBMITTED'}
            </p>
            <p className={`text-xs ${sc === 'green' ? 'text-green-600' : sc === 'yellow' ? 'text-yellow-600' : sc === 'red' ? 'text-red-600' : 'text-gray-500'}`}>
              {sc === 'green' ? 'Your identity is verified. You can use all features.' :
               sc === 'yellow' ? 'Your documents are under review (1-3 business days).' :
               sc === 'red' ? `Rejected: ${kycStatus?.rejectionReason || 'Please resubmit'}` :
               'Submit your documents to verify your identity'}
            </p>
          </div>
        </div>
      </div>

      {kycStatus?.status === 'approved' ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Fully Verified!</h2>
          <p className="text-gray-500">Your account is fully verified. Enjoy all Zenvio features!</p>
        </div>
      ) : kycStatus?.status === 'pending' ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
          <p className="text-5xl mb-3">⏳</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Under Review</h2>
          <p className="text-gray-500 text-sm">We're reviewing your documents. You'll be notified once complete.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Submit Verification Documents</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Document Type</label>
              <select value={form.docType} onChange={e => setForm({ ...form, docType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-2 gap-4">
              <DropZone label="ID Front" file={files.front} onDrop={f => setFiles({ ...files, front: f })} required />
              <DropZone label="ID Back" file={files.back} onDrop={f => setFiles({ ...files, back: f })} />
              <DropZone label="Selfie with ID" file={files.selfie} onDrop={f => setFiles({ ...files, selfie: f })} required />
              <DropZone label="Proof of Address" file={files.addressProof} onDrop={f => setFiles({ ...files, addressProof: f })} />
            </div>

            {/* Personal Info */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="font-medium text-gray-900 mb-4 text-sm">Personal Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" required value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                  <input required value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="e.g. American" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3 text-sm">Address</h3>
              <div className="space-y-3">
                <input required value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Street address" />
                <div className="grid grid-cols-2 gap-3">
                  <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="City" />
                  <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="State/Province" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Country" />
                  <input required value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="ZIP Code" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
