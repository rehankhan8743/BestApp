import { useState, useEffect } from 'react';
import { useApiCall } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import FileUploader from '../components/FileUploader.jsx';
import {
  Upload, File, Image, Trash2, Download, Eye,
  HardDrive, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

const UploadManager = () => {
  const { call } = useApiCall();
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadUploads();
  }, [filter, sortBy]);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const res = await call('get', `/uploads?filter=${filter}&sort=${sortBy}`);
      if (res?.success) {
        setUploads(res.data.uploads || []);
        setStorageUsed(res.data.storageUsed || 0);
        setStorageLimit(res.data.storageLimit || 100 * 1024 * 1024); // 100MB default
      }
    } catch (error) {
      console.error('Failed to load uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uploadId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeleting(uploadId);
    try {
      const res = await call('delete', `/uploads/${uploadId}`);
      if (res?.success) {
        setUploads(uploads.filter(u => u._id !== uploadId));
        alert('File deleted successfully');
        loadUploads(); // Reload to update storage stats
      } else {
        alert(res?.message || 'Failed to delete file');
      }
    } catch (error) {
      alert('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadComplete = (data) => {
    loadUploads();
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <File className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{status}</span>;
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-7 h-7" />
            Upload Manager
          </h1>
          <p className="text-gray-500 mt-1">Manage your uploaded files and attachments</p>
        </div>

        {/* Storage Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Storage Usage</h2>
                <p className="text-blue-100 text-sm">{formatSize(storageUsed)} of {formatSize(storageLimit)} used</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{storagePercentage.toFixed(1)}%</div>
              <div className="text-blue-100 text-sm">Used</div>
            </div>
          </div>
          
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          
          {storagePercentage > 80 && (
            <div className="mt-3 p-3 bg-white bg-opacity-20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">You're running low on storage! Consider deleting unused files.</span>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload New Files
          </h2>
          <FileUploader 
            endpoint="/upload"
            maxSize={100}
            acceptedTypes={['image/*', 'application/pdf', 'application/zip', 'application/x-rar-compressed']}
            multiple={true}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {['all', 'images', 'documents', 'archives'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="largest">Largest First</option>
              <option value="smallest">Smallest First</option>
            </select>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Your Files ({uploads.length})</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No files uploaded yet</h3>
              <p className="text-gray-500">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {uploads.map((upload) => (
                <div key={upload._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(upload.mimeType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800 truncate">{upload.originalName}</h4>
                        {getStatusBadge(upload.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatSize(upload.size)}</span>
                        <span>•</span>
                        <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                        {upload.thread && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">Attached to: {upload.thread.title}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={upload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View/Download"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <a
                        href={upload.url}
                        download={upload.originalName}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleDelete(upload._id)}
                        disabled={deleting === upload._id}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === upload._id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadManager;
