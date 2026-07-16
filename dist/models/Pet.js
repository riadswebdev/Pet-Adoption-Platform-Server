"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSchema = void 0;
const zod_1 = require("zod");
exports.PetSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(100),
    slug: zod_1.z.string().optional(),
    petName: zod_1.z.string().min(2).max(50),
    category: zod_1.z.string().min(2),
    breed: zod_1.z.string().min(2),
    age: zod_1.z.string(),
    gender: zod_1.z.enum(['Male', 'Female', 'Unknown']),
    weight: zod_1.z.string(),
    color: zod_1.z.string(),
    vaccinated: zod_1.z.boolean(),
    neutered: zod_1.z.boolean(),
    healthCondition: zod_1.z.string(),
    adoptionFee: zod_1.z.number().min(0),
    location: zod_1.z.string(),
    images: zod_1.z
        .array(zod_1.z.string().trim().min(1).url("Each image must be a valid URL"))
        .min(1, "At least one image is required"),
    shortDescription: zod_1.z.string().max(200),
    description: zod_1.z.string().min(20),
    isFeatured: zod_1.z.boolean().default(false),
    adoptionStatus: zod_1.z.enum(['Available', 'Pending', 'Adopted']).default('Available'),
    userId: zod_1.z.string(),
    userName: zod_1.z.string(),
    userEmail: zod_1.z.string().email(),
    userPhoto: zod_1.z.string().optional(),
    createdAt: zod_1.z.date().default(() => new Date()),
    updatedAt: zod_1.z.date().default(() => new Date()),
});
//# sourceMappingURL=Pet.js.map