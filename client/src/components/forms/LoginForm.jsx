// src/components/forms/LoginForm.jsx
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { api } from '../../services/api';

const LoginForm = () => {
  const { 
    user, 
    setUser, 
    setIsLoading, 
    setError, 
    setCourses,
    setCurrentStep 
  } = useAppContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginFetch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { username, password } = user;
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      const data = await api.loginFetch({ username, password });
      setCourses(data.courses);
      setCurrentStep(2);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Login & Fetch Courses" className="max-w-md mx-auto">
      <form onSubmit={handleLoginFetch}>
        <Input 
          name="username" 
          label="Username" 
          value={user.username} 
          onChange={handleChange} 
          placeholder="Enter your Moodle username" 
          required 
        />

        <Input 
          type="password" 
          name="password" 
          label="Password" 
          value={user.password} 
          onChange={handleChange} 
          placeholder="Enter your Moodle password" 
          required 
          autoComplete="current-password"
        />

        <Input 
          name="NAME" 
          label="Full Name" 
          value={user.NAME} 
          onChange={handleChange} 
          placeholder="Enter your full name" 
          required 
        />

        <Input 
          name="UID" 
          label="UID" 
          value={user.UID} 
          onChange={handleChange} 
          placeholder="Enter your UID" 
          required 
        />

        <Input 
          name="key" 
          label="API Key" 
          value={user.key} 
          onChange={handleChange} 
          placeholder="API Key (pre-filled)" 
        />

        <div className="mt-6">
          <Button type="submit" className="w-full">
            Login & Fetch Courses
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LoginForm;