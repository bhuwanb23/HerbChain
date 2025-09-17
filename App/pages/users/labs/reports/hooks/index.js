import { useState, useMemo } from 'react';
import { MOCK_REPORTS, REGION_FILTERS, DATE_RANGE_FILTERS } from '../constants';

export const useReportsData = () => {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [isLoading, setIsLoading] = useState(false);

  const filteredReports = useMemo(() => {
    return reports; // For now, return all reports
  }, [reports]);

  const getReportById = (reportId) => {
    return reports.find(report => report.id === reportId);
  };

  const addReport = (newReport) => {
    setReports(prevReports => [...prevReports, newReport]);
  };

  const updateReport = (reportId, updatedData) => {
    setReports(prevReports =>
      prevReports.map(report =>
        report.id === reportId ? { ...report, ...updatedData } : report
      )
    );
  };

  const deleteReport = (reportId) => {
    setReports(prevReports => prevReports.filter(report => report.id !== reportId));
  };

  return {
    reports: filteredReports,
    isLoading,
    setIsLoading,
    getReportById,
    addReport,
    updateReport,
    deleteReport,
  };
};

export const useReportsFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(REGION_FILTERS[0]);
  const [selectedDateRange, setSelectedDateRange] = useState(DATE_RANGE_FILTERS[0]);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRegion(REGION_FILTERS[0]);
    setSelectedDateRange(DATE_RANGE_FILTERS[0]);
    setSelectedStatus('all');
  };

  const applyFilters = (reports) => {
    return reports.filter(report => {
      const matchesSearch = searchQuery === '' || 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.herbType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = selectedRegion === 'All Regions' || 
        report.region === selectedRegion;
      
      const matchesStatus = selectedStatus === 'all' || 
        report.status === selectedStatus;

      return matchesSearch && matchesRegion && matchesStatus;
    });
  };

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
};

export const useReportsActions = () => {
  const handleGenerateChart = (type) => {
    console.log(`Generate ${type} Chart`);
    // Logic to generate chart based on type
  };

  const handleGenerateReport = (type) => {
    console.log(`Generate ${type} Report`);
    // Logic to generate report based on type
  };

  const handleViewHeatmap = () => {
    console.log('View Heatmap');
    // Logic to view heatmap
  };

  const handleSearchArchive = (filters) => {
    console.log('Searching archive with filters:', filters);
    // Logic to search archive
  };

  const handleViewReport = (reportId) => {
    console.log(`View Report for ${reportId}`);
    // Logic to view a specific report
  };

  const handleDownloadReport = (reportId) => {
    console.log(`Download Report for ${reportId}`);
    // Logic to download a specific report
  };

  const handleShareReport = (reportId) => {
    console.log(`Share Report for ${reportId}`);
    // Logic to share a specific report
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF');
    // Logic to export PDF
  };

  const handleExportExcel = () => {
    console.log('Exporting Excel');
    // Logic to export Excel
  };

  const handleShareWithAYUSH = () => {
    console.log('Sharing with AYUSH');
    // Logic to share with AYUSH
  };

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
};

export const useReportsTabs = () => {
  const [activeTab, setActiveTab] = useState('reports');

  const tabs = [
    { id: 'reports', label: 'Reports', icon: 'bar-chart' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return {
    activeTab,
    setActiveTab,
    tabs,
    switchTab,
  };
};
