import { useCallback, useEffect, useState } from 'react';
import { ReportsAPI } from '../../../../../services/apiClient';
import { useAuth } from '../../../../../contexts/AuthContext';
import { REGION_FILTERS, DATE_RANGE_FILTERS, EXPORT_FORMATS } from '../constants';

const STATUS_FALLBACK = {
  queued: 'pending',
  ready: 'passed',
};

function readableTitle(reportType) {
  if (!reportType) return 'Report';
  return reportType
    .replace(/^analytics_/, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function mapReportRow(row) {
  const params = row?.params_json || {};
  return {
    id: row?.id,
    title: row?.title || readableTitle(row?.report_type),
    subtitle: `${(row?.format || 'pdf').toUpperCase()} • ${(row?.created_at || '').slice(0, 10) || 'recently'}`,
    status: STATUS_FALLBACK[row?.status] || row?.status || 'pending',
    purity: typeof params.purity_percentage === 'number' ? params.purity_percentage : null,
    herbType: params.herb_type || row?.report_type || 'Herb',
    region: params.region || 'All Regions',
    testDate: (row?.created_at || '').slice(0, 10),
    farmer: params.farmer || 'Lab',
    labTechnician: params.lab_technician || '',
    fileUrl: row?.file_url,
    fileName: row?.file_name,
    rowCount: row?.row_count ?? 0,
    createdAt: row?.created_at,
  };
}

function reportTypeFor(title) {
  const value = String(title || '').toLowerCase();
  if (value.includes('contaminant')) return 'contaminant_trends';
  if (value.includes('purity')) return 'herb_purity_breakdown';
  if (value.includes('heatmap')) return 'quality_heatmap';
  if (value.includes('compliance')) return 'compliance_report';
  if (value.includes('batch')) return 'batch_analysis';
  return 'batch_analysis';
}

export function useReportsData() {
  const { accessToken: token } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = useCallback(async () => {
    if (!token) {
      setReports([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await ReportsAPI.list(token);
      const rows = res?.rows || (Array.isArray(res) ? res : []);
      setReports(rows.map(mapReportRow));
    } catch (error) {
      console.log('Failed to load reports', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const getReportById = useCallback(
    (reportId) => reports.find((report) => report.id === reportId) || null,
    [reports],
  );

  const addReport = useCallback(
    async (nextReport) => {
      try {
        const res = await ReportsAPI.generate(token, {
          report_type: nextReport?.report_type || 'batch_analysis',
          format: nextReport?.format || 'pdf',
          title: nextReport?.title,
          params_json: nextReport?.params_json || {},
        });
        console.log('Added report', res?.report?.id);
        await loadReports();
      } catch (error) {
        console.log('Failed to add report', error);
      }
    },
    [token, loadReports],
  );

  const updateReport = useCallback(async (reportId, updates) => {
    console.log('Update report', reportId, updates);
    setReports((prev) =>
      prev.map((report) => (report.id === reportId ? { ...report, ...updates } : report)),
    );
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    console.log('Delete report', reportId);
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }, []);

  return { reports, isLoading, setIsLoading, getReportById, addReport, updateReport, deleteReport };
}

export function useReportsFilters() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(REGION_FILTERS[0]);
  const [selectedDateRange, setSelectedDateRange] = useState(DATE_RANGE_FILTERS[0]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedRegion(REGION_FILTERS[0]);
    setSelectedDateRange(DATE_RANGE_FILTERS[0]);
    setSelectedStatus('all');
  }, []);

  const applyFilters = useCallback(
    (reports) =>
      (reports || []).filter((report) => {
        const matchesSearch =
          !searchQuery ||
          `${report.title || ''} ${report.herbType || ''}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesRegion =
          selectedRegion === 'All Regions' || report.region === selectedRegion;
        const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
        return matchesSearch && matchesRegion && matchesStatus;
      }),
    [searchQuery, selectedRegion, selectedStatus],
  );

  return {
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    selectedDateRange,
    setSelectedDateRange,
    selectedStatus,
    setSelectedStatus,
    resetFilters,
    applyFilters,
  };
}

export function useReportsActions(chartData) {
  const { accessToken: token } = useAuth();
  const { loadReports } = useReportsData();

  const createReport = useCallback(
    async (reportType, format, title) => {
      try {
        const res = await ReportsAPI.generate(token, {
          report_type: reportType,
          format: format || 'pdf',
          title,
          params_json: {
            source: chartData ? 'live' : 'request',
          },
        });
        console.log('Created report', res?.report?.id);
        await loadReports();
      } catch (error) {
        console.log('Failed to create report', error);
      }
    },
    [token, loadReports, chartData],
  );

  const handleGenerateChart = useCallback(
    (type) => createReport(reportTypeFor(type), 'pdf', `${type} Chart`),
    [createReport],
  );

  const handleGenerateReport = useCallback(
    (type) => createReport(reportTypeFor(type), 'pdf', `${type} Report`),
    [createReport],
  );

  const handleViewHeatmap = useCallback(
    () => createReport('quality_heatmap', 'pdf', 'Region-wise Quality Heatmap'),
    [createReport],
  );

  const handleSearchArchive = useCallback((query) => {
    console.log('Search report archive', query);
  }, []);

  const handleViewReport = useCallback((report) => {
    console.log('View report', report?.id);
  }, []);

  const handleDownloadReport = useCallback(
    async (reportId) => {
      try {
        const res = await ReportsAPI.download(token, reportId);
        console.log('Download ready', res?.download_url || res?.file_url || 'Report not ready');
      } catch (error) {
        console.log('Download failed', error);
      }
    },
    [token],
  );

  const handleShareReport = useCallback((report) => {
    console.log('Share report', report?.id);
  }, []);

  const handleExportPDF = useCallback(
    () => createReport('export', 'pdf', 'Generated export'),
    [createReport],
  );

  const handleExportExcel = useCallback(
    () => createReport('export', 'excel', 'Generated export'),
    [createReport],
  );

  const handleShareWithAYUSH = useCallback((report) => {
    console.log('Share with AYUSH', report?.id);
  }, []);

  return {
    handleGenerateChart,
    handleGenerateReport,
    handleViewHeatmap,
    handleSearchArchive,
    handleViewReport,
    handleDownloadReport,
    handleShareReport,
    handleExportPDF,
    handleExportExcel,
    handleShareWithAYUSH,
  };
}

export function useReportsTabs() {
  const [activeTab, setActiveTab] = useState('reports');
  const [tabs] = useState([
    { id: 'reports', label: 'Reports', icon: 'bar-chart' },
    { id: 'history', label: 'History', icon: 'history' },
  ]);

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, setActiveTab, tabs, switchTab };
}

export default useReportsData;