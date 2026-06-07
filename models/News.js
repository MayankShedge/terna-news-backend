const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['placement', 'tech-event', 'cultural-event', 'cutoff'],
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    ratings: [ratingSchema],
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    averageRating: {
      type: Number,
      required: true,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const News = mongoose.model('News', newsSchema);
module.exports = News;