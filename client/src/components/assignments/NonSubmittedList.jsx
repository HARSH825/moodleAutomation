import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { api } from '../../services/api';

const NonSubmittedList = () => {
  const { 
    user, 
    isLoading, 
    setIsLoading, 
    nonSubmittedAssignments, 
    setNonSubmittedAssignments, 
    setError,
    setCurrentStep,
    setGeneratedDocuments
  } = useAppContext();

  const [currentAction, setCurrentAction] = useState(null);

  const handleCheckSubmissions = async () => {
    setCurrentAction('checking');
    setIsLoading(true);
    
    try {
      const { username, password } = user;
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      const data = await api.checkSubmissions({ username, password });
      setNonSubmittedAssignments(data.nonSubmittedAssignments);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const handleGenerateDocuments = async () => {
    setCurrentAction('generating');
    setIsLoading(true);
    
    try {
      const { username, password, NAME, UID, key } = user;
      if (!username || !password || !NAME || !UID) {
        throw new Error('All fields are required');
      }
      
      const data = await api.generateDocuments({ username, password, NAME, UID, key });
      setGeneratedDocuments(data.generatedDocuments || []);
      //navigate
      setCurrentStep(3);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600">
          {currentAction === 'generating' 
            ? "Generating documents...Please Wait, this process might take a few minutes" 
            : "Checking for non-submitted assignments...Please Wait, this process might take a few minutes"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Non-Submitted Assignments</h2>
        <div className="space-x-3">
          <Button onClick={handleCheckSubmissions} variant="secondary">
            Check Non-Submitted
          </Button>
          <Button onClick={handleGenerateDocuments} variant="primary">
            Generate Documents
          </Button>
        </div>
      </div>

      {(!nonSubmittedAssignments || Object.keys(nonSubmittedAssignments).length === 0) ? (
        <Card className="text-center p-6">
          <p className="text-gray-600 mb-4">Click "Check Non-Submitted" to find assignments that need attention.</p>
        </Card>
      ) : (
        Object.entries(nonSubmittedAssignments).map(([courseId, courseData]) => (
          <Card key={courseId} title={courseData.courseTitle}>
            <div className="space-y-4">
              <div className="flex justify-between pb-2 border-b">
                <span className="font-medium text-gray-700">Course ID: {courseId}</span>
                <span className="bg-amber-100 text-amber-800 py-1 px-3 rounded-full text-sm">
                  {courseData.nonSubmittedCount} Non-Submitted
                </span>
              </div>
              
              <ul className="divide-y">
                {courseData.assignments.map((assignment) => (
                  <li key={assignment.id} className="py-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-500">
                          Status: {assignment.submissionStatus}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <a 
                          href={assignment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:text-teal-800"
                        >
                          View on Moodle
                        </a>
                      </div>
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

export default NonSubmittedList;