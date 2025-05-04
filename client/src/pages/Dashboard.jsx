import React from 'react';
import { useAppContext } from '../context/AppContext';
import LoginForm from '../components/forms/LoginForm';
import NonSubmittedList from '../components/assignments/NonSubmittedList';
import GeneratedDocsList from '../components/assignments/GeneratedDocsList';
import { Loader } from '../components/common/Loader';

const Dashboard = () => {
  const { isLoading, error, currentStep, clearError } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Moodle Assignment Automation Tool</h1>
          <p className="mt-1 text-teal-100">Automate your assignment submissions</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={clearError}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-8">
          <ol className="flex items-center w-full">
            <li className={`flex items-center ${currentStep >= 1 ? 'text-teal-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                1
              </span>
              <span className="ml-2 text-sm font-medium">Login</span>
              <div className="w-full h-0.5 mx-4 bg-gray-200"></div>
            </li>
            <li className={`flex items-center ${currentStep >= 2 ? 'text-teal-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                2
              </span>
              <span className="ml-2 text-sm font-medium">Check Submissions</span>
              <div className="w-full h-0.5 mx-4 bg-gray-200"></div>
            </li>
            <li className={`flex items-center ${currentStep >= 3 ? 'text-teal-600' : 'text-gray-500'}`}>
              <span className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                3
              </span>
              <span className="ml-2 text-sm font-medium">Generate Docs</span>
            </li>
          </ol>
        </div>

        {isLoading && currentStep === 1 && (
          <div className="flex flex-col items-center py-12">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Logging in and fetching courses...Please wait, this process might take a few minutes</p>
          </div>
        )}

        {!isLoading && currentStep === 1 && <LoginForm />}
        {currentStep === 2 && <NonSubmittedList />}
        {currentStep === 3 && <GeneratedDocsList />}
      </main>

      <footer className="bg-gray-100 border-t">
        <div className="container mx-auto px-4 py-4 text-center text-gray-600 text-sm">
           {/* {new Date().getFullYear()}  */}
           Moodle Assignment Automation .
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;