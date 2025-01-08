import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Image from './Image';

function ImageList() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTag, setSelectedTag] = useState(null);

    useEffect(() => {
        const fetchImages = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = selectedTag ? { tag: selectedTag } : {};
                const response = await axios.get('http://localhost:5000/images', { params });
                setImages(response.data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [selectedTag]);

    const handleTagClick = (tag) => {
        setSelectedTag(tag);
    };

    const handleClearFilter = () => {
        setSelectedTag(null);
    };

    if (loading) return <div>Loading images...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (images.length === 0) return <div>No images found.</div>

    return (
        <div>
            {selectedTag && <button onClick={handleClearFilter}>Clear Filter</button>}
            <div className="image-list">
                {images.map((image) => (
                    <Image key={image.image_id} image={image} onTagClick={handleTagClick} />
                ))}
            </div>
        </div>
    );
}

export default ImageList;