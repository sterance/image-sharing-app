import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
import ImageList from './ImageList';
import UploadForm from './UploadForm';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './App.css';

function App() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tag = searchParams.get("tag")

    const handleUpload = () => {
        // Force a re-render by updating the search params
        setSearchParams({})
    }

    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/upload">Upload</Link>
                        </li>
                        <li>
                            <Link to="/login">Login</Link>
                        </li>
                        <li>
                            <Link to="/register">Register</Link>
                        </li>
                    </ul>
                </nav>
                <Routes>
                    <Route path="/" element={<ImageList tag={tag} />} />
                    <Route path="/upload" element={<UploadForm onUpload={handleUpload} />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;