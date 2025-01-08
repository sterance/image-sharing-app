import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useSearchParams } from 'react-router-dom';
import ImageList from './ImageList';
import UploadForm from './UploadForm';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/upload">Upload</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register">Register</Link></li>
                    </ul>
                </nav>

                <Routes>
                    <Route path="/" element={<Home />} /> {/* Use a wrapper component */}
                    <Route path="/upload" element={<UploadForm />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                </Routes>
            </div>
        </Router>
    );
}

// Create a wrapper component to use useSearchParams
function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tag = searchParams.get("tag");

    const handleUpload = () => {
        setSearchParams({});
    };

    return (
        <div>
            <ImageList tag={tag} />
        </div>
    );
}

export default App;