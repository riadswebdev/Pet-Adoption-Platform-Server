import { z } from 'zod';
import { ObjectId } from 'mongodb';
export declare const PetSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    petName: z.ZodString;
    category: z.ZodString;
    breed: z.ZodString;
    age: z.ZodString;
    gender: z.ZodEnum<{
        Male: "Male";
        Female: "Female";
        Unknown: "Unknown";
    }>;
    weight: z.ZodString;
    color: z.ZodString;
    vaccinated: z.ZodBoolean;
    neutered: z.ZodBoolean;
    healthCondition: z.ZodString;
    adoptionFee: z.ZodNumber;
    location: z.ZodString;
    images: z.ZodArray<z.ZodString>;
    shortDescription: z.ZodString;
    description: z.ZodString;
    isFeatured: z.ZodDefault<z.ZodBoolean>;
    adoptionStatus: z.ZodDefault<z.ZodEnum<{
        Available: "Available";
        Pending: "Pending";
        Adopted: "Adopted";
    }>>;
    userId: z.ZodString;
    userName: z.ZodString;
    userEmail: z.ZodString;
    userPhoto: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export type PetInput = z.infer<typeof PetSchema>;
export interface Pet extends PetInput {
    _id?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Pet.d.ts.map