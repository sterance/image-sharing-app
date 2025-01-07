import React from 'react';

function Image({ image }) {
    return (
        <div className="image-container">
            <img src={`/uploads/${image.image_path}`} alt={image.name || 'Image'} />
            <h3>{image.name || 'No Name'}</h3>
            <p>Uploaded by: {image.username}</p>
            <p>{image.description}</p>
            <div className='tags'>
              {image.tags && image.tags.map((tag, index) => (
                <span key={index}>{tag} </span>
              ))}
            </div>
        </div>
    );
}

export default Image;