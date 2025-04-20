const API_BASE_URL = 'https://moodle-backend-latest.onrender.com/';

export const api = {
  async loginFetch(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/loginFetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to login and fetch data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login Fetch Error:', error);
      throw error;
    }
  },
  
  async checkSubmissions(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/checkSubmissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check submissions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Check Submissions Error:', error);
      throw error;
    }
  },
  
  async generateDocuments(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/generateDocuments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate documents');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Generate Documents Error:', error);
      throw error;
    }
  },
};