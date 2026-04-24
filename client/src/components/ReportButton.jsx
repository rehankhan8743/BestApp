import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Flag, AlertTriangle } from 'lucide-react';

const ReportButton = ({ contentId, contentType = 'post', contentTitle }) => {
  const { post } = useApi();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [reportType, setReportType] = useState('spam');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await post('/reports', {
        contentId,
        contentType,
        type: reportType,
        reason,
        priority
      });

      if (res?.success) {
        alert('Report submitted successfully. Thank you for keeping the community safe!');
        setShowModal(false);
        setReason('');
        setReportType('spam');
      } else {
        alert(res?.message || 'Failed to submit report');
      }
    } catch (error) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors text-sm"
      >
        <Flag className="w-4 h-4" />
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Report Content</h3>
                <p className="text-sm text-gray-500">Help us keep the community safe</p>
              </div>
            </div>

            {/* Content Info */}
            {contentTitle && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 truncate">{contentTitle}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Report Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spam">🗑️ Spam</option>
                  <option value="harassment">⚠️ Harassment</option>
                  <option value="inappropriate">🚫 Inappropriate Content</option>
                  <option value="copyright">©️ Copyright Violation</option>
                  <option value="misinformation">📰 Misinformation</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low - General concern</option>
                  <option value="medium">Medium - Should be reviewed</option>
                  <option value="high">High - Urgent attention needed</option>
                  <option value="critical">Critical - Immediate action required</option>
                </select>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  placeholder="Please describe why you're reporting this content..."
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;
