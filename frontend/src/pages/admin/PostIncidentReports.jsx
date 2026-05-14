import React, { useState, useEffect } from 'react';
import { postReportAPI, incidentAPI } from '../../api';
import toast from 'react-hot-toast';
import {
  ChevronDown, Eye, CheckCircle, Clock, AlertCircle, Loader2,
  Filter, Search, Calendar, FileText
} from 'lucide-react';

const PostIncidentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    from_date: '',
    to_date: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, ...filters };
      const response = await postReportAPI.getAll(params);
      setReports(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      toast.error('Failed to load post-incident reports');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setNewStatus(report.status || 'PENDING');
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    try {
      setUpdating(true);
      await postReportAPI.updateStatus(selectedReport.report_id, {
        status: newStatus,
        admin_notes: adminNotes
      });
      toast.success('Report updated successfully');
      setShowModal(false);
      fetchReports();
    } catch (error) {
      console.error('Failed to update report', error);
      toast.error('Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
      UNDER_REVIEW: 'text-blue-700 bg-blue-50 border-blue-200',
      APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      REJECTED: 'text-red-700 bg-red-50 border-red-200'
    };
    return colors[status] || 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'UNDER_REVIEW':
        return <Loader2 size={16} className="animate-spin" />;
      case 'APPROVED':
        return <CheckCircle size={16} />;
      case 'REJECTED':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const handleClearFilters = () => {
    setFilters({ status: '', from_date: '', to_date: '', search: '' });
    setPage(1);
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-3" size={32} />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Post-Incident Reports</h1>
          <p className="text-slate-600">Review and approve reports submitted after incident resolution</p>
        </div>
        <div className="mt-4 sm:mt-0 text-right">
          <p className="text-3xl font-bold text-indigo-600">{pagination?.total || 0}</p>
          <p className="text-sm text-slate-600">Total Reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by incident code..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* From Date */}
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => {
                setFilters({ ...filters, from_date: e.target.value });
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => {
                setFilters({ ...filters, to_date: e.target.value });
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {(filters.status || filters.from_date || filters.to_date || filters.search) && (
          <button
            onClick={handleClearFilters}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-400 mb-3" size={32} />
            <p className="text-slate-600 font-medium">No reports found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Incident Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Submitted By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reports.map((report) => (
                  <tr key={report.report_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm font-semibold text-indigo-600">{report.incident?.incident_code}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">{report.incident?.incident_type?.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.submitter?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(report)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Report Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Incident Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Incident Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Incident Code</p>
                    <code className="font-mono text-indigo-600 font-bold">{selectedReport.incident?.incident_code}</code>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Type</p>
                    <p className="text-slate-900 font-medium">{selectedReport.incident?.incident_type?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Reported By</p>
                    <p className="text-slate-900 font-medium">{selectedReport.incident?.reporter?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Location</p>
                    <p className="text-slate-900 font-medium">{selectedReport.incident?.barangay?.name}</p>
                  </div>
                </div>
              </div>

              {/* Report Data */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Report Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Response Time</p>
                    <p className="text-slate-900 font-medium">{selectedReport.response_time_minutes || 'N/A'} minutes</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Casualties</p>
                    <p className="text-slate-900 font-medium">{selectedReport.casualties || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Submitted By</p>
                    <p className="text-slate-900 font-medium">{selectedReport.submitter?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase">Date Submitted</p>
                    <p className="text-slate-900 font-medium">{new Date(selectedReport.submitted_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions Taken */}
              <div className="space-y-2">
                <p className="text-slate-600 text-xs font-semibold uppercase">Actions Taken</p>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  {selectedReport.actions_taken}
                </p>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <p className="text-slate-600 text-xs font-semibold uppercase">Admin Notes</p>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your review notes..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none h-24"
                />
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <p className="text-slate-600 text-xs font-semibold uppercase">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                        newStatus === status
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end bg-slate-50 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium text-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {updating && <Loader2 size={16} className="animate-spin" />}
                Update Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostIncidentReports;
