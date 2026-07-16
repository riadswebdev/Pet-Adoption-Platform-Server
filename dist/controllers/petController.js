"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserProfile = exports.updatePetStatus = exports.getAllPetsForAdmin = exports.getAdminDashboardStats = exports.getAdminRecentActivity = exports.getMyPetsSummary = exports.getMyPets = exports.deletePet = exports.updatePet = exports.createPet = exports.getPetById = exports.getPets = void 0;
const mongodb_1 = require("mongodb");
const db_1 = __importDefault(require("../config/db"));
const Pet_1 = require("../models/Pet");
const zod_1 = require("zod");
const getPetsCollection = async () => {
    const client = await db_1.default;
    const db = client.db("pet_adoption");
    return db.collection("pets");
};
const getUsersCollection = async () => {
    const client = await db_1.default;
    const db = client.db("pet_adoption");
    return db.collection("user");
};
const getQueryValue = (value) => {
    if (typeof value === "string")
        return value.trim();
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string")
        return value[0].trim();
    return undefined;
};
const getRouteParamValue = (value) => {
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && value.length > 0)
        return value[0];
    return undefined;
};
const isAdminUser = (user) => {
    return (user?.role || "user").toLowerCase() === "admin";
};
const parseBooleanQuery = (value) => {
    const stringValue = getQueryValue(value);
    if (!stringValue)
        return undefined;
    if (stringValue === "true")
        return true;
    if (stringValue === "false")
        return false;
    return undefined;
};
const DEFAULT_PET_IMAGE = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";
const isSafeImageValue = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue)
        return false;
    if (trimmedValue.startsWith("/"))
        return true;
    if (/^https?:\/\//i.test(trimmedValue))
        return true;
    if (/^data:image\//i.test(trimmedValue))
        return true;
    return false;
};
const normalizeImages = (imagesValue) => {
    const rawImages = typeof imagesValue === "string" ? [imagesValue]
        : Array.isArray(imagesValue) ? imagesValue
            : [];
    const normalizedImages = rawImages
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    if (normalizedImages.length === 0) {
        return [DEFAULT_PET_IMAGE];
    }
    return normalizedImages.map((item) => isSafeImageValue(item) ? item : DEFAULT_PET_IMAGE);
};
const normalizeGender = (value) => {
    if (typeof value !== "string")
        return "Unknown";
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue === "male" || trimmedValue === "m")
        return "Male";
    if (trimmedValue === "female" || trimmedValue === "f")
        return "Female";
    return "Unknown";
};
const normalizePetInput = (body) => {
    const imagesValue = body["images"];
    const images = normalizeImages(imagesValue);
    const adoptionFee = typeof body["adoptionFee"] === "number" ? body["adoptionFee"]
        : typeof body["adoptionFee"] === "string" ?
            Number.parseFloat(body["adoptionFee"])
            : 0;
    return {
        ...body,
        images,
        adoptionFee,
        gender: normalizeGender(body["gender"]),
        vaccinated: typeof body["vaccinated"] === "boolean" ?
            body["vaccinated"]
            : body["vaccinated"] === "true",
        neutered: typeof body["neutered"] === "boolean" ?
            body["neutered"]
            : body["neutered"] === "true",
        isFeatured: typeof body["isFeatured"] === "boolean" ?
            body["isFeatured"]
            : body["isFeatured"] === "true",
        adoptionStatus: typeof body["adoptionStatus"] === "string" ?
            body["adoptionStatus"]
            : "Available",
    };
};
const getPets = async (req, res) => {
    try {
        const petsCollection = await getPetsCollection();
        const category = getQueryValue(req.query["category"]);
        const breed = getQueryValue(req.query["breed"]);
        const gender = getQueryValue(req.query["gender"]);
        const vaccinated = parseBooleanQuery(req.query["vaccinated"]);
        const location = getQueryValue(req.query["location"]);
        const search = getQueryValue(req.query["search"]);
        const page = Math.max(1, Number.parseInt(getQueryValue(req.query["page"]) ?? "1", 10));
        const limit = Math.min(50, Math.max(1, Number.parseInt(getQueryValue(req.query["limit"]) ?? "12", 10)));
        const query = {};
        if (category) {
            query["category"] = { $regex: category, $options: "i" };
        }
        if (breed) {
            query["breed"] = { $regex: breed, $options: "i" };
        }
        if (gender) {
            query["gender"] = { $regex: gender, $options: "i" };
        }
        if (vaccinated !== undefined) {
            query["vaccinated"] = vaccinated;
        }
        if (location) {
            query["location"] = { $regex: location, $options: "i" };
        }
        if (search) {
            query["$or"] = [
                { petName: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { breed: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }
        const pets = await petsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();
        const sanitizedPets = pets.map((pet) => ({
            ...pet,
            images: normalizeImages(pet["images"]),
        }));
        res.status(200).json(sanitizedPets);
    }
    catch (error) {
        console.error("Error fetching pets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getPets = getPets;
const getPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const routeId = getRouteParamValue(id);
        if (!routeId || !mongodb_1.ObjectId.isValid(routeId)) {
            res.status(400).json({ error: "Invalid pet ID" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pet = await petsCollection.findOne({ _id: new mongodb_1.ObjectId(routeId) });
        if (!pet) {
            res.status(404).json({ error: "Pet not found" });
            return;
        }
        res.status(200).json({
            ...pet,
            images: normalizeImages(pet["images"]),
        });
        return;
    }
    catch (error) {
        console.error("Error fetching pet by ID:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getPetById = getPetById;
const createPet = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const petData = normalizePetInput({
            ...req.body,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userPhoto: user.image || user.avatar || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const validatedData = Pet_1.PetSchema.parse(petData);
        const newPet = {
            ...validatedData,
            slug: validatedData.slug ||
                validatedData.title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, ""),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const petsCollection = await getPetsCollection();
        const result = await petsCollection.insertOne(newPet);
        res.status(201).json({
            ...newPet,
            _id: result.insertedId,
            images: normalizeImages(newPet.images),
        });
        return;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res
                .status(400)
                .json({ error: "Validation Error", details: error.issues });
            return;
        }
        console.error("Error creating pet:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
};
exports.createPet = createPet;
const updatePet = async (req, res) => {
    try {
        const { id } = req.params;
        const routeId = getRouteParamValue(id);
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!routeId || !mongodb_1.ObjectId.isValid(routeId)) {
            res.status(400).json({ error: "Invalid pet ID" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pet = await petsCollection.findOne({ _id: new mongodb_1.ObjectId(routeId) });
        if (!pet) {
            res.status(404).json({ error: "Pet not found" });
            return;
        }
        const petOwnerId = pet["userId"];
        if (petOwnerId !== user.id && !isAdminUser(user)) {
            res
                .status(403)
                .json({ error: "Forbidden: You can only update your own pets" });
            return;
        }
        const updates = normalizePetInput(req.body);
        const validated = Pet_1.PetSchema.partial().parse(updates);
        await petsCollection.updateOne({ _id: new mongodb_1.ObjectId(routeId) }, { $set: { ...validated, updatedAt: new Date() } });
        const updatedPet = await petsCollection.findOne({
            _id: new mongodb_1.ObjectId(routeId),
        });
        res.status(200).json(updatedPet);
        return;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res
                .status(400)
                .json({ error: "Validation Error", details: error.issues });
            return;
        }
        console.error("Error updating pet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.updatePet = updatePet;
const deletePet = async (req, res) => {
    try {
        const { id } = req.params;
        const routeId = getRouteParamValue(id);
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!routeId || !mongodb_1.ObjectId.isValid(routeId)) {
            res.status(400).json({ error: "Invalid pet ID" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pet = await petsCollection.findOne({ _id: new mongodb_1.ObjectId(routeId) });
        if (!pet) {
            res.status(404).json({ error: "Pet not found" });
            return;
        }
        const petOwnerId = pet["userId"];
        if (petOwnerId !== user.id && !isAdminUser(user)) {
            res
                .status(403)
                .json({ error: "Forbidden: You can only delete your own pets" });
            return;
        }
        await petsCollection.deleteOne({ _id: new mongodb_1.ObjectId(routeId) });
        res.status(200).json({ message: "Pet deleted successfully" });
        return;
    }
    catch (error) {
        console.error("Error deleting pet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.deletePet = deletePet;
const getMyPets = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pets = await petsCollection
            .find({ userId: user.id })
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json(pets.map((pet) => ({
            ...pet,
            images: normalizeImages(pet["images"]),
        })));
    }
    catch (error) {
        console.error("Error fetching my pets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getMyPets = getMyPets;
const getMyPetsSummary = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pets = await petsCollection.find({ userId: user.id }).toArray();
        const totalPetsListed = pets.length;
        const activeListings = pets.filter((pet) => {
            const status = typeof pet["adoptionStatus"] === "string" ?
                pet["adoptionStatus"]
                : "";
            return status === "Available" || status === "Pending";
        }).length;
        const adoptedPets = pets.filter((pet) => {
            const status = typeof pet["adoptionStatus"] === "string" ?
                pet["adoptionStatus"]
                : "";
            return status === "Adopted";
        }).length;
        res.status(200).json({
            totalPetsListed,
            activeListings,
            adoptedPets,
        });
    }
    catch (error) {
        console.error("Error fetching my pets summary:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getMyPetsSummary = getMyPetsSummary;
const getDocumentTimestamp = (document) => {
    const createdAt = document["createdAt"];
    if (createdAt instanceof Date) {
        return createdAt;
    }
    const updatedAt = document["updatedAt"];
    if (updatedAt instanceof Date) {
        return updatedAt;
    }
    const id = document["_id"];
    if (id &&
        typeof id === "object" &&
        "getTimestamp" in id &&
        typeof id.getTimestamp === "function") {
        return id.getTimestamp();
    }
    return new Date(0);
};
const getAdminRecentActivity = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!isAdminUser(user)) {
            res.status(403).json({ error: "Forbidden: Admin access required" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const usersCollection = await getUsersCollection();
        const [recentPets, recentUsers] = await Promise.all([
            petsCollection.find({}).sort({ createdAt: -1, updatedAt: -1 }).limit(10).toArray(),
            usersCollection.find({}).sort({ createdAt: -1, updatedAt: -1 }).limit(10).toArray(),
        ]);
        const activities = [
            ...recentUsers.map((userDoc) => {
                const record = userDoc;
                const name = typeof record["name"] === "string" ? record["name"] : undefined;
                const email = typeof record["email"] === "string" ? record["email"] : undefined;
                return {
                    id: `user-${String(record["_id"])}`,
                    type: "user_signup",
                    title: "New user signup",
                    description: `${name || email || "A user"} joined the platform`,
                    createdAt: getDocumentTimestamp(record).toISOString(),
                    actor: name || email || "User",
                };
            }),
            ...recentPets.map((petDoc) => {
                const record = petDoc;
                const status = typeof record["adoptionStatus"] === "string"
                    ? record["adoptionStatus"]
                    : "Available";
                const isAdoptionUpdate = status === "Pending" || status === "Adopted";
                const petName = typeof record["petName"] === "string"
                    ? record["petName"]
                    : typeof record["title"] === "string"
                        ? record["title"]
                        : "A pet";
                return {
                    id: `pet-${String(record["_id"])}`,
                    type: isAdoptionUpdate ? "adoption_update" : "pet_listing",
                    title: isAdoptionUpdate ? "Adoption update" : "New pet listing",
                    description: isAdoptionUpdate
                        ? `${petName} is now ${String(status).toLowerCase()}`
                        : `${petName} was listed for adoption`,
                    createdAt: getDocumentTimestamp(record).toISOString(),
                    actor: typeof record["userName"] === "string"
                        ? record["userName"]
                        : "Pet owner",
                };
            }),
        ]
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            .slice(0, 12);
        res.status(200).json(activities);
    }
    catch (error) {
        console.error("Error fetching admin recent activity:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAdminRecentActivity = getAdminRecentActivity;
const getAdminDashboardStats = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!isAdminUser(user)) {
            res.status(403).json({ error: "Forbidden: Admin access required" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const usersCollection = await getUsersCollection();
        const [totalPets, availablePets, adoptedPets, adoptionRequests, totalUsers,] = await Promise.all([
            petsCollection.countDocuments(),
            petsCollection.countDocuments({ adoptionStatus: "Available" }),
            petsCollection.countDocuments({ adoptionStatus: "Adopted" }),
            petsCollection.countDocuments({ adoptionStatus: "Pending" }),
            usersCollection.countDocuments(),
        ]);
        res.status(200).json({
            totalUsers,
            totalPets,
            adoptionRequests,
            availablePets,
            adoptedPets,
        });
    }
    catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAdminDashboardStats = getAdminDashboardStats;
const getAllPetsForAdmin = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!isAdminUser(user)) {
            res.status(403).json({ error: "Forbidden: Admin access required" });
            return;
        }
        const petsCollection = await getPetsCollection();
        const pets = await petsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json(pets.map((pet) => ({
            ...pet,
            images: normalizeImages(pet["images"]),
        })));
    }
    catch (error) {
        console.error("Error fetching pets for admin:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAllPetsForAdmin = getAllPetsForAdmin;
const updatePetStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const routeId = getRouteParamValue(id);
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        if (!isAdminUser(user)) {
            res.status(403).json({ error: "Forbidden: Admin access required" });
            return;
        }
        if (!routeId || !mongodb_1.ObjectId.isValid(routeId)) {
            res.status(400).json({ error: "Invalid pet ID" });
            return;
        }
        const status = getQueryValue(req.body["adoptionStatus"]) ||
            req.body["adoptionStatus"];
        const petsCollection = await getPetsCollection();
        await petsCollection.updateOne({ _id: new mongodb_1.ObjectId(routeId) }, { $set: { adoptionStatus: status, updatedAt: new Date() } });
        const updatedPet = await petsCollection.findOne({
            _id: new mongodb_1.ObjectId(routeId),
        });
        res.status(200).json(updatedPet);
    }
    catch (error) {
        console.error("Error updating pet status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.updatePetStatus = updatePetStatus;
const getCurrentUserProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image || user.avatar || null,
            phone: user.phone || null,
            address: user.address || null,
            bio: user.bio || null,
            role: user.role || "user",
        });
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getCurrentUserProfile = getCurrentUserProfile;
//# sourceMappingURL=petController.js.map