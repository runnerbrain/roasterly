import mongoose, { Schema, models, model } from 'mongoose';

const GreenBeanSchema = new Schema({
  country: { type: String, required: true },
  region: { type: String, required: true },
  process: { 
    type: String, 
    enum: ['Natural', 'Washed', 'Honey', 'Wet-Hulled', 'Other'],
    default: 'Natural'
  },
  purchaseDate: { type: Date, required: true },
  totalWeight: { type: Number, required: true }, // in grams
  createdAt: { type: Date, default: Date.now }
});

const GreenBean = models.GreenBean || model('GreenBean', GreenBeanSchema, 'green_beans');

export default GreenBean;
