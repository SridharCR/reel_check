import React, { useEffect, useState, useContext } from 'react';
import { getAnalysisHistory, getAnalysisStatus } from 'api/api';
import { AuthContext } from 'contexts/AuthContext';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = await new Promise(resolve => {
          chrome.storage.local.get(['token'], (result) => {
            resolve(result.token);
          });
        });
        if (!token) {
          setError('Authentication token not found.');
          setLoading(false);
          return;
        }
        const data = await getAnalysisHistory(token);
        setHistory(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return <div className="text-center text-gray-600 dark:text-gray-400">Loading history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Past Analyses</h3>
      {history.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No past analyses found.</p>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li key={item.analysis_id} className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">URL: {item.url}</p>
                <p className={`text-sm ${item.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>Status: {item.status}</p>
              </div>
              <button
                onClick={() => console.log('View details for:', item.analysis_id)}
                className="ml-4 py-1 px-3 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                View Details
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
