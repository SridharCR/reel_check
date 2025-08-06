import React, { useState, useContext, useEffect } from 'react';
import { analyzeContent, getAnalysisStatus, getAnalysisDetails, AuthenticationError } from 'api/api';
import { AuthContext } from 'contexts/AuthContext';
import History from './History';
import LoadingProgress from './LoadingProgress';

export const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state for analysis in progress
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null); // New state for selected analysis
  const [loading, setLoading] = useState(false); // Add loading state
  const { user, handleAuthError } = useContext(AuthContext);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);
    setTaskId(null);
    setAnalysisStatus(null);
    setAnalysisReport(null);
    setSelectedAnalysisId(null); // Clear selected analysis when starting a new one
    if (!url) {
      setError('Please enter a URL.');
      return;
    }
    setIsAnalyzing(true); // Set analyzing state to true
    try {
      const data = await analyzeContent(url);
      setTaskId(data.task_id);
      setAnalysisStatus('queued');
      setUrl('');
    } catch (err) {
      if (err instanceof AuthenticationError) {
        handleAuthError();
      } else {
        setError(err.message || 'Failed to trigger analysis.');
      }
      setIsAnalyzing(false); // Reset analyzing state on error
    }
  };

  const handleStopAnalysis = () => {
    // Clear all relevant states to stop polling and hide progress
    setTaskId(null);
    setAnalysisStatus(null);
    setAnalysisReport(null);
    setError(null);
    setIsAnalyzing(false); // Show the form again
    setSelectedAnalysisId(null); // Clear selected analysis
  };

  const handleViewDetails = (analysisId) => {
    setSelectedAnalysisId(analysisId);
    setAnalysisReport(null); // Clear previous report
    setIsAnalyzing(false); // Ensure analysis form is hidden
  };

  const handleCloseReport = () => {
    setAnalysisReport(null);
    setSelectedAnalysisId(null);
  };

  useEffect(() => {
    let interval;
    if (taskId && analysisStatus !== 'completed') {
      interval = setInterval(async () => {
        try {
          const statusData = await getAnalysisStatus(taskId);
          if (statusData.status === 'completed' || statusData.status === 'failed') {
            clearInterval(interval);
            if (statusData.status === 'completed') {
              const analysisReport = await getAnalysisDetails(statusData.id);
              setAnalysisReport(analysisReport);
            } else {
              setError(statusData.error_message || 'Analysis failed.');
            }
            setIsAnalyzing(false); // Analysis finished, show form again
          }
        } catch (err) {
          console.error('Error polling status:', err);
          if (err instanceof AuthenticationError) {
            handleAuthError();
          } else {
            setError(err.message || 'Failed to get analysis status.');
          }
          clearInterval(interval);
          setIsAnalyzing(false); // Reset analyzing state on error
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [taskId, analysisStatus]);

  useEffect(() => {
    const fetchAnalysisDetails = async () => {
      if (selectedAnalysisId) {
        try {
          setLoading(true); // Assuming you have a loading state in Dashboard as well
          const report = await getAnalysisDetails(selectedAnalysisId);
          setAnalysisReport(report);
        } catch (err) {
          if (err instanceof AuthenticationError) {
            handleAuthError();
          } else {
            setError(err.message || 'Failed to fetch analysis details.');
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAnalysisDetails();
  }, [selectedAnalysisId]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-gray-100">Welcome, {user?.email || 'User'}!</h2>
      {!isAnalyzing && !analysisReport && (
        <form onSubmit={handleAnalyze} className="space-y-4 mb-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reel/Short URL</label>
            <input
              type="url"
              id="url"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL here"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out"
          >
            Analyze
          </button>
        </form>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {isAnalyzing && (
        <div className="mb-4 relative">
          <LoadingProgress status={analysisStatus} />
          <button
            onClick={handleStopAnalysis}
            className="absolute top-0 right-0 mt-2 mr-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Stop Analysis"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {analysisReport && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mt-8 border border-gray-200 dark:border-gray-700 relative">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Analysis Report</h3>
          <button
            onClick={handleCloseReport}
            className="absolute top-4 right-4 p-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Close Report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{analysisReport.report}</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Overall Score: <span className="text-blue-600 dark:text-blue-400">{analysisReport.factual_report_json.overall_score}</span></p>
          <h4 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Claims:</h4>
          {analysisReport.claims.map((claim, index) => {
            const scoreColorClass =
              claim.score >= 80
                ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100'
                : claim.score >= 50
                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                : 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100';

            return (
              <div key={index} className="mb-4 p-5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-base">Claim: {claim.claim}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 leading-snug">
                  <span className="font-medium">Evidence:</span> {claim.evidence_summary}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Score:</span>
                  </p>
                  <span className={`px-4 py-1 rounded-full text-sm font-bold ${scoreColorClass}`}>
                    {claim.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <History handleViewDetails={handleViewDetails} />
    </div>
  );
};
