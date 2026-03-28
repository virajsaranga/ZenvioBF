import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { depositAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const BANK_INFO = {
  bank_transfer: { name: 'Wire Transfer', info: 'Bank: Zenvio Bank\nAccount: 1234-5678-9012\nSwift: ZNVDUS33\nRef: Your Account Number' },
  local_bank:    { name: 'Local Bank',    info: 'Bank: National Bank\nAccount: 9876-5432-1098\nBranch: Main Branch' },
  card:          { name: 'Card Payment',  info: null },
};

export function DepositPage() {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(accepted => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'application/pdf': [] }, maxFiles: 1 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (method !== 'card' && !file) return toast.error('Please upload payment proof');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('amount', amount);
      fd.append('method', method);
      fd.append('note', note);
      if (file) fd.append('proof', file);
      await depositAPI.request(fd);
      setSuccess(true);
      toast.success('Deposit request submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Deposit Request Submitted</h2>
        <p className="text-gray-500 text-sm mb-6">Your deposit is pending admin review. Usually approved within 1-24 hours.</p>
        <button onClick={() => { setSuccess(false); setStep(1); setMethod(''); setAmount(''); setFile(null); }}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
          Make Another Deposit
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Deposit Funds</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">Choose your deposit method</p>
            {Object.entries(BANK_INFO).map(([key, val]) => (
              <button key={key} onClick={() => { setMethod(key); setStep(2); }}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-left group">
                <div className="w-10 h-10 rounded-xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center text-lg">
                  {key === 'card' ? '💳' : key === 'bank_transfer' ? '🏦' : '🏧'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{val.name}</p>
                  <p className="text-xs text-gray-400">{key === 'card' ? 'Visa, Mastercard' : 'Bank transfer with proof'}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline">← Change method</button>

            {BANK_INFO[method]?.info && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Transfer Details</p>
                <pre className="text-xs text-blue-700 whitespace-pre-wrap">{BANK_INFO[method].info}</pre>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" min="10" required value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  placeholder="0.00" />
              </div>
            </div>

            {method !== 'card' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Payment Proof</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-400 bg-primary-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary-300'}`}>
                  <input {...getInputProps()} />
                  <CloudArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  {file ? <p className="text-sm text-green-700 font-medium">{file.name}</p>
                        : <p className="text-sm text-gray-500">Drop screenshot or PDF here, or click to select</p>}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Reference or note" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors">
              {loading ? 'Submitting...' : 'Submit Deposit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DepositPage;
