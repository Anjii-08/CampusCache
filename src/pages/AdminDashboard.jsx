import React, { useContext, useEffect, useState } from 'react';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

// Configure axios defaults for all requests
axios.defaults.withCredentials = true;

const AdminDashboard = () => {
  const { backendUrl, userData, isLoggedin, getUserData, isLoading } = useContext(AppContent);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [contentMap, setContentMap] = useState({});

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      // Wait for the initial auth check to complete
      if (isLoading) {
        return;
      }

      // After loading, check login status
      if (!isLoggedin) {
        navigate('/login');
        return;
      }

      if (!userData) {
        try {
          await getUserData();
        } catch (error) {
          console.error('Failed to get user data:', error);
          setIsCheckingAuth(false);
        }
        return;
      }

      if (userData?.role !== 'Admin') {
        toast.error('Admin access required');
        navigate('/');
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [userData, isLoggedin, navigate, getUserData]);

  const handleAuthError = (error) => {
    if (error?.response?.status === 401) {
      // Unauthorized - redirect to login
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return true;
    }
    return false;
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const endpoint = {
        pending: '/api/admin/reports/pending',
        inProcess: '/api/admin/reports/in-process'
      }[activeTab];

      const { data } = await axios.get(`${backendUrl}${endpoint}`);

      if (data.success) {
        // Set reports to empty array if no reports are found
        setReports(data.reports || data.data || []);
      } else {
        // Only show error if it's not a "no reports" situation
        const isNoReportsMessage = data.message?.toLowerCase().includes('no reports') || 
                                 data.message?.toLowerCase().includes('not found');
        if (!isNoReportsMessage) {
          toast.error(data.message || 'Failed to fetch reports');
        }
        setReports([]);
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        // Only show error for actual errors, not for missing reports
        const errorMessage = error.response?.data?.error || error.message;
        const isNoReportsError = errorMessage?.toLowerCase().includes('no reports') || 
                                errorMessage?.toLowerCase().includes('not found');
        if (!isNoReportsError) {
          toast.error(errorMessage || 'Failed to fetch reports');
        }
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth) {
      fetchReports();
    }
  }, [activeTab, isCheckingAuth]);

  // Fetch content for each report
  useEffect(() => {
    reports.forEach(report => {
      fetchContent(report);
    });
  }, [reports]);

  const handleClaim = async (contentId) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/reports/claim/${contentId}`
      );
      
      if (data.success) {
        toast.success('Report claimed successfully');
        fetchReports();
      } else {
        toast.error('Failed to claim report');
      }
    } catch (error) {
      if (!handleAuthError(error)) {
        toast.error('Failed to claim report');
      }
    }
  };

  const handleResolve = async (contentId, action) => {
    try{
      const {data} = await axios.post(`${backendUrl}/api/admin/reports/resolve/${contentId}`,{action});
      if(!data.success){
        toast.error('Failed to resolve report');
      }else{
        toast.success('Report resolved successfully');
        fetchReports();
      }
    }catch(error){
      if (!handleAuthError(error)) {
        toast.error('Failed to resolve report');
      }else{
        toast.error('Failed to resolve report');
      }
    }
  };  

  const fetchContent = async (report) => {
    try {
      if (!report.contentId || !report.contentType) {
        return 'Content information not available';
      }

      const endpoint = report.contentType === 'Question'
        ? `/api/fetch/questions/${report.contentId}`
        : `/api/fetch/answers/${report.contentId}`;

      const { data } = await axios.get(`${backendUrl}${endpoint}`);

      if (!data.success) {
        return 'Content not found';
      }

      setContentMap(prev => ({
        ...prev,
        [report.contentId]: data.content
      }));
      
    } catch (error) {
      console.error('Error fetching content:', error);
      setContentMap(prev => ({
        ...prev,
        [report.contentId]: 'Error loading content'
      }));
    }
  };

  const renderReportCard = (report) => (
    <div key={report._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Reported By:</span>
            <span className="text-sm text-gray-800">{report.reportedBy.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Content Type:</span>
            <span className="text-sm text-gray-800">{report.contentType}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Content:</span>
            <span className="text-sm text-gray-800 whitespace-pre-wrap">
              {contentMap[report.contentId] || 'Loading content...'}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-600">Reasons:</span>
            <span className="text-sm text-gray-800">{report.reasons.join(', ')}</span>
          </div>
          <p className="text-sm text-gray-700 mt-2">{report.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          {report.status === 'Pending' && (
            <button
              onClick={() => handleClaim(report.contentId)}
              className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors hover:cursor-pointer"
            >
              Claim Report
            </button>
          )}
          {report.status === 'In Progress' && (
            <>
              <button
                onClick={() => handleResolve(report.contentId, 'Content Deleted')}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors hover:cursor-pointer"
              >
                Delete Content
              </button>
              <button
                onClick={() => handleResolve(report.contentId, 'No Action Needed')}
                className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 transition-colors hover:cursor-pointer"
              >
                Mark Safe
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-400">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-900 hover:text-white border border-indigo-500 hover:border-transparent hover:cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Go to Home
          </button>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex-1 hover:cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-900 text-white'
                : 'bg-white text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-900 hover:text-white border border-indigo-500 hover:border-transparent'
            }`}
          >
            Pending Reports
          </button>
          <button
            onClick={() => setActiveTab('inProcess')}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex-1 hover:cursor-pointer ${
              activeTab === 'inProcess'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-900 text-white'
                : 'bg-white text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-900 hover:text-white border border-indigo-500 hover:border-transparent'
            }`}
          >
            In Process Reports
          </button>
        </div>

        {/* Reports Display */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-600">No {activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} reports found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => renderReportCard(report))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;