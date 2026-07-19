import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import clientPromise from "../config/db";
import { PetSchema } from "../models/Pet";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
    avatar?: string;
    phone?: string;
    address?: string;
    bio?: string;
    role?: string;
  };
}

const getPetsCollection = async () => {
  const client = await clientPromise;
  const db = client.db("pet_adoption");
  return db.collection("pets");
};

const getUsersCollection = async () => {
  const client = await clientPromise;
  const db = client.db("pet_adoption");
  return db.collection("user");
};

const getQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string")
    return value[0].trim();
  return undefined;
};

const getRouteParamValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return undefined;
};

const isAdminUser = (user?: AuthenticatedRequest["user"]): boolean => {
  return (user?.role || "user").toLowerCase() === "admin";
};

const parseBooleanQuery = (value: unknown): boolean | undefined => {
  const stringValue = getQueryValue(value);
  if (!stringValue) return undefined;
  if (stringValue === "true") return true;
  if (stringValue === "false") return false;
  return undefined;
};

const DEFAULT_PET_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600";

const isSafeImageValue = (value: string): boolean => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return false;
  if (trimmedValue.startsWith("/")) return true;
  if (/^https?:\/\//i.test(trimmedValue)) return true;
  if (/^data:image\//i.test(trimmedValue)) return true;

  return false;
};

const normalizeImages = (imagesValue: unknown): string[] => {
  const rawImages =
    typeof imagesValue === "string" ? [imagesValue]
    : Array.isArray(imagesValue) ? imagesValue
    : [];

  const normalizedImages = rawImages
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (normalizedImages.length === 0) {
    return [DEFAULT_PET_IMAGE];
  }

  return normalizedImages.map((item) =>
    isSafeImageValue(item) ? item : DEFAULT_PET_IMAGE,
  );
};

const normalizeGender = (value: unknown): string => {
  if (typeof value !== "string") return "Unknown";

  const trimmedValue = value.trim().toLowerCase();

  if (trimmedValue === "male" || trimmedValue === "m") return "Male";
  if (trimmedValue === "female" || trimmedValue === "f") return "Female";
  return "Unknown";
};

const normalizePetInput = (body: Record<string, unknown>) => {
  const imagesValue = body["images"];
  const images = normalizeImages(imagesValue);

  const adoptionFee =
    typeof body["adoptionFee"] === "number" ? body["adoptionFee"]
    : typeof body["adoptionFee"] === "string" ?
      Number.parseFloat(body["adoptionFee"] as string)
    : 0;

  return {
    ...body,
    images,
    adoptionFee,
    gender: normalizeGender(body["gender"]),
    vaccinated:
      typeof body["vaccinated"] === "boolean" ?
        body["vaccinated"]
      : body["vaccinated"] === "true",
    neutered:
      typeof body["neutered"] === "boolean" ?
        body["neutered"]
      : body["neutered"] === "true",
    isFeatured:
      typeof body["isFeatured"] === "boolean" ?
        body["isFeatured"]
      : body["isFeatured"] === "true",
    adoptionStatus:
      typeof body["adoptionStatus"] === "string" ?
        body["adoptionStatus"]
      : "Available",
  };
};

export const getPets = async (req: Request, res: Response) => {
  try {
    const petsCollection = await getPetsCollection();

    const category = getQueryValue(req.query["category"]);
    const breed = getQueryValue(req.query["breed"]);
    const gender = getQueryValue(req.query["gender"]);
    const vaccinated = parseBooleanQuery(req.query["vaccinated"]);
    const location = getQueryValue(req.query["location"]);
    const search = getQueryValue(req.query["search"]);
    const page = Math.max(
      1,
      Number.parseInt(getQueryValue(req.query["page"]) ?? "1", 10),
    );
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(getQueryValue(req.query["limit"]) ?? "12", 10),
      ),
    );

    const query: Record<string, unknown> = {};

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

    const sanitizedPets = pets.map(
      (pet) =>
        ({
          ...pet,
          images: normalizeImages((pet as Record<string, unknown>)["images"]),
        }) as Record<string, unknown>,
    );

    res.status(200).json(sanitizedPets);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = getRouteParamValue(id);

    if (!routeId || !ObjectId.isValid(routeId)) {
      res.status(400).json({ error: "Invalid pet ID" });
      return;
    }

    const petsCollection = await getPetsCollection();
    const pet = await petsCollection.findOne({ _id: new ObjectId(routeId) });

    if (!pet) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }

    res.status(200).json({
      ...pet,
      images: normalizeImages((pet as Record<string, unknown>)["images"]),
    });
    return;
  } catch (error) {
    console.error("Error fetching pet by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPet = async (req: AuthenticatedRequest, res: Response) => {
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

    const validatedData = PetSchema.parse(petData);

    const newPet = {
      ...validatedData,
      slug:
        validatedData.slug ||
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
  } catch (error) {
    if (error instanceof z.ZodError) {
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

export const updatePet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = getRouteParamValue(id);
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!routeId || !ObjectId.isValid(routeId)) {
      res.status(400).json({ error: "Invalid pet ID" });
      return;
    }

    const petsCollection = await getPetsCollection();
    const pet = await petsCollection.findOne({ _id: new ObjectId(routeId) });

    if (!pet) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }

    const petOwnerId = (pet as Record<string, unknown>)["userId"];
    if (petOwnerId !== user.id && !isAdminUser(user)) {
      res
        .status(403)
        .json({ error: "Forbidden: You can only update your own pets" });
      return;
    }

    const updates = normalizePetInput(req.body as Record<string, unknown>);
    const validated = PetSchema.partial().parse(updates);

    await petsCollection.updateOne(
      { _id: new ObjectId(routeId) },
      { $set: { ...validated, updatedAt: new Date() } },
    );

    const updatedPet = await petsCollection.findOne({
      _id: new ObjectId(routeId),
    });
    res.status(200).json(updatedPet);
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation Error", details: error.issues });
      return;
    }
    console.error("Error updating pet:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const routeId = getRouteParamValue(id);
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!routeId || !ObjectId.isValid(routeId)) {
      res.status(400).json({ error: "Invalid pet ID" });
      return;
    }

    const petsCollection = await getPetsCollection();
    const pet = await petsCollection.findOne({ _id: new ObjectId(routeId) });

    if (!pet) {
      res.status(404).json({ error: "Pet not found" });
      return;
    }

    const petOwnerId = (pet as Record<string, unknown>)["userId"];
    if (petOwnerId !== user.id && !isAdminUser(user)) {
      res
        .status(403)
        .json({ error: "Forbidden: You can only delete your own pets" });
      return;
    }

    await petsCollection.deleteOne({ _id: new ObjectId(routeId) });
    res.status(200).json({ message: "Pet deleted successfully" });
    return;
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyPets = async (req: AuthenticatedRequest, res: Response) => {
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

    res.status(200).json(
      pets.map((pet) => ({
        ...pet,
        images: normalizeImages((pet as Record<string, unknown>)["images"]),
      })),
    );
  } catch (error) {
    console.error("Error fetching my pets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMyPetsSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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
      const status =
        typeof (pet as Record<string, unknown>)["adoptionStatus"] === "string" ?
          ((pet as Record<string, unknown>)["adoptionStatus"] as string)
        : "";
      return status === "Available" || status === "Pending";
    }).length;
    const adoptedPets = pets.filter((pet) => {
      const status =
        typeof (pet as Record<string, unknown>)["adoptionStatus"] === "string" ?
          ((pet as Record<string, unknown>)["adoptionStatus"] as string)
        : "";
      return status === "Adopted";
    }).length;

    res.status(200).json({
      totalPetsListed,
      activeListings,
      adoptedPets,
    });
  } catch (error) {
    console.error("Error fetching my pets summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDocumentTimestamp = (document: Record<string, unknown>): Date => {
  const createdAt = document["createdAt"];
  if (createdAt instanceof Date) {
    return createdAt;
  }

  const updatedAt = document["updatedAt"];
  if (updatedAt instanceof Date) {
    return updatedAt;
  }

  const id = document["_id"];
  if (
    id &&
    typeof id === "object" &&
    "getTimestamp" in id &&
    typeof (id as { getTimestamp?: () => Date }).getTimestamp === "function"
  ) {
    return (id as { getTimestamp: () => Date }).getTimestamp();
  }

  return new Date(0);
};

export const getAdminRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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
      petsCollection
        .find({})
        .sort({ createdAt: -1, updatedAt: -1 })
        .limit(10)
        .toArray(),
      usersCollection
        .find({})
        .sort({ createdAt: -1, updatedAt: -1 })
        .limit(10)
        .toArray(),
    ]);

    const activities = [
      ...recentUsers.map((userDoc) => {
        const record = userDoc as Record<string, unknown>;
        const name =
          typeof record["name"] === "string" ? record["name"] : undefined;
        const email =
          typeof record["email"] === "string" ? record["email"] : undefined;

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
        const record = petDoc as Record<string, unknown>;
        const status =
          typeof record["adoptionStatus"] === "string" ?
            record["adoptionStatus"]
          : "Available";
        const isAdoptionUpdate = status === "Pending" || status === "Adopted";
        const petName =
          typeof record["petName"] === "string" ? record["petName"]
          : typeof record["title"] === "string" ? record["title"]
          : "A pet";

        return {
          id: `pet-${String(record["_id"])}`,
          type: isAdoptionUpdate ? "adoption_update" : "pet_listing",
          title: isAdoptionUpdate ? "Adoption update" : "New pet listing",
          description:
            isAdoptionUpdate ?
              `${petName} is now ${String(status).toLowerCase()}`
            : `${petName} was listed for adoption`,
          createdAt: getDocumentTimestamp(record).toISOString(),
          actor:
            typeof record["userName"] === "string" ?
              record["userName"]
            : "Pet owner",
        };
      }),
    ]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, 12);

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching admin recent activity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdminUsers = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    const usersCollection = await getUsersCollection();
    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1, updatedAt: -1 })
      .toArray();

    const sanitizedUsers = users.map((userDoc) => {
      const record = userDoc as Record<string, unknown>;
      const name = typeof record["name"] === "string" ? record["name"] : "";
      const email = typeof record["email"] === "string" ? record["email"] : "";
      const role = typeof record["role"] === "string" ? record["role"] : "user";
      const emailVerified =
        record["emailVerified"] === true || record["emailVerified"] === "true";
      const createdAtValue = record["createdAt"];
      const updatedAtValue = record["updatedAt"];

      return {
        id: String(record["_id"]),
        name,
        email,
        role: role.toLowerCase(),
        emailVerified,
        image: typeof record["image"] === "string" ? record["image"] : null,
        phone: typeof record["phone"] === "string" ? record["phone"] : null,
        address:
          typeof record["address"] === "string" ? record["address"] : null,
        bio: typeof record["bio"] === "string" ? record["bio"] : null,
        createdAt:
          createdAtValue instanceof Date ? createdAtValue.toISOString()
          : typeof createdAtValue === "string" ? createdAtValue
          : null,
        updatedAt:
          updatedAtValue instanceof Date ? updatedAtValue.toISOString()
          : typeof updatedAtValue === "string" ? updatedAtValue
          : null,
      };
    });

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdminDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    const [
      totalPets,
      availablePets,
      adoptedPets,
      adoptionRequests,
      totalUsers,
    ] = await Promise.all([
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
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPetsForAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    res.status(200).json(
      pets.map((pet) => ({
        ...pet,
        images: normalizeImages((pet as Record<string, unknown>)["images"]),
      })),
    );
  } catch (error) {
    console.error("Error fetching pets for admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updatePetStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    if (!routeId || !ObjectId.isValid(routeId)) {
      res.status(400).json({ error: "Invalid pet ID" });
      return;
    }

    const status =
      getQueryValue((req.body as Record<string, unknown>)["adoptionStatus"]) ||
      (req.body as Record<string, unknown>)["adoptionStatus"];
    const petsCollection = await getPetsCollection();
    await petsCollection.updateOne(
      { _id: new ObjectId(routeId) },
      { $set: { adoptionStatus: status, updatedAt: new Date() } },
    );

    const updatedPet = await petsCollection.findOne({
      _id: new ObjectId(routeId),
    });
    res.status(200).json(updatedPet);
  } catch (error) {
    console.error("Error updating pet status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCurrentUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
