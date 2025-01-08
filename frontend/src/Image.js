import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Image({ image, onTagClick }) {
    const imageUrl = `http://localhost:5000/uploads/${image.image_path}`;
    const [vote, setVote] = useState(0);
    const [voteCount, setVoteCount] = useState(0);
    const [message, setMessage] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        const fetchVotes = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/images/${image.image_id}/votes`);
                setVoteCount(response.data.vote_count);
            } catch (error) {
                console.error("Error fetching votes:", error);
            }
        };
        fetchVotes();
    }, [image.image_id]); // Important: Add image.image_id to dependency array

    const handleVote = async (voteValue) => {
        if (hasVoted) return;
        try {
            const response = await axios.post(`http://localhost:5000/images/${image.image_id}/vote`, { vote: voteValue });
            setMessage(response.data.message);
            setVote(voteValue);
            setVoteCount(prevCount => prevCount + voteValue);
            setHasVoted(true);
            setTimeout(() => {
                setHasVoted(false);
            }, 1000);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Voting failed');
        }
    };

    const handleTagClick = (tag) => {
        if (onTagClick) {
            onTagClick(tag);
        }
    };

    return (
        <div className="image">
            <img src={imageUrl} alt={image.name} style={{ maxWidth: '300px', maxHeight: '300px' }} />
            <h3>{image.name}</h3>
            <p>Uploaded by: {image.username}</p>
            <p>{image.description}</p>
            {image.tags && (
                <p>
                    Tags:{" "}
                    {image.tags.split(",").map((tag) => (
                        <button key={tag} onClick={() => handleTagClick(tag.trim())}>
                            {tag.trim()}
                        </button>
                    ))}
                </p>
            )}
            <div>
                <button onClick={() => handleVote(1)} disabled={hasVoted}>
                    {vote === 1 ? "Upvoted!" : "Upvote"}
                </button>
                <button onClick={() => handleVote(-1)} disabled={hasVoted}>
                    {vote === -1 ? "Downvoted!" : "Downvote"}
                </button>
                <p>Votes: {voteCount}</p> {/* Display vote count */}
                {message && <p>{message}</p>}
            </div>
        </div>
    );
}

export default Image;