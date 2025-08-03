import React, { useState, useContext, useEffect } from 'react';
import { analyzeContent, getAnalysisStatus, getAnalysisDetails } from 'api/api';
import { AuthContext } from 'contexts/AuthContext';
import History from './History';
import LoadingProgress from './LoadingProgress';

const Dashboard = () => {
  const [url, setUrl] = useState('');
  const [taskId, setTaskId] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisReport, setAnalysisReport] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);
    setTaskId(null);
    setAnalysisStatus(null);
    setAnalysisReport(null);
    if (!url) {
      setError('Please enter a URL.');
      return;
    }
    try {
      const token = await new Promise(resolve => {
        chrome.storage.local.get(['token'], (result) => {
          resolve(result.token);
        });
      });
      const data = await analyzeContent(url, token);
      setTaskId(data.task_id);
      setAnalysisStatus('queued');
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to trigger analysis.');
    }
  };

  useEffect(() => {
    let interval;
    if (taskId && analysisStatus !== 'completed') {
      interval = setInterval(async () => {
        try {
          const token = await new Promise(resolve => {
            chrome.storage.local.get(['token'], (result) => {
              resolve(result.token);
            });
          });
          const statusData = await getAnalysisStatus(taskId, token);
          setAnalysisStatus(statusData.status);
          if (statusData.status === 'completed') {
            clearInterval(interval);
            // Call getAnalysisDetails to fetch the full analysis report
            const analysisReport = await getAnalysisDetails(statusData.id, token);
            setAnalysisReport(analysisReport);
          }
        } catch (err) {
          console.error('Error polling status:', err);
          setError(err.message || 'Failed to get analysis status.');
          clearInterval(interval);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [taskId, analysisStatus]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Welcome, {user?.email || 'User'}!</h2>
      <form onSubmit={handleAnalyze} className="space-y-4 mb-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reel/Short URL</label>
          <input
            type="url"
            id="url"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL here"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Analyze
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {taskId && analysisStatus && !analysisReport && (
        <div className="mb-4">
          <LoadingProgress status={analysisStatus} />
          {analysisStatus === 'completed' && (
            <p className="text-center text-green-600 mt-2">Analysis complete! Check history for details.</p>
          )}
        </div>
      )}

      {analysisReport && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md shadow-md mt-6">
          <h3 className="text-lg font-bold mb-2">Analysis Report</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{analysisReport.report}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Overall Score: {analysisReport.overall_score}</p>
          <h4 className="text-md font-semibold mb-2">Claims:</h4>
          {analysisReport.claims.map((claim, index) => {
            const scoreColorClass =
              claim.score >= 80
                ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100'
                : claim.score >= 50
                ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                : 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100';

            return (
              <div key={index} className="mb-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Claim: {claim.claim}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">Evidence:</span> {claim.evidence_summary}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Score:</span>
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${scoreColorClass}`}>
                    {claim.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <History />
    </div>
  );
};

export default Dashboard;
