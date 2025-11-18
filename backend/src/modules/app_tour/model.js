import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userTourSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    projectTour: {
      type: Boolean,
      default: false, // false means not completed
    },
    galleryTour: {
      type: Boolean,
      default: false,
    },
    variationsTour: {
      type: Boolean,
      default: false,
    },
    postListTour: {
      type: Boolean,
      default: false,
    },
    viewPostTour: {
      type: Boolean,
      default: false,
    },
    imageEditorTour: {
      type: Boolean,
      default: false,
    },
    combineImagesTour: {
      type: Boolean,
      default: false,
    },
    sizeChartTour: {
      type: Boolean,
      default: false,
    },
    broadCastMessageTour: {
      type: Boolean,
      default: false,
    },
    directMessagesTour: {
      type: Boolean,
      default: false,
    },
    moodBoardTour: {
      type: Boolean,
      default: false,
    },
    textToSketchTour: {
      type: Boolean,
      default: false,
    }
    // Add more tours here as needed
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export default model("UserTour", userTourSchema);
