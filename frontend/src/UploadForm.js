import React, { useState } from 'react';

function UploadForm({ onUpload }) {
    const [image, setImage] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('image', image);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('tags', tags);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Upload successful:', data);
            setName('');
            setDescription('');
            setTags('');
            setImage(null);
            onUpload(); // Refresh image list
        } catch (error) {
            console.error('Upload error:', error);
            alert(error.message)
        }
    };

    return (
        <div>
            <h2>Upload Image</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} required/>
                <input type="text" placeholder="Image Name" value={name} onChange={(e) => setName(e.target.value)} required/>
                <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} required/>
                <button type="submit">Upload</button>
            </form>
        </div>
    );
}

export default UploadForm;