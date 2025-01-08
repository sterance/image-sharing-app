import React, { useState, useEffect } from 'react';
import Image from './Image';

function ImageList({ tag }) { // Add tag prop for filtering
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchImages = async () => {
            let url = 'http://localhost:5000/images'; // Absolute URL
            if (tag) {
                url += `?tag=${tag}`; // Add tag query parameter if tag is provided
            }
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setImages(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, [tag]); // Add tag to the dependency array

    if (loading) return <div>Loading images...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="image-list">
            {images.map(image => (
                <Image key={image.image_id} image={image} />
            ))}
        </div>
    );
}

export default ImageList;