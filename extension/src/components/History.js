import React, { useEffect, useState, useContext } from 'react';
import { getAnalysisHistory, getAnalysisStatus, AuthenticationError } from 'api/api';
import { AuthContext } from 'contexts/AuthContext';

const History = ({ handleViewDetails }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5; // Display 5 items per page
  const { user, handleAuthError } = useContext(AuthContext);

  const fetchHistory = async (page) => {
    try {
      setLoading(true);
      const skip = (page - 1) * itemsPerPage;
      const data = await getAnalysisHistory(skip, itemsPerPage);
      setHistory(data.analyses);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (err) {
      if (err instanceof AuthenticationError) {
        handleAuthError();
      } else {
        setError(err.message || 'Failed to fetch history.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [user, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600 dark:text-gray-400">Loading history...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Past Analyses</h3>
      {history.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No past analyses found.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm flex justify-between items-center border border-gray-200 dark:border-gray-700 transition duration-200 ease-in-out hover:shadow-md">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">URL: {item.video.url}</p>
                  <p className={`text-sm ${item.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>Status: {item.status}</p>
                </div>
                <button
                  onClick={() => handleViewDetails(item.id)}
                  className="ml-4 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition duration-200 ease-in-out shadow-md"
                >
                  View Details
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default History;
