from flask import Flask, jsonify, request, send_from_directory
import os
import sqlite3
import datetime
import uuid
import werkzeug
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# Create the Flask app instance
app = Flask(__name__, static_folder="frontend", static_url_path="/")
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DATABASE = 'database.db'

def get_db_connection():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        if conn:
            conn.close()
        return None

def create_tables():
    conn = get_db_connection()
    if conn is None:
        return

    cursor = conn.cursor()

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS images (
                image_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                image_path TEXT NOT NULL,
                name TEXT,
                description TEXT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
                tag_name TEXT UNIQUE NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS image_tags (
                image_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (image_id, tag_id),
                FOREIGN KEY (image_id) REFERENCES images(image_id),
                FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS votes (
                user_id INTEGER NOT NULL,
                image_id INTEGER NOT NULL,
                vote_value INTEGER NOT NULL,
                PRIMARY KEY (user_id, image_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                FOREIGN KEY (image_id) REFERENCES images(image_id)
            )
        """)
        conn.commit()
        print("Tables created (if they didn't exist)")

    except sqlite3.Error as e:
        print(f"Error creating tables: {e}")
        conn.rollback() # Important: Rollback on error to avoid partial table creation

    finally:
        conn.close()


# Define HTML routes
@app.route('/', methods=['GET'])
def index():
    return "Welcome to the Image Sharing App!"

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor()

    try:
        # Check if username already exists
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            conn.close()
            return jsonify({'error': 'Username already exists'}), 400

        hashed_password = generate_password_hash(password)
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'message': 'User registered successfully'}), 201

    except sqlite3.Error as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            return jsonify({'message': 'Login successful', 'username': username, 'user_id': user['user_id']}), 200
        else:
            return jsonify({'error': 'Invalid username or password'}), 401

    except sqlite3.Error as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    image = request.files['image']
    name = request.form.get('name')
    description = request.form.get('description')
    tags_string = request.form.get('tags')

    if image.filename == '':
        return jsonify({'error': 'No selected image'}), 400

    if image:
        try:
            filename = secure_filename(str(uuid.uuid4()) + "_" + image.filename) #Generate unique filename
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            conn = get_db_connection()
            if conn is None:
                return jsonify({'error': 'Database connection failed'}), 500

            cursor = conn.cursor()
            user_id = 1 #Get this from the user's session once authentication is implemented on the front end

            cursor.execute("INSERT INTO images (user_id, image_path, name, description) VALUES (?, ?, ?, ?)", (user_id, filename, name, description))
            conn.commit()

            image_id = cursor.lastrowid

            if tags_string:
                tags = [tag.strip() for tag in tags_string.split(',')]
                for tag in tags:
                    cursor.execute("INSERT OR IGNORE INTO tags (tag_name) VALUES (?)", (tag,))
                    cursor.execute("SELECT tag_id FROM tags WHERE tag_name=?", (tag,))
                    tag_id = cursor.fetchone()['tag_id']
                    cursor.execute("INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)", (image_id, tag_id))
                conn.commit()

            conn.close()


            return jsonify({'message': 'Image uploaded successfully'}), 201
        except Exception as e:
            conn.rollback()
            conn.close()
            print(e)
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'An unknown error has occurred'}), 500

@app.route('/images', methods=['GET'])
def get_images():
    tag_name = request.args.get('tag')  # Get the tag from the query parameters

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        query = """
            SELECT 
                images.image_id, 
                images.image_path, 
                images.name, 
                images.description,
                users.username,
                GROUP_CONCAT(tags.tag_name) AS tags
            FROM images
            JOIN users ON images.user_id = users.user_id
            LEFT JOIN image_tags ON images.image_id = image_tags.image_id
            LEFT JOIN tags ON image_tags.tag_id = tags.tag_id
        """
        params = ()

        if tag_name: #Add the filter if a tag is provided
            query += " WHERE tags.tag_name = ?"
            params = (tag_name,)

        query += " GROUP BY images.image_id"
        cur.execute(query, params)

        images = cur.fetchall()
        cur.close()
        conn.close()

        image_list = []
        for image in images:
            image_list.append(dict(image))
        return jsonify(image_list), 200

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                images.image_id, 
                images.image_path, 
                images.name, 
                images.description,
                users.username,
                GROUP_CONCAT(tags.tag_name) AS tags
            FROM images
            JOIN users ON images.user_id = users.user_id
            LEFT JOIN image_tags ON images.image_id = image_tags.image_id
            LEFT JOIN tags ON image_tags.tag_id = tags.tag_id
            GROUP BY images.image_id
        """)
        images = cur.fetchall()
        cur.close()
        conn.close()

        image_list = []
        for image in images:
            image_list.append(dict(image))
        return jsonify(image_list), 200

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/images/<int:image_id>/vote', methods=['POST'])
def vote(image_id):
    data = request.get_json()
    vote_value = data.get('vote') # -1 for downvote, 1 for upvote
    user_id = 1 # Replace with getting user_id from session

    if vote_value not in [-1, 1]:
        return jsonify({'error': 'Invalid vote value'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cur = conn.cursor()

        # Check if the user has already voted on this image
        cur.execute("SELECT * FROM votes WHERE user_id = ? AND image_id = ?", (user_id, image_id))
        existing_vote = cur.fetchone()

        if existing_vote:
            # Update the existing vote
            cur.execute("UPDATE votes SET vote_value = ? WHERE user_id = ? AND image_id = ?", (vote_value, user_id, image_id))
        else:
            # Insert a new vote
            cur.execute("INSERT INTO votes (user_id, image_id, vote_value) VALUES (?, ?, ?)", (user_id, image_id, vote_value))

        conn.commit()
        conn.close()
        return jsonify({'message': 'Vote recorded successfully'}), 200

    except sqlite3.Error as e:
        conn.rollback()
        conn.close()
        print(e)
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    create_tables()
    app.run(debug=True, host='0.0.0.0', port=5000)