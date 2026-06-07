import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  ChevronDown, Eye, CheckCircle, Clock, AlertCircle, Loader2,
  Filter, Search, Calendar, FileText, Download, MapPin, Image as ImageIcon,
  User, Shield, Timer, Camera, XCircle
} from 'lucide-react';
import { postReportAPI, incidentTypeAPI, reportAPI } from '../../api';

const PostIncidentReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    type_id: '',
    from_date: '',
    to_date: '',
    search: ''
  });
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.relative')) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown]);

  const fetchIncidentTypes = async () => {
    try {
      const response = await incidentTypeAPI.getAll();
      setIncidentTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch incident types', error);
    }
  };

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
    setShowModal(true);
  };

  // Simplified: Acknowledge always sets status to APPROVED
  const handleAcknowledge = async () => {
    if (!selectedReport) return;
    try {
      setUpdating(true);
      await postReportAPI.updateStatus(selectedReport.report_id, {
        status: 'APPROVED',
        admin_notes: adminNotes
      });
      toast.success('Report acknowledged successfully');
      setShowModal(false);
      fetchReports();
    } catch (error) {
      console.error('Failed to acknowledge report', error);
      toast.error('Failed to acknowledge report');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportSinglePDF = async (reportId) => {
    try {
      setExporting(true);
      const response = await reportAPI.exportPostReportsPDF({
        report_id: reportId
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Incident_Report_${selectedReport.incident?.incident_code}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported as PDF');
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await reportAPI.exportPostReports({
        ...filters,
        startDate: filters.from_date,
        endDate: filters.to_date
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Post_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel report exported');
    } catch (error) {
      console.error('Export failed', error);
      toast.error('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await reportAPI.exportPostReportsPDF({
        ...filters,
        startDate: filters.from_date,
        endDate: filters.to_date
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Post_Reports_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF report exported');
    } catch (error) {
      console.error('PDF export failed', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
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
      case 'PENDING': return <Clock size={13} />;
      case 'UNDER_REVIEW': return <Loader2 size={13} className="animate-spin" />;
      case 'APPROVED': return <CheckCircle size={13} />;
      case 'REJECTED': return <AlertCircle size={13} />;
      default: return null;
    }
  };

  const handleClearFilters = () => {
    setFilters({ type_id: '', from_date: '', to_date: '', search: '' });
    setPage(1);
  };

  const fmt = (d) => d
    ? new Date(d).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

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

  // Separate reporter evidence (from incident.evidence) vs responder photos (from report.photos)
  const reporterEvidence = selectedReport?.incident?.evidence || [];
  const responderPhotos = selectedReport?.photos || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Post-Incident Reports</h1>
          <p className="text-slate-600">Review and acknowledge reports submitted after incident resolution</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <div className="text-right pr-4 border-r border-slate-200">
            <p className="text-3xl font-bold text-indigo-600">{pagination?.total || 0}</p>
            <p className="text-sm text-slate-600 uppercase tracking-wider font-bold">Total Reports</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              disabled={exporting || reports.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-bold text-sm disabled:opacity-50"
            >
              {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              Export
              <ChevronDown size={16} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-[100] animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => { handleExport(); setShowExportDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download size={14} className="text-emerald-600" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => { handleExportPDF(); setShowExportDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 font-semibold flex items-center gap-2 transition-colors"
                >
                  <FileText size={14} className="text-rose-600" />
                  PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by incident code..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <select
            value={filters.type_id}
            onChange={(e) => { setFilters({ ...filters, type_id: e.target.value }); setPage(1); }}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            <option value="">All Types</option>
            {incidentTypes.map(type => (
              <option key={type.type_id} value={type.type_id}>{type.name}</option>
            ))}
          </select>

          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => { setFilters({ ...filters, from_date: e.target.value }); setPage(1); }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => { setFilters({ ...filters, to_date: e.target.value }); setPage(1); }}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {(filters.type_id || filters.from_date || filters.to_date || filters.search) && (
          <button onClick={handleClearFilters} className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date Submitted</th>
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{fmt(report.submitted_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenModal(report)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
          <p className="text-sm text-slate-600">Page {pagination.page} of {pagination.totalPages}</p>
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

      {/* ─── DETAIL MODAL ─── */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2000]">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Post-Incident Report</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  <code className="font-mono text-indigo-600 font-bold">{selectedReport.incident?.incident_code}</code>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>
                    {getStatusIcon(selectedReport.status)}
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">

              {/* ── Section 1: Incident Overview ── */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Incident Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoCard label="Incident Type" value={selectedReport.incident?.incident_type?.name || '—'} />
                  <InfoCard label="Barangay / Location" value={selectedReport.incident?.barangay?.name || selectedReport.incident?.map_pin_address || '—'} icon={<MapPin size={13} />} />
                  <InfoCard label="Reported At" value={fmt(selectedReport.incident?.reported_at)} icon={<Clock size={13} />} />
                  <InfoCard label="Severity" value={selectedReport.incident?.severity || '—'} />
                  <InfoCard label="Status at Close" value={selectedReport.incident?.status || '—'} />
                  <InfoCard label="Reporter" value={selectedReport.incident?.reporter?.name || selectedReport.incident?.reporter_name || 'Anonymous'} icon={<User size={13} />} />
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* ── Section 2: Reporter Evidence ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Camera size={16} className="text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporter Evidence</h3>
                  <span className="ml-auto text-xs text-slate-400">{reporterEvidence.length} file{reporterEvidence.length !== 1 ? 's' : ''}</span>
                </div>

                {reporterEvidence.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                    <ImageIcon size={18} />
                    <span>No reporter photos attached to this incident.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {reporterEvidence.map((ev, idx) => (
                      <EvidenceCard
                        key={ev.evidence_id || idx}
                        src={ev.file_path}
                        fileType={ev.file_type}
                        caption={`Uploaded ${fmt(ev.uploaded_at)}`}
                        badge={selectedReport.incident?.incident_type?.name}
                        badgeColor="rose"
                        sublabel={selectedReport.incident?.barangay?.name || selectedReport.incident?.map_pin_address || null}
                        onClick={() => setLightboxImg(ev.file_path)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-slate-100" />

              {/* ── Section 3: Response Details ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response Unit Details</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <InfoCard label="Submitted By" value={selectedReport.submitter?.name || '—'} icon={<Shield size={13} />} />
                  <InfoCard label="Submitted At" value={fmt(selectedReport.submitted_at)} icon={<Clock size={13} />} />
                  <InfoCard
                    label="Response Time"
                    value={selectedReport.response_time_minutes ? `${selectedReport.response_time_minutes} min` : 'Not recorded'}
                    icon={<Timer size={13} />}
                    highlight={selectedReport.response_time_minutes ? 'indigo' : null}
                  />
                  <InfoCard label="Casualties" value={selectedReport.casualties ?? 0} />
                  <InfoCard label="Damages Estimate" value={selectedReport.damages_estimate || 'Not reported'} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions Taken</p>
                  <p className="text-sm text-slate-800 bg-indigo-50 border border-indigo-100 rounded-xl p-4 leading-relaxed">
                    {selectedReport.actions_taken}
                  </p>
                </div>

                {selectedReport.remarks && (
                  <div className="space-y-2 mt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Additional Remarks</p>
                    <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                      {selectedReport.remarks}
                    </p>
                  </div>
                )}
              </section>

              {/* ── Section 4: Response Unit Photos ── */}
              {responderPhotos.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Camera size={16} className="text-indigo-500" />
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response Unit Photos</h3>
                      <span className="ml-auto text-xs text-slate-400">{responderPhotos.length} file{responderPhotos.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {responderPhotos.map((photoUrl, idx) => (
                        <EvidenceCard
                          key={idx}
                          src={photoUrl}
                          fileType="image"
                          caption={`Submitted with report`}
                          badge={selectedReport.response_time_minutes ? `${selectedReport.response_time_minutes}m response` : null}
                          badgeColor="indigo"
                          sublabel={fmt(selectedReport.submitted_at)}
                          onClick={() => setLightboxImg(photoUrl)}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              <hr className="border-slate-100" />

              {/* ── Section 5: Admin Notes ── */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Notes</h3>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add acknowledgement notes or remarks (optional)..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none h-24"
                />
              </section>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 sticky bottom-0 rounded-b-2xl">
              <button
                onClick={() => handleExportSinglePDF(selectedReport.report_id)}
                disabled={exporting}
                className="mr-auto px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Export as PDF
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-100 font-medium text-slate-700 text-sm transition-colors"
              >
                Cancel
              </button>
              {selectedReport.status !== 'APPROVED' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={updating}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
                >
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX via Portal ─── */}
      {lightboxImg && createPortal(
        <div
          className="fixed inset-0 bg-slate-950/98 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img
              src={lightboxImg}
              alt="Evidence Full"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-500 scale-in-95"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-0 right-0 sm:-top-12 sm:right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all active:scale-90 border border-white/20"
              onClick={() => setLightboxImg(null)}
              title="Close Preview"
            >
              <XCircle size={28} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Helper Components ──

const InfoCard = ({ label, value, icon, highlight }) => (
  <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 transition-all hover:bg-slate-100/50">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
      {icon}
      {label}
    </p>
    <p className={`text-[15px] font-bold ${highlight === 'indigo' ? 'text-indigo-600' : 'text-slate-800'}`}>
      {value}
    </p>
  </div>
);

const EvidenceCard = ({ src, fileType, caption, badge, badgeColor, sublabel, onClick }) => {
  const bgBadge = badgeColor === 'rose'
    ? 'bg-rose-100 text-rose-700'
    : 'bg-indigo-100 text-indigo-700';

  const isImage = fileType?.startsWith('image') || fileType === 'image' ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(src || '');

  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      {isImage ? (
        <div className="relative">
          <img
            src={src}
            alt="Evidence"
            className="w-full h-36 object-cover group-hover:brightness-90 transition-all"
          />
          {badge && (
            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${bgBadge}`}>
              {badge}
            </span>
          )}
        </div>
      ) : (
        <div className="w-full h-36 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
          <FileText size={32} />
          <span className="text-xs font-medium">Non-image file</span>
        </div>
      )}
      <div className="p-2 bg-white">
        <p className="text-[11px] text-slate-600 font-medium leading-snug">{caption}</p>
        {sublabel && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={10} />{sublabel}</p>}
      </div>
    </div>
  );
};

export default PostIncidentReports;
