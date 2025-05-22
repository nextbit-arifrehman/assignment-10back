

import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
const app = express();
import 'dotenv/config';
const PORT = process.env.PORT || 5000;
// const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String
const MONGO_URI = `mongodb+srv://${process.env.DBUSer}:${process.env.DBPASS}@back-app.roomcj4.mongodb.net/?retryWrites=true&w=majority&appName=Back-App`;



// Connect to MongoDB
let db;

const connectToDatabase = async () => {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Default root route
app.get('/', (req, res) => {
  res.send('Welcome to the Recipe Book API!');
});


// API Routes
// Get top recipes
app.get('/api/recipes/top', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipes = await db.collection('recipes')
      .find()
      .sort({ likeCount: -1 })
      .limit(6)
      .toArray();

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching top recipes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all recipes with optional filtering
app.get('/api/recipes', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const { cuisineType } = req.query;
    const filter = cuisineType ? { cuisineType } : {};

    const recipes = await db.collection('recipes')
      .find(filter)
      .toArray();

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get a specific recipe by ID
app.get('/api/recipes/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
    }

    const recipe = await db.collection('recipes').findOne({ _id: new ObjectId(recipeId) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recipes by user ID
app.get('/api/recipes/user/:userId', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipes = await db.collection('recipes')
      .find({ userId: req.params.userId })
      .toArray();

    res.json(recipes);
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a new recipe
app.post('/api/recipes', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipe = {
      ...req.body,
      createdAt: new Date().toISOString(),
      likeCount: 0
    };

    const result = await db.collection('recipes').insertOne(recipe);

    res.status(201).json({
      success: true,
      message: 'Recipe added successfully',
      recipeId: result.insertedId
    });
  } catch (error) {
    console.error('Error adding recipe:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a recipe
app.put('/api/recipes/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
    }

    const result = await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, message: 'Recipe updated successfully' });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a recipe
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipeId = req.params.id;

    // Check if recipeId is a valid ObjectId
    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
    }

    const result = await db.collection('recipes').deleteOne({ _id: new ObjectId(recipeId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Increment like count for a recipe
app.post('/api/recipes/:id/like', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }

    const recipeId = req.params.id;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
    }

    const result = await db.collection('recipes').updateOne(
      { _id: new ObjectId(recipeId) },
      { $inc: { likeCount: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, message: 'Recipe liked successfully' });
  } catch (error) {
    console.error('Error liking recipe:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectToDatabase();
});

export default app;