import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { DownloadIcon } from '../icons/DownloadIcon';
import { api } from '../../services/api';

const GeneratedDocsList = () => {
  const { 
    user, 
    isLoading, 
    setIsLoading,
    setError,
    generatedDocuments,
    setGeneratedDocuments
  } = useAppContext();

  useEffect(() => {
    const fetchGeneratedDocs = async () => {
      if (generatedDocuments.length === 0) {
        setIsLoading(true);
        try {
          const { username, password, NAME, UID, key } = user;
          const data = await api.generateDocuments({ username, password, NAME, UID, key });
          setGeneratedDocuments(data.generatedDocuments);
        } catch (error) {
          setError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchGeneratedDocs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">Fetching generated documents...</p>
      </div>
    );
  }

  // Group documents by courseId
  const docsByCourse = generatedDocuments.reduce((acc, doc) => {
    if (!acc[doc.courseId]) {
      acc[doc.courseId] = {
        courseTitle: doc.courseTitle,
        documents: []
      };
    }
    acc[doc.courseId].documents.push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Generated Documents</h2>
      
      {Object.entries(docsByCourse).length === 0 ? (
        <Card className="text-center p-6">
          <p className="text-gray-600 mb-4">No documents have been generated yet.</p>
        </Card>
      ) : (
        Object.entries(docsByCourse).map(([courseId, courseData]) => (
          <Card key={courseId} title={courseData.courseTitle.replace(/\n\s+/g, ' ')}>
            <div className="space-y-4">
              <div className="flex justify-between pb-2 border-b">
                <span className="font-medium text-gray-700">Course ID: {courseId}</span>
                <span className="bg-teal-100 text-teal-800 py-1 px-3 rounded-full text-sm">
                  {courseData.documents.length} Documents
                </span>
              </div>
              
              <ul className="divide-y">
                {courseData.documents.map((doc, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{doc.title}</h4>
                      <a 
                        href={doc.url}
                        download
                        className="flex items-center text-teal-600 hover:text-teal-800"
                      >
                        <DownloadIcon className="w-5 h-5 mr-1" />
                        <span>Download</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default GeneratedDocsList;