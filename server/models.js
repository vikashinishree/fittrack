import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = { type: Schema.Types.ObjectId, ref: 'User', index: true };
const num = { type: Number, default: 0 };

export const User = model('User', new Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  age: Number, gender: String, height: Number, weight: Number,
  targets: {
    steps: { type: Number, default: 10000 },
    calories: { type: Number, default: 2000 },
    water: { type: Number, default: 8 },
  },
}));

export const Workout = model('Workout', new Schema({
  user: ref, name: String, type: String,
  duration: Number, calories: Number,
  date: { type: Date, default: Date.now },
}));

export const Log = model('Log', new Schema({
  user: ref, date: String,
  steps: num, caloriesIn: num, caloriesOut: num, water: num,
}).index({ user: 1, date: 1 }, { unique: true }));

// ---- Buddy Streaks (groups) ----
export const Group = model('Group', new Schema({
  name: String,
  code: { type: String, unique: true },
  members: [{ _id: false, user: { type: Schema.Types.ObjectId, ref: 'User' }, joined: String }], // joined = YYYY-MM-DD
  savedDays: [String], // days forgiven with a "streak save"
}, { timestamps: true }).index({ 'members.user': 1 }));

export const Nudge = model('Nudge', new Schema({
  group: ref, from: ref, to: ref, kind: String, date: String,
}).index({ group: 1, from: 1, to: 1, date: 1 }, { unique: true })); // one nudge per buddy per day
