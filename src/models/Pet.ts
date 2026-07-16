import { z } from 'zod';
import { ObjectId } from 'mongodb';

export const PetSchema = z.object({
  title: z.string().min(5).max(100),
  slug: z.string().optional(),
  petName: z.string().min(2).max(50),
  category: z.string().min(2),
  breed: z.string().min(2),
  age: z.string(),
  gender: z.enum(['Male', 'Female', 'Unknown']),
  weight: z.string(),
  color: z.string(),
  vaccinated: z.boolean(),
  neutered: z.boolean(),
  healthCondition: z.string(),
  adoptionFee: z.number().min(0),
  location: z.string(),
  images: z
    .array(z.string().trim().min(1).url("Each image must be a valid URL"))
    .min(1, "At least one image is required"),
  shortDescription: z.string().max(200),
  description: z.string().min(20),
  isFeatured: z.boolean().default(false),
  adoptionStatus: z.enum(['Available', 'Pending', 'Adopted']).default('Available'),
  
  // User Information (copied from Better Auth user)
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  userPhoto: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type PetInput = z.infer<typeof PetSchema>;

export interface Pet extends PetInput {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
