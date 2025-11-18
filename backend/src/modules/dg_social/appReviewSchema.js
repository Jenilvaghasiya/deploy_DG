import mongoose from 'mongoose';

const appReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Review description is required'],
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

appReviewSchema.virtual('calculatedHelpfulCount').get(function() {
  return this.helpfulUsers ? this.helpfulUsers.length : 0;
});

// Pre-save middleware to update helpfulCount
appReviewSchema.pre('save', function(next) {
  if (this.helpfulUsers) {
    this.helpfulCount = this.helpfulUsers.length;
  }
  next();
});

const AppReview = mongoose.model('AppReview', appReviewSchema);

export default AppReview;