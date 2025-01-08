import React, { useState } from 'react';
import axios from 'axios';

function Image({ image }) {
    const [vote, setVote] = useState(0); // Track current vote for user
    const [message, setMessage] = useState(null);

    const handleVote = async (voteValue) => {
        try {
            const response = await axios.post(`http://localhost:5000/images/${image.image_id}/vote`, { vote: voteValue });
            setMessage(response.data.message);
            setVote(voteValue); // Update the local vote state
        } catch (error) {
            setMessage(error.response?.data?.error || 'Voting failed');
        }
    };

    return (
        <div className="image">
            <img src={`http://localhost:5000/uploads/${image.image_path}`} alt={image.name} />
            <h3>{image.name}</h3>
            <p>Uploaded by: {image.username}</p>
            <p>{image.description}</p>
            {image.tags && <p>Tags: {image.tags}</p>}
            <div>
                <button onClick={() => handleVote(1)} disabled={vote === 1}>Upvote</button>
                <button onClick={() => handleVote(-1)} disabled={vote === -1}>Downvote</button>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
}

export default Image;